// Options Screen JavaScript
// Handles logout functionality and app settings for MCP

class OptionsManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.bindEvents();
        this.loadUserInfo();
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
    }

    bindEvents() {
        // Back button
        document.getElementById('backButton').addEventListener('click', () => {
            this.goBack();
        });

        // Logout button
        document.getElementById('logoutButton').addEventListener('click', () => {
            this.showLogoutConfirmation();
        });

        // Debug button
        document.getElementById('debugButton').addEventListener('click', () => {
            this.showDebugInfo();
        });

        // Clear chat button
        document.getElementById('clearChatButton').addEventListener('click', () => {
            this.showClearChatConfirmation();
        });

        // Modal buttons
        document.getElementById('modalCancel').addEventListener('click', () => {
            this.hideModal('confirmModal');
        });

        document.getElementById('modalConfirm').addEventListener('click', () => {
            this.executeModalAction();
        });

        document.getElementById('debugClose').addEventListener('click', () => {
            this.hideModal('debugModal');
        });

        // Close modal on background click
        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideModal('confirmModal');
            }
        });

        document.getElementById('debugModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideModal('debugModal');
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal('confirmModal');
                this.hideModal('debugModal');
            }
        });
    }

    loadUserInfo() {
        if (this.currentUser) {
            document.getElementById('userEmail').textContent = this.currentUser.email;
        }
    }

    goBack() {
        // Navigate back to home screen
        window.location.href = 'home.html';
    }

    showLogoutConfirmation() {
        this.showModal(
            'confirmModal',
            'ログアウト確認',
            'ログアウトしますか？\n次回ログイン時は認証が必要です。',
            'logout'
        );
    }

    showClearChatConfirmation() {
        this.showModal(
            'confirmModal',
            'チャット履歴クリア',
            'チャット履歴を削除しますか？\nこの操作は取り消せません。',
            'clearChat'
        );
    }

    showModal(modalId, title, message, action) {
        const modal = document.getElementById(modalId);
        const titleElement = document.getElementById('modalTitle');
        const messageElement = document.getElementById('modalMessage');
        
        titleElement.textContent = title;
        messageElement.textContent = message;
        modal.dataset.action = action;
        
        modal.classList.remove('hidden');
        
        // Focus on cancel button for accessibility
        setTimeout(() => {
            document.getElementById('modalCancel').focus();
        }, 100);
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('hidden');
        delete modal.dataset.action;
    }

    executeModalAction() {
        const modal = document.getElementById('confirmModal');
        const action = modal.dataset.action;
        
        switch (action) {
            case 'logout':
                this.performLogout();
                break;
            case 'clearChat':
                this.performClearChat();
                break;
            default:
                console.warn('Unknown modal action:', action);
                break;
        }
        
        this.hideModal('confirmModal');
    }

    async performLogout() {
        const logoutButton = document.getElementById('logoutButton');
        this.setButtonLoading(logoutButton, true);

        try {
            // Attempt to notify backend of logout
            const response = await fetch('http://localhost:8000/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.currentUser.token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Note: We proceed with logout regardless of backend response
            // to ensure user can always logout from frontend
            
        } catch (error) {
            console.error('Logout request failed:', error);
            // Still proceed with logout
        }

        // Clear authentication data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        sessionStorage.clear();
        
        // Clear any cached data
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
        
        // Show success message briefly before redirect
        this.showMessage('ログアウトしました', 'success');
        
        // Redirect to login after brief delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }

    performClearChat() {
        try {
            // Clear chat-related localStorage items
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('chat_')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Clear sessionStorage chat data
            const sessionKeysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith('chat_')) {
                    sessionKeysToRemove.push(key);
                }
            }
            
            sessionKeysToRemove.forEach(key => {
                sessionStorage.removeItem(key);
            });
            
            this.showMessage('チャット履歴をクリアしました', 'success');
            
        } catch (error) {
            console.error('Failed to clear chat history:', error);
            this.showMessage('チャット履歴のクリアに失敗しました', 'error');
        }
    }

    showDebugInfo() {
        const debugInfo = this.collectDebugInfo();
        const debugElement = document.getElementById('debugInfo');
        
        debugElement.textContent = JSON.stringify(debugInfo, null, 2);
        
        document.getElementById('debugModal').classList.remove('hidden');
    }

    collectDebugInfo() {
        const info = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            localStorage: {},
            sessionStorage: {},
            authentication: {
                hasToken: !!localStorage.getItem('authToken'),
                hasEmail: !!localStorage.getItem('userEmail'),
                userEmail: this.currentUser?.email || 'N/A'
            },
            performance: {
                memoryUsage: this.getMemoryUsage(),
                connectionType: this.getConnectionType()
            },
            features: {
                webGL: this.checkWebGLSupport(),
                webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
                geolocation: 'geolocation' in navigator,
                notifications: 'Notification' in window
            }
        };

        // Collect localStorage data (excluding sensitive info)
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !key.includes('Token') && !key.includes('password')) {
                info.localStorage[key] = localStorage.getItem(key);
            } else if (key) {
                info.localStorage[key] = '[HIDDEN]';
            }
        }

        // Collect sessionStorage data (excluding sensitive info)
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && !key.includes('Token') && !key.includes('password')) {
                info.sessionStorage[key] = sessionStorage.getItem(key);
            } else if (key) {
                info.sessionStorage[key] = '[HIDDEN]';
            }
        }

        return info;
    }

    getMemoryUsage() {
        if ('memory' in performance) {
            return {
                usedJSHeapSize: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
                totalJSHeapSize: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
                jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
            };
        }
        return 'Not available';
    }

    getConnectionType() {
        if ('connection' in navigator) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }
        return 'Not available';
    }

    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (e) {
            return false;
        }
    }

    setButtonLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
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
}

// Initialize options manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
});
