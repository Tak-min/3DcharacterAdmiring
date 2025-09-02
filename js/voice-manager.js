/**
 * 音声合成エンジンを管理するクラス
 * VOICEVOXとにじボイスの切り替えを行います
 */
class VoiceManager {
    constructor() {
        this.currentEngine = CONFIG.voice.currentEngine || 'voicevox';
        this.engines = {};
        this.activeEngine = null;
        
        // 初期化
        this.init();
    }
    
    /**
     * 初期化処理
     */
    async init() {
        console.log('VoiceManager: 初期化中...');
        
        // VOICEVOXエンジンの初期化
        this.engines.voicevox = window.voicevoxSpeech;
        
        // にじボイスエンジンの初期化
        this.engines.nijivoice = window.nijivoiceSpeech;
        
        // 現在のエンジンを設定
        this.setEngine(this.currentEngine);
        
        // UIの初期化
        this.initUI();
        
        console.log('VoiceManager: 初期化完了、現在のエンジン:', this.currentEngine);
    }
    
    /**
     * UIの初期化
     */
    initUI() {
        console.log('VoiceManager: UI初期化');
        
        // エンジン切り替えボタンの設定
        const voicevoxButton = document.getElementById('voicevox-button');
        const nijivoiceButton = document.getElementById('nijivoice-button');
        
        if (voicevoxButton) {
            console.log('VoiceManager: VOICEVOXボタン登録');
            voicevoxButton.addEventListener('click', () => {
                console.log('VoiceManager: VOICEVOXボタンクリック');
                if (this.currentEngine !== 'voicevox') {
                    this.setEngine('voicevox');
                    this.updateUI();
                    // フィードバックを表示
                    this.showMessage('音声エンジンをVOICEVOXに切り替えました');
                }
            });
        } else {
            console.warn('VoiceManager: VOICEVOXボタンが見つかりません');
        }
        
        if (nijivoiceButton) {
            console.log('VoiceManager: にじボイスボタン登録');
            nijivoiceButton.addEventListener('click', () => {
                console.log('VoiceManager: にじボイスボタンクリック');
                if (this.currentEngine !== 'nijivoice') {
                    this.setEngine('nijivoice');
                    this.updateUI();
                    // フィードバックを表示
                    this.showMessage('音声エンジンをにじボイスに切り替えました');
                }
            });
        } else {
            console.warn('VoiceManager: にじボイスボタンが見つかりません');
        }
        
        // 初期UIの更新
        this.updateUI();
    }
    
    /**
     * UIの更新
     */
    updateUI() {
        console.log('VoiceManager: UI更新、現在のエンジン:', this.currentEngine);
        
        const voicevoxButton = document.getElementById('voicevox-button');
        const nijivoiceButton = document.getElementById('nijivoice-button');
        const engineLabel = document.getElementById('voice-engine-label');
        
        if (voicevoxButton && nijivoiceButton) {
            // アクティブなエンジンに対応するボタンをハイライト
            if (this.currentEngine === 'voicevox') {
                voicevoxButton.classList.add('active');
                nijivoiceButton.classList.remove('active');
            } else {
                voicevoxButton.classList.remove('active');
                nijivoiceButton.classList.add('active');
            }
        } else {
            console.warn('VoiceManager: 音声エンジンボタンが見つかりません');
        }
        
        if (engineLabel) {
            engineLabel.textContent = this.currentEngine === 'voicevox' ? 'VOICEVOX' : 'にじボイス';
        } else {
            console.warn('VoiceManager: エンジンラベルが見つかりません');
        }
        
        // 話者リストの更新
        if (this.activeEngine) {
            this.activeEngine.updateSpeakerSelect();
        }
    }
    
    /**
     * エンジンの切り替え
     * @param {string} engineName - エンジン名 ('voicevox' または 'nijivoice')
     */
    setEngine(engineName) {
        console.log('VoiceManager: エンジン切り替え要求:', engineName);
        
        if (engineName !== 'voicevox' && engineName !== 'nijivoice') {
            console.error('VoiceManager: 無効なエンジン名:', engineName);
            this.showErrorMessage(`無効な音声エンジン名: ${engineName}`);
            return;
        }
        
        if (!this.engines[engineName]) {
            console.error('VoiceManager: エンジンが初期化されていません:', engineName);
            
            // エンジンを初期化しようとする
            if (engineName === 'voicevox' && !window.voicevoxSpeech) {
                window.voicevoxSpeech = new VoicevoxSpeech();
                this.engines.voicevox = window.voicevoxSpeech;
                console.log('VoiceManager: VOICEVOXエンジンを初期化しました');
            } else if (engineName === 'nijivoice' && !window.nijivoiceSpeech) {
                window.nijivoiceSpeech = new NijivoiceSpeech();
                this.engines.nijivoice = window.nijivoiceSpeech;
                console.log('VoiceManager: にじボイスエンジンを初期化しました');
            } else {
                this.showErrorMessage(`音声エンジン${engineName}が利用できません`);
                return;
            }
        }
        
        // 現在と同じエンジンの場合は何もしない
        if (this.currentEngine === engineName && this.activeEngine) {
            console.log('VoiceManager: 既に選択されているエンジンです:', engineName);
            return;
        }
        
        // 設定を更新
        this.currentEngine = engineName;
        CONFIG.voice.currentEngine = engineName;
        saveSettings();
        
        // アクティブなエンジンを設定
        this.activeEngine = this.engines[engineName];
        
        console.log(`VoiceManager: 音声エンジンを切り替えました: ${engineName}`);
        
        // VRMモデルとの連携を更新
        this.updateVRMConnection();
    }
    
    /**
     * VRMモデルとの連携を更新
     */
    updateVRMConnection() {
        if (window.vrmController && this.activeEngine) {
            // 前のエンジンのコールバックをクリア
            Object.values(this.engines).forEach(engine => {
                if (engine && engine.mouthMovementCallbacks) {
                    engine.mouthMovementCallbacks = [];
                }
            });
            
            // 新しいエンジンのコールバックを設定
            this.activeEngine.onMouthMovement((value) => {
                if (window.vrmController) {
                    window.vrmController.setMouthOpen(value);
                }
            });
        }
    }
    
    /**
     * テキストを音声で読み上げ
     * @param {string} text - 読み上げるテキスト
     * @returns {Promise} - 読み上げ完了時に解決するPromise
     */
    async speak(text) {
        if (!this.activeEngine) {
            console.error('VoiceManager: アクティブな音声エンジンがありません');
            this.showErrorMessage('音声合成エンジンが利用できません。設定を確認してください。');
            return Promise.resolve();
        }
        
        console.log(`VoiceManager: [${this.currentEngine}] 音声合成開始`, text.substring(0, 20) + '...');
        
        try {
            // 開始前にエンジンが有効かどうか再確認
            if (!this.engines[this.currentEngine]) {
                console.error(`VoiceManager: エンジン「${this.currentEngine}」が見つかりません`);
                this.showErrorMessage(`音声エンジン「${this.currentEngine}」が見つかりません。VOICEVOXに切り替えます。`);
                this.setEngine('voicevox');
                this.updateUI();
            }
            
            // 音声合成を実行
            const result = await this.activeEngine.speak(text);
            return result;
        } catch (error) {
            console.error('VoiceManager: 音声合成エラー:', error);
            
            // エラーの内容に応じて適切なメッセージを表示
            if (error.message && error.message.includes('Failed to fetch')) {
                this.showErrorMessage(`音声合成サーバーに接続できません。インターネット接続を確認してください。`);
            } else if (error.message && error.message.includes('API')) {
                this.showErrorMessage(`APIキーエラー: ${error.message}`);
            } else {
                this.showErrorMessage(`音声合成に失敗しました: ${error.message || 'エラーが発生しました'}`);
            }
            
            return Promise.resolve();
        }
    }
    
    /**
     * エラーメッセージを表示
     * @param {string} message - エラーメッセージ
     */
    showErrorMessage(message) {
        console.error('VoiceManager:', message);
        
        // チャットメッセージとしてエラーを表示
        const messageElement = document.createElement('div');
        messageElement.className = 'message message-system';
        messageElement.textContent = `⚠️ ${message}`;
        
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    /**
     * 情報メッセージを表示
     * @param {string} message - 情報メッセージ
     */
    showMessage(message) {
        console.log('VoiceManager:', message);
        
        // 通知として表示
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
     * 音声の再生を停止
     */
    stopAudio() {
        if (this.activeEngine) {
            this.activeEngine.stopAudio();
        }
    }
    
    /**
     * 音声再生完了時のコールバックを登録
     * @param {Function} callback - 完了時に呼び出す関数
     */
    onEnd(callback) {
        if (this.activeEngine && typeof callback === 'function') {
            this.activeEngine.onEnd(callback);
        }
    }
}

// インスタンス作成とグローバル変数への登録
document.addEventListener('DOMContentLoaded', () => {
    // VOICEVOXとにじボイスのエンジンが初期化された後に実行
    const initVoiceManager = () => {
        console.log('VoiceManager初期化チェック:', 
            window.voicevoxSpeech ? 'VOICEVOX準備完了' : 'VOICEVOX未初期化', 
            window.nijivoiceSpeech ? 'にじボイス準備完了' : 'にじボイス未初期化');

        // にじボイスが未初期化の場合は作成する
        if (!window.nijivoiceSpeech) {
            console.log('にじボイスを初期化します');
            window.nijivoiceSpeech = new NijivoiceSpeech();
        }
        
        // VOICEVOXが未初期化の場合は作成する
        if (!window.voicevoxSpeech) {
            console.log('VOICEVOXを初期化します');
            window.voicevoxSpeech = new VoicevoxSpeech();
        }
        
        // 両方のエンジンが存在するか再確認
        if (window.voicevoxSpeech && window.nijivoiceSpeech) {
            console.log('VoiceManager: 両方の音声エンジンが準備完了、マネージャーを初期化します');
            window.voiceManager = new VoiceManager();
            
            // VRMモデルが読み込まれたときの処理
            document.addEventListener('vrmLoaded', () => {
                if (window.voiceManager && window.vrmController) {
                    window.voiceManager.updateVRMConnection();
                }
            });
        } else {
            // エンジンがまだ初期化されていない場合は再試行（最大10回）
            if (initVoiceManager.retryCount === undefined) {
                initVoiceManager.retryCount = 0;
            }
            
            if (initVoiceManager.retryCount < 10) {
                console.log(`VoiceManager: 音声エンジン初期化待機中... (${initVoiceManager.retryCount + 1}/10)`);
                initVoiceManager.retryCount++;
                setTimeout(initVoiceManager, 500);
            } else {
                console.error('VoiceManager: 音声エンジンの初期化に失敗しました。');
                // エラーメッセージを表示
                const chatMessages = document.getElementById('chat-messages');
                if (chatMessages) {
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message message-system';
                    messageElement.textContent = `⚠️ 音声合成エンジンの初期化に失敗しました。ページを再読み込みしてください。`;
                    chatMessages.appendChild(messageElement);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }
        }
    };
    
    // 初期化を開始（少し遅らせて他のコンポーネントの初期化を待つ）
    setTimeout(initVoiceManager, 1000);
});
