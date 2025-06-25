// main.js
// Clean, robust, and enhanced main game logic for LabX Arena
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { initArena } from './arena.js';
import { PlayerPhysics } from './PlayerPhysics.js';
import { PlayerModel } from './player.js';
import { MusicPlayer } from './music.js';
import { setupInput, toggleEscMenu, setupEscMenuEvents } from './escMenu.js';
import { WeaponManager, Sword, Gun } from './weapons.js';
import { HealthSystem, updateHealthBar } from './health.js';
import { getPlayerName, setPlayerNameAbove } from './playerName.js';

// --- GLOBALS ---
export const musicPlayer = new MusicPlayer('assets/sounds/Pigstep1hr.mp3');

// --- MAIN GAME ENTRY ---
export function startGame(playerName) {
    const socket = io();
    let scene, renderer, playerPhysics;
    let players = {}; // Remote players
    let started = false;
    let myId = playerName;

    // --- GAME INIT ---
    function init() {
        const arena = initArena();
        scene = arena.scene;
        renderer = arena.renderer;
        const collidableObjects = arena.collidableObjects;
        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(renderer.domElement);
        renderer.domElement.id = 'gameCanvas';

        // Local player
        playerPhysics = new PlayerPhysics(scene, renderer.domElement, collidableObjects, null, socket, playerName, myId);
        document.getElementById('ui-overlay').classList.remove('hidden');

        // Weapons
        const weaponManager = new WeaponManager(playerPhysics);
        weaponManager.addWeapon(new Sword());
        weaponManager.addWeapon(new Gun());
        const healthSystem = new HealthSystem(100);
        healthSystem.setHealthChangeCallback(updateHealthBar);
        setPlayerNameAbove(playerPhysics.playerModel, playerName);

        // UI: Hotbar
        const hotbar = document.getElementById('hotbar');
        function updateHotbar() {
            if (!hotbar) return;
            hotbar.innerHTML = '';
            weaponManager.weapons.forEach((weapon, i) => {
                const slot = document.createElement('div');
                slot.className = 'hotbar-slot' + (i === weaponManager.currentIndex ? ' selected' : '');
                slot.textContent = weapon.name;
                slot.onclick = () => { weaponManager.switchWeapon(i); playerPhysics.playerModel.setWeaponModel(weaponManager.getCurrentWeapon().name); };
                hotbar.appendChild(slot);
            });
        }
        updateHotbar();
        setInterval(updateHotbar, 200);

        // Controls
        window.addEventListener('keydown', e => {
            if (e.code === 'Digit1') weaponManager.switchWeapon(0);
            if (e.code === 'Digit2') weaponManager.switchWeapon(1);
            playerPhysics.playerModel.setWeaponModel(weaponManager.getCurrentWeapon().name);
        });
        window.addEventListener('wheel', e => {
            if (e.deltaY > 0) weaponManager.nextWeapon();
            else weaponManager.prevWeapon();
            playerPhysics.playerModel.setWeaponModel(weaponManager.getCurrentWeapon().name);
        });
        window.addEventListener('mousedown', e => {
            if (e.button === 0) {
                const allPlayers = [playerPhysics, ...Object.values(players).map(p => p)];
                weaponManager.attack(allPlayers);
            }
        });
        window.addEventListener("resize", () => {
            const camera = playerPhysics.getCamera();
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        started = true;
        socket.emit("start", { id: myId, name: playerName });
        setupInput(toggleEscMenu);
        setupEscMenuEvents(musicPlayer);
        startMusicOnInteraction();
        gameLoop(0);
    }

    // --- GAME LOOP ---
    let lastTime = 0;
    function gameLoop(currentTime) {
        requestAnimationFrame(gameLoop);
        if (!started) return;
        const deltaTime = (currentTime - lastTime) * 0.001;
        lastTime = currentTime;
        if (playerPhysics) playerPhysics.update(deltaTime);
        if (renderer && scene && playerPhysics.getCamera()) {
            renderer.render(scene, playerPhysics.getCamera());
        }
    }

    // --- MUSIC ---
    function startMusicOnInteraction() {
        const startMusic = () => {
            musicPlayer.audio.play().catch(e => {
                console.warn("Music play prevented by browser:", e);
            });
            window.removeEventListener('click', startMusic);
            window.removeEventListener('keydown', startMusic);
        };
        window.addEventListener('click', startMusic);
        window.addEventListener('keydown', startMusic);
    }

    // --- MULTIPLAYER EVENTS ---
    socket.on("currentPlayers", (serverPlayers) => {
        for (const id in serverPlayers) {
            if (!players[id] && id !== myId) {
                const otherPlayerModel = new PlayerModel(scene);
                otherPlayerModel.playerGroup.position.set(
                    serverPlayers[id].position.x,
                    serverPlayers[id].position.y,
                    serverPlayers[id].position.z
                );
                otherPlayerModel.playerGroup.rotation.y = serverPlayers[id].rotationY || 0;
                otherPlayerModel.update(
                    new THREE.Vector3(serverPlayers[id].position.x, serverPlayers[id].position.y, serverPlayers[id].position.z),
                    serverPlayers[id].isWalking
                );
                players[id] = {
                    playerModel: otherPlayerModel,
                    id,
                    position: otherPlayerModel.playerGroup.position,
                    takeDamage: (amount) => {},
                    health: serverPlayers[id].health
                };
            }
        }
    });
    socket.on("newPlayer", ({ id, position, rotationY, isWalking }) => {
        if (players[id] || id === myId) return;
        const newPlayerModel = new PlayerModel(scene);
        newPlayerModel.playerGroup.position.set(position.x, position.y, position.z);
        newPlayerModel.playerGroup.rotation.y = rotationY;
        newPlayerModel.update(new THREE.Vector3(position.x, position.y, position.z), isWalking);
        players[id] = {
            playerModel: newPlayerModel,
            id,
            position: newPlayerModel.playerGroup.position,
            takeDamage: (amount) => {},
            health: 100
        };
    });
    socket.on("playerMoved", ({ id, position, rotationY, isWalking }) => {
        if (players[id] && id !== myId) {
            players[id].playerModel.playerGroup.position.set(position.x, position.y, position.z);
            players[id].playerModel.playerGroup.rotation.y = rotationY;
            players[id].playerModel.update(new THREE.Vector3(position.x, position.y, position.z), isWalking);
            players[id].position = players[id].playerModel.playerGroup.position;
        }
    });
    socket.on("playerDisconnected", (id) => {
        if (players[id]) {
            scene.remove(players[id].playerModel.playerGroup);
            delete players[id];
        }
    });
    socket.on('playerState', ({ id, position, rotationY, isWalking, health, name }) => {
        if (id === myId) return;
        let p = players[id];
        if (!p) {
            const otherPlayerModel = new PlayerModel(scene);
            p = {
                playerModel: otherPlayerModel,
                id,
                position: otherPlayerModel.playerGroup.position,
                takeDamage: (amount) => {},
                health: health
            };
            players[id] = p;
        }
        p.playerModel.playerGroup.position.set(position.x, position.y, position.z);
        p.playerModel.playerGroup.rotation.y = rotationY;
        p.playerModel.update(new THREE.Vector3(position.x, position.y, position.z), isWalking);
        setPlayerNameAbove(p.playerModel, name);
        p.health = health;
    });
    socket.on('updateHealth', ({ id, health }) => {
        if (id === myId) {
            playerPhysics.healthSystem.currentHealth = health;
            updateHealthBar(health, playerPhysics.healthSystem.maxHealth);
        } else if (players[id]) {
            players[id].health = health;
        }
    });

    // --- START GAME ---
    init();
}
