// effects.js
// Handles visual and particle effects (sparks, hit, death, ability FX)

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

export function spawnParticleEffect(scene, position, color = 0xffffff, size = 0.2, duration = 0.5) {
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(position);
    scene.add(particle);
    setTimeout(() => scene.remove(particle), duration * 1000);
}

// Add more complex effects as needed (weapon glow, hit flashes, etc.)
