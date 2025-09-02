/**
 * VOICEVOXが利用できない場合に使用するWeb Speech APIの代替実装
 */
class WebSpeechFallback {
    constructor() {
        this.isSpeaking = false;
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.selectedVoice = null;
        this.rate = 1.0;
        this.pitch = 1.0;
        this.volume = 1.0;
        this.mouthMovementCallbacks = [];
        this.onEndCallbacks = [];
        
        // 初期化
        this.init();
    }
    
    /**
     * 初期化処理
     */
    init() {
        // 音声を取得
        this.loadVoices();
        
        // voiceschangedイベントで音声リストが更新された場合
        if (this.synth) {
            this.synth.onvoiceschanged = () => {
                this.loadVoices();
            };
        }
    }
    
    /**
     * 利用可能な音声の読み込み
     */
    loadVoices() {
        if (!this.synth) return;
        
        this.voices = this.synth.getVoices();
        
        // 日本語の音声を優先して選択
        this.selectedVoice = this.voices.find(voice => 
            (voice.lang === 'ja-JP' || voice.lang === 'ja_JP') && 
            voice.name.includes('Microsoft')  // Microsoftの音声を優先
        );
        
        // Microsoftの日本語音声がない場合は他の日本語音声を検索
        if (!this.selectedVoice) {
            this.selectedVoice = this.voices.find(voice => 
                voice.lang === 'ja-JP' || voice.lang === 'ja_JP'
            );
        }
        
        // 日本語がなければ、デフォルトの音声を使用
        if (!this.selectedVoice && this.voices.length > 0) {
            // 日本語がなければ、女性の声を優先
            this.selectedVoice = this.voices.find(voice => 
                voice.name.includes('female') || 
                voice.name.includes('Female') || 
                voice.name.includes('Microsoft')
            ) || this.voices[0];
        }
        
        console.log('Web Speech API: 利用可能な音声数:', this.voices.length);
        console.log('Web Speech API: 選択された音声:', this.selectedVoice?.name);
    }
    
    /**
     * テキストを音声で読み上げ
     * @param {string} text - 読み上げるテキスト
     * @returns {Promise} - 読み上げ完了時に解決するPromise
     */
    speak(text) {
        return new Promise((resolve) => {
            if (!this.synth || !text || text.trim() === '') {
                resolve();
                return;
            }
            
            // 現在の発話をすべて停止
            this.stopSpeaking();
            
            // 新しい発話を作成
            const utterance = new SpeechSynthesisUtterance(text);
            
            // 音声の設定
            if (this.selectedVoice) {
                utterance.voice = this.selectedVoice;
            }
            
            // 発話パラメータの設定
            utterance.rate = this.rate;
            utterance.pitch = this.pitch;
            utterance.volume = this.volume;
            
            // 口の動きを模擬するためのタイマー
            let mouthTimer = null;
            const simulateMouthMovement = () => {
                // ランダムな値で口の動きを模擬
                const value = Math.random() * 0.5 + 0.2;
                this.mouthMovementCallbacks.forEach(callback => {
                    callback(value);
                });
            };
            
            // 発話開始時のイベントハンドラ
            utterance.onstart = () => {
                this.isSpeaking = true;
                
                // 250msごとに口の動きを更新
                mouthTimer = setInterval(simulateMouthMovement, 250);
            };
            
            // 発話終了時のイベントハンドラ
            utterance.onend = () => {
                this.isSpeaking = false;
                
                // タイマーを停止
                if (mouthTimer) {
                    clearInterval(mouthTimer);
                    mouthTimer = null;
                }
                
                // 口を閉じる
                this.mouthMovementCallbacks.forEach(callback => {
                    callback(0);
                });
                
                // 完了コールバックを実行
                this.onEndCallbacks.forEach(callback => callback());
                
                resolve();
            };
            
            // 発話エラー時のイベントハンドラ
            utterance.onerror = (event) => {
                console.error('Web Speech API error:', event.error);
                this.isSpeaking = false;
                
                // タイマーを停止
                if (mouthTimer) {
                    clearInterval(mouthTimer);
                    mouthTimer = null;
                }
                
                // 口を閉じる
                this.mouthMovementCallbacks.forEach(callback => {
                    callback(0);
                });
                
                resolve();
            };
            
            // 発話開始
            this.synth.speak(utterance);
        });
    }
    
    /**
     * 発話を停止
     */
    stopSpeaking() {
        if (this.synth) {
            this.synth.cancel();
            this.isSpeaking = false;
            
            // 口を閉じる
            this.mouthMovementCallbacks.forEach(callback => {
                callback(0);
            });
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
     * 話速を設定
     * @param {number} rate - 話速（デフォルト: 1.0）
     */
    setSpeed(rate) {
        this.rate = rate;
    }
}

// VOICEVOXが利用できない場合のフォールバックとして登録
document.addEventListener('DOMContentLoaded', () => {
    // WebSpeechFallbackのインスタンスを作成
    window.webSpeechFallback = new WebSpeechFallback();
    
    // VoicevoxSpeechのメソッドを上書きしてフォールバック実装
    if (window.voicevoxSpeech) {
        const originalSpeak = window.voicevoxSpeech.speak;
        window.voicevoxSpeech.speak = async function(text) {
            try {
                // まずVOICEVOXでの合成を試みる
                const audioData = await this.synthesize(text);
                if (audioData) {
                    return this.playAudio(audioData);
                } else {
                    // VOICEVOXでの合成に失敗した場合、Web Speech APIを使用
                    console.log('VOICEVOX合成に失敗したため、Web Speech APIにフォールバックします');
                    return window.webSpeechFallback.speak(text);
                }
            } catch (error) {
                console.error('Error in VOICEVOX speak, falling back to Web Speech API:', error);
                return window.webSpeechFallback.speak(text);
            }
        };
        
        // 設定フォームに音声フォールバックの状態を表示
        const settingsContent = document.querySelector('.settings-content');
        if (settingsContent) {
            const fallbackInfo = document.createElement('div');
            fallbackInfo.className = 'setting-group';
            fallbackInfo.innerHTML = `
                <h3>音声合成状態</h3>
                <div class="setting-item">
                    <span id="voicevox-status">VOICEVOXの接続状態を確認中...</span>
                </div>
                <div class="setting-item">
                    <span id="web-speech-status">Web Speech APIの状態を確認中...</span>
                </div>
            `;
            
            // 既存の最初の設定グループの前に挿入
            const firstGroup = settingsContent.querySelector('.setting-group');
            if (firstGroup) {
                settingsContent.insertBefore(fallbackInfo, firstGroup);
            } else {
                settingsContent.appendChild(fallbackInfo);
            }
            
            // 状態を更新
            setTimeout(() => {
                const voicevoxStatus = document.getElementById('voicevox-status');
                const webSpeechStatus = document.getElementById('web-speech-status');
                
                if (voicevoxStatus) {
                    if (window.voicevoxSpeech.speakerList && window.voicevoxSpeech.speakerList.length > 0) {
                        voicevoxStatus.innerHTML = '✅ VOICEVOXエンジンに接続しています';
                        voicevoxStatus.style.color = 'green';
                    } else {
                        voicevoxStatus.innerHTML = '❌ VOICEVOXエンジンに接続できません';
                        voicevoxStatus.style.color = 'red';
                    }
                }
                
                if (webSpeechStatus) {
                    if (window.webSpeechFallback.selectedVoice) {
                        webSpeechStatus.innerHTML = `✅ Web Speech API使用可能 (${window.webSpeechFallback.selectedVoice.name})`;
                        webSpeechStatus.style.color = 'green';
                    } else {
                        webSpeechStatus.innerHTML = '❌ Web Speech APIが利用できません';
                        webSpeechStatus.style.color = 'red';
                    }
                }
            }, 2000);
        }
    }
    
    // キャラクターモデルと口の動きを連携
    document.addEventListener('vrmLoaded', () => {
        if (window.vrmController && window.webSpeechFallback) {
            window.webSpeechFallback.onMouthMovement((value) => {
                window.vrmController.setMouthOpen(value);
            });
        }
    });
});
