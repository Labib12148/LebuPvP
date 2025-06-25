// playerName.js
// Handles player name input and display above character

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

export function getPlayerName() {
    const input = document.getElementById('player-name-input');
    return input ? input.value : 'Player';
}

export function setPlayerNameAbove(model, name) {
    // Remove old name tag if exists
    if (model.nameTag) {
        model.playerGroup.remove(model.nameTag);
    }
    // Create new name tag
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '64px Press Start 2P';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.strokeText(name, 128, 40);
    ctx.fillText(name, 128, 40);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.5, 1);
    sprite.position.set(0, 2.2, 0); // Adjust above head
    model.playerGroup.add(sprite);
    model.nameTag = sprite;
}
