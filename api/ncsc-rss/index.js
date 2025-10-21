const fetch = require('node-fetch');

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
        
        // Fetch RSS feed from server-side (no CORS issues)
        const response = await fetch(rssUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Tuusula-Cybersecurity-Dashboard/1.0',
                'Accept': 'application/rss+xml, application/xml, text/xml'
            },
            timeout: 30000 // 30 second timeout
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const xmlContent = await response.text();
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
        context.log.error(`RSS fetch failed: ${error.message}`);
        
        // Return error response
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: {
                success: false,
                timestamp: new Date().toISOString(),
                error: error.message,
                source: 'NCSC-FI RSS Feed'
            }
        };
    }
};
