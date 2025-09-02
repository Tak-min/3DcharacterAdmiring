/**
 * にじボイス API プロキシ (Cloudflare Pages Functions)
 */

export async function onRequestGet(context) {
    return handleNijivoiceRequest(context, 'GET');
}

export async function onRequestPost(context) {
    return handleNijivoiceRequest(context, 'POST');
}

async function handleNijivoiceRequest(context, method) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    // CORS ヘッダー
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    
    try {
        const apiKey = env.NIJIVOICE_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Nijivoice API key not configured' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // パス解析
        const pathParts = url.pathname.split('/').filter(Boolean);
        const nijivoicePathIndex = pathParts.findIndex(part => part === 'nijivoice');
        const apiPath = pathParts.slice(nijivoicePathIndex + 1).join('/');
        
        if (apiPath === 'voice-actors') {
            // 話者リスト取得
            const response = await fetch(
                'https://api.nijivoice.com/api/platform/v1/voice-actors',
                {
                    headers: {
                        'Accept': 'application/json',
                        'x-api-key': apiKey
                    }
                }
            );
            
            if (!response.ok) {
                return new Response(JSON.stringify({ 
                    error: 'Nijivoice voice actors request failed',
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
            
        } else if (apiPath.includes('generate-voice')) {
            // 音声合成
            const voiceActorIdMatch = apiPath.match(/generate-voice\/([^\/]+)/);
            if (!voiceActorIdMatch) {
                return new Response(JSON.stringify({ error: 'Voice actor ID not found in path' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const voiceActorId = voiceActorIdMatch[1];
            const requestBody = await request.json();
            
            const response = await fetch(
                `https://api.nijivoice.com/api/platform/v1/voice-actors/${voiceActorId}/generate-voice`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'x-api-key': apiKey
                    },
                    body: JSON.stringify(requestBody)
                }
            );
            
            if (!response.ok) {
                const errorText = await response.text();
                return new Response(JSON.stringify({ 
                    error: 'Nijivoice voice generation failed',
                    status: response.status,
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
        }
        
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Nijivoice proxy error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            details: error.message 
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
