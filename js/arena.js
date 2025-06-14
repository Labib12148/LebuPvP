import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

const BLOCK_SIZE = 1;
const FLOOR_Y = 0;
const FLOOR_RADIUS = 30;

const loader = new THREE.TextureLoader();
const floorTextures = [];
for (let i = 1; i <= 5; i++) {
    floorTextures.push(loader.load(`assets/floor${i}.png`));
}

const textures = {
    block: loader.load("assets/block.png")
};

export function initArena() {
    const scene = new THREE.Scene();
    const collidableObjects = [];

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xaaaaaa, 0x111111, 1);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight.position.set(100, 100, 50);
    dirLight.castShadow = false;
    scene.add(dirLight);

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
        return mesh;
    }

    // 🕺 Organized Disco Floor — Tiled pattern with cycling animation
    const floorBlocks = [];
    const patternSize = 5; // size of repeating pattern (5 textures)

    for (let x = -FLOOR_RADIUS; x <= FLOOR_RADIUS; x++) {
        for (let z = -FLOOR_RADIUS; z <= FLOOR_RADIUS; z++) {
            if (x * x + z * z <= FLOOR_RADIUS * FLOOR_RADIUS) {
                // Select texture index based on position for a repeating pattern
                const patternIndex = ((x + FLOOR_RADIUS) % patternSize + (z + FLOOR_RADIUS) % patternSize) % floorTextures.length;

                const material = new THREE.MeshBasicMaterial({
                    map: floorTextures[patternIndex],
                    transparent: true,
                    opacity: 1
                });

                const block = addBlock(x, FLOOR_Y, z, material, false);
                floorBlocks.push({
                    mesh: block,
                    x: x + FLOOR_RADIUS,
                    z: z + FLOOR_RADIUS,
                    baseIndex: patternIndex
                });
            }
        }
    }

    // 💡 Disco Animation - cycling textures in a wave pattern
    let animationStep = 0;
    setInterval(() => {
        animationStep++;
        for (const blockData of floorBlocks) {
            // Cycle texture index based on position and animation step for wave effect
            const newIndex = (blockData.baseIndex + animationStep + blockData.x + blockData.z) % floorTextures.length;
            blockData.mesh.material.map = floorTextures[newIndex];
            blockData.mesh.material.needsUpdate = true;
        }
    }, 500); // change every 0.5 seconds for a lively effect

    // 🧱 Walls
    const wallHeight = 5;
    const wallThickness = 2;
    const wallInnerRadius = FLOOR_RADIUS;
    const wallOuterRadius = FLOOR_RADIUS + wallThickness;

    for (let x = -(wallOuterRadius + 1); x <= (wallOuterRadius + 1); x++) {
        for (let z = -(wallOuterRadius + 1); z <= (wallOuterRadius + 1); z++) {
            const dist = Math.sqrt(x * x + z * z);
            if (dist >= wallInnerRadius && dist <= wallOuterRadius) {
                for (let h = 0; h < wallHeight; h++) {
                    addBlock(x, FLOOR_Y + h + 1, z, blockMaterial, true);
                }
            }
        }
    }

    // 🌌 Retro Sky Shader
    const skyGeo = new THREE.SphereGeometry(500, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
            topColor: { value: new THREE.Color(0x001f3f) },
            bottomColor: { value: new THREE.Color(0x39CCCC) },
            offset: { value: 33 },
            exponent: { value: 0.6 }
        },
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `,
        depthWrite: false
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    // ✨ Stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 500;
    const starPositions = [];

    for (let i = 0; i < starCount; i++) {
        const radius = 450;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        starPositions.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5,
        sizeAttenuation: false
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    return { scene, camera, renderer, collidableObjects };
}
