const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // npm install node-fetch@2.6.7 が必要
const path = require('path');
require('dotenv').config(); // npm install dotenv が必要

const app = express();
const PORT = process.env.PORT || 3001;

// CORS設定
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://your-cloudflare-domain.pages.dev'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// JSON解析
app.use(express.json());

// 静的ファイルの提供（本番環境用）
app.use(express.static(path.join(__dirname, '..')));

// 環境変数からAPIキーを取得
const API_KEYS = {
    gemini: process.env.GEMINI_API_KEY,
    voicevox: process.env.VOICEVOX_API_KEY,
    nijivoice: process.env.NIJIVOICE_API_KEY
};

// APIキーの存在確認
console.log('API Keys Status:');
console.log('Gemini:', API_KEYS.gemini ? '✅ Set' : '❌ Missing');
console.log('VOICEVOX:', API_KEYS.voicevox ? '✅ Set' : '❌ Missing');
console.log('Nijivoice:', API_KEYS.nijivoice ? '✅ Set' : '❌ Missing');

// エラーハンドリングミドルウェア
const handleApiError = (error, service) => {
    console.error(`${service} API Error:`, error.message);
    
    if (error.message.includes('fetch')) {
        return { error: 'Network connection failed', service };
    } else if (error.message.includes('404')) {
        return { error: 'API endpoint not found', service };
    } else if (error.message.includes('401') || error.message.includes('403')) {
        return { error: 'Authentication failed', service };
    } else if (error.message.includes('429')) {
        return { error: 'Rate limit exceeded', service };
    } else {
        return { error: 'Unknown error occurred', service, details: error.message };
    }
};

// **Gemini API Proxy**
app.post('/api/proxy/gemini', async (req, res) => {
    try {
        if (!API_KEYS.gemini) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }

        const { model, ...requestBody } = req.body;
        const geminiModel = model || 'gemini-2.0-flash';
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${API_KEYS.gemini}`,
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
            console.error('Gemini API Error:', response.status, errorText);
            
            // モデル名の問題を検出して代替モデルを提案
            if (errorText.includes('not found for API version')) {
                return res.status(400).json({ 
                    error: 'Model not found', 
                    suggestion: 'Try alternative model names',
                    alternatives: ['gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-flash']
                });
            }
            
            return res.status(response.status).json({ 
                error: 'Gemini API request failed', 
                details: errorText 
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        const errorResponse = handleApiError(error, 'Gemini');
        res.status(500).json(errorResponse);
    }
});

// **VOICEVOX API Proxy**
app.get('/api/proxy/voicevox/speakers', async (req, res) => {
    try {
        if (!API_KEYS.voicevox) {
            return res.status(500).json({ error: 'VOICEVOX API key not configured' });
        }

        const response = await fetch(
            `https://deprecatedapis.tts.quest/v2/voicevox/speakers/?key=${API_KEYS.voicevox}`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: 'VOICEVOX speakers request failed',
                status: response.status 
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        const errorResponse = handleApiError(error, 'VOICEVOX');
        res.status(500).json(errorResponse);
    }
});

app.get('/api/proxy/voicevox/audio', async (req, res) => {
    try {
        if (!API_KEYS.voicevox) {
            return res.status(500).json({ error: 'VOICEVOX API key not configured' });
        }

        const { text, speaker, speed, pitch, intonationScale } = req.query;
        
        const params = new URLSearchParams({
            text: text,
            speaker: speaker,
            speed: speed || '1.0',
            pitch: pitch || '0',
            intonationScale: intonationScale || '1.0',
            key: API_KEYS.voicevox
        });

        const response = await fetch(
            `https://deprecatedapis.tts.quest/v2/voicevox/audio/?${params.toString()}`,
            {
                headers: {
                    'Accept': 'audio/wav,audio/*'
                }
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: 'VOICEVOX audio synthesis failed',
                status: response.status 
            });
        }

        // 音声データをそのまま転送
        res.set({
            'Content-Type': response.headers.get('content-type') || 'audio/wav',
            'Content-Length': response.headers.get('content-length')
        });
        
        response.body.pipe(res);
    } catch (error) {
        const errorResponse = handleApiError(error, 'VOICEVOX');
        res.status(500).json(errorResponse);
    }
});

// **にじボイス API Proxy**
app.get('/api/proxy/nijivoice/voice-actors', async (req, res) => {
    try {
        if (!API_KEYS.nijivoice) {
            return res.status(500).json({ error: 'Nijivoice API key not configured' });
        }

        const response = await fetch(
            'https://api.nijivoice.com/api/platform/v1/voice-actors',
            {
                headers: {
                    'Accept': 'application/json',
                    'x-api-key': API_KEYS.nijivoice
                }
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: 'Nijivoice voice actors request failed',
                status: response.status 
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        const errorResponse = handleApiError(error, 'Nijivoice');
        res.status(500).json(errorResponse);
    }
});

app.post('/api/proxy/nijivoice/generate-voice/:voiceActorId', async (req, res) => {
    try {
        if (!API_KEYS.nijivoice) {
            return res.status(500).json({ error: 'Nijivoice API key not configured' });
        }

        const { voiceActorId } = req.params;
        const requestBody = req.body;

        const response = await fetch(
            `https://api.nijivoice.com/api/platform/v1/voice-actors/${voiceActorId}/generate-voice`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'x-api-key': API_KEYS.nijivoice
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ 
                error: 'Nijivoice voice generation failed',
                status: response.status,
                details: errorText
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        const errorResponse = handleApiError(error, 'Nijivoice');
        res.status(500).json(errorResponse);
    }
});

// 既存の音声ファイル取得プロキシ（互換性のため残す）
app.get('/fetch-audio', async (req, res) => {
  try {
    const audioUrl = req.query.url;
    if (!audioUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log('音声ファイル取得:', audioUrl);
    
    const response = await fetch(audioUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch audio: ${response.statusText}` });
    }

    // レスポンスヘッダーを設定
    res.set({
      'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    });

    // 音声データをストリーミング
    response.body.pipe(res);
  } catch (error) {
    console.error('音声ファイル取得エラー:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        services: {
            gemini: !!API_KEYS.gemini,
            voicevox: !!API_KEYS.voicevox,
            nijivoice: !!API_KEYS.nijivoice
        }
    });
});

// メインページを提供（開発時）
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 404ハンドラー
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// グローバルエラーハンドラー
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log('📡 Available endpoints:');
    console.log('  - POST /api/proxy/gemini');
    console.log('  - GET  /api/proxy/voicevox/speakers');
    console.log('  - GET  /api/proxy/voicevox/audio');
    console.log('  - GET  /api/proxy/nijivoice/voice-actors');
    console.log('  - POST /api/proxy/nijivoice/generate-voice/:voiceActorId');
    console.log('  - GET  /api/health');
});

module.exports = app;