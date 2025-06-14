// PlayerPhysics.js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { CameraController } from './camera.js';
import { PlayerModel } from './player.js';

const PLAYER_HEIGHT = 1.8;
const PLAYER_WIDTH = 0.6;
const PLAYER_RADIUS = PLAYER_WIDTH / 2;
const PLAYER_SPEED = 0.2;
const JUMP_POWER = 0.2;
const GRAVITY = -0.01;
const FLOOR_Y = 0; // Adjusted to 0 since player model now handles its height relative to 0

export class PlayerPhysics {
    constructor(scene, rendererDomElement, collidableObjects, showMessageBox, socket) {
        this.scene = scene;
        this.collidableObjects = collidableObjects;
        this.showMessageBox = showMessageBox;
        this.socket = socket;

        this.playerModel = new PlayerModel(this.scene); // Initialize PlayerModel

        this.cameraController = new CameraController(rendererDomElement, this.playerModel);
        this.camera = this.cameraController.getCamera();

        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Vector2(); // Stores camera rotation (yaw and pitch)
        this.onGround = false;

        this.keyState = {};

        this.addEventListeners();

        // Initial position, adjusted based on the PlayerModel's internal offset for feet at Y=0
        this.position.set(0, PLAYER_HEIGHT / 2, 0);
    }

    addEventListeners() {
        document.addEventListener('keydown', (event) => {
            this.keyState[event.code] = true;
        });
        document.addEventListener('keyup', (event) => {
            this.keyState[event.code] = false;
        });

        document.addEventListener('mousemove', (event) => {
            if (this.cameraController.getIsPointerLocked()) {
                this.rotation.y -= event.movementX * 0.002; // Yaw (left/right)
                this.rotation.x -= event.movementY * 0.002; // Pitch (up/down)

                // Clamp pitch to prevent flipping the camera
                this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
            }
        });
    }

    update(deltaTime) {
        let moveDirection = new THREE.Vector3();
        let isWalking = false; // Flag to determine if the player is moving horizontally

        // Create a temporary camera object to get forward/right vectors without affecting the actual camera's pitch
        const tempCamera = new THREE.Object3D();
        tempCamera.rotation.copy(this.camera.rotation);
        tempCamera.rotation.x = 0; // Ignore pitch for movement direction calculation
        tempCamera.updateMatrixWorld();

        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(tempCamera.quaternion);
        forward.y = 0; // Ensure movement is strictly horizontal
        forward.normalize();

        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(tempCamera.quaternion);
        right.y = 0; // Ensure movement is strictly horizontal
        right.normalize();

        // Handle movement input
        if (this.keyState['KeyW']) {
            moveDirection.add(forward);
            isWalking = true;
        }
        if (this.keyState['KeyS']) {
            moveDirection.sub(forward);
            isWalking = true;
        }
        if (this.keyState['KeyA']) {
            moveDirection.sub(right);
            isWalking = true;
        }
        if (this.keyState['KeyD']) {
            moveDirection.add(right);
            isWalking = true;
        }

        // Apply movement velocity
        if (moveDirection.lengthSq() > 0) {
            moveDirection.normalize();
            this.velocity.x = moveDirection.x * PLAYER_SPEED;
            this.velocity.z = moveDirection.z * PLAYER_SPEED;

            // Rotate the player model to face the movement direction
            const targetRotationY = Math.atan2(moveDirection.x, moveDirection.z);
            this.playerModel.playerGroup.rotation.y = targetRotationY;

        } else {
            // Decelerate if no keys are pressed
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;
            isWalking = false; // Not walking if no horizontal input
        }

        // Apply gravity
        this.velocity.y += GRAVITY;

        // Handle jumping
        if (this.keyState['Space'] && this.onGround) {
            this.velocity.y = JUMP_POWER;
            this.onGround = false;
        }

        // Update position
        this.position.add(this.velocity);

        this.onGround = false; // Assume not on ground until collision detection proves otherwise

        // Player bounding box for collision detection
        const playerMin = new THREE.Vector3(
            this.position.x - PLAYER_RADIUS,
            this.position.y - PLAYER_HEIGHT / 2, // Bottom of physics capsule
            this.position.z - PLAYER_RADIUS
        );
        const playerMax = new THREE.Vector3(
            this.position.x + PLAYER_RADIUS,
            this.position.y + PLAYER_HEIGHT / 2, // Top of physics capsule
            this.position.z + PLAYER_RADIUS
        );
        let playerBoundingBox = new THREE.Box3(playerMin, playerMax);

        // Collision detection with collidable objects
        for (const obj of this.collidableObjects) {
            const blockBoundingBox = obj.userData.boundingBox;

            if (playerBoundingBox.intersectsBox(blockBoundingBox)) {
                // Calculate overlaps in each dimension
                const xOverlap = Math.min(playerMax.x, blockBoundingBox.max.x) - Math.max(playerMin.x, blockBoundingBox.min.x);
                const yOverlap = Math.min(playerMax.y, blockBoundingBox.max.y) - Math.max(playerMin.y, blockBoundingBox.min.y);
                const zOverlap = Math.min(playerMax.z, blockBoundingBox.max.z) - Math.max(playerMin.z, blockBoundingBox.min.z);

                // Resolve collision along the axis with the smallest overlap
                if (yOverlap <= xOverlap && yOverlap <= zOverlap) {
                    if (this.velocity.y < 0) {
                        // Collision from above (landing)
                        this.position.y += yOverlap; // Move player up to resolve overlap
                        this.velocity.y = 0;
                        this.onGround = true;
                    } else if (this.velocity.y > 0) {
                        // Collision from below (hitting head on ceiling)
                        this.position.y -= yOverlap; // Move player down
                        this.velocity.y = 0;
                        // this.onGround remains false if jumping into ceiling
                    }
                } else if (xOverlap <= yOverlap && xOverlap <= zOverlap) {
                    if (this.velocity.x > 0) {
                        this.position.x -= xOverlap;
                    } else {
                        this.position.x += xOverlap;
                    }
                    this.velocity.x = 0;
                } else {
                    if (this.velocity.z > 0) {
                        this.position.z -= zOverlap;
                    } else {
                        this.position.z += zOverlap;
                    }
                    this.velocity.z = 0;
                }

                // Re-calculate bounding box after resolving collision for next iteration (if needed)
                playerMin.set(
                    this.position.x - PLAYER_RADIUS,
                    this.position.y - PLAYER_HEIGHT / 2,
                    this.position.z - PLAYER_RADIUS
                );
                playerMax.set(
                    this.position.x + PLAYER_RADIUS,
                    this.position.y + PLAYER_HEIGHT / 2,
                    this.position.z + PLAYER_RADIUS
                );
                playerBoundingBox.set(playerMin, playerMax);
            }
        }

        // Keep player above the floor (y=FLOOR_Y)
        if (this.position.y - PLAYER_HEIGHT / 2 < FLOOR_Y) {
            this.position.y = FLOOR_Y + PLAYER_HEIGHT / 2;
            this.velocity.y = 0;
            this.onGround = true;
        }

        // Update camera position and rotation
        this.cameraController.update(this.position, this.rotation, PLAYER_HEIGHT, PLAYER_RADIUS);

        // Update player model position and walking animation state (for your own player)
        this.playerModel.update(this.position, isWalking);

        // Emit player movement data for multiplayer (if socket is available)
        if (this.socket) {
            // Remove redundant 'playerMovement' emit if 'move' sends enough data
            // this.socket.emit('playerMovement', { position: this.position, rotation: this.rotation }); 

            this.socket.emit("move", {
                position: {
                    x: this.position.x,
                    y: this.position.y,
                    z: this.position.z
                },
                // Send the player's current rotation around the Y-axis (for facing direction)
                rotationY: this.playerModel.playerGroup.rotation.y, // <-- ADDED: Send player's Y rotation
                isWalking: isWalking // <-- ADDED: Send animation state
            });
        }
    }

    getCamera() {
        return this.camera;
    }
}
