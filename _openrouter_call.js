const fs = require('fs');
const https = require('https');

const env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const match = env.match(/^\s*OPENROUTER_API_KEY\s*=\s*(.*)\s*$/m);
if (!match) {
  console.log('HTTP 0');
  console.log('ERROR: OPENROUTER_API_KEY not found in .env');
  process.exit(1);
}

const key = match[1].trim().replace(/^['"]|['"]$/g, '');
if (!key) {
  console.log('HTTP 0');
  console.log('ERROR: OPENROUTER_API_KEY is empty');
  process.exit(1);
}

const body = JSON.stringify({
  model: 'meta-llama/llama-3.1-8b-instruct:free',
  messages: [{ role: 'user', content: 'hello' }]
});

const req = https.request({
  hostname: 'openrouter.ai',
  path: '/api/v1/chat/completions',
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'HTTP-Referer': 'http://localhost',
    'X-Title': 'my-chatbot'
  }
}, (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    console.log('HTTP ' + res.statusCode);
    let parsed;
    try { parsed = JSON.parse(data); } catch {}

    if (res.statusCode >= 200 && res.statusCode < 300) {
      let text = (parsed && parsed.choices && parsed.choices[0] && ((parsed.choices[0].message && parsed.choices[0].message.content) || parsed.choices[0].text)) || '';
      text = String(text).replace(/\s+/g, ' ').trim();
      if (text.length > 160) text = text.slice(0, 160) + '...';
      console.log(text ? ('TEXT: ' + text) : 'ERROR: No text in first choice');
    } else {
      let err = (parsed && parsed.error && parsed.error.message) ? parsed.error.message : (data || 'Request failed');
      err = String(err).replace(/\s+/g, ' ').trim();
      if (err.length > 200) err = err.slice(0, 200) + '...';
      console.log('ERROR: ' + err);
      process.exitCode = 1;
    }
  });
});

req.on('error', (err) => {
  console.log('HTTP 0');
  console.log('ERROR: ' + err.message);
  process.exit(1);
});

req.write(body);
req.end();
