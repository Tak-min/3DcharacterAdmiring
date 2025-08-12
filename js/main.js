import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

// --- Basic Setup ---
// Check authentication before running main script
if (!sessionStorage.getItem('authenticated')) {
    window.location.href = 'login.html';
}

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
// Note: Replace with an actual 3D model path
// For now, we'll just use a cube as a placeholder
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;


// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
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
