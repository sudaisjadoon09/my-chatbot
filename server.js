require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
app.post('/api/chat', async (req, res) => {
  try {
    console.log('📨 Request received');
    console.log('Messages:', JSON.stringify(req.body.messages, null, 2));

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Chatbot'
      },
      body: JSON.stringify({
        model: 'arcee-ai/trinity-large-preview:free',
        messages: [
          { role: 'system', content: req.body.system || 'You are a helpful assistant.' },
          ...req.body.messages
        ],
        max_tokens: 1000,
      })
    });

    const data = await response.json();
    console.log('✅ OpenRouter full response:', JSON.stringify(data, null, 2));

    if (data.error) {
      console.error('❌ OpenRouter error:', data.error);
      return res.json({ content: [{ text: `Error: ${data.error.message}` }] });
    }

    const reply = data.choices?.[0]?.message?.content || 'No reply received.';
    res.json({ content: [{ text: reply }] });

  } catch (err) {
    console.error('❌ Server crash:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('✅ Backend running on http://localhost:3001');
});