// Home Screen JavaScript
// Implements navigation, authentication check, and main UI interactions

class HomeManager {
    constructor() {
        this.sidebarOpen = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.bindEvents();
        this.loadUserData();
    }

    checkAuthentication() {
        const token = localStorage.getItem('authToken');
        const userEmail = localStorage.getItem('userEmail');
        
        if (!token || !userEmail) {
            // User is not authenticated, redirect to login
            window.location.href = 'index.html';
            return;
        }

        this.currentUser = {
            email: userEmail,
            token: token
        };

        // Validate token with backend
        this.validateToken();
    }

    async validateToken() {
        try {
            const response = await fetch('http://localhost:8000/api/auth/validate', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.currentUser.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // Token is invalid, redirect to login
                this.logout();
                return;
            }

            const data = await response.json();
            console.log('User authenticated:', data);
        } catch (error) {
            console.error('Token validation error:', error);
            // If there's a network error, still allow access but log the error
        }
    }

    bindEvents() {
        // Hamburger menu toggle
        const hamburger = document.getElementById('hamburger');
        const sidebar = document.getElementById('sidebar');

        hamburger.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', (event) => {
            if (this.sidebarOpen && 
                !sidebar.contains(event.target) && 
                !hamburger.contains(event.target)) {
                this.closeSidebar();
            }
        });

        // Sidebar menu items
        document.getElementById('optionsBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToOptions();
        });

        document.getElementById('profileBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showProfile();
        });

        document.getElementById('aboutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showAbout();
        });

        // Render toggle button
        document.getElementById('toggleRenderer').addEventListener('click', () => {
            this.toggleRenderer();
        });

        // Camera reset button
        document.getElementById('resetCamera').addEventListener('click', () => {
            this.resetCamera();
        });

        // Handle escape key to close sidebar
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.sidebarOpen) {
                this.closeSidebar();
            }
        });
    }

    loadUserData() {
        // Load user-specific data and preferences
        // This could include character preferences, chat history, etc.
        const userName = this.currentUser.email.split('@')[0];
        document.getElementById('character-name').textContent = `${userName}のキャラクター`;
    }

    toggleSidebar() {
        const hamburger = document.getElementById('hamburger');
        const sidebar = document.getElementById('sidebar');

        if (this.sidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        const hamburger = document.getElementById('hamburger');
        const sidebar = document.getElementById('sidebar');

        hamburger.classList.add('active');
        sidebar.classList.add('active');
        this.sidebarOpen = true;
    }

    closeSidebar() {
        const hamburger = document.getElementById('hamburger');
        const sidebar = document.getElementById('sidebar');

        hamburger.classList.remove('active');
        sidebar.classList.remove('active');
        this.sidebarOpen = false;
    }

    navigateToOptions() {
        // Navigate to options page
        window.location.href = 'options.html';
    }

    showProfile() {
        // Show user profile modal or navigate to profile page
        this.showMessage('プロフィール機能は開発中です', 'info');
        this.closeSidebar();
    }

    showAbout() {
        // Show about modal
        const aboutText = `3D Character Admiring v1.0 (MCP)\n\n` +
                         `Three.jsとA-Frameを使用した3Dキャラクター観察アプリです。\n` +
                         `開発者: プロウェブエンジニア\n` +
                         `技術スタック: Three.js, A-Frame, FastAPI, Gemini 2.0 Flash`;
        
        alert(aboutText);
        this.closeSidebar();
    }

    toggleRenderer() {
        // Toggle between Three.js and A-Frame renderers
        const threeJsDisplay = document.getElementById('character-display');
        const aframeScene = document.getElementById('aframe-scene');
        const toggleBtn = document.getElementById('toggleRenderer');

        if (aframeScene.classList.contains('hidden')) {
            // Switch to A-Frame
            threeJsDisplay.style.display = 'none';
            aframeScene.classList.remove('hidden');
            toggleBtn.textContent = 'A-Frame ⇄ Three.js';
            this.showMessage('A-Frameレンダラーに切り替えました', 'info');
            
            // Notify character3d.js to pause Three.js rendering
            if (window.character3DManager) {
                window.character3DManager.pauseRendering();
            }
        } else {
            // Switch to Three.js
            aframeScene.classList.add('hidden');
            threeJsDisplay.style.display = 'block';
            toggleBtn.textContent = 'Three.js ⇄ A-Frame';
            this.showMessage('Three.jsレンダラーに切り替えました', 'info');
            
            // Notify character3d.js to resume Three.js rendering
            if (window.character3DManager) {
                window.character3DManager.resumeRendering();
            }
        }
    }

    resetCamera() {
        // Reset camera position in both renderers
        if (window.character3DManager) {
            window.character3DManager.resetCamera();
        }
        
        // Reset A-Frame camera
        const aframeCamera = document.querySelector('a-camera');
        if (aframeCamera) {
            aframeCamera.setAttribute('position', '0 1.6 3');
            aframeCamera.setAttribute('rotation', '0 0 0');
        }
        
        this.showMessage('カメラをリセットしました', 'info');
    }

    logout() {
        // Clear authentication data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        sessionStorage.clear();
        
        // Redirect to login
        window.location.href = 'index.html';
    }

    showMessage(message, type = 'info') {
        // Create and show a temporary message
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transition: all 0.3s ease;
            max-width: 300px;
            font-size: 14px;
        `;

        // Set background color based on type
        switch (type) {
            case 'success':
                messageElement.style.background = '#4CAF50';
                break;
            case 'error':
                messageElement.style.background = '#f44336';
                break;
            case 'info':
            default:
                messageElement.style.background = '#2196F3';
                break;
        }

        document.body.appendChild(messageElement);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }

    showLoading(show = true) {
        const loadingElement = document.getElementById('loading');
        if (show) {
            loadingElement.classList.remove('hidden');
        } else {
            loadingElement.classList.add('hidden');
        }
    }
}

// Initialize home manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.homeManager = new HomeManager();
});
