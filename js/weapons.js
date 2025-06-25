import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

// weapons.js
// Handles weapon logic, switching, and attacks

export class WeaponManager {
    constructor(playerPhysics) {
        this.weapons = [];
        this.currentIndex = 0;
        this.playerPhysics = playerPhysics;
    }

    addWeapon(weapon) {
        this.weapons.push(weapon);
    }

    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.currentIndex = index;
        }
    }

    nextWeapon() {
        this.currentIndex = (this.currentIndex + 1) % this.weapons.length;
    }

    prevWeapon() {
        this.currentIndex = (this.currentIndex - 1 + this.weapons.length) % this.weapons.length;
    }

    getCurrentWeapon() {
        return this.weapons[this.currentIndex];
    }

    attack(allPlayers = []) {
        const weapon = this.getCurrentWeapon();
        if (weapon && weapon.attack) {
            weapon.attack(this.playerPhysics, allPlayers);
        }
    }
}

// Example weapon classes
export class Sword {
    constructor() {
        this.name = 'Sword';
        this.cooldown = 0.4;
        this.cooldownTimer = 0;
        this.range = 1.5; // Melee range
        this.angle = Math.PI / 3; // 60 degree cone
        this.damage = 2; // 2 damage per hit
    }
    attack(playerPhysics, allPlayers = []) {
        if (this.cooldownTimer <= 0) {
            const myPos = playerPhysics.position;
            const myDir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, playerPhysics.playerModel.playerGroup.rotation.y, 0));
            for (const other of allPlayers) {
                if (other === playerPhysics) continue;
                if (!other.position) continue;
                const toOther = other.position.clone().sub(myPos);
                if (toOther.length() < this.range) {
                    const angle = myDir.angleTo(toOther.clone().setY(0).normalize());
                    if (angle < this.angle / 2) {
                        other.takeDamage?.(this.damage);
                    }
                }
            }
            this.cooldownTimer = this.cooldown;
        }
    }
    update(deltaTime) {
        if (this.cooldownTimer > 0) this.cooldownTimer -= deltaTime;
    }
}

export class Gun {
    constructor() {
        this.name = 'Gun';
        this.cooldown = 0.3;
        this.cooldownTimer = 0;
        this.range = 20;
        this.damage = 1; // 1 damage per hit
    }
    attack(playerPhysics, allPlayers = []) {
        if (this.cooldownTimer <= 0) {
            const myPos = playerPhysics.position.clone();
            const myDir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, playerPhysics.playerModel.playerGroup.rotation.y, 0));
            let closest = null;
            let minDist = this.range;
            for (const other of allPlayers) {
                if (other === playerPhysics) continue;
                if (!other.position) continue;
                const toOther = other.position.clone().sub(myPos);
                const proj = toOther.dot(myDir);
                if (proj > 0 && proj < minDist) {
                    const perp = toOther.clone().sub(myDir.clone().multiplyScalar(proj));
                    if (perp.length() < 0.7) {
                        closest = other;
                        minDist = proj;
                    }
                }
            }
            if (closest) {
                closest.takeDamage?.(this.damage);
            }
            this.cooldownTimer = this.cooldown;
        }
    }
    update(deltaTime) {
        if (this.cooldownTimer > 0) this.cooldownTimer -= deltaTime;
    }
}

// Add more weapons (Axe, MagicWand, etc.) as needed
