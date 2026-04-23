require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const LEADS_FILE = path.join(__dirname, 'leads.json');
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const ADMIN_DASHBOARD_URL = process.env.ADMIN_DASHBOARD_URL || 'http://localhost:3000/admin';
const LEAD_ALERT_EMAIL_TO = process.env.LEAD_ALERT_EMAIL_TO || 'sudaisjadoo09@gmail.com';
const LEAD_ALERT_WHATSAPP_TO = (process.env.LEAD_ALERT_WHATSAPP_TO || '923195426640').replace(/\D/g, '');
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'change-this-admin-session-secret';
const ADMIN_SESSION_TTL_MS = Number(process.env.ADMIN_SESSION_TTL_MS || 1000 * 60 * 60 * 8);

const DEFAULT_CHAT_MODELS = [
  process.env.OPENROUTER_MODEL,
  'openai/gpt-4o-mini',
  'deepseek/deepseek-r1-distill-llama-70b:free',
  'meta-llama/llama-3.1-8b-instruct:free',
].filter(Boolean);

async function callOpenRouterWithFallback({ models, messages, maxTokens, title }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'OPENROUTER_API_KEY is missing in environment variables.' };
  }

  let lastError = 'Unknown OpenRouter error';
  const attempts = [];

  for (const model of models) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://tameen24.com',
          'X-Title': title,
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
      });

      const data = await response.json();
      const apiError = data?.error?.message;

      if (response.ok && !apiError) {
        return { ok: true, data, model, attempts };
      }

      lastError = apiError || `HTTP ${response.status}`;
      attempts.push({ model, error: lastError });
      console.warn(`⚠️ OpenRouter model failed (${model}): ${lastError}`);
    } catch (err) {
      lastError = err.message;
      attempts.push({ model, error: lastError });
      console.warn(`⚠️ OpenRouter request failed (${model}): ${lastError}`);
    }
  }

  return { ok: false, error: lastError, attempts };
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + '='.repeat(padLength), 'base64').toString('utf8');
}

function signAdminSession(payload) {
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(payloadEncoded)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${payloadEncoded}.${signature}`;
}

function verifyAdminSessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { ok: false, error: 'Missing admin token' };
  }

  const [payloadEncoded, signature] = token.split('.');
  const expectedSignature = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(payloadEncoded)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigA = Buffer.from(signature || '', 'utf8');
  const sigB = Buffer.from(expectedSignature, 'utf8');
  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
    return { ok: false, error: 'Invalid admin token signature' };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));
    if (!payload?.exp || Date.now() > payload.exp) {
      return { ok: false, error: 'Admin token expired' };
    }
    return { ok: true, payload };
  } catch (err) {
    return { ok: false, error: `Invalid admin token payload: ${err.message}` };
  }
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
}

function requireAdminAuth(req, res, next) {
  const token = getBearerToken(req);
  const verified = verifyAdminSessionToken(token);

  if (!verified.ok) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.adminSession = verified.payload;
  return next();
}

// ── Helper: read/write leads ──────────────────────────────────
function readLeads() {
  if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, '[]');
  return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
}

function writeLead(lead) {
  const leads = readLeads();
  leads.unshift({ id: Date.now(), ...lead });
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

function buildLeadSummary(lead) {
  const leadTime = lead.timestamp ? new Date(lead.timestamp).toLocaleString() : new Date().toLocaleString();
  return [
    `Name: ${lead.name || '-'}`,
    `Phone: ${lead.phone || '-'}`,
    `Email: ${lead.email || '-'}`,
    `Insurance: ${lead.insurance || '-'}`,
    `Language: ${lead.lang || '-'}`,
    `Time: ${leadTime}`,
  ].join('\n');
}

function buildLeadEmailHtml(lead) {
  const safe = (value) => String(value || '-').replace(/[&<>"]+/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  const leadTime = lead.timestamp ? new Date(lead.timestamp).toLocaleString() : new Date().toLocaleString();
  return `
    <div style="font-family:Arial,sans-serif;background:#f6fff9;padding:24px;color:#173b24;">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #d7efdf;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);">
        <div style="background:linear-gradient(135deg,#00a651,#007a3d);color:#fff;padding:18px 22px;">
          <div style="font-size:22px;font-weight:800;">New Lead Alert</div>
          <div style="font-size:13px;opacity:.9;">Tameen24 admin notification</div>
        </div>
        <div style="padding:22px;line-height:1.7;font-size:14px;">
          <p><strong>Name:</strong> ${safe(lead.name)}</p>
          <p><strong>Phone:</strong> ${safe(lead.phone)}</p>
          <p><strong>Email:</strong> ${safe(lead.email)}</p>
          <p><strong>Insurance:</strong> ${safe(lead.insurance)}</p>
          <p><strong>Language:</strong> ${safe(lead.lang)}</p>
          <p><strong>Time:</strong> ${safe(leadTime)}</p>
          <div style="margin-top:18px;">
            <a href="${ADMIN_DASHBOARD_URL}" style="display:inline-block;background:#00a651;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Open Admin Dashboard</a>
          </div>
        </div>
      </div>
    </div>`;
}

async function sendLeadEmailNotification(lead) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('⚠️ SMTP env vars missing, skipping email notification');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || smtpUser,
    to: LEAD_ALERT_EMAIL_TO,
    subject: `New Tameen24 lead: ${lead.name || 'Lead'}`,
    text: `${buildLeadSummary(lead)}\n\nAdmin: ${ADMIN_DASHBOARD_URL}`,
    html: buildLeadEmailHtml(lead),
  });
}

async function sendLeadWhatsAppNotification(lead) {
  const whatsappToken = process.env.WHATSAPP_TOKEN;
  if (!whatsappToken || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('⚠️ WhatsApp notification env vars missing, skipping WhatsApp alert');
    return;
  }

  const bodyText = `${buildLeadSummary(lead)}\n\nAdmin Dashboard: ${ADMIN_DASHBOARD_URL}`;

  await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${whatsappToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: LEAD_ALERT_WHATSAPP_TO,
      type: 'text',
      text: { preview_url: true, body: bodyText },
    }),
  });
}

// ── AI Chat ───────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    console.log('📨 Chat request received');

    const requestedModel = req.body.model;
    const models = [requestedModel, ...DEFAULT_CHAT_MODELS].filter(Boolean);
    const uniqueModels = [...new Set(models)];

    const result = await callOpenRouterWithFallback({
      models: uniqueModels,
      messages: [
        { role: 'system', content: req.body.system || 'You are a helpful insurance assistant.' },
        ...(req.body.messages || []),
      ],
      maxTokens: req.body.max_tokens || 500,
      title: 'Tameen24 AI Chatbot',
    });

    if (!result.ok) {
      console.error('❌ OpenRouter error:', result.error);
      const responseBody = {
        content: [{ text: 'Sorry, AI service is temporarily unavailable. Please try again.' }],
        error: result.error,
      };

      // Expose detailed diagnostics only outside production.
      if (process.env.NODE_ENV !== 'production') {
        responseBody.debug = {
          reason: result.error,
          attemptedModels: uniqueModels,
          attempts: result.attempts || [],
        };
      }

      return res.status(502).json(responseBody);
    }

    console.log(`✅ AI response received via model: ${result.model}`);
    const reply = result.data.choices?.[0]?.message?.content || 'Sorry, please try again.';
    res.json({ content: [{ text: reply }], model: result.model });

  } catch (err) {
    console.error('❌ Server error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Save Lead ─────────────────────────────────────────────────
app.post('/api/lead', async (req, res) => {
  try {
    const { name, phone, email, insurance, lang, timestamp } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });

    const lead = { name, phone, email, insurance, lang, timestamp };
    writeLead(lead);
    console.log(`✅ New lead saved: ${name} - ${phone} - ${insurance}`);

    await Promise.allSettled([
      sendLeadEmailNotification(lead),
      sendLeadWhatsAppNotification(lead),
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Lead save error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Admin Login/Session ──────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  try {
    const configuredAdminKey = process.env.ADMIN_KEY;
    const { adminKey } = req.body || {};

    if (!configuredAdminKey) {
      return res.status(500).json({ error: 'ADMIN_KEY is not configured on server' });
    }

    if (!adminKey || adminKey !== configuredAdminKey) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
    const token = signAdminSession({
      role: 'admin',
      iat: Date.now(),
      exp: expiresAt,
    });

    return res.json({ token, expiresAt });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/verify', requireAdminAuth, (req, res) => {
  res.json({ ok: true, expiresAt: req.adminSession.exp });
});

// ── Get All Leads (Admin Dashboard) ──────────────────────────
app.get('/api/leads', requireAdminAuth, (req, res) => {
  try {
    const leads = readLeads();
    res.json({ leads, total: leads.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── WhatsApp Webhook Verify ───────────────────────────────────
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'tameen24secret';
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified');
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Invalid token');
  }
});

// ── WhatsApp Message Handler ──────────────────────────────────
app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message || message.type !== 'text') return res.sendStatus(200);

    const userMessage = message.text.body;
    const from = message.from;
    const phoneNumberId = change?.value?.metadata?.phone_number_id;

    console.log(`📱 WhatsApp from ${from}: ${userMessage}`);

    // Detect language
    const isArabic = /[\u0600-\u06FF]/.test(userMessage);
    const sysPrompt = isArabic
      ? `أنت مساعد تأمين ذكي لشركة تأمين24 في الإمارات. اجعل إجاباتك موجزة (3 جمل). لا تعطِ أسعاراً محددة. اقترح التواصل مع وكيل للحصول على عرض.`
      : `You are an AI insurance assistant for Tameen24 UAE. Keep replies under 3 sentences. Never give exact prices. Always suggest speaking to an agent for a quote.`;

    // Get AI reply
    const waModels = [
      process.env.OPENROUTER_WHATSAPP_MODEL,
      'openai/gpt-4o-mini',
      'deepseek/deepseek-r1-distill-llama-70b:free',
      'meta-llama/llama-3.1-8b-instruct:free',
    ].filter(Boolean);

    const aiResult = await callOpenRouterWithFallback({
      models: [...new Set(waModels)],
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userMessage },
      ],
      maxTokens: 300,
      title: 'Tameen24 WhatsApp Bot',
    });

    const reply = aiResult.ok
      ? aiResult.data.choices?.[0]?.message?.content
      : null;

    const safeReply = reply || (isArabic ? 'عذراً، حاول مرة أخرى.' : 'Sorry, please try again.');

    // Send WhatsApp reply
    await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: from,
        text: { body: safeReply },
      }),
    });

    console.log(`✅ WhatsApp reply sent to ${from}`);
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ WhatsApp error:', err.message);
    res.sendStatus(500);
  }
});

// ── Health check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: '✅ Tameen24 AI Backend Running', version: '1.0.0' });
});

const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Tameen24 Backend running on port ${PORT}`);
});