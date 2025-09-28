import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const analyticsFile = path.join(DATA_DIR, 'analytics.json');
const notificationsFile = path.join(DATA_DIR, 'notifications.json');

const readJson = (p, fallback=[]) => {
  try { return JSON.parse(fs.readFileSync(p,'utf-8')); }
  catch(e){ return fallback; }
};
const writeJson = (p, data) => fs.writeFileSync(p, JSON.stringify(data,null,2), 'utf-8');

app.get('/', (req,res)=> res.send({ok:true, service:'ClarityRead backend example'}));

// Summarize endpoint: if OPENAI_API_KEY env var present, it will call OpenAI's chat completions.
app.post('/api/summarize', async (req,res)=>{
  const { text, max_tokens=200 } = req.body || {};
  if (!text) return res.status(400).json({error:'missing text'});
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const prompt = `Summarize the following text in a concise bullet list:\n\n${text}`;
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{role:'user', content: prompt}],
          max_tokens
        })
      });
      const j = await r.json();
      const out = j?.choices?.[0]?.message?.content ?? JSON.stringify(j);
      return res.json({summary: out, source: 'openai'});
    } catch(e){
      console.error('openai call failed',e);
    }
  }
  // fallback: naive mock summarizer
  const sentences = text.replace(/\n/g,' ').split(/(?<=[.?!])\s+/).slice(0,4);
  const summary = sentences.join(' ').slice(0,100) + (text.length>100 ? '...' : '');
  res.json({summary, source: 'mock'});
});

// Basic analytics collector (append events)
app.post('/api/analytics', (req,res)=>{
  const event = Object.assign({ts: new Date().toISOString()}, req.body || {});
  const arr = readJson(analyticsFile, []);
  arr.push(event);
  writeJson(analyticsFile, arr);
  res.json({ok:true, count: arr.length});
});

// Notifications register (store)
app.post('/api/notifications/register', (req,res)=>{
  const item = Object.assign({id: Date.now(), ts: new Date().toISOString()}, req.body || {});
  const arr = readJson(notificationsFile, []);
  arr.push(item);
  writeJson(notificationsFile, arr);
  res.json({ok:true, item});
});

// Simple retrieval endpoints for debugging
app.get('/api/analytics', (req,res)=>{
  res.json(readJson(analyticsFile, []));
});
app.get('/api/notifications', (req,res)=>{
  res.json(readJson(notificationsFile, []));
});

const port = process.env.PORT || 8787;
app.listen(port, ()=> console.log('ClarityRead backend listening on', port));
