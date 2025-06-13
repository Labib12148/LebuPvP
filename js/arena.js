import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

const BLOCK_SIZE = 1;
const FLOOR_Y = 0;

const loader = new THREE.TextureLoader();
const textures = {
    block: loader.load("assets/block.png"),
    grass: loader.load("assets/grass.png")
};

export function initArena() {
    const scene = new THREE.Scene();
    const collidableObjects = [];

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0x606060));

    const grassMaterial = new THREE.MeshLambertMaterial({ map: textures.grass });
    const blockMaterial = new THREE.MeshLambertMaterial({ map: textures.block });

    function addBlock(x, y, z, material, isCollidable = false) {
        const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x + BLOCK_SIZE / 2, y + BLOCK_SIZE / 2, z + BLOCK_SIZE / 2);

        if (isCollidable) {
            mesh.userData.isCollidable = true;
            mesh.geometry.computeBoundingBox();
            mesh.userData.boundingBox = new THREE.Box3().setFromObject(mesh);
            collidableObjects.push(mesh);
        }
        scene.add(mesh);
    }

    const floorRadius = 50;
    for (let x = -floorRadius; x <= floorRadius; x++) {
        for (let z = -floorRadius; z <= floorRadius; z++) {
            if (x * x + z * z <= floorRadius * floorRadius) {
                addBlock(x, FLOOR_Y, z, grassMaterial, false);
            }
        }
    }

    const wallHeight = 5;
    // Increased wallThickness to make the barrier more robust and prevent glitches
    const wallThickness = 2; // Changed from 1 to 2
    const wallInnerRadius = floorRadius;
    const wallOuterRadius = floorRadius + wallThickness;

    // Iterate over a square region that encompasses the outer wall
    for (let x = -(wallOuterRadius + 1); x <= (wallOuterRadius + 1); x++) {
        for (let z = -(wallOuterRadius + 1); z <= (wallOuterRadius + 1); z++) {
            const dist = Math.sqrt(x * x + z * z);

            // Check if the current (x, z) coordinate falls within the annulus of the wall
            // Using <= for wallOuterRadius to ensure full coverage up to and including the outer edge
            if (dist >= wallInnerRadius && dist <= wallOuterRadius) { // Changed < to <= for wallOuterRadius
                for (let h = 0; h < wallHeight; h++) {
                    // Add blocks vertically to form the wall
                    addBlock(x, FLOOR_Y + h + 1, z, blockMaterial, true);
                }
            }
        }
    }

    scene.background = new THREE.Color(0x87CEEB);

    return { scene, camera, renderer, collidableObjects };
}
