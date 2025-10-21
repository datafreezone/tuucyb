<?php
// NCSC-FI RSS Proxy for Azure Web App
// Fetches RSS feed server-side to avoid CORS issues

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

try {
    $rssUrl = 'https://www.kyberturvallisuuskeskus.fi/feed/rss/fi';
    
    // Create context with proper headers
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'User-Agent: Tuusula-Cybersecurity-Dashboard/1.0',
                'Accept: application/rss+xml, application/xml, text/xml'
            ],
            'timeout' => 30
        ]
    ]);
    
    // Fetch RSS content
    $xmlContent = file_get_contents($rssUrl, false, $context);
    
    if ($xmlContent === false) {
        throw new Exception('Failed to fetch RSS content from NCSC-FI');
    }
    
    // Validate RSS content
    if (strpos($xmlContent, '<rss') === false || strpos($xmlContent, '<channel>') === false) {
        throw new Exception('Invalid RSS content received');
    }
    
    // Return successful response
    $response = [
        'success' => true,
        'timestamp' => date('c'),
        'source' => 'NCSC-FI RSS Feed',
        'content' => $xmlContent,
        'contentLength' => strlen($xmlContent)
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    // Return error response
    http_response_code(500);
    $response = [
        'success' => false,
        'timestamp' => date('c'),
        'error' => $e->getMessage(),
        'source' => 'NCSC-FI RSS Feed'
    ];
    
    echo json_encode($response);
}
?>
