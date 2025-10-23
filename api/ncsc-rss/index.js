const fetch = require('node-fetch');

// Retry utility function
async function fetchWithRetry(url, options, maxRetries = 3, delayMs = 2000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            }
            
            // If we get a 5xx error, retry
            if (response.status >= 500 && attempt < maxRetries) {
                lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
                console.log(`Attempt ${attempt} failed with ${response.status}, retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                continue;
            }
            
            // For 4xx errors or last attempt, throw immediately
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            lastError = error;
            
            if (attempt < maxRetries) {
                console.log(`Attempt ${attempt} failed: ${error.message}, retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    
    throw lastError;
}

module.exports = async function (context, req) {
    context.log('Starting NCSC-FI RSS fetch...');
    
    // CORS headers for frontend access
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: corsHeaders
        };
        return;
    }
    
    try {
        const rssUrl = 'https://www.kyberturvallisuuskeskus.fi/feed/rss/fi';
        context.log(`Fetching RSS from: ${rssUrl}`);
        
        let response;
        let xmlContent;
        
        // NCSC-FI blocks Azure IPs, so use CORS proxy as primary method
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
        context.log(`Fetching via proxy: ${proxyUrl}`);
        
        try {
            response = await fetchWithRetry(proxyUrl, {
                method: 'GET',
                headers: {
                    'Accept': '*/*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 30000
            }, 3, 2000);
            xmlContent = await response.text();
            context.log('Successfully fetched via CORS proxy');
        } catch (proxyError) {
            context.log(`CORS proxy failed: ${proxyError.message}, trying direct...`);
            
            // Fallback to direct fetch (unlikely to work but worth trying)
            try {
                response = await fetchWithRetry(rssUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
                    },
                    timeout: 30000
                }, 2, 2000);
                xmlContent = await response.text();
                context.log('Successfully fetched directly');
            } catch (directError) {
                context.log.error(`Both methods failed. Proxy: ${proxyError.message}, Direct: ${directError.message}`);
                throw new Error(`Unable to fetch RSS feed. Proxy error: ${proxyError.message}`);
            }
        }
        
        context.log(`Successfully fetched RSS content (${xmlContent.length} characters)`);
        
        // Validate that we got valid RSS content
        if (!xmlContent.includes('<rss') || !xmlContent.includes('<channel>')) {
            throw new Error('Invalid RSS content received');
        }
        
        // Return successful response
        context.res = {
            status: 200,
            headers: corsHeaders,
            body: {
                success: true,
                timestamp: new Date().toISOString(),
                source: 'NCSC-FI RSS Feed',
                content: xmlContent,
                contentLength: xmlContent.length
            }
        };
        
        context.log('RSS fetch completed successfully');
        
    } catch (error) {
        context.log.error(`RSS fetch failed after retries: ${error.message}`);
        
        // Return error response
        context.res = {
            status: 502, // Bad Gateway - indicates upstream server issue
            headers: corsHeaders,
            body: {
                success: false,
                timestamp: new Date().toISOString(),
                error: error.message,
                source: 'NCSC-FI RSS Feed',
                note: 'Failed after 3 retry attempts'
            }
        };
    }
};
