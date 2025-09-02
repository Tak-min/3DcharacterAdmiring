/**
 * Cloudflare Pages Functions - API プロキシ
 * エッジで実行されるサーバーレス関数
 */

// Gemini API プロキシ
export async function onRequestPost(context) {
    const { request, env } = context;
    
    // CORS ヘッダー
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // OPTIONS リクエスト (プリフライト) への対応
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    
    try {
        // 環境変数からAPIキーを取得
        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // リクエストボディを解析
        const requestBody = await request.json();
        const { model = 'gemini-2.0-flash', ...body } = requestBody;
        
        // Gemini APIにリクエスト
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
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
            
            // モデル名の問題を検出
            if (errorText.includes('not found for API version')) {
                return new Response(JSON.stringify({ 
                    error: 'Model not found', 
                    suggestion: 'Try alternative model names',
                    alternatives: ['gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-flash']
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            return new Response(JSON.stringify({ 
                error: 'Gemini API request failed', 
                details: errorText 
            }), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Gemini proxy error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            details: error.message 
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
