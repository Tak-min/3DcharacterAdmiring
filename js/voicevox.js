/**
 * VOICEVOX音声合成エンジンと連携するクラス
 * ウェブ版VOICEVOXサーバーAPIを利用した実装
 */
class VoicevoxSpeech {
    constructor() {
        this.apiEndpoint = CONFIG.voicevox.apiEndpoint;
        this.apiKey = CONFIG.voicevox.apiKey || '';
        this.speakerId = CONFIG.voicevox.defaultSpeakerId;
        this.speed = CONFIG.voicevox.defaultSpeed;
        this.pitch = CONFIG.voicevox.defaultPitch;
        this.intonationScale = CONFIG.voicevox.defaultIntonationScale;
        this.audioContext = null;
        this.audioSource = null;
        this.isSpeaking = false;
        this.speakerList = [];
        this.mouthMovementCallbacks = [];
        this.onEndCallbacks = [];
        
        // 初期化
        this.init();
    }
    
    /**
     * 初期化処理
     */
    async init() {
        console.log('VOICEVOXSpeech: 初期化中...');
        
        // Web Audio APIのセットアップ
        this.initAudio();
        
        // 利用可能な話者リストを取得
        try {
            await this.fetchSpeakers();
        } catch (error) {
            console.error('VOICEVOXSpeech: 話者リスト取得エラー', error);
            // エラー時はデフォルトリストを使用
            this.useDefaultSpeakerList();
        }
    }
    
    /**
     * Web Audio APIの初期化
     */
    initAudio() {
        // AudioContextのセットアップ（ユーザージェスチャー後に実行される）
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    }
    
    /**
     * 利用可能な話者リストを取得
     */
    async fetchSpeakers() {
        try {
            console.log('VOICEVOXSpeech: 話者リスト取得開始');
            
            // セキュアAPIクライアント経由で取得
            if (window.secureApiClient) {
                const data = await window.secureApiClient.getVoicevoxSpeakers();
                console.log('VOICEVOXSpeech: 話者リスト取得成功（プロキシ経由）', data);
                
                if (Array.isArray(data)) {
                    this.speakerList = data;
                    this.updateSpeakerSelect();
                    return data;
                } else {
                    throw new Error('VOICEVOXSpeech: 話者リストの形式が不正です');
                }
            } else {
                throw new Error('セキュアAPIクライアントが利用できません');
            }
        } catch (error) {
            console.error('VOICEVOXSpeech: 話者リスト取得処理エラー:', error);
            this.showErrorMessage(`VOICEVOXサーバーに接続できませんでした: ${error.message || '不明なエラー'}`);
            
            // デモ用の話者リストを使用
            this.useDefaultSpeakerList();
            return [];
        }
    }
    
    /**
     * デモ用の話者リストを使用
     */
    useDefaultSpeakerList() {
        // 基本的な話者リストを静的に定義
        this.speakerList = [
            {
                "name": "四国めたん",
                "styles": [
                    { "id": 2, "name": "ノーマル" },
                    { "id": 0, "name": "あまあま" }
                ]
            },
            {
                "name": "ずんだもん",
                "styles": [
                    { "id": 3, "name": "ノーマル" },
                    { "id": 1, "name": "あまあま" }
                ]
            },
            {
                "name": "春日部つむぎ",
                "styles": [
                    { "id": 8, "name": "ノーマル" }
                ]
            }
        ];
        
        // スピーカー選択フォームを更新
        this.updateSpeakerSelect();
    }
    
    /**
     * スピーカー選択フォームの更新
     */
    updateSpeakerSelect() {
        const selectElement = document.getElementById('voice-select');
        if (!selectElement || !this.speakerList.length) return;
        
        // 既存のオプションをクリア
        selectElement.innerHTML = '';
        
        // 話者リストを追加
        this.speakerList.forEach(speaker => {
            speaker.styles.forEach(style => {
                const option = document.createElement('option');
                option.value = style.id;
                option.textContent = `${speaker.name} (${style.name})`;
                selectElement.appendChild(option);
            });
        });
        
        // 現在のスピーカーIDを選択
        selectElement.value = this.speakerId;
    }
    
    /**
     * 音声合成のリクエストを送信
     * @param {string} text - 読み上げるテキスト
     * @returns {Promise<ArrayBuffer>} - 音声データ
     */
    async synthesize(text) {
        if (!text || text.trim() === '') {
            return null;
        }
        
        try {
            console.log('VOICEVOXSpeech: 音声合成開始', text.substring(0, 20) + '...');
            
            // パラメータを構築
            const params = {
                text: text,
                speaker: this.speakerId,
                speed: this.speed,
                pitch: this.pitch,
                intonationScale: this.intonationScale
            };
            
            // セキュアAPIクライアント経由で音声合成
            if (window.secureApiClient) {
                const audioData = await window.secureApiClient.getVoicevoxAudio(params);
                console.log('VOICEVOXSpeech: 音声合成成功（プロキシ経由）');
                return audioData;
            } else {
                throw new Error('セキュアAPIクライアントが利用できません');
            }
        } catch (error) {
            console.error('VOICEVOXSpeech: 音声合成処理エラー:', error);
            
            // エラータイプ別の詳細メッセージ
            let userMessage = '';
            if (error.message.includes('Authentication failed')) {
                userMessage = 'VOICEVOX APIキーが無効です。設定を確認してください。';
            } else if (error.message.includes('Rate limit exceeded')) {
                userMessage = 'VOICEVOX APIのレート制限に達しました。しばらく待ってからお試しください。';
            } else {
                userMessage = `VOICEVOX音声合成に失敗しました: ${error.message}`;
            }
            
            this.showErrorMessage(userMessage);
            return null;
        }
    }
    
    /**
     * 音声を再生
     * @param {ArrayBuffer} audioData - 音声データ
     * @returns {Promise} - 再生完了時に解決するPromise
     */
    async playAudio(audioData) {
        if (!audioData || !this.audioContext) {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            // 既に再生中の場合は停止
            this.stopAudio();
            
            // 音声データをデコード
            this.audioContext.decodeAudioData(audioData, (buffer) => {
                // 再生準備
                this.audioSource = this.audioContext.createBufferSource();
                this.audioSource.buffer = buffer;
                
                // 分析用のノードを作成
                const analyser = this.audioContext.createAnalyser();
                analyser.fftSize = 1024;
                
                // 音量測定用の配列
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                
                // 接続
                this.audioSource.connect(analyser);
                analyser.connect(this.audioContext.destination);
                
                // 口の動きを制御するためのリスナー設定
                let mouthInterval = setInterval(() => {
                    if (!this.isSpeaking) {
                        clearInterval(mouthInterval);
                        return;
                    }
                    
                    // 音量データを取得
                    analyser.getByteFrequencyData(dataArray);
                    
                    // 平均音量を計算 (0～255の範囲)
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / dataArray.length;
                    
                    // 0～1の範囲に正規化
                    const normalizedValue = Math.min(average / 128, 1);
                    
                    // コールバックで口の動きを更新
                    this.mouthMovementCallbacks.forEach(callback => {
                        callback(normalizedValue);
                    });
                }, 50);
                
                // 再生完了時の処理
                this.audioSource.onended = () => {
                    this.isSpeaking = false;
                    clearInterval(mouthInterval);
                    
                    // 口を閉じる
                    this.mouthMovementCallbacks.forEach(callback => {
                        callback(0);
                    });
                    
                    // 完了コールバックを実行
                    this.onEndCallbacks.forEach(callback => callback());
                    
                    resolve();
                };
                
                // 再生開始
                this.audioSource.start(0);
                this.isSpeaking = true;
            }, (error) => {
                console.error('Error decoding audio data:', error);
                resolve();
            });
        });
    }
    
    /**
     * 音声の再生を停止
     */
    stopAudio() {
        if (this.audioSource && this.isSpeaking) {
            try {
                this.audioSource.stop();
            } catch (e) {
                // すでに停止している場合のエラーを無視
            }
            this.isSpeaking = false;
            
            // 口を閉じる
            this.mouthMovementCallbacks.forEach(callback => {
                callback(0);
            });
        }
    }
    
    /**
     * テキストを音声で読み上げ
     * @param {string} text - 読み上げるテキスト
     * @returns {Promise} - 読み上げ完了時に解決するPromise
     */
    async speak(text) {
        if (!text || text.trim() === '') {
            return Promise.resolve();
        }
        
        try {
            // 音声合成
            const audioData = await this.synthesize(text);
            if (!audioData) {
                return Promise.resolve();
            }
            
            // 音声再生
            return this.playAudio(audioData);
        } catch (error) {
            console.error('Error in speak function:', error);
            return Promise.resolve();
        }
    }
    
    /**
     * 口の動きのコールバックを登録
     * @param {Function} callback - 口の動きを更新する関数
     */
    onMouthMovement(callback) {
        if (typeof callback === 'function') {
            this.mouthMovementCallbacks.push(callback);
        }
    }
    
    /**
     * 音声再生完了時のコールバックを登録
     * @param {Function} callback - 完了時に呼び出す関数
     */
    onEnd(callback) {
        if (typeof callback === 'function') {
            this.onEndCallbacks.push(callback);
        }
    }
    
    /**
     * スピーカーIDを設定
     * @param {number} id - スピーカーID
     */
    setSpeakerId(id) {
        this.speakerId = id;
    }
    
    /**
     * 話速を設定
     * @param {number} speed - 話速（デフォルト: 1.0）
     */
    setSpeed(speed) {
        this.speed = speed;
    }
    
    /**
     * エラーメッセージを表示
     * @param {string} message - エラーメッセージ
     */
    showErrorMessage(message) {
        console.error('VOICEVOXSpeech:', message);
        
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
}

// インスタンス作成とグローバル変数への登録
document.addEventListener('DOMContentLoaded', () => {
    window.voicevoxSpeech = new VoicevoxSpeech();
    
    // キャラクターモデルと口の動きを連携
    document.addEventListener('vrmLoaded', () => {
        if (window.vrmController && window.voicevoxSpeech) {
            window.voicevoxSpeech.onMouthMovement((value) => {
                window.vrmController.setMouthOpen(value);
            });
        }
    });
    
    // 設定パネルの音声設定を連携
    const voiceSelect = document.getElementById('voice-select');
    if (voiceSelect) {
        voiceSelect.addEventListener('change', (e) => {
            if (window.voicevoxSpeech) {
                window.voicevoxSpeech.setSpeakerId(parseInt(e.target.value));
                CONFIG.voicevox.defaultSpeakerId = parseInt(e.target.value);
                saveSettings();
            }
        });
    }
    
    const voiceSpeed = document.getElementById('voice-speed');
    if (voiceSpeed) {
        voiceSpeed.addEventListener('input', (e) => {
            if (window.voicevoxSpeech) {
                const speed = parseFloat(e.target.value);
                window.voicevoxSpeech.setSpeed(speed);
                CONFIG.voicevox.defaultSpeed = speed;
                
                // スライダーの値表示を更新
                const rangeValue = e.target.nextElementSibling;
                if (rangeValue) {
                    rangeValue.textContent = speed.toFixed(1);
                }
                
                saveSettings();
            }
        });
        
        // 初期値を設定
        voiceSpeed.value = CONFIG.voicevox.defaultSpeed;
        const rangeValue = voiceSpeed.nextElementSibling;
        if (rangeValue) {
            rangeValue.textContent = CONFIG.voicevox.defaultSpeed.toFixed(1);
        }
    }
});
