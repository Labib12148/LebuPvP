import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { initArena } from './arena.js';
import { PlayerPhysics } from './PlayerPhysics.js';
import { PlayerModel } from './player.js';
import { setupUI, updateHealthBar } from './ui.js';
import { initInput } from './input.js';

// This function will be called by index.html after the user clicks "Play"
export function startGame() {
    const socket = io();

    let scene;
    let renderer;
    let playerPhysics;
    let players = {};
    let currentItem = 0;
    let started = false;

    // Define initial health for the player
    const health = { current: 10, max: 10 };
    // Define hotbar items (these are also defined in textures.js and ui.js, ensure consistency)
    const hotbarItems = ["sword", "axe", "shield"];

    // The main initialization logic for the game
    function init() {
        const arena = initArena();
        scene = arena.scene;
        renderer = arena.renderer;
        const collidableObjects = arena.collidableObjects;

        // Append the renderer's canvas to the game container
        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(renderer.domElement);
        renderer.domElement.id = 'gameCanvas'; // Assign an ID for styling if needed

        playerPhysics = new PlayerPhysics(scene, renderer.domElement, collidableObjects, showMessageBox, socket);

        // Setup the game UI.
        // The original 'play' button logic from setupUI is now handled by the landing page.
        // We can directly start the game UI elements here.
        setupUI(hotbarItems, health); // Pass hotbarItems and health to setupUI
        document.getElementById("hud").style.display = "block"; // Or 'flex' depending on your layout
        started = true;
        socket.emit("start");

        // Initialize input handlers, passing the canvas element and socket
        initInput(renderer.domElement, socket);

        // Event listener for window resize to update camera and renderer
        window.addEventListener("resize", () => {
            const camera = playerPhysics.getCamera();
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Start the animation loop once initialization is complete
        animate(0);
    }

    // Function to display messages in a custom message box
    function showMessageBox(message) {
        const messageBox = document.getElementById('messageBox');
        const messageText = document.getElementById('messageText');
        const messageButton = document.getElementById('messageButton');

        messageText.textContent = message;
        messageBox.style.display = 'block';

        messageButton.onclick = () => {
            messageBox.style.display = 'none';
        };
    }
    
    // Function to change the currently selected hotbar item
    function changeHotbar(index) {
        if (index >= hotbarItems.length) return; // Prevent out-of-bounds access
        currentItem = index;

        // Update the visual selection in the hotbar UI
        document.querySelectorAll(".hotbar-slot").forEach((el, i) =>
            el.classList.toggle("selected", i === index)
        );

        // If player model exists, update the held item visually
        if (playerPhysics && playerPhysics.playerModel) {
            playerPhysics.playerModel.updateHeldItem(currentItem);
        }
    }

    let lastTime = 0;
    // Main animation loop
    function animate(currentTime) {
        requestAnimationFrame(animate);

        // Ensure we only calculate deltaTime and render if the game has started
        if (!started) return;

        const deltaTime = (currentTime - lastTime) * 0.001; // Convert to seconds
        lastTime = currentTime;

        // Update player physics
        if (playerPhysics) {
            playerPhysics.update(deltaTime);
        }

        // Render the scene
        if (renderer && scene && playerPhysics.getCamera()) {
            renderer.render(scene, playerPhysics.getCamera());
        }
    }

    // --- Socket.IO Event Handlers ---
    // Handle current players on connection
    socket.on("currentPlayers", (serverPlayers) => {
        for (const id in serverPlayers) {
            if (!players[id] && id !== socket.id) {
                const otherPlayerModel = new PlayerModel(scene);
                otherPlayerModel.playerGroup.position.set(
                    serverPlayers[id].position.x,
                    serverPlayers[id].position.y,
                    serverPlayers[id].position.z
                );
                players[id] = otherPlayerModel;
            }
        }
    });

    // Handle new player joining
    socket.on("newPlayer", ({ id, position, skinUrl }) => {
        if (players[id] || id === socket.id) return; // Don't add self or existing player

        const newPlayerModel = new PlayerModel(scene);
        newPlayerModel.playerGroup.position.set(position.x, position.y, position.z);
        players[id] = newPlayerModel;
    });

    // Handle player movement
    socket.on("playerMoved", ({ id, position }) => {
        if (players[id] && id !== socket.id) {
            players[id].playerGroup.position.set(position.x, position.y, position.z);
        }
    });

    // Handle player disconnection
    socket.on("playerDisconnected", (id) => {
        if (players[id]) {
            scene.remove(players[id].playerGroup);
            delete players[id];
        }
    });

    // Handle 'gotHit' event from the server to update player health
    socket.on("gotHit", (amount) => {
        health.current = Math.max(0, health.current - amount); // Decrease health, ensure it doesn't go below 0
        updateHealthBar(health); // Update the visual health bar
    });
    
    // Kick off the game initialization process
    init();
}
