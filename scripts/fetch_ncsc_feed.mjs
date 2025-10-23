import fs from 'fs/promises';

const RSS_URL = 'https://www.kyberturvallisuuskeskus.fi/feed/rss/fi';

async function fetchRss(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; NCSC-FI-CacheBot/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'accept': 'application/rss+xml, application/xml, text/xml, */*'
    },
    redirect: 'follow'
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

function isValidRss(text) {
  return typeof text === 'string' && text.includes('<rss') && text.includes('<channel>');
}

async function main() {
  let attemptErrors = [];
  const tries = [
    RSS_URL,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(RSS_URL)}`,
    `https://cors.isomorphic-git.org/${RSS_URL}`
  ];

  let xml = null;
  for (const tryUrl of tries) {
    try {
      const r = await fetchRss(tryUrl);
      if (r.ok && isValidRss(r.text)) {
        xml = r.text;
        break;
      }
      attemptErrors.push(`URL: ${tryUrl} => status ${r.status}, valid=${isValidRss(r.text)}`);
    } catch (e) {
      attemptErrors.push(`URL: ${tryUrl} => error ${(e && e.message) || e}`);
    }
  }

  const payload = xml ? {
    success: true,
    source: 'NCSC-FI RSS Feed',
    url: RSS_URL,
    fetchedAt: new Date().toISOString(),
    contentLength: xml.length,
    content: xml
  } : {
    success: false,
    source: 'NCSC-FI RSS Feed',
    url: RSS_URL,
    fetchedAt: new Date().toISOString(),
    error: 'All attempts failed',
    attempts: attemptErrors.slice(0, 10)
  };

  await fs.writeFile('ncsc-rss.json', JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Wrote ncsc-rss.json (success=${payload.success})`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

