import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.167.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.167.0/examples/jsm/loaders/GLTFLoader.js';

// --- Basic Setup ---

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight * 0.7), 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const container = document.getElementById('character-container');
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 1, 0);
scene.add(directionalLight);

// --- Character Loading ---
const loader = new GLTFLoader();
// IMPORTANT: Replace 'assets/avatar.glb' with the actual path to your 3D model.
// You can download free GLTF/GLB models from sites like Sketchfab.
// Create an 'assets' folder in your project and place the model file there.
loader.load(
    'assets/avatar.glb', // Example path - this will fail initially
    function (gltf) {
        const model = gltf.scene;
        // Optional: Adjust model scale, position, rotation
        model.scale.set(1, 1, 1);
        model.position.set(0, -1, 0); // Adjust Y position to have it stand on the "ground"
        scene.add(model);
    },
    // called while loading is progressing
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    // called when loading has errors
    function (error) {
        console.error('Could not load 3D model, displaying fallback cube.', error);
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
    }
);

camera.position.z = 5;


// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    // If you have animations in your model, you'll need to add an AnimationMixer here.
    renderer.render(scene, camera);
}
animate();


// --- UI ---
const hamburgerMenu = document.getElementById('hamburger-menu');
const sidebar = document.getElementById('sidebar');

hamburgerMenu.addEventListener('click', () => {
    if (sidebar.style.width === '250px') {
        sidebar.style.width = '0';
    } else {
        sidebar.style.width = '250px';
    }
});

// --- Chat ---
const sendButton = document.getElementById('send-button');
const userInput = document.getElementById('user-input');
const chatLog = document.getElementById('chat-log');

sendButton.addEventListener('click', () => {
    const message = userInput.value;
    if (message.trim() !== '') {
        // Display user message
        const userMessageElem = document.createElement('p');
        userMessageElem.textContent = `You: ${message}`;
        chatLog.appendChild(userMessageElem);

        // Dummy character response
        const characterResponseElem = document.createElement('p');
        characterResponseElem.textContent = `Character: Hello! You said: "${message}"`;
        chatLog.appendChild(characterResponseElem);

        userInput.value = '';
        chatLog.scrollTop = chatLog.scrollHeight; // Scroll to bottom
    }
});
