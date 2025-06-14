// camera.js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

export class CameraController {
    constructor(rendererDomElement, playerModel) {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.rotation.order = 'YXZ';
        this.rendererDomElement = rendererDomElement;
        this.playerModel = playerModel;
        this.isPointerLocked = false;

        this.perspectives = ['firstPerson', 'thirdPersonBack', 'thirdPersonFront'];
        this.currentPerspectiveIndex = 0;

        this.rotation = { x: 0, y: 0 };
        this.mouseSensitivity = 0.002;

        this.crosshair = this.initCrosshair();
        this.addEventListeners();
        this.applyPerspective();
    }

    initCrosshair() {
        const crosshair = document.createElement('div');
        crosshair.id = 'crosshair';
        crosshair.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 4px;
            height: 4px;
            background-color: white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            z-index: 100;
            box-shadow: 0 0 2px black;
        `;
        document.body.appendChild(crosshair);
        return crosshair;
    }

    addEventListeners() {
        // Pointer lock for 1st person
        this.rendererDomElement.addEventListener('click', () => {
            if (!this.isPointerLocked && this.getPerspective() === 'firstPerson') {
                this.rendererDomElement.requestPointerLock();
            }
        });

        // Pointer lock state update
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.rendererDomElement;
            this.crosshair.style.display = (this.isPointerLocked && this.getPerspective() === 'firstPerson') ? 'block' : 'none';
        });

        // Toggle perspective
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyX') this.togglePerspective();
        });

        // Mouse move for all perspectives
        window.addEventListener('mousemove', (e) => {
            if (this.getPerspective() === 'firstPerson' && this.isPointerLocked) {
                this.rotation.y -= e.movementX * this.mouseSensitivity;
                this.rotation.x -= e.movementY * this.mouseSensitivity;
                this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
            }

            // Free mouse movement in 3rd person without pointer lock
            else if (this.getPerspective() !== 'firstPerson') {
                this.rotation.y -= e.movementX * this.mouseSensitivity;
            }
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });
    }

    togglePerspective() {
        this.currentPerspectiveIndex = (this.currentPerspectiveIndex + 1) % this.perspectives.length;
        this.applyPerspective();
    }

    getPerspective() {
        return this.perspectives[this.currentPerspectiveIndex];
    }

    applyPerspective() {
        const perspective = this.getPerspective();
        if (perspective === 'firstPerson') {
            this.rendererDomElement.requestPointerLock();
            this.playerModel.playerGroup.visible = false;
        } else {
            document.exitPointerLock();
            this.playerModel.playerGroup.visible = true;
            this.crosshair.style.display = 'none';
        }
    }

    update(playerPosition, playerRotation, playerHeight, playerRadius) {
        const eyeOffset = playerHeight * 0.80;
        const lookTarget = new THREE.Vector3(
            playerPosition.x,
            playerPosition.y + eyeOffset,
            playerPosition.z
        );

        if (this.getPerspective() === 'firstPerson') {
            this.camera.position.set(
                playerPosition.x,
                playerPosition.y + eyeOffset,
                playerPosition.z
            );
            this.camera.rotation.x = this.rotation.x;
            this.camera.rotation.y = this.rotation.y;
        } else {
            const behind = this.getPerspective() === 'thirdPersonBack';
            const dist = 3;
            const angle = this.rotation.y;
            const offsetX = Math.sin(angle) * dist * (behind ? -1 : 1);
            const offsetZ = Math.cos(angle) * dist * (behind ? -1 : 1);

            const cameraPos = new THREE.Vector3(
                playerPosition.x + offsetX,
                playerPosition.y + eyeOffset,
                playerPosition.z + offsetZ
            );

            this.camera.position.lerp(cameraPos, 0.2);
            this.camera.lookAt(lookTarget);
        }
    }

    getCamera() {
        return this.camera;
    }

    getIsPointerLocked() {
        return this.isPointerLocked;
    }
}
