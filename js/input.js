// input.js
// Import currentItem and changeHotbar from ui.js for managing hotbar state
import { currentItem, changeHotbar } from "./ui.js";
// Import hotbarItems from textures.js for consistency in item definitions
import { hotbarItems } from "./textures.js";

const keys = {}; // Object to track currently pressed keys
let pointerLocked = false; // Flag to check if pointer lock is active

/**
 * Initializes all event listeners for player input.
 * @param {HTMLElement} canvas - The canvas element for pointer lock.
 * @param {SocketIO.Socket} socket - The Socket.IO client instance for emitting events.
 */
export function initInput(canvas, socket) {
  // Add keyboard event listeners
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("keypress", onKeyPress); // Typically not used for continuous movement

  // Add mouse event listeners
  window.addEventListener("mousedown", (e) => onMouseDown(e, socket)); // Pass socket to onMouseDown
  window.addEventListener("wheel", onMouseWheel);
  window.addEventListener("contextmenu", (e) => e.preventDefault()); // Prevent right-click context menu

  // Event listener for clicking on the canvas to request pointer lock
  canvas.addEventListener("click", () => {
    if (!pointerLocked) canvas.requestPointerLock();
  });

  // Event listener for pointer lock state changes
  document.addEventListener("pointerlockchange", () => {
    pointerLocked = document.pointerLockElement === canvas; // Update pointerLocked flag
    console.log("Pointer locked:", pointerLocked); // Debug pointer lock state
    // Toggle crosshair visibility based on pointer lock state
    document.getElementById("crosshair").style.display = pointerLocked ? "block" : "none";
  });
}

/**
 * Returns the current state of pressed keys.
 * @returns {Object} An object where keys are lowercase key names and values are booleans (true if pressed).
 */
export function getKeys() {
  return keys;
}

/**
 * Handles keydown events, setting the corresponding key in the 'keys' object to true.
 * Also handles hotbar selection and exiting pointer lock.
 * @param {KeyboardEvent} e - The keyboard event object.
 */
function onKeyDown(e) {
  keys[e.key.toLowerCase()] = true; // Set key state to true
  console.log("Key down:", e.key); // Debug key press

  // Check if a number key (1-9) was pressed for hotbar selection
  if (e.key >= "1" && e.key <= "9") {
    const index = parseInt(e.key) - 1; // Convert key to 0-indexed hotbar slot
    changeHotbar(index); // Change the hotbar selection
  }

  // If 'Escape' key is pressed, exit pointer lock
  if (e.key === "Escape") {
    document.exitPointerLock();
  }
}

/**
 * Handles keyup events, setting the corresponding key in the 'keys' object to false.
 * @param {KeyboardEvent} e - The keyboard event object.
 */
function onKeyUp(e) {
  keys[e.key.toLowerCase()] = false; // Set key state to false
}

/**
 * Handles keypress events (currently reserved).
 * @param {KeyboardEvent} e - The keyboard event object.
 */
function onKeyPress(e) {
  // Reserved for F5 or others if needed
}

/**
 * Handles mouse down events for attacking and using items.
 * @param {MouseEvent} e - The mouse event object.
 * @param {SocketIO.Socket} socket - The Socket.IO client instance for emitting events.
 */
function onMouseDown(e, socket) {
  if (!pointerLocked) return; // Only process if pointer is locked

  const heldItem = hotbarItems[currentItem]; // Get the currently held item

  if (e.button === 0) {  // Left click (primary action)
    if (heldItem === "shield") {
      console.log("Shield raised (left click) — no attack"); // Shield's primary action is blocking, not attacking
    } else {
      // Determine damage based on the held item
      let damage = heldItem === "sword" ? 0.5 : heldItem === "axe" ? 1 : 0; // Sword does 0.5, Axe does 1, others do 0
      socket.emit("attack", { damage }); // Emit an "attack" event to the server with damage amount
      console.log(`Attacked with ${heldItem}, damage: ${damage}`); // Debug attack
    }
  }

  if (e.button === 2) {  // Right click (secondary action)
    if (heldItem === "shield") {
      console.log("Blocking with shield (right click)"); // Shield's secondary action is blocking
    } else {
      console.log(`Used ${heldItem} with right click`); // Generic secondary action for other items
    }
  }
}

/**
 * Handles mouse wheel events for changing hotbar items.
 * @param {WheelEvent} e - The mouse wheel event object.
 */
function onMouseWheel(e) {
  const dir = Math.sign(e.deltaY); // Get scroll direction (-1 for up, 1 for down)
  let newIndex = currentItem + dir; // Calculate new hotbar index

  // Wrap around hotbar if scrolling past ends
  if (newIndex < 0) newIndex = hotbarItems.length - 1;
  if (newIndex >= hotbarItems.length) newIndex = 0;
  
  changeHotbar(newIndex); // Change the hotbar selection
}
