/**
 * セキュアなAPIプロキシクライアント
 * APIキーを隠蔽し、プロキシサーバー経由でAPIリクエストを行います
 */
class SecureApiClient {
    constructor() {
        // 本番環境とローカル環境を自動検出
        this.baseURL = this.detectProxyUrl();
        this.isProxyAvailable = false;
        
        // プロキシサーバーの可用性をチェック
        this.checkProxyAvailability();
    }
    
    /**
     * プロキシサーバーのURLを検出
     */
    detectProxyUrl() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // ローカル開発環境
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3002';
        }
        
        // Cloudflare Pages や Netlify など
        if (hostname.includes('.pages.dev') || hostname.includes('.netlify.app')) {
            // 本番環境では同一オリジンのAPIエンドポイントを使用
            return `${protocol}//${hostname}`;
        }
        
        // その他の本番環境
        return `${protocol}//${hostname}`;
    }
    
    /**
     * プロキシサーバーの可用性をチェック
     */
    async checkProxyAvailability() {
        try {
            const response = await fetch(`${this.baseURL}/api/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.isProxyAvailable = true;
                console.log('🟢 Secure API Proxy: Available');
                console.log('Services:', data.services);
            } else {
                this.isProxyAvailable = false;
                console.warn('🟡 Secure API Proxy: Server responded with error');
            }
        } catch (error) {
            this.isProxyAvailable = false;
            console.warn('🔴 Secure API Proxy: Not available, falling back to direct API calls');
            console.warn('Note: API keys will be exposed in this mode');
        }
    }
    
    /**
     * Gemini APIリクエスト
     */
    async sendGeminiRequest(requestBody) {
        if (this.isProxyAvailable) {
            return this.makeProxyRequest('/api/proxy/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
        } else {
            // フォールバック: 直接APIを呼び出し（開発時のみ）
            return this.fallbackGeminiRequest(requestBody);
        }
    }
    
    /**
     * VOICEVOX話者リスト取得
     */
    async getVoicevoxSpeakers() {
        if (this.isProxyAvailable) {
            return this.makeProxyRequest('/api/proxy/voicevox/speakers');
        } else {
            return this.fallbackVoicevoxSpeakers();
        }
    }
    
    /**
     * VOICEVOX音声合成
     */
    async getVoicevoxAudio(params) {
        if (this.isProxyAvailable) {
            const queryString = new URLSearchParams(params).toString();
            return this.makeProxyRequest(`/api/proxy/voicevox/audio?${queryString}`, {
                responseType: 'arrayBuffer'
            });
        } else {
            return this.fallbackVoicevoxAudio(params);
        }
    }
    
    /**
     * にじボイス話者リスト取得
     */
    async getNijivoiceVoiceActors() {
        if (this.isProxyAvailable) {
            return this.makeProxyRequest('/api/proxy/nijivoice/voice-actors');
        } else {
            return this.fallbackNijivoiceVoiceActors();
        }
    }
    
    /**
     * にじボイス音声合成
     */
    async generateNijivoiceVoice(voiceActorId, requestBody) {
        if (this.isProxyAvailable) {
            return this.makeProxyRequest(`/api/proxy/nijivoice/generate-voice/${voiceActorId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
        } else {
            return this.fallbackNijivoiceGenerate(voiceActorId, requestBody);
        }
    }
    
    /**
     * プロキシリクエストの実行
     */
    async makeProxyRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            if (options.responseType === 'arrayBuffer') {
                return await response.arrayBuffer();
            } else {
                return await response.json();
            }
        } catch (error) {
            console.error(`Proxy request failed for ${endpoint}:`, error);
            throw error;
        }
    }
    
    /**
     * フォールバック: 直接Gemini API呼び出し（開発時のみ）
     */
    async fallbackGeminiRequest(requestBody) {
        if (!CONFIG.gemini.apiKey) {
            throw new Error('Gemini API key not configured and proxy not available');
        }
        
        console.warn('⚠️ Using direct Gemini API call (API key exposed)');
        
        const { model, ...body } = requestBody;
        const geminiModel = model || CONFIG.gemini.model;
        
        const response = await fetch(
            `${CONFIG.gemini.apiEndpoint}${geminiModel}:generateContent?key=${CONFIG.gemini.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        return await response.json();
    }
    
    /**
     * フォールバック: 直接VOICEVOX話者リスト取得
     */
    async fallbackVoicevoxSpeakers() {
        console.warn('⚠️ Using direct VOICEVOX API call (API key exposed)');
        
        let apiUrl = `${CONFIG.voicevox.apiEndpoint}/speakers/`;
        if (CONFIG.voicevox.apiKey) {
            apiUrl += `?key=${encodeURIComponent(CONFIG.voicevox.apiKey)}`;
        }
        
        const response = await fetch(apiUrl, {
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`VOICEVOX speakers request failed: ${response.status}`);
        }
        
        return await response.json();
    }
    
    /**
     * フォールバック: 直接VOICEVOX音声合成
     */
    async fallbackVoicevoxAudio(params) {
        console.warn('⚠️ Using direct VOICEVOX API call (API key exposed)');
        
        const urlParams = new URLSearchParams(params);
        if (CONFIG.voicevox.apiKey) {
            urlParams.append('key', CONFIG.voicevox.apiKey);
        }
        
        const response = await fetch(`${CONFIG.voicevox.apiEndpoint}/audio/?${urlParams.toString()}`, {
            headers: { 'Accept': 'audio/wav,audio/*' }
        });
        
        if (!response.ok) {
            throw new Error(`VOICEVOX audio synthesis failed: ${response.status}`);
        }
        
        return await response.arrayBuffer();
    }
    
    /**
     * フォールバック: 直接にじボイス話者リスト取得
     */
    async fallbackNijivoiceVoiceActors() {
        if (!CONFIG.nijivoice.apiKey) {
            throw new Error('Nijivoice API key not configured and proxy not available');
        }
        
        console.warn('⚠️ Using direct Nijivoice API call (API key exposed)');
        
        const response = await fetch('https://api.nijivoice.com/api/platform/v1/voice-actors', {
            headers: {
                'Accept': 'application/json',
                'x-api-key': CONFIG.nijivoice.apiKey
            }
        });
        
        if (!response.ok) {
            throw new Error(`Nijivoice voice actors request failed: ${response.status}`);
        }
        
        return await response.json();
    }
    
    /**
     * フォールバック: 直接にじボイス音声合成
     */
    async fallbackNijivoiceGenerate(voiceActorId, requestBody) {
        if (!CONFIG.nijivoice.apiKey) {
            throw new Error('Nijivoice API key not configured and proxy not available');
        }
        
        console.warn('⚠️ Using direct Nijivoice API call (API key exposed)');
        
        const response = await fetch(
            `https://api.nijivoice.com/api/platform/v1/voice-actors/${voiceActorId}/generate-voice`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'x-api-key': CONFIG.nijivoice.apiKey
                },
                body: JSON.stringify(requestBody)
            }
        );
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Nijivoice voice generation failed: ${response.status} - ${errorText}`);
        }
        
        return await response.json();
    }
    
    /**
     * APIキーの設定状況を確認
     */
    getApiKeyStatus() {
        return {
            proxy: this.isProxyAvailable,
            gemini: !!CONFIG.gemini.apiKey,
            voicevox: !!CONFIG.voicevox.apiKey,
            nijivoice: !!CONFIG.nijivoice.apiKey
        };
    }
}

// グローバルインスタンスを作成
document.addEventListener('DOMContentLoaded', () => {
    window.secureApiClient = new SecureApiClient();
    
    // デバッグ用
    window.checkApiStatus = () => {
        console.log('API Status:', window.secureApiClient.getApiKeyStatus());
    };
});
