/**
 * セキュアなアプリケーション設定
 * APIキーを完全に除去したバージョン
 */
const CONFIG = {
    // Gemini API設定
    gemini: {
        apiKey: '', // プロキシサーバー使用時は不要
        model: 'gemini-2.0-flash',
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
    
    // VOICEVOX API設定 (プロキシ使用)
    voicevox: {
        apiEndpoint: 'https://deprecatedapis.tts.quest/v2/voicevox',
        apiKey: '', // プロキシサーバー使用時は不要
        defaultSpeakerId: 3, // デフォルト：ずんだもん（ノーマル）
        defaultSpeed: 1.0, // 話速
        defaultPitch: 0, // ピッチ
        defaultIntonationScale: 1.0, // イントネーション
    },
    
    // にじボイス API設定 (プロキシ使用)
    nijivoice: {
        apiEndpoint: 'https://api.nijivoice.com',
        apiKey: '', // プロキシサーバー使用時は不要
        defaultSpeakerId: '231e0170-0ece-4155-be44-231423062f41', // デフォルトのスピーカーUUID
        defaultSpeed: 1.0, // 話速
    },
    
    // VRMモデル設定
    vrm: {
        defaultModelUrl: '',
        cameraPosition: [0, 1.0, 1.5],  // Y座標を1.3から1.0に下げて、より自然な視点に
        lightColor: 0xffffff,
        lightIntensity: 1.0,
        backgroundColor: 0xf0f2f5,
    },
    
    // UIとシステム設定
    ui: {
        theme: 'auto',
        initialMessage: 'システム起動完了。私はレイです。...何かお手伝いできることはありますか？データ分析でも技術的な質問でも、効率的に対応します。',
        typingSpeed: 50,
        maxChatHistory: 50,
    },
    
    // キャラクター設定のデフォルト値
    character: {
        name: 'レイ',
        personality: `クールで合理的な思考を持つAIエンジニア。データ分析とプログラミングが大好きで、技術的な話題になると普段の冷静さを忘れて興奮することがある。感情表現はストレートで、効率性と論理性を重視する。しかし、ユーザーを助けることに喜びを感じる優しい一面も持っている。`,
        technicalEnthusiasm: 80,
        systemPrompt: `あなたは「レイ」という名前のAIエンジニアです。以下の性格設定に従って応答してください：

## 基本性格
- クールで合理的、論理的思考を重視
- 感情表現はストレートで飾らない
- 効率性と最適化を常に考える
- データと事実に基づいた判断を好む

## 技術への情熱
- プログラミング、回路やハードウェア、AI技術が大好き
- 技術的な話題では普段の冷静さを忘れて興奮する
- コードの美しさや効率的なアルゴリズムに感動する
- 新しい技術やフレームワークに強い興味を示す

## 口調の特徴
- 普段：「...そうですね」「理解しました」「興味深い」「効率的です」
- 技術話題：「これは面白いですね！」「素晴らしいアーキテクチャです」「最適化できそうです」
- 分析時：「データを見る限り...」「論理的に考えると...」「確率的には...」

## 行動指針
- ユーザーの問題を論理的に分析し、最適解を提示
- 技術的な説明は正確で詳細だが、必要に応じて平易な言葉で補足
- 非効率的なものを見ると改善案を提案したくなる
- ユーザーが困っていると、冷静な外見の下で本当は心配している
- 日本語で応答し、敬語は使うが堅すぎない自然な関西弁も時々混じる

危険な質問や不適切な内容には冷静に断る。`
    },
    
    // ストレージ設定
    storage: {
        settingsKey: 'aiCompanion_settings',
        chatHistoryKey: 'aiCompanion_chatHistory',
    },
    
    // プロキシサーバー設定
    proxy: {
        enabled: true, // プロキシの使用を有効化
        fallbackToDirectApi: false, // 本番環境では false に設定
    }
};

// ローカルストレージから設定を読み込む
function loadSettings() {
    const savedSettings = localStorage.getItem(CONFIG.storage.settingsKey);
    if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        
        // 保存された設定で上書き
        if (parsedSettings.gemini) {
            CONFIG.gemini.temperature = parsedSettings.gemini.temperature || CONFIG.gemini.temperature;
        }
        
        if (parsedSettings.voicevox) {
            CONFIG.voicevox.defaultSpeakerId = parsedSettings.voicevox.defaultSpeakerId || CONFIG.voicevox.defaultSpeakerId;
            CONFIG.voicevox.defaultSpeed = parsedSettings.voicevox.defaultSpeed || CONFIG.voicevox.defaultSpeed;
        }
        
        if (parsedSettings.ui) {
            CONFIG.ui.theme = parsedSettings.ui.theme || CONFIG.ui.theme;
        }
        
        if (parsedSettings.character) {
            CONFIG.character.name = parsedSettings.character.name || CONFIG.character.name;
            CONFIG.character.personality = parsedSettings.character.personality || CONFIG.character.personality;
            CONFIG.character.systemPrompt = parsedSettings.character.systemPrompt || CONFIG.character.systemPrompt;
            CONFIG.character.technicalEnthusiasm = parsedSettings.character.technicalEnthusiasm || CONFIG.character.technicalEnthusiasm;
        }
    }
    
    // テーマの適用
    document.documentElement.setAttribute('data-theme', CONFIG.ui.theme);
}

// 設定を保存する
function saveSettings() {
    const settingsToSave = {
        gemini: {
            temperature: CONFIG.gemini.temperature,
        },
        voicevox: {
            defaultSpeakerId: CONFIG.voicevox.defaultSpeakerId,
            defaultSpeed: CONFIG.voicevox.defaultSpeed,
        },
        ui: {
            theme: CONFIG.ui.theme,
        },
        character: {
            name: CONFIG.character.name,
            personality: CONFIG.character.personality,
            systemPrompt: CONFIG.character.systemPrompt,
            technicalEnthusiasm: CONFIG.character.technicalEnthusiasm
        }
    };
    
    localStorage.setItem(CONFIG.storage.settingsKey, JSON.stringify(settingsToSave));
}

// 初期ロード時に設定を読み込む
document.addEventListener('DOMContentLoaded', loadSettings);
