// Chat Manager for text-based conversation with character
// Uses Gemini 2.0 Flash API for AI responses

class ChatManager {
    constructor() {
        this.baseURL = 'http://localhost:8000/api';
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.scrollToBottom();
        console.log('Chat Manager initialized');
    }

    bindEvents() {
        // Send button click
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key press
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Input validation
        this.messageInput.addEventListener('input', (e) => {
            this.validateInput(e.target.value);
        });

        // Auto-resize input (if needed in future)
        this.messageInput.addEventListener('input', (e) => {
            // Placeholder for auto-resize functionality
        });
    }

    validateInput(text) {
        const trimmedText = text.trim();
        const isValid = trimmedText.length > 0 && trimmedText.length <= 500;
        
        this.sendButton.disabled = !isValid || this.isProcessing;
        
        // Visual feedback for character limit
        if (text.length > 450) {
            this.messageInput.style.borderColor = '#ff9800'; // Orange warning
        } else if (text.length > 500) {
            this.messageInput.style.borderColor = '#f44336'; // Red error
        } else {
            this.messageInput.style.borderColor = '#e1e5e9'; // Default
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message || this.isProcessing) {
            return;
        }

        // Validate message length
        if (message.length > 500) {
            this.showError('メッセージは500文字以内で入力してください');
            return;
        }

        this.isProcessing = true;
        this.sendButton.disabled = true;
        this.messageInput.disabled = true;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        
        // Show typing indicator
        const typingIndicator = this.addTypingIndicator();

        try {
            // Get authentication token
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('認証トークンが見つかりません');
            }

            // Send message to backend for AI processing
            const response = await fetch(`${this.baseURL}/chat/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: message,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Remove typing indicator
            this.removeTypingIndicator(typingIndicator);
            
            // Add AI response to chat
            this.addMessage(data.response, 'character');
            
            // Trigger character animation based on response sentiment (placeholder)
            this.triggerCharacterReaction(data.sentiment || 'neutral');
            
        } catch (error) {
            console.error('Chat error:', error);
            
            // Remove typing indicator
            this.removeTypingIndicator(typingIndicator);
            
            // Add error message
            this.addMessage(
                'すみません、ただいま応答できません。しばらくしてからもう一度お試しください。', 
                'character'
            );
            
            this.showError('メッセージの送信に失敗しました');
        } finally {
            this.isProcessing = false;
            this.sendButton.disabled = false;
            this.messageInput.disabled = false;
            this.messageInput.focus();
        }
    }

    addMessage(content, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.formatTime(new Date());
        
        messageElement.appendChild(messageContent);
        messageElement.appendChild(messageTime);
        
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
        
        // Animate message appearance
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(10px)';
        
        requestAnimationFrame(() => {
            messageElement.style.transition = 'all 0.3s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        });
    }

    addTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.className = 'message character-message typing-indicator';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'message-content';
        typingContent.innerHTML = '<span class="typing-dots">●●●</span>';
        
        typingElement.appendChild(typingContent);
        this.chatMessages.appendChild(typingElement);
        this.scrollToBottom();
        
        // Animate typing dots
        const dots = typingContent.querySelector('.typing-dots');
        let dotCount = 1;
        const typingAnimation = setInterval(() => {
            dots.textContent = '●'.repeat(dotCount) + '○'.repeat(3 - dotCount);
            dotCount = (dotCount % 3) + 1;
        }, 500);
        
        typingElement.animationInterval = typingAnimation;
        return typingElement;
    }

    removeTypingIndicator(typingElement) {
        if (typingElement && typingElement.parentNode) {
            clearInterval(typingElement.animationInterval);
            typingElement.parentNode.removeChild(typingElement);
        }
    }

    triggerCharacterReaction(sentiment) {
        // Trigger 3D character animation based on sentiment
        if (window.character3DManager) {
            let animationType = 'neutral';
            
            switch (sentiment) {
                case 'positive':
                case 'happy':
                    animationType = 'happy';
                    break;
                case 'negative':
                case 'sad':
                    animationType = 'sad';
                    break;
                case 'surprised':
                    animationType = 'surprised';
                    break;
                default:
                    animationType = 'neutral';
                    break;
            }
            
            window.character3DManager.triggerAnimation(animationType);
        }
        
        // Update character status display
        this.updateCharacterStatus(sentiment);
    }

    updateCharacterStatus(sentiment) {
        const statusElement = document.getElementById('character-status');
        if (!statusElement) return;
        
        let statusText = '準備完了';
        
        switch (sentiment) {
            case 'positive':
            case 'happy':
                statusText = '嬉しそう♪';
                break;
            case 'negative':
            case 'sad':
                statusText = 'ちょっと悲しそう...';
                break;
            case 'surprised':
                statusText = '驚いています！';
                break;
            case 'thinking':
                statusText = '考え中...';
                break;
            default:
                statusText = '聞いています';
                break;
        }
        
        statusElement.textContent = statusText;
        
        // Animate status change
        statusElement.style.transition = 'color 0.3s ease';
        statusElement.style.color = this.getSentimentColor(sentiment);
        
        setTimeout(() => {
            statusElement.style.color = '#666';
        }, 3000);
    }

    getSentimentColor(sentiment) {
        const colors = {
            'positive': '#4CAF50',
            'happy': '#4CAF50',
            'negative': '#f44336',
            'sad': '#f44336',
            'surprised': '#FF9800',
            'thinking': '#2196F3',
            'neutral': '#666'
        };
        
        return colors[sentiment] || colors.neutral;
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return '今';
        } else if (diff < 3600000) { // Less than 1 hour
            return `${Math.floor(diff / 60000)}分前`;
        } else if (diff < 86400000) { // Less than 1 day
            return `${Math.floor(diff / 3600000)}時間前`;
        } else {
            return date.toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    showError(message) {
        // Show temporary error message
        if (window.homeManager) {
            window.homeManager.showMessage(message, 'error');
        } else {
            console.error(message);
        }
    }

    // Method to load chat history (for future implementation)
    async loadChatHistory() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.baseURL}/chat/history`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const history = await response.json();
                this.renderChatHistory(history.messages);
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }

    renderChatHistory(messages) {
        // Clear current messages (except welcome message)
        const welcomeMessage = this.chatMessages.querySelector('.character-message');
        this.chatMessages.innerHTML = '';
        
        if (welcomeMessage) {
            this.chatMessages.appendChild(welcomeMessage);
        }
        
        // Render historical messages
        messages.forEach(msg => {
            this.addMessage(msg.content, msg.sender);
        });
    }

    // Clear chat (for testing or reset)
    clearChat() {
        this.chatMessages.innerHTML = '';
        this.addMessage('こんにちは！今日も会えて嬉しいです♪', 'character');
    }
}

// Add CSS for typing indicator
const style = document.createElement('style');
style.textContent = `
    .typing-indicator .message-content {
        background: linear-gradient(135deg, #667eea, #764ba2) !important;
        color: white !important;
    }
    
    .typing-dots {
        font-size: 18px;
        animation: typingPulse 1.5s infinite;
    }
    
    @keyframes typingPulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
    }
`;
document.head.appendChild(style);

// Initialize chat manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if chat elements exist
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        window.chatManager = new ChatManager();
    }
});
