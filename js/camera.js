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
        this.rendererDomElement.addEventListener('click', () => {
            if (!this.isPointerLocked && this.getPerspective() === 'firstPerson') {
                this.rendererDomElement.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.rendererDomElement;
            this.crosshair.style.display = (this.isPointerLocked && this.getPerspective() === 'firstPerson') ? 'block' : 'none';
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyX') this.togglePerspective();
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
        }
    }

    update(playerPosition, playerRotation, playerHeight, playerRadius) {
        const eyeOffset = playerHeight * 0.80; // eye-level

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
            this.camera.rotation.x = playerRotation.x;
            this.camera.rotation.y = playerRotation.y;
        } else {
            const behind = this.getPerspective() === 'thirdPersonBack';
            const dist = 3;
            const angle = playerRotation.y;
            const offsetX = Math.sin(angle) * dist * (behind ? -1 : 1);
            const offsetZ = Math.cos(angle) * dist * (behind ? -1 : 1);

            const cameraPos = new THREE.Vector3(
                playerPosition.x + offsetX,
                playerPosition.y + eyeOffset,
                playerPosition.z + offsetZ
            );

            this.camera.position.lerp(cameraPos, 0.2); // smooth camera
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
