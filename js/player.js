// player.js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

export const PLAYER_HEIGHT_UNITS = 1.8;
const PLAYER_WIDTH_UNITS = 0.6;
const MINECRAFT_MODEL_TOTAL_HEIGHT_PX = 32;
const GLOBAL_SCALE = PLAYER_HEIGHT_UNITS / MINECRAFT_MODEL_TOTAL_HEIGHT_PX;

export class PlayerModel {
    constructor(scene) {
        this.scene = scene;
        this.playerGroup = new THREE.Group();
        this.createMinecraftCharacter();
        this.scene.add(this.playerGroup);
    }

    createMinecraftCharacter() {
        // Helper function to create a box part of the character model
        const createBoxPart = (width, height, depth, xOffset, yOffset, zOffset, name, color) => {
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
            mesh.name = name; // Assign a name for easier access later
            this.playerGroup.add(mesh);
            return mesh;
        };

        // Create individual body parts of the Minecraft character
        this.head = createBoxPart(8, 8, 8, 0, 24, 0, 'head', 0x8B4513);
        this.body = createBoxPart(8, 12, 4, 0, 12, 0, 'body', 0x008000);
        this.rightArm = createBoxPart(4, 12, 4, -6, 12, 0, 'rightHand', 0x8B4513); // Renamed to rightHand for clarity
        this.leftArm = createBoxPart(4, 12, 4, 6, 12, 0, 'leftArm', 0x8B4513);
        this.rightLeg = createBoxPart(4, 12, 4, -2, 0, 0, 'rightLeg', 0x0000FF);
        this.leftLeg = createBoxPart(4, 12, 4, 2, 0, 0, 'leftLeg', 0x0000FF);

        // Adjust the player group's vertical position so it stands on the ground
        const LEG_HEIGHT_PX = 12;
        this.playerGroup.position.y = LEG_HEIGHT_PX * GLOBAL_SCALE;
    }

    // Update the player's position in the scene
    update(position) {
        this.playerGroup.position.set(
            position.x,
            position.y,
            position.z
        );
    }

}
