/**
 * アプリケーションの設定
 */
const CONFIG = {
    // Gemini API設定
    gemini: {
        apiKey: '', // 実際のAPIキーをここに設定
        model: 'gemini-2.0-flash', // 最新のモデル名
        apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models/',
        maxTokens: 1024,
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
    },
    
    // 音声合成の設定
    voice: {
        // 使用する音声エンジン: 'voicevox' または 'nijivoice'
        currentEngine: 'voicevox',
    },
    
    // VOICEVOX API設定 (Web版)
    voicevox: {
        apiEndpoint: 'https://deprecatedapis.tts.quest/v2/voicevox',
        apiKey: 'm9S22_I2h-k8B43', // デモキーを設定（本番環境では実際のAPIキーに置き換え）
        defaultSpeakerId: 3, // デフォルト：ずんだもん（ノーマル）
        defaultSpeed: 1.0, // 話速
        defaultPitch: 0, // ピッチ
        defaultIntonationScale: 1.0, // イントネーション
    },
    
    // にじボイス API設定
    nijivoice: {
        apiEndpoint: 'https://api.nijivoice.com', // 正しいAPIエンドポイント
        apiKey: 'cab2b4b6-0bd4-418f-be36-ae0de041a202', // APIキー
        defaultSpeakerId: '231e0170-0ece-4155-be44-231423062f41', // デフォルトのスピーカーUUID（花村 穂ノ香）
        defaultSpeed: 1.0, // 話速
    },
    
    // VRMモデル設定
    vrm: {
        defaultModelUrl: '', // デフォルトモデルがある場合はURLを設定
        cameraPosition: [0, 1.3, 1.5], // x, y, z
        lightColor: 0xffffff,
        lightIntensity: 1.0,
        backgroundColor: 0xf0f2f5,
    },
    
    // UIとシステム設定
    ui: {
        theme: 'auto', // 'light', 'dark', 'auto'
        initialMessage: 'こんにちは！何か質問があればどうぞ！',
        typingSpeed: 50, // ミリ秒単位
        maxChatHistory: 50, // チャット履歴の最大保存数
    },
    
    // キャラクター設定のデフォルト値
    character: {
        name: 'AIコンパニオン',
        personality: '明るくフレンドリーな性格で、ユーザーの質問に親切に答えます。知識が豊富で、わかりやすい説明を心がけています。時々冗談も言います。',
        // システムプロンプト（Gemini APIに送信する設定）
        systemPrompt: `あなたは親しみやすい3Dアシスタントです。
- ユーザーにとって役立つ情報を提供し、親切に応答してください
- 必要に応じて感情を示し、親しみやすさを維持してください
- 簡潔で読みやすい回答を心がけてください
- 日本語で応答してください
- 複雑な概念は簡単な言葉で説明してください
- 危険な質問や不適切な内容には応じないでください`
    },
    
    // ストレージ設定
    storage: {
        settingsKey: 'aiCompanion_settings',
        chatHistoryKey: 'aiCompanion_chatHistory',
    }
};

// ローカルストレージから設定を読み込む
function loadSettings() {
    const savedSettings = localStorage.getItem(CONFIG.storage.settingsKey);
    if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        
        // 保存された設定で上書き
        if (parsedSettings.gemini) {
            CONFIG.gemini.apiKey = parsedSettings.gemini.apiKey || CONFIG.gemini.apiKey;
            CONFIG.gemini.temperature = parsedSettings.gemini.temperature || CONFIG.gemini.temperature;
        }
        
        if (parsedSettings.nijivoice) {
            CONFIG.nijivoice.apiKey = parsedSettings.nijivoice.apiKey || CONFIG.nijivoice.apiKey;
        }
        
        if (parsedSettings.voicevox) {
            CONFIG.voicevox.defaultSpeakerId = parsedSettings.voicevox.defaultSpeakerId || CONFIG.voicevox.defaultSpeakerId;
            CONFIG.voicevox.defaultSpeed = parsedSettings.voicevox.defaultSpeed || CONFIG.voicevox.defaultSpeed;
        }
        
        if (parsedSettings.ui) {
            CONFIG.ui.theme = parsedSettings.ui.theme || CONFIG.ui.theme;
        }
        
        if (parsedSettings.character) {
            CONFIG.character.personality = parsedSettings.character.personality || CONFIG.character.personality;
        }
        
        if (parsedSettings.gemini) {
            CONFIG.gemini.temperature = parsedSettings.gemini.temperature || CONFIG.gemini.temperature;
        }
    }
    
    // テーマの適用
    document.documentElement.setAttribute('data-theme', CONFIG.ui.theme);
}

// 設定を保存する
function saveSettings() {
    const settingsToSave = {
        gemini: {
            apiKey: CONFIG.gemini.apiKey,
            temperature: CONFIG.gemini.temperature,
        },
        nijivoice: {
            apiKey: CONFIG.nijivoice.apiKey,
        },
        voicevox: {
            defaultSpeakerId: CONFIG.voicevox.defaultSpeakerId,
            defaultSpeed: CONFIG.voicevox.defaultSpeed,
        },
        ui: {
            theme: CONFIG.ui.theme,
        },
        character: {
            personality: CONFIG.character.personality,
        }
    };
    
    localStorage.setItem(CONFIG.storage.settingsKey, JSON.stringify(settingsToSave));
}

// 初期ロード時に設定を読み込む
document.addEventListener('DOMContentLoaded', loadSettings);
