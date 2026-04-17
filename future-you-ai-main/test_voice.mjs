const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const keyLine = env.split('\n').find(l => l.includes('VITE_SUPABASE_PUBLISHABLE_KEY'));
const key = keyLine.split('=')[1].replace(/\"/gi, '').replace(/\r/gi,'').trim();

fetch('https://iraolkerdmhsfncsquic.supabase.co/functions/v1/process-voice-input', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + key
  },
  body: JSON.stringify({ transcript: 'I slept 8 hours' })
}).then(async r => {
  console.log('Status:', r.status);
  console.log('Body:', await r.text());
}).catch(console.error);
