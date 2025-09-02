// 3D Character Display Manager using Three.js
// References Three.js official documentation: https://threejs.org/docs/

class Character3DManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.character = null;
        this.animationId = null;
        this.isRendering = true;
        this.container = document.getElementById('character-display');
        
        this.init();
    }

    init() {
        this.setupScene();
        this.setupLighting();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.createDefaultCharacter();
        this.startRenderLoop();
        this.handleResize();
        
        console.log('Three.js Character3D Manager initialized');
    }

    setupScene() {
        // Create scene with Three.js
        // Reference: https://threejs.org/docs/#api/en/scenes/Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
        
        // Add fog for depth perception
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 50);
    }

    setupLighting() {
        // Ambient light for overall illumination
        // Reference: https://threejs.org/docs/#api/en/lights/AmbientLight
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Directional light for main lighting
        // Reference: https://threejs.org/docs/#api/en/lights/DirectionalLight
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        
        this.scene.add(directionalLight);

        // Additional fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-1, 0.5, -1);
        this.scene.add(fillLight);
    }

    setupCamera() {
        // Perspective camera setup
        // Reference: https://threejs.org/docs/#api/en/cameras/PerspectiveCamera
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera = new THREE.PerspectiveCamera(
            75, // field of view
            width / height, // aspect ratio
            0.1, // near clipping plane
            1000 // far clipping plane
        );
        
        this.camera.position.set(0, 1.6, 3);
        this.camera.lookAt(0, 1, 0);
    }

    setupRenderer() {
        // WebGL renderer setup
        // Reference: https://threejs.org/docs/#api/en/renderers/WebGLRenderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        this.container.appendChild(this.renderer.domElement);
    }

    setupControls() {
        // Orbit controls for camera movement
        // Reference: https://threejs.org/docs/#examples/en/controls/OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10;
        this.controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below ground
        this.controls.target.set(0, 1, 0); // Look at character center
        
        this.controls.update();
    }

    createDefaultCharacter() {
        // Create a simple character for MCP (T-pose acceptable as per requirements)
        const characterGroup = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.5, 1.0, 0.3);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 }); // Light pink
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        characterGroup.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC }); // Skin tone
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.2;
        head.castShadow = true;
        characterGroup.add(head);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.03, 8, 8);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.08, 1.25, 0.15);
        characterGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.08, 1.25, 0.15);
        characterGroup.add(rightEye);
        
        // Arms (T-pose)
        const armGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.15);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.4, 0.7, 0);
        leftArm.rotation.z = Math.PI / 2;
        leftArm.castShadow = true;
        characterGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.4, 0.7, 0);
        rightArm.rotation.z = -Math.PI / 2;
        rightArm.castShadow = true;
        characterGroup.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.15);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 }); // Royal blue for pants
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.15, -0.3, 0);
        leftLeg.castShadow = true;
        characterGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.15, -0.3, 0);
        rightLeg.castShadow = true;
        characterGroup.add(rightLeg);
        
        // Add subtle idle animation
        characterGroup.userData = {
            originalY: 0,
            time: 0
        };
        
        this.character = characterGroup;
        this.scene.add(this.character);
        
        // Add ground plane
        this.createGround();
        
        console.log('Default character created in T-pose');
    }

    createGround() {
        // Create ground plane with shadow receiving
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x7BC8A4 }); // Light green
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        
        this.scene.add(ground);
    }

    startRenderLoop() {
        const animate = () => {
            if (!this.isRendering) {
                return;
            }
            
            this.animationId = requestAnimationFrame(animate);
            
            // Update controls
            this.controls.update();
            
            // Simple idle animation for character
            if (this.character) {
                this.character.userData.time += 0.01;
                this.character.position.y = this.character.userData.originalY + 
                    Math.sin(this.character.userData.time) * 0.02;
                this.character.rotation.y += 0.005; // Slow rotation
            }
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }

    pauseRendering() {
        this.isRendering = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    resumeRendering() {
        this.isRendering = true;
        this.startRenderLoop();
    }

    resetCamera() {
        // Reset camera to initial position
        this.camera.position.set(0, 1.6, 3);
        this.controls.target.set(0, 1, 0);
        this.controls.update();
        
        console.log('Camera reset to initial position');
    }

    handleResize() {
        window.addEventListener('resize', () => {
            if (!this.container || !this.renderer || !this.camera) return;
            
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });
    }

    // Method to load VRM models in future phases
    async loadVRMModel(modelPath) {
        try {
            // This will be implemented in later phases using @pixiv/three-vrm
            // Reference: https://pixiv.github.io/three-vrm/docs/
            console.log('VRM model loading will be implemented in Phase 2');
            
            // Placeholder for VRM loading
            return null;
        } catch (error) {
            console.error('VRM model loading error:', error);
            return null;
        }
    }

    // Method to trigger character animations
    triggerAnimation(animationType) {
        // Placeholder for character animations (Phase 2)
        console.log(`Animation triggered: ${animationType}`);
        
        // Simple placeholder animation
        if (this.character) {
            const originalScale = this.character.scale.clone();
            this.character.scale.multiplyScalar(1.1);
            
            setTimeout(() => {
                this.character.scale.copy(originalScale);
            }, 200);
        }
    }

    dispose() {
        // Clean up resources
        this.pauseRendering();
        
        if (this.renderer) {
            this.container.removeChild(this.renderer.domElement);
            this.renderer.dispose();
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Dispose geometries and materials
        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}

// Initialize 3D character manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if character display container exists
    const container = document.getElementById('character-display');
    if (container) {
        window.character3DManager = new Character3DManager();
    }
});
