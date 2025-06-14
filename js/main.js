// main.js

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { initArena } from './arena.js';
import { PlayerPhysics } from './PlayerPhysics.js';
import { PlayerModel } from './player.js';
import { MusicPlayer } from './music.js';
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

    init();
    setupEscMenuEvents(musicPlayer)
}
