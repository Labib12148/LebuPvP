import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

export const PLAYER_HEIGHT_UNITS = 1.8;
const MODEL_HEIGHT_PX = 32; 
const GLOBAL_SCALE = PLAYER_HEIGHT_UNITS / MODEL_HEIGHT_PX;

export class PlayerModel {
    constructor(scene) {
        this.scene = scene;
        this.playerGroup = new THREE.Group(); // Group to hold all character parts for easier manipulation
        this.walking = false; // Flag to control walking animation
        this.walkSpeed = 0.1; // Speed of the arm/leg swing
        this.armSwingAngle = 0; // Current angle for arm swing
        this.legSwingAngle = 0; // Current angle for leg swing
        this.swingFrequency = 5; // Adjust for faster/slower walking animation

        this.createMinecraftCharacter(); // Initialize the character model
        this.scene.add(this.playerGroup); // Add the entire character group to the scene
    }

    createMinecraftCharacter() {
        const purpleColor = 0x800080; // Main body and limb color
        const blackColor = 0x000000; // Head and limb accent color

        const createBoxPart = (width, height, depth, xOffset, yOffset, zOffset, name, color, parent = this.playerGroup) => {
            const geo = new THREE.BoxGeometry(
                width * GLOBAL_SCALE,
                height * GLOBAL_SCALE,
                depth * GLOBAL_SCALE
            );
            const mat = new THREE.MeshBasicMaterial({ color: color });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(
                xOffset * GLOBAL_SCALE,
                yOffset * GLOBAL_SCALE,
                zOffset * GLOBAL_SCALE
            );
            mesh.name = name;
            parent.add(mesh);
            return mesh;
        };

        const HEAD_W = 8, HEAD_H = 8, HEAD_D = 8;
        const BODY_W = 8, BODY_H = 12, BODY_D = 4;
        const ARM_W = 3, ARM_H_PURPLE = 10, ARM_D = 3;
        const HAND_W = 3, HAND_H = 2, HAND_D = 3;
        const LEG_W = 4, LEG_H_PURPLE = 10, LEG_D = 4;
        const FOOT_W = 4, FOOT_H = 2, FOOT_D = 4;

        const TOTAL_LEG_HEIGHT = LEG_H_PURPLE + FOOT_H;
        const BODY_CENTER_Y = TOTAL_LEG_HEIGHT + (BODY_H / 2);
        const HEAD_CENTER_Y = TOTAL_LEG_HEIGHT + BODY_H + (HEAD_H / 2);

        // Body (purple)
        this.body = createBoxPart(BODY_W, BODY_H, BODY_D, 0, BODY_CENTER_Y, 0, 'body', purpleColor);

        // Head (black)
        this.head = createBoxPart(HEAD_W, HEAD_H, HEAD_D, 0, HEAD_CENTER_Y, 0, 'head', blackColor);

        // Arms setup
        const ARM_X_OFFSET = (BODY_W / 2) + (ARM_W / 2);
        const ARM_PIVOT_Y = HEAD_CENTER_Y - (HEAD_H / 2) + 2;

        // Right Arm
        this.rightArm = createBoxPart(ARM_W, ARM_H_PURPLE, ARM_D, -ARM_X_OFFSET, ARM_PIVOT_Y - (ARM_H_PURPLE / 2), 0, 'rightArm', purpleColor);
        this.rightArm.geometry.translate(0, ARM_H_PURPLE / 2 * GLOBAL_SCALE, 0); // pivot top
        this.rightArm.position.y = ARM_PIVOT_Y * GLOBAL_SCALE;
        this.rightArm.rotation.x = 0;

        // Right Hand (child of rightArm)
        this.rightHand = createBoxPart(HAND_W, HAND_H, HAND_D, 0, -(ARM_H_PURPLE / 2 + HAND_H / 2), 0, 'rightHand', blackColor, this.rightArm);
        // Attach weapon group to right hand
        this.weaponGroup = new THREE.Group();
        this.rightHand.add(this.weaponGroup);

        // Left Arm
        this.leftArm = createBoxPart(ARM_W, ARM_H_PURPLE, ARM_D, ARM_X_OFFSET, ARM_PIVOT_Y - (ARM_H_PURPLE / 2), 0, 'leftArm', purpleColor);
        this.leftArm.geometry.translate(0, ARM_H_PURPLE / 2 * GLOBAL_SCALE, 0);
        this.leftArm.position.y = ARM_PIVOT_Y * GLOBAL_SCALE;
        this.leftArm.rotation.x = 0;

        // Left Hand (child of leftArm)
        this.leftHand = createBoxPart(HAND_W, HAND_H, HAND_D, 0, -(ARM_H_PURPLE / 2 + HAND_H / 2), 0, 'leftHand', blackColor, this.leftArm);

        // Legs setup
        const LEG_X_OFFSET = (BODY_W / 2) - (LEG_W / 2);
        const LEG_PIVOT_Y = TOTAL_LEG_HEIGHT;

        // Right Leg
        this.rightLeg = createBoxPart(LEG_W, LEG_H_PURPLE, LEG_D, -LEG_X_OFFSET, LEG_PIVOT_Y - (LEG_H_PURPLE / 2), 0, 'rightLeg', purpleColor);
        this.rightLeg.geometry.translate(0, LEG_H_PURPLE * GLOBAL_SCALE, 0);
        this.rightLeg.position.y = LEG_PIVOT_Y * GLOBAL_SCALE;

        // Make right leg invisible but keep feet visible by setting opacity
        this.rightLeg.material.transparent = true;
        this.rightLeg.material.opacity = 0;

        // Right Foot (child of rightLeg)
        this.rightFoot = createBoxPart(FOOT_W, FOOT_H, FOOT_D, 0, -(LEG_H_PURPLE / 2 + FOOT_H / 2), 0, 'rightFoot', blackColor, this.rightLeg);

        // Left Leg
        this.leftLeg = createBoxPart(LEG_W, LEG_H_PURPLE, LEG_D, LEG_X_OFFSET, LEG_PIVOT_Y - (LEG_H_PURPLE / 2), 0, 'leftLeg', purpleColor);
        this.leftLeg.geometry.translate(0, LEG_H_PURPLE * GLOBAL_SCALE, 0); 
        this.leftLeg.position.y = LEG_PIVOT_Y * GLOBAL_SCALE;

        // Make left leg invisible but keep feet visible by setting opacity
        this.leftLeg.material.transparent = true;
        this.leftLeg.material.opacity = 0;

        // Left Foot (child of leftLeg)
        this.leftFoot = createBoxPart(FOOT_W, FOOT_H, FOOT_D, 0, -(LEG_H_PURPLE / 2 + FOOT_H / 2), 0, 'leftFoot', blackColor, this.leftLeg);

        // Face (purple)
        const faceMaterial = new THREE.MeshBasicMaterial({ color: purpleColor });
        const FACE_Z_OFFSET = HEAD_D / 2 * GLOBAL_SCALE + 0.001 * GLOBAL_SCALE;
        const EYE_W = 1, EYE_H = 1, MOUTH_W = 3, MOUTH_H = 0.5;

        const leftEye = new THREE.Mesh(new THREE.BoxGeometry(EYE_W * GLOBAL_SCALE, EYE_H * GLOBAL_SCALE, 0.1 * GLOBAL_SCALE), faceMaterial);
        leftEye.position.set(-1.5 * GLOBAL_SCALE, 0.5 * GLOBAL_SCALE, FACE_Z_OFFSET);
        this.head.add(leftEye);

        const rightEye = new THREE.Mesh(new THREE.BoxGeometry(EYE_W * GLOBAL_SCALE, EYE_H * GLOBAL_SCALE, 0.1 * GLOBAL_SCALE), faceMaterial);
        rightEye.position.set(1.5 * GLOBAL_SCALE, 0.5 * GLOBAL_SCALE, FACE_Z_OFFSET);
        this.head.add(rightEye);

        const mouth = new THREE.Mesh(new THREE.BoxGeometry(MOUTH_W * GLOBAL_SCALE, MOUTH_H * GLOBAL_SCALE, 0.1 * GLOBAL_SCALE), faceMaterial);
        mouth.position.set(0, -0.5 * GLOBAL_SCALE, FACE_Z_OFFSET);
        this.head.add(mouth);

        // Ensure feet at ground level
        this.playerGroup.position.y = 0;
    }

    update(position, isWalking) {
        this.playerGroup.position.set(position.x, position.y, position.z);
        this.walking = isWalking;
        this.animateLimbs();
    }

    animateLimbs() {
        const baseArmRotation = 0;

        if (this.walking) {
            this.armSwingAngle += this.walkSpeed * this.swingFrequency;
            this.legSwingAngle += this.walkSpeed * this.swingFrequency;

            const armSwing = Math.sin(this.armSwingAngle) * 0.5;
            const legRotation = Math.sin(this.legSwingAngle) * 0.5;

            this.rightArm.rotation.x = baseArmRotation + armSwing;
            this.leftArm.rotation.x = baseArmRotation - armSwing;
            this.rightLeg.rotation.x = -legRotation;
            this.leftLeg.rotation.x = legRotation;

            // Body stays static (no movement)
            // Head could be animated here if desired, currently static
        } else {
            this.rightArm.rotation.x = baseArmRotation;
            this.leftArm.rotation.x = baseArmRotation;
            this.rightLeg.rotation.x = 0;
            this.leftLeg.rotation.x = 0;
        }
    }

    setWeaponModel(weaponType) {
        // Remove previous weapon
        while (this.weaponGroup.children.length > 0) {
            this.weaponGroup.remove(this.weaponGroup.children[0]);
        }
        // Add new weapon
        if (weaponType === 'Sword') {
            // Neon sword: blade (cyan) + hilt (magenta)
            const blade = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.8, 0.12),
                new THREE.MeshBasicMaterial({ color: 0x00ffff }) // Removed emissive
            );
            blade.position.y = 0.4;
            const hilt = new THREE.Mesh(
                new THREE.CylinderGeometry(0.09, 0.09, 0.18, 12),
                new THREE.MeshBasicMaterial({ color: 0xff00ff }) // Removed emissive
            );
            hilt.position.y = -0.35;
            this.weaponGroup.add(blade);
            this.weaponGroup.add(hilt);
        } else if (weaponType === 'Gun') {
            // Neon gun: body (cyan) + barrel (magenta)
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.15, 0.15),
                new THREE.MeshBasicMaterial({ color: 0x00ffff }) // Removed emissive
            );
            body.position.y = 0.1;
            const barrel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.04, 0.3, 12),
                new THREE.MeshBasicMaterial({ color: 0xff00ff }) // Removed emissive
            );
            barrel.position.y = 0.25;
            barrel.rotation.z = Math.PI / 2;
            this.weaponGroup.add(body);
            this.weaponGroup.add(barrel);
        }
    }
}
