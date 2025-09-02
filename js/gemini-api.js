/**
 * Google Gemini APIとの連携を担当するクラス
 */
class GeminiAPI {
    constructor() {
        this.apiKey = CONFIG.gemini.apiKey;
        this.model = CONFIG.gemini.model;
        this.apiEndpoint = CONFIG.gemini.apiEndpoint;
        this.systemPrompt = CONFIG.character.systemPrompt;
        this.chatHistory = [];
        this.maxChatHistoryLength = CONFIG.ui.maxChatHistory;
        this.isGenerating = false;
        
        // チャット履歴の読み込み
        this.loadChatHistory();
    }
    
    /**
     * Gemini APIにメッセージを送信して応答を取得
     * @param {string} message - ユーザーメッセージ
     * @returns {Promise<string>} - AIの応答
     */
    async sendMessage(message) {
        if (!this.apiKey) {
            throw new Error('Gemini API key is not set. Please set it in the config.js file.');
        }
        
        this.isGenerating = true;
        
        try {
            // メッセージをチャット履歴に追加
            this.addToChatHistory('user', message);
            
            // APIリクエスト用のメッセージ形式に変換
            const formattedMessages = this.formatChatHistory();
            
            // APIリクエストを構築
            const requestBody = {
                contents: formattedMessages,
                generationConfig: {
                    temperature: CONFIG.gemini.temperature,
                    topK: CONFIG.gemini.topK,
                    topP: CONFIG.gemini.topP,
                    maxOutputTokens: CONFIG.gemini.maxTokens,
                }
            };
            
            // APIリクエスト
            const response = await fetch(
                `${this.apiEndpoint}${this.model}:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                }
            );
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            
            // レスポンスからテキストを抽出
            const responseText = this.extractResponseText(data);
            
            // 応答をチャット履歴に追加
            this.addToChatHistory('assistant', responseText);
            
            // チャット履歴を保存
            this.saveChatHistory();
            
            this.isGenerating = false;
            return responseText;
        } catch (error) {
            console.error('Error in sendMessage:', error);
            
            // API URLの問題を検出した場合、モデル名を更新して再試行
            if (error.message && error.message.includes('not found for API version')) {
                console.log('Attempting with alternative model name...');
                const originalModel = this.model;
                
                // 代替モデル名を試す
                if (this.model === 'gemini-1.5-flash') {
                    this.model = 'gemini-pro';
                } else if (this.model === 'gemini-pro') {
                    this.model = 'gemini-1.0-pro';
                } else {
                    this.model = 'gemini-1.5-flash';
                }
                
                try {
                    const result = await this.sendMessage(message);
                    // 成功した場合、設定を更新
                    CONFIG.gemini.model = this.model;
                    saveSettings();
                    return result;
                } catch (retryError) {
                    // 再試行も失敗した場合は元のモデルに戻す
                    this.model = originalModel;
                    console.error('Retry with alternative model failed:', retryError);
                }
            }
            
            this.isGenerating = false;
            
            // エラーメッセージをチャット履歴に追加
            const errorMessage = 'すみません、AIの応答を取得できませんでした。しばらく経ってからもう一度お試しください。';
            this.addToChatHistory('assistant', errorMessage);
            this.saveChatHistory();
            
            throw error;
        }
    }
    
    /**
     * APIレスポンスからテキストを抽出
     * @param {Object} response - APIレスポンス
     * @returns {string} - 抽出されたテキスト
     */
    extractResponseText(response) {
        try {
            if (response.candidates && response.candidates.length > 0) {
                const candidate = response.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    return candidate.content.parts[0].text || '';
                }
            }
            return 'レスポンスの解析に失敗しました。';
        } catch (error) {
            console.error('Error extracting response text:', error);
            return 'レスポンスの解析に失敗しました。';
        }
    }
    
    /**
     * チャット履歴をGemini API形式に変換
     * @returns {Array} - フォーマットされたメッセージリスト
     */
    formatChatHistory() {
        const messages = [];
        
        // システムプロンプトを追加
        if (this.systemPrompt) {
            messages.push({
                role: 'user',
                parts: [{ text: `あなたは以下の設定に従って対話してください: ${this.systemPrompt}\n\nユーザーの人格設定: ${CONFIG.character.personality}` }]
            });
            
            messages.push({
                role: 'model',
                parts: [{ text: '了解しました。設定に従って対話します。' }]
            });
        }
        
        // チャット履歴を追加
        // 最大トークン数制限を考慮して、最新のメッセージを優先
        const recentHistory = this.chatHistory.slice(-this.maxChatHistoryLength);
        
        recentHistory.forEach(entry => {
            messages.push({
                role: entry.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: entry.content }]
            });
        });
        
        return messages;
    }
    
    /**
     * チャット履歴にメッセージを追加
     * @param {string} role - メッセージの送信者 ('user' または 'assistant')
     * @param {string} content - メッセージの内容
     */
    addToChatHistory(role, content) {
        this.chatHistory.push({
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        });
        
        // 最大数を超えた場合、古いメッセージを削除
        if (this.chatHistory.length > this.maxChatHistoryLength * 2) {
            this.chatHistory = this.chatHistory.slice(-this.maxChatHistoryLength);
        }
    }
    
    /**
     * チャット履歴をローカルストレージに保存
     */
    saveChatHistory() {
        try {
            localStorage.setItem(CONFIG.storage.chatHistoryKey, JSON.stringify(this.chatHistory));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }
    
    /**
     * ローカルストレージからチャット履歴を読み込み
     */
    loadChatHistory() {
        try {
            const savedHistory = localStorage.getItem(CONFIG.storage.chatHistoryKey);
            if (savedHistory) {
                this.chatHistory = JSON.parse(savedHistory);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            this.chatHistory = [];
        }
    }
    
    /**
     * チャット履歴をクリア
     */
    clearChatHistory() {
        this.chatHistory = [];
        this.saveChatHistory();
    }
    
    /**
     * APIキーを設定
     * @param {string} apiKey - Gemini API Key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        CONFIG.gemini.apiKey = apiKey;
        saveSettings();
    }
    
    /**
     * モデルを設定
     * @param {string} model - 使用するモデル名
     */
    setModel(model) {
        this.model = model;
        CONFIG.gemini.model = model;
        saveSettings();
    }
    
    /**
     * システムプロンプトを設定
     * @param {string} prompt - システムプロンプト
     */
    setSystemPrompt(prompt) {
        this.systemPrompt = prompt;
        CONFIG.character.systemPrompt = prompt;
        saveSettings();
    }
    
    /**
     * 生成中かどうかを取得
     * @returns {boolean} - 生成中ならtrue
     */
    isGeneratingResponse() {
        return this.isGenerating;
    }
}

// DOMContentLoadedイベントでGemini APIのインスタンスを作成
document.addEventListener('DOMContentLoaded', () => {
    window.geminiAPI = new GeminiAPI();
    
    // 設定パネルのキャラクター設定と連携
    const characterPersona = document.getElementById('character-persona');
    if (characterPersona) {
        characterPersona.value = CONFIG.character.personality;
        
        characterPersona.addEventListener('change', (e) => {
            if (window.geminiAPI) {
                CONFIG.character.personality = e.target.value;
                saveSettings();
            }
        });
    }
});
