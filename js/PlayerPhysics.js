// PlayerPhysics.js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { CameraController } from './camera.js';
import { PlayerModel } from './player.js';

const PLAYER_HEIGHT = 1.8;
const PLAYER_WIDTH = 0.6;
const PLAYER_RADIUS = PLAYER_WIDTH / 2;
const PLAYER_SPEED = 0.25;
const JUMP_POWER = 0.2;
const GRAVITY = -0.02;
const FLOOR_Y = 0.5;
export class PlayerPhysics {
    constructor(scene, rendererDomElement, collidableObjects, showMessageBox, socket) {
        this.scene = scene;
        this.collidableObjects = collidableObjects;
        this.showMessageBox = showMessageBox;
        this.socket = socket;

        this.playerModel = new PlayerModel(this.scene);

        this.cameraController = new CameraController(rendererDomElement, this.playerModel);
        this.camera = this.cameraController.getCamera();

        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Vector2();
        this.onGround = false;

        this.keyState = {};

        this.addEventListeners();

        this.position.set(0, FLOOR_Y + PLAYER_HEIGHT / 2, 0); 
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
                this.rotation.y -= event.movementX * 0.002;
                this.rotation.x -= event.movementY * 0.002;

                this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
            }
        });
    }

    update(deltaTime) {
        let moveDirection = new THREE.Vector3();

        const tempCamera = new THREE.Object3D();
        tempCamera.rotation.copy(this.camera.rotation);
        tempCamera.rotation.x = 0;
        tempCamera.updateMatrixWorld();

        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(tempCamera.quaternion);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(tempCamera.quaternion);
        right.y = 0;
        right.normalize();

        if (this.keyState['KeyW']) {
            moveDirection.add(forward);
        }
        if (this.keyState['KeyS']) {
            moveDirection.sub(forward);
        }
        if (this.keyState['KeyA']) {
            moveDirection.sub(right);
        }
        if (this.keyState['KeyD']) {
            moveDirection.add(right);
        }

        if (moveDirection.lengthSq() > 0) {
            moveDirection.normalize();
            this.velocity.x = moveDirection.x * PLAYER_SPEED;
            this.velocity.z = moveDirection.z * PLAYER_SPEED;
        } else {
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;
        }

        this.velocity.y += GRAVITY;

        if (this.keyState['Space'] && this.onGround) {
            this.velocity.y = JUMP_POWER;
            this.onGround = false;
        }

        this.position.add(this.velocity);

        this.onGround = false;

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

        for (const obj of this.collidableObjects) {
            const blockBoundingBox = obj.userData.boundingBox;

            if (playerBoundingBox.intersectsBox(blockBoundingBox)) {
                const xOverlap = Math.min(playerMax.x, blockBoundingBox.max.x) - Math.max(playerMin.x, blockBoundingBox.min.x);
                const yOverlap = Math.min(playerMax.y, blockBoundingBox.max.y) - Math.max(playerMin.y, blockBoundingBox.min.y);
                const zOverlap = Math.min(playerMax.z, blockBoundingBox.max.z) - Math.max(playerMin.z, blockBoundingBox.min.z);

                if (yOverlap <= xOverlap && yOverlap <= zOverlap) {
                    if (this.velocity.y < 0) {
                        // FIX: Snap to the top of the block, not adding 0.1
                        this.position.y += yOverlap; // Adjust position to be above the block
                        this.velocity.y = 0;
                        this.onGround = true;
                    } else if (this.velocity.y > 0) {
                        this.position.y -= yOverlap;
                        this.velocity.y = 0;
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

        if (this.position.y - PLAYER_HEIGHT / 2 < FLOOR_Y) { 
            this.position.y = FLOOR_Y + PLAYER_HEIGHT / 2; 
            this.velocity.y = 0;
            this.onGround = true;
        }

        this.cameraController.update(this.position, this.rotation, PLAYER_HEIGHT, PLAYER_RADIUS);

        this.playerModel.update(this.position);

        this.socket.emit('playerMovement', { position: this.position, rotation: this.rotation });
        
        this.socket.emit("move", {
        position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
    }
});
    

    }

    getCamera() {
        return this.camera;
    }
}