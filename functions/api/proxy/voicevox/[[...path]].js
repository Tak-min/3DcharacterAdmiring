/**
 * VOICEVOX API プロキシ (Cloudflare Pages Functions)
 */

// 話者リスト取得
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    // CORS ヘッダー
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    
    try {
        const apiKey = env.VOICEVOX_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'VOICEVOX API key not configured' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // パス判定
        if (url.pathname.endsWith('/speakers')) {
            // 話者リスト取得
            const response = await fetch(
                `https://deprecatedapis.tts.quest/v2/voicevox/speakers/?key=${apiKey}`,
                {
                    headers: { 'Accept': 'application/json' }
                }
            );
            
            if (!response.ok) {
                return new Response(JSON.stringify({ 
                    error: 'VOICEVOX speakers request failed',
                    status: response.status 
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
            
        } else if (url.pathname.endsWith('/audio')) {
            // 音声合成
            const params = new URLSearchParams();
            url.searchParams.forEach((value, key) => {
                params.append(key, value);
            });
            params.append('key', apiKey);
            
            const response = await fetch(
                `https://deprecatedapis.tts.quest/v2/voicevox/audio/?${params.toString()}`,
                {
                    headers: { 'Accept': 'audio/wav,audio/*' }
                }
            );
            
            if (!response.ok) {
                return new Response(JSON.stringify({ 
                    error: 'VOICEVOX audio synthesis failed',
                    status: response.status 
                }), {
                    status: response.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // 音声データを転送
            return new Response(response.body, {
                status: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': response.headers.get('content-type') || 'audio/wav',
                    'Content-Length': response.headers.get('content-length')
                }
            });
        }
        
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('VOICEVOX proxy error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            details: error.message 
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
