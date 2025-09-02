/**
 * UIを制御するクラス
 */
class UIController {
    constructor() {
        // UI要素
        this.chatMessages = document.getElementById('chat-messages');
        this.userInput = document.getElementById('user-input');
        this.sendButton = document.getElementById('send-button');
        this.voiceButton = document.getElementById('voice-button');
        this.settingsButton = document.querySelector('.settings-button');
        this.settingsPanel = document.getElementById('settings-panel');
        this.closeSettingsButton = document.querySelector('.close-button');
        this.saveSettingsButton = document.getElementById('save-settings');
        this.resetSettingsButton = document.getElementById('reset-settings');
        this.themeSelect = document.getElementById('theme-select');
        this.geminiApiKeyInput = document.getElementById('gemini-api-key');
        this.nijivoiceApiKeyInput = document.getElementById('nijivoice-api-key');
        
        // 状態
        this.isListening = false;
        this.recognition = null;
        this.pendingMessages = [];
        this.isProcessingMessage = false;
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 音声認識の初期化
        this.initSpeechRecognition();
        
        // テーマの初期化
        this.initTheme();
        
        // 設定画面の初期化
        this.initSettingsPanel();
        
        // 入力フィールドの自動リサイズ設定
        this.setupAutoResize();
        
        // 初期メッセージの表示
        this.displayInitialMessage();
    }
    
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // メッセージ送信ボタン
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // 入力フィールドのEnterキー
        this.userInput.addEventListener('keydown', (e) => {
            // Enterキーで送信（Shiftキー同時押しの場合は改行）
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // 音声入力ボタン
        if (this.voiceButton) {
            this.voiceButton.addEventListener('click', () => {
                this.toggleSpeechRecognition();
            });
        }
        
        // 設定パネルを開く
        if (this.settingsButton) {
            this.settingsButton.addEventListener('click', () => {
                this.settingsPanel.classList.add('open');
            });
        }
        
        // 設定パネルを閉じる
        if (this.closeSettingsButton) {
            this.closeSettingsButton.addEventListener('click', () => {
                this.settingsPanel.classList.remove('open');
            });
        }
        
        // 設定を保存
        if (this.saveSettingsButton) {
            this.saveSettingsButton.addEventListener('click', () => {
                this.saveAllSettings();
                this.settingsPanel.classList.remove('open');
                this.showNotification('設定を保存しました');
            });
        }
        
        // 設定をリセット
        if (this.resetSettingsButton) {
            this.resetSettingsButton.addEventListener('click', () => {
                // 確認ダイアログ
                if (confirm('設定をデフォルトに戻しますか？')) {
                    localStorage.removeItem(CONFIG.storage.settingsKey);
                    window.location.reload();
                }
            });
        }
        
        // テーマ変更
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
            });
        }
    }
    
    /**
     * 音声認識の初期化
     */
    initSpeechRecognition() {
        // Web Speech APIのサポートチェック
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'ja-JP';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            
            // 音声認識結果のイベントハンドラ
            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                
                // 暫定結果を表示
                if (interimTranscript !== '') {
                    this.userInput.value = interimTranscript;
                }
                
                // 最終結果を送信
                if (finalTranscript !== '') {
                    this.userInput.value = finalTranscript;
                    this.stopSpeechRecognition();
                    this.sendMessage();
                }
            };
            
            // エラー処理
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopSpeechRecognition();
            };
            
            // 音声認識終了時
            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceButtonState();
            };
        } else {
            console.warn('Speech recognition not supported');
            if (this.voiceButton) {
                this.voiceButton.disabled = true;
                this.voiceButton.title = '音声認識はこのブラウザではサポートされていません';
            }
        }
    }
    
    /**
     * テーマの初期化
     */
    initTheme() {
        if (this.themeSelect) {
            this.themeSelect.value = CONFIG.ui.theme;
        }
        document.documentElement.setAttribute('data-theme', CONFIG.ui.theme);
    }
    
    /**
     * テーマの変更
     * @param {string} theme - テーマ名 ('light', 'dark', 'auto')
     */
    changeTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        CONFIG.ui.theme = theme;
        saveSettings();
    }
    
    /**
     * 設定画面の初期化
     */
    initSettingsPanel() {
        // APIキーの設定
        if (this.geminiApiKeyInput) {
            this.geminiApiKeyInput.value = CONFIG.gemini.apiKey || '';
        }
        
        if (this.nijivoiceApiKeyInput) {
            this.nijivoiceApiKeyInput.value = CONFIG.nijivoice.apiKey || '';
        }
        
        // テーマ設定の初期化
        if (this.themeSelect) {
            this.themeSelect.value = CONFIG.ui.theme;
        }
        
        // 音声設定の初期化
        const voiceSpeed = document.getElementById('voice-speed');
        if (voiceSpeed) {
            voiceSpeed.value = CONFIG.voicevox.defaultSpeed;
            const rangeValue = voiceSpeed.nextElementSibling;
            if (rangeValue) {
                rangeValue.textContent = CONFIG.voicevox.defaultSpeed.toFixed(1);
            }
        }
        
        // キャラクター設定の初期化
        const characterPersona = document.getElementById('character-persona');
        if (characterPersona) {
            characterPersona.value = CONFIG.character.personality;
        }
    }
    
    /**
     * すべての設定を保存
     */
    saveAllSettings() {
        // APIキーの保存
        if (this.geminiApiKeyInput) {
            const geminiKey = this.geminiApiKeyInput.value.trim();
            if (geminiKey) {
                CONFIG.gemini.apiKey = geminiKey;
                if (window.geminiAPI) {
                    window.geminiAPI.setApiKey(geminiKey);
                }
                console.log('Gemini APIキーを更新しました');
            }
        }
        
        if (this.nijivoiceApiKeyInput) {
            const nijivoiceKey = this.nijivoiceApiKeyInput.value.trim();
            if (nijivoiceKey) {
                CONFIG.nijivoice.apiKey = nijivoiceKey;
                if (window.nijivoiceSpeech) {
                    window.nijivoiceSpeech.apiKey = nijivoiceKey;
                }
                console.log('にじボイス APIキーを更新しました');
            }
        }
        
        // 従来の設定保存処理
        saveSettings();
    }
    
    /**
     * 入力フィールドの自動リサイズ設定
     */
    setupAutoResize() {
        const autoResize = () => {
            this.userInput.style.height = 'auto';
            this.userInput.style.height = Math.min(this.userInput.scrollHeight, 120) + 'px';
        };
        
        this.userInput.addEventListener('input', autoResize);
        window.addEventListener('resize', autoResize);
    }
    
    /**
     * 初期メッセージの表示
     */
    displayInitialMessage() {
        // チャット履歴が空の場合のみ初期メッセージを表示
        if (window.geminiAPI && window.geminiAPI.chatHistory.length === 0) {
            setTimeout(() => {
                this.addMessage('assistant', CONFIG.ui.initialMessage);
            }, 500);
        } else {
            // チャット履歴がある場合は表示
            this.displayChatHistory();
        }
    }
    
    /**
     * チャット履歴の表示
     */
    displayChatHistory() {
        if (!window.geminiAPI || !window.geminiAPI.chatHistory.length) return;
        
        // チャットメッセージをクリア
        this.chatMessages.innerHTML = '';
        
        // 履歴を表示（最新の10件のみ）
        const recentHistory = window.geminiAPI.chatHistory.slice(-10);
        recentHistory.forEach(entry => {
            this.addMessage(entry.role, entry.content, false);
        });
        
        // スクロールを最下部に
        this.scrollToBottom();
    }
    
    /**
     * メッセージの送信処理
     */
    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;
        
        // ユーザー入力をクリア
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        
        // ユーザーメッセージを表示
        this.addMessage('user', message);
        
        // メッセージをキューに追加
        this.pendingMessages.push(message);
        
        // メッセージ処理が実行中でなければ処理を開始
        if (!this.isProcessingMessage) {
            this.processNextMessage();
        }
    }
    
    /**
     * キュー内の次のメッセージを処理
     */
    async processNextMessage() {
        if (this.pendingMessages.length === 0) {
            this.isProcessingMessage = false;
            return;
        }
        
        this.isProcessingMessage = true;
        const message = this.pendingMessages.shift();
        
        try {
            // AI応答の生成中メッセージを表示
            const loadingMessageId = this.addLoadingMessage();
            
            // Gemini APIからの応答を取得
            const response = await window.geminiAPI.sendMessage(message);
            
            // ローディングメッセージを削除
            this.removeLoadingMessage(loadingMessageId);
            
            // AI応答を表示
            this.addMessage('assistant', response);
            
            // 音声読み上げ
            if (window.voiceManager) {
                try {
                    await window.voiceManager.speak(response);
                } catch (error) {
                    console.error('音声読み上げエラー:', error);
                    this.addErrorMessage(`音声合成に失敗しました: ${error.message || 'エラーが発生しました'}`);
                }
            } else {
                console.error('音声マネージャーが初期化されていません');
                this.addErrorMessage('音声合成エンジンが利用できません。APIキーを確認してページを再読み込みしてください。');
            }
            
        } catch (error) {
            console.error('Error processing message:', error);
            this.addErrorMessage('応答の生成中にエラーが発生しました。もう一度お試しください。');
        }
        
        // 次のメッセージを処理
        this.processNextMessage();
    }
    
    /**
     * チャットメッセージの追加
     * @param {string} role - メッセージの送信者 ('user' または 'assistant')
     * @param {string} content - メッセージの内容
     * @param {boolean} animate - アニメーションを適用するかどうか
     */
    addMessage(role, content, animate = true) {
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${role === 'user' ? 'user' : 'ai'}`;
        
        // マークダウン変換（assistantメッセージのみ）
        if (role === 'assistant' && typeof marked !== 'undefined') {
            messageElement.innerHTML = marked.parse(content);
        } else {
            messageElement.textContent = content;
        }
        
        // アニメーション設定
        if (!animate) {
            messageElement.style.animation = 'none';
        }
        
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
        
        return messageElement.id;
    }
    
    /**
     * ローディングメッセージの追加
     * @returns {string} - メッセージID
     */
    addLoadingMessage() {
        const messageElement = document.createElement('div');
        messageElement.className = 'message message-ai message-loading';
        messageElement.id = 'loading-message-' + Date.now();
        
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<span></span><span></span><span></span>';
        
        messageElement.appendChild(document.createTextNode('応答を生成中'));
        messageElement.appendChild(loadingIndicator);
        
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
        
        return messageElement.id;
    }
    
    /**
     * ローディングメッセージの削除
     * @param {string} id - メッセージID
     */
    removeLoadingMessage(id) {
        const messageElement = document.getElementById(id);
        if (messageElement) {
            messageElement.remove();
        }
    }
    
    /**
     * エラーメッセージの追加
     * @param {string} message - エラーメッセージ
     */
    addErrorMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message message-system';
        messageElement.textContent = `⚠️ ${message}`;
        
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }
    
    /**
     * 通知メッセージの表示
     * @param {string} message - 通知メッセージ
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 2秒後に削除
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }
    
    /**
     * チャットを最下部にスクロール
     */
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    /**
     * 音声認識の開始/停止を切り替え
     */
    toggleSpeechRecognition() {
        if (!this.recognition) return;
        
        if (this.isListening) {
            this.stopSpeechRecognition();
        } else {
            this.startSpeechRecognition();
        }
    }
    
    /**
     * 音声認識の開始
     */
    startSpeechRecognition() {
        if (!this.recognition) return;
        
        try {
            this.recognition.start();
            this.isListening = true;
            this.updateVoiceButtonState();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
        }
    }
    
    /**
     * 音声認識の停止
     */
    stopSpeechRecognition() {
        if (!this.recognition) return;
        
        try {
            this.recognition.stop();
            this.isListening = false;
            this.updateVoiceButtonState();
        } catch (error) {
            console.error('Error stopping speech recognition:', error);
        }
    }
    
    /**
     * 音声ボタンの状態更新
     */
    updateVoiceButtonState() {
        if (!this.voiceButton) return;
        
        if (this.isListening) {
            this.voiceButton.classList.add('listening');
            this.voiceButton.querySelector('.material-symbols-rounded').textContent = 'mic_off';
        } else {
            this.voiceButton.classList.remove('listening');
            this.voiceButton.querySelector('.material-symbols-rounded').textContent = 'mic';
        }
    }
}

// DOMContentLoadedイベントでUIControllerのインスタンスを作成
document.addEventListener('DOMContentLoaded', () => {
    window.uiController = new UIController();
});
