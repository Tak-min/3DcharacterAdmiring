/**
 * にじボイス音声合成エンジンと連携するクラス
 * にじボイスのAPIを利用した音声合成を行います
 */
class NijivoiceSpeech {
    constructor() {
        this.apiEndpoint = CONFIG.nijivoice.apiEndpoint;
        this.apiKey = CONFIG.nijivoice.apiKey;
        this.speakerId = CONFIG.nijivoice.defaultSpeakerId; // UUIDを直接設定
        this.speed = CONFIG.nijivoice.defaultSpeed;
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
        console.log('NijivoiceSpeech: 初期化中...');
        console.log('NijivoiceSpeech: APIエンドポイント:', this.apiEndpoint);
        console.log('NijivoiceSpeech: APIキー設定状況:', this.apiKey ? 'APIキー設定済み' : 'APIキー未設定');
        
        // Web Audio APIのセットアップ
        this.initAudio();
        
        // 利用可能な話者リストを取得
        try {
            await this.fetchSpeakers();
        } catch (error) {
            console.error('NijivoiceSpeech: 話者リスト取得エラー', error);
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
            console.log('NijivoiceSpeech: 話者リスト取得開始');
            
            if (!this.apiKey) {
                console.warn('NijivoiceSpeech: APIキーが設定されていません');
                throw new Error('APIキーが設定されていません。config.jsファイルでにじボイスのAPIキーを設定してください。');
            }
            
            const speakersUrl = `${this.apiEndpoint}/api/platform/v1/voice-actors`;
            console.log('NijivoiceSpeech: 話者リスト取得URL', speakersUrl);
            
            const response = await fetch(speakersUrl, { 
                headers: {
                    'Accept': 'application/json',
                    'x-api-key': this.apiKey
                },
                signal: AbortSignal.timeout(10000) // 10秒でタイムアウト
            });
            
            if (!response.ok) {
                throw new Error(`NijivoiceSpeech: 話者リスト取得エラー: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('NijivoiceSpeech: 話者リスト取得成功', data);
            
            // 詳細な話者リスト情報をログに出力
            if (data.voiceActors && data.voiceActors.length > 0) {
                console.log(`NijivoiceSpeech: ${data.voiceActors.length}人の話者を取得しました`);
                // 最初の1人だけ詳細表示
                const firstActor = data.voiceActors[0];
                console.log(`最初の話者: ${firstActor.name} (ID: ${firstActor.id})`);
                if (firstActor.voiceStyles && firstActor.voiceStyles.length > 0) {
                    console.log(`  - ${firstActor.voiceStyles.length}個のスタイルが利用可能`);
                }
            }
            
            // にじボイス形式のデータをVOICEVOX形式に変換
            this.speakerList = this.convertSpeakerFormat(data.voiceActors || []);
            
            // APIから取得した最初の話者IDを使用（必ずUUIDを使用）
            if (this.speakerList.length > 0 && this.speakerList[0].styles.length > 0) {
                // 最初の話者のUUIDを取得（数値IDではなく）
                const firstActor = data.voiceActors[0];
                const firstSpeakerId = firstActor.id; // UUIDを直接使用
                console.log('NijivoiceSpeech: 最初の話者UUIDを使用します:', firstSpeakerId);
                this.speakerId = firstSpeakerId;
                CONFIG.nijivoice.defaultSpeakerId = firstSpeakerId;
            } else {
                console.warn('NijivoiceSpeech: 有効な話者が見つかりません');
                // デフォルトの話者リストにフォールバック
                this.useDefaultSpeakerList();
                if (this.speakerList.length > 0) {
                    this.speakerId = this.speakerList[0].styles[0].id;
                }
            }
            
            // スピーカー選択フォームを更新
            this.updateSpeakerSelect();
            
            return this.speakerList;
        } catch (error) {
            console.error('NijivoiceSpeech: 話者リスト取得処理エラー:', error);
            this.showErrorMessage(`にじボイスサーバーに接続できませんでした: ${error.message}`);
            
            // デフォルトの話者リストを使用
            this.useDefaultSpeakerList();
            return [];
        }
    }
    
    /**
     * にじボイスの話者データをVOICEVOX互換形式に変換
     * @param {Array} voiceActors - にじボイスの話者リスト
     * @returns {Array} - VOICEVOX形式の話者リスト
     */
    convertSpeakerFormat(voiceActors) {
        return voiceActors.map(actor => {
            // にじボイスAPIでは話者のUUIDを使用する（スタイルIDは無視）
            const styles = [{
                id: actor.id, // 常に話者のUUIDを使用
                name: '標準'
            }];
            
            // 複数のスタイルがある場合も、話者UUIDを使用
            if (actor.voiceStyles && actor.voiceStyles.length > 0) {
                actor.voiceStyles.forEach(style => {
                    styles.push({
                        id: actor.id, // スタイルが違っても話者UUIDを使用
                        name: style.style,
                        styleId: style.id // 参考用にスタイルIDも保存
                    });
                });
            }
            
            return {
                name: actor.name,
                styles: styles
            };
        });
    }
    
    /**
     * デフォルトの話者リストを使用
     */
    useDefaultSpeakerList() {
        // 基本的な話者リストを静的に定義（実際のUUID形式のIDを使用）
        this.speakerList = [
            {
                "name": "花村 穂ノ香",
                "styles": [
                    { "id": "231e0170-0ece-4155-be44-231423062f41", "name": "標準" }
                ]
            },
            {
                "name": "漆夜 蓮",
                "styles": [
                    { "id": "04c7f4e0-41d8-4d02-9cbe-bf79e635f5ab", "name": "標準" }
                ]
            },
            {
                "name": "冬月 初音",
                "styles": [
                    { "id": "d158278c-c4fa-461a-b271-468146ad51c9", "name": "標準" }
                ]
            },
            {
                "name": "苔村 まりも",
                "styles": [
                    { "id": "2f982b65-dbc3-4ed6-b355-b0f7c0abaa70", "name": "標準" }
                ]
            },
            {
                "name": "陽斗・エイデン・グリーンウッド",
                "styles": [
                    { "id": "29cdf589-e581-4ab0-8467-0cd0c7ba640f", "name": "標準" }
                ]
            }
        ];
        
        console.log('NijivoiceSpeech: デフォルト話者リストを使用します', this.speakerList);
        
        // スピーカー選択フォームを更新
        this.updateSpeakerSelect();
    }
    
    /**
     * スピーカー選択フォームの更新
     */
    updateSpeakerSelect() {
        const selectElement = document.getElementById('voice-select');
        if (!selectElement || !this.speakerList.length) {
            console.warn('NijivoiceSpeech: 話者選択フォームが見つからないか、話者リストが空です');
            return;
        }
        
        console.log('NijivoiceSpeech: 話者選択フォームを更新します。話者数:', this.speakerList.length);
        
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
        console.log('NijivoiceSpeech: 話者IDをセレクトボックスに設定:', this.speakerId);
        
        // 選択されているかどうか確認
        if (selectElement.selectedIndex === -1) {
            console.warn('NijivoiceSpeech: 指定された話者ID', this.speakerId, 'がリストに存在しません');
            // 最初の話者のUUIDを選択
            if (selectElement.options.length > 0) {
                // 最初のオプションのvalue（UUID）を使用
                this.speakerId = selectElement.options[0].value;
                selectElement.selectedIndex = 0;
                console.log('NijivoiceSpeech: 最初の話者UUIDを選択しました:', this.speakerId);
            }
        }
        
        // 話者変更イベントリスナーを追加
        selectElement.addEventListener('change', (e) => {
            const newSpeakerId = e.target.value;
            console.log('NijivoiceSpeech: 話者を変更します:', this.speakerId, '->', newSpeakerId);
            this.setSpeakerId(newSpeakerId);
        });
    }
    
    /**
     * 音声合成のリクエストを送信
     * @param {string} text - 読み上げるテキスト
     * @returns {Promise<ArrayBuffer>} - 音声データ
     */
    async synthesize(text) {
        if (!text || text.trim() === '' || !this.apiKey) {
            return null;
        }
        
        try {
            console.log('Synthesizing with NijiVoice:', text.substring(0, 20) + '...');
            
            // 話者IDが有効かどうか確認
            if (!this.speakerId) {
                // 話者リストから最初の有効なIDを取得
                if (this.speakerList.length > 0 && this.speakerList[0].styles.length > 0) {
                    this.speakerId = this.speakerList[0].styles[0].id;
                    console.log('NijivoiceSpeech: 有効な話者IDに切り替えます:', this.speakerId);
                } else {
                    throw new Error('有効な話者IDが見つかりません。話者リストが空です。');
                }
            }
            
            console.log('NijivoiceSpeech: 使用する話者ID:', this.speakerId, '(type:', typeof this.speakerId, ')');
            
            // にじボイスAPI形式のリクエストデータ
            const requestData = {
                script: text,
                speed: this.speed.toString(),
                format: 'mp3'
            };
            
            // 音声合成リクエスト
            const generateUrl = `${this.apiEndpoint}/api/platform/v1/voice-actors/${this.speakerId}/generate-voice`;
            console.log('NijivoiceSpeech: 音声合成URL', generateUrl);
            console.log('NijivoiceSpeech: リクエストデータ', requestData);
            
            const response = await fetch(generateUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'x-api-key': this.apiKey
                },
                body: JSON.stringify(requestData),
                signal: AbortSignal.timeout(15000) // 15秒でタイムアウト
            });
            
            if (!response.ok) {
                // エラーレスポンスの解析を試みる
                let errorMessage = `ステータスコード: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // JSONではない場合はテキストを取得
                    try {
                        errorMessage = await response.text();
                    } catch (e2) {
                        // テキスト取得も失敗した場合は元のエラーメッセージを使用
                    }
                }
                
                throw new Error(`NijivoiceSpeech: 音声合成エラー: ${errorMessage}`);
            }
            
            // 音声ファイルのURLを取得
            const responseData = await response.json();
            console.log('NijivoiceSpeech: 音声合成レスポンス', responseData);
            
            if (!responseData.generatedVoice) {
                throw new Error('NijivoiceSpeech: generatedVoiceが見つかりません');
            }
            
            // 音声ファイルURLの詳細をログ出力
            const generatedVoice = responseData.generatedVoice;
            console.log('=== にじボイス音声ファイルURL情報 ===');
            console.log('audioFileUrl:', generatedVoice.audioFileUrl);
            console.log('audioFileDownloadUrl:', generatedVoice.audioFileDownloadUrl);
            console.log('その他のプロパティ:', Object.keys(generatedVoice));
            console.log('=====================================');
            
            // どちらのURLを使用するか判定
            const audioUrl = generatedVoice.audioFileDownloadUrl || generatedVoice.audioFileUrl;
            if (!audioUrl) {
                throw new Error('NijivoiceSpeech: 音声ファイルのURLが見つかりません');
            }
            
            console.log('NijivoiceSpeech: 使用する音声URL:', audioUrl);
            
            // 音声ファイルを直接ダウンロード
            console.log('NijivoiceSpeech: 音声ファイルをダウンロード中...');
            const audioResponse = await fetch(audioUrl);
            
            if (!audioResponse.ok) {
                throw new Error(`NijivoiceSpeech: 音声ファイルのダウンロードエラー: ${audioResponse.status} ${audioResponse.statusText}`);
            }
            
            console.log('NijivoiceSpeech: 音声ファイルダウンロード完了');
            return await audioResponse.arrayBuffer();
        } catch (error) {
            console.error('NijivoiceSpeech: 音声合成処理エラー:', error);
            this.showErrorMessage(`にじボイス音声合成に失敗しました: ${error.message || 'エラーが発生しました'}`);
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
        console.error('NijivoiceSpeech:', message);
        
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
    // にじボイスのインスタンスを作成
    console.log('NijivoiceSpeech: インスタンスを作成します');
    window.nijivoiceSpeech = new NijivoiceSpeech();
});
