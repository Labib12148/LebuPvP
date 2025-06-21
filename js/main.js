// main.js

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { initArena } from './arena.js';
import { PlayerPhysics } from './PlayerPhysics.js';
import { PlayerModel } from './player.js';
import { MusicPlayer } from './music.js';
import { HealthSystem } from './healthSystem.js';
import { setupInput, toggleEscMenu, setupEscMenuEvents } from './escMenu.js';

// Create music player but do NOT autoplay yet
export const musicPlayer = new MusicPlayer('assets/sounds/Pigstep1hr.mp3');


// Main game start function
export function startGame() {
    const socket = io();

    let scene;
    let renderer;
    let playerPhysics;
    let players = {}; // Stores other players' models
    let healthSystem;
    let started = false;

    function init() {
        const arena = initArena();
        scene = arena.scene;
        renderer = arena.renderer;
        const collidableObjects = arena.collidableObjects;

        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(renderer.domElement);
        renderer.domElement.id = 'gameCanvas';

        playerPhysics = new PlayerPhysics(scene, renderer.domElement, collidableObjects, showMessageBox, socket);

        // Init HUD health system
        healthSystem = new HealthSystem(10);
        healthSystem.setHealth(10);

        started = true;
        socket.emit("start");

        // Setup input handling with ESC menu toggle
        setupInput(toggleEscMenu);

        // Window resize handling
        window.addEventListener("resize", () => {
            const camera = playerPhysics.getCamera();
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        animate(0);

        // Attack action on left click
        renderer.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                socket.emit('attack');
            }
        });
    }

    // Show custom message box
    function showMessageBox(message) {
        const messageBox = document.getElementById('messageBox');
        const messageText = document.getElementById('messageText');
        const messageButton = document.getElementById('messageButton');

        messageText.textContent = message;
        messageBox.style.display = 'flex';

        messageButton.onclick = () => {
            messageBox.style.display = 'none';
        };
    }

    let lastTime = 0;
    function animate(currentTime) {
        requestAnimationFrame(animate);

        if (!started) return;

        const deltaTime = (currentTime - lastTime) * 0.001;
        lastTime = currentTime;

        if (playerPhysics) playerPhysics.update(deltaTime);
        if (renderer && scene && playerPhysics.getCamera()) {
            renderer.render(scene, playerPhysics.getCamera());
        }
    }

    // Start music playback on first user interaction (to avoid autoplay blocking)
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
    startMusicOnInteraction();

    // Socket events as before ...
    socket.on("currentPlayers", (serverPlayers) => {
        for (const id in serverPlayers) {
            if (!players[id] && id !== socket.id) {
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
                players[id] = otherPlayerModel;
            }
        }
    });

    socket.on("newPlayer", ({ id, position, rotationY, isWalking }) => {
        if (players[id] || id === socket.id) return;

        const newPlayerModel = new PlayerModel(scene);
        newPlayerModel.playerGroup.position.set(position.x, position.y, position.z);
        newPlayerModel.playerGroup.rotation.y = rotationY;
        newPlayerModel.update(new THREE.Vector3(position.x, position.y, position.z), isWalking);
        players[id] = newPlayerModel;
    });

    socket.on("playerMoved", ({ id, position, rotationY, isWalking }) => {
        if (players[id] && id !== socket.id) {
            players[id].playerGroup.position.set(position.x, position.y, position.z);
            players[id].playerGroup.rotation.y = rotationY;
            players[id].update(new THREE.Vector3(position.x, position.y, position.z), isWalking);
        }
    });

    socket.on("playerDisconnected", (id) => {
        if (players[id]) {
            scene.remove(players[id].playerGroup);
            delete players[id];
        }
    });

    // Receive health updates for this player
    socket.on('updateHealth', ({ id, health }) => {
        if (id === socket.id && healthSystem) {
            healthSystem.setHealth(health);
        }
    });

    socket.on('playerRespawn', ({ id, position, health }) => {
        if (id === socket.id) {
            // Reset health HUD
            if (healthSystem) healthSystem.setHealth(health);
            // Teleport player to new position
            if (playerPhysics) {
                playerPhysics.position.set(position.x, position.y, position.z);
            }
        } else if (players[id]) {
            // Other player's model resets position
            players[id].playerGroup.position.set(position.x, position.y, position.z);
        }
    });

    init();
    setupEscMenuEvents(musicPlayer)
}
