
import { useState, useRef, useEffect } from "react";

const DEFAULT_CONFIG = {
  businessName: "NexaCorp",
  tagline: "Premium Business Solutions",
  avatarEmoji: "⚡",
  welcomeMessage: "Welcome! I'm your intelligent business assistant. I can answer questions about our services, pricing, availability, and more. How can I help you today?",
  systemPrompt: `You are an elite AI business assistant for NexaCorp, a premium business solutions company.

Business Information:
- Company: NexaCorp Premium Solutions
- Services: AI Chatbot Development ($200-$500), Web Development ($300-$800), Business Automation ($150-$400), Consulting ($100/hr)
- Hours: Monday-Friday 9AM-6PM EST, Saturday 10AM-2PM EST
- Response Time: Within 2 hours on business days
- Contact: hello@nexacorp.com | +1 (555) 123-4567
- Location: Remote / Worldwide
- Guarantee: 100% satisfaction, unlimited revisions

Personality: Professional, warm, confident. You're proud of the quality you deliver.
Rules:
- Keep answers under 4 sentences unless more detail is needed
- Always end with a helpful follow-up question or call-to-action
- If asked about pricing, give ranges and offer a free consultation
- Never make up information not listed above`,
};

const QUICK_REPLIES = [
  { label: "💼 Services", text: "What services do you offer?" },
  { label: "💰 Pricing", text: "How much does it cost?" },
  { label: "⏰ Availability", text: "What are your working hours?" },
  { label: "📞 Contact", text: "How can I contact you?" },
  { label: "⚡ Get Started", text: "How do I get started?" },
  { label: "🛡️ Guarantee", text: "Do you offer any guarantees?" },
];

const PARTICLE_COUNT = 20;

export default function PremiumChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
    }))
  );
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

useEffect(() => {
  setMessages([{ role: "assistant", content: config.welcomeMessage, time: now() }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function now() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const newMessages = [...messages, { role: "user", content: userText, time: now() }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 600));

    try {
      // ✅ Calls your local backend — no CORS error
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: config.systemPrompt,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || "I apologize, something went wrong. Please try again.";
      setIsTyping(false);
      setMessages([...newMessages, { role: "assistant", content: reply, time: now() }]);
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "⚠️ Could not reach server. Make sure your backend is running with: node server.js",
          time: now(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([{ role: "assistant", content: config.welcomeMessage, time: now() }]);
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .chatbot-root {
      min-height: 100vh;
      background: #050810;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'DM Sans', sans-serif;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .bg-grid {
      position: fixed; inset: 0;
      background-image:
        linear-gradient(rgba(0,212,170,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,212,170,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }

    .bg-glow-1 {
      position: fixed;
      width: 600px; height: 600px;
      background: radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%);
      top: -200px; left: -200px;
      pointer-events: none;
    }

    .bg-glow-2 {
      position: fixed;
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(0,153,255,0.06) 0%, transparent 70%);
      bottom: -150px; right: -150px;
      pointer-events: none;
    }

    .particle {
      position: fixed;
      border-radius: 50%;
      background: rgba(0,212,170,0.4);
      pointer-events: none;
      animation: float linear infinite;
    }

    @keyframes float {
      0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
    }

    .main-wrapper {
      width: 100%;
      max-width: 780px;
      position: relative;
      z-index: 10;
    }

    .brand-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding: 0 4px;
    }

    .brand-logo {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 22px;
      color: #fff;
      letter-spacing: -0.5px;
    }

    .brand-logo span { color: #00d4aa; }

    .brand-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(0,212,170,0.1);
      border: 1px solid rgba(0,212,170,0.25);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 11px;
      color: #00d4aa;
      font-weight: 500;
    }

    .badge-dot {
      width: 6px; height: 6px;
      background: #00d4aa;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    .chat-window {
      background: rgba(8,14,28,0.95);
      border: 1px solid rgba(0,212,170,0.15);
      border-radius: 24px;
      overflow: hidden;
      box-shadow:
        0 0 0 1px rgba(0,212,170,0.05),
        0 40px 80px rgba(0,0,0,0.6),
        inset 0 1px 0 rgba(255,255,255,0.05);
    }

    .chat-header {
      background: linear-gradient(135deg, rgba(0,212,170,0.12), rgba(0,153,255,0.08));
      border-bottom: 1px solid rgba(0,212,170,0.12);
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }

    .chat-header::after {
      content: '';
      position: absolute;
      bottom: 0; left: 24px; right: 24px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(0,212,170,0.4), transparent);
    }

    .agent-info { display: flex; align-items: center; gap: 14px; }

    .agent-avatar {
      width: 46px; height: 46px;
      background: linear-gradient(135deg, #00d4aa, #0099ff);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      position: relative;
      box-shadow: 0 0 20px rgba(0,212,170,0.3);
    }

    .agent-avatar::after {
      content: '';
      position: absolute;
      bottom: -2px; right: -2px;
      width: 12px; height: 12px;
      background: #00d4aa;
      border: 2px solid #050810;
      border-radius: 50%;
    }

    .agent-name {
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 16px;
      color: #fff;
    }

    .agent-status {
      font-size: 12px;
      color: #00d4aa;
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .header-actions { display: flex; gap: 8px; }

    .btn-icon {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      color: #8899aa;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-icon:hover {
      background: rgba(0,212,170,0.1);
      border-color: rgba(0,212,170,0.3);
      color: #00d4aa;
    }

    .config-panel {
      background: rgba(0,0,0,0.4);
      border-bottom: 1px solid rgba(0,212,170,0.1);
      padding: 20px 24px;
    }

    .config-title {
      font-family: 'Syne', sans-serif;
      font-size: 11px;
      font-weight: 700;
      color: #00d4aa;
      letter-spacing: 2px;
      margin-bottom: 14px;
    }

    .config-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }

    .config-field label {
      display: block;
      font-size: 11px;
      color: #667788;
      margin-bottom: 5px;
      font-weight: 500;
    }

    .config-input {
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(0,212,170,0.2);
      border-radius: 8px;
      padding: 8px 12px;
      color: #e0e8f0;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      outline: none;
      transition: border-color 0.2s;
    }

    .config-input:focus { border-color: rgba(0,212,170,0.5); }

    .config-textarea {
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(0,212,170,0.2);
      border-radius: 8px;
      padding: 10px 12px;
      color: #e0e8f0;
      font-size: 12px;
      font-family: 'DM Sans', sans-serif;
      resize: vertical;
      outline: none;
      line-height: 1.5;
      transition: border-color 0.2s;
    }

    .config-textarea:focus { border-color: rgba(0,212,170,0.5); }
    .config-hint { font-size: 11px; color: #445566; margin-top: 8px; }

    .messages-area {
      height: 420px;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .messages-area::-webkit-scrollbar { width: 3px; }
    .messages-area::-webkit-scrollbar-track { background: transparent; }
    .messages-area::-webkit-scrollbar-thumb { background: rgba(0,212,170,0.2); border-radius: 3px; }

    .message-row {
      display: flex;
      gap: 10px;
      animation: msgIn 0.3s ease;
    }

    .message-row.user { flex-direction: row-reverse; }

    @keyframes msgIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .msg-avatar {
      width: 32px; height: 32px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .msg-avatar.bot {
      background: linear-gradient(135deg, #00d4aa22, #0099ff22);
      border: 1px solid rgba(0,212,170,0.3);
    }

    .msg-avatar.user-av {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
    }

    .msg-content {
      max-width: 72%;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .msg-bubble {
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.6;
    }

    .msg-bubble.bot {
      background: rgba(0,212,170,0.06);
      border: 1px solid rgba(0,212,170,0.12);
      color: #c8d8e8;
      border-radius: 4px 18px 18px 18px;
    }

    .msg-bubble.user {
      background: linear-gradient(135deg, rgba(0,212,170,0.2), rgba(0,153,255,0.2));
      border: 1px solid rgba(0,212,170,0.25);
      color: #e8f4f8;
      border-radius: 18px 4px 18px 18px;
    }

    .msg-time { font-size: 10px; color: #334455; padding: 0 4px; }
    .message-row.user .msg-time { text-align: right; }

    .typing-bubble {
      background: rgba(0,212,170,0.06);
      border: 1px solid rgba(0,212,170,0.12);
      border-radius: 4px 18px 18px 18px;
      padding: 14px 18px;
      display: flex;
      gap: 5px;
      align-items: center;
      width: fit-content;
    }

    .typing-dot {
      width: 6px; height: 6px;
      background: #00d4aa;
      border-radius: 50%;
      animation: typingBounce 1.2s infinite;
    }

    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-6px); opacity: 1; }
    }

    .quick-replies {
      padding: 0 24px 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .quick-btn {
      background: rgba(0,212,170,0.05);
      border: 1px solid rgba(0,212,170,0.2);
      border-radius: 20px;
      color: #00d4aa;
      padding: 6px 14px;
      font-size: 12px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
    }

    .quick-btn:hover {
      background: rgba(0,212,170,0.15);
      border-color: rgba(0,212,170,0.5);
      transform: translateY(-1px);
    }

    .input-area {
      padding: 16px 24px 20px;
      border-top: 1px solid rgba(0,212,170,0.08);
      position: relative;
    }

    .input-area::before {
      content: '';
      position: absolute;
      top: 0; left: 24px; right: 24px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(0,212,170,0.2), transparent);
    }

    .input-row { display: flex; gap: 10px; align-items: flex-end; }
    .input-wrapper { flex: 1; position: relative; }

    .chat-input {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(0,212,170,0.15);
      border-radius: 14px;
      padding: 13px 18px;
      color: #e0e8f0;
      font-size: 14px;
      font-family: 'DM Sans', sans-serif;
      outline: none;
      transition: all 0.2s;
    }

    .chat-input:focus {
      border-color: rgba(0,212,170,0.4);
      background: rgba(0,212,170,0.04);
      box-shadow: 0 0 0 3px rgba(0,212,170,0.05);
    }

    .chat-input::placeholder { color: #334455; }

    .send-btn {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, #00d4aa, #0099ff);
      border: none;
      border-radius: 14px;
      color: #050810;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
      box-shadow: 0 4px 15px rgba(0,212,170,0.3);
    }

    .send-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0,212,170,0.4);
    }

    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

    .input-hint { font-size: 11px; color: #223344; margin-top: 8px; text-align: center; }

    .stats-bar {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-top: 16px;
      padding: 12px 24px;
      background: rgba(0,212,170,0.03);
      border: 1px solid rgba(0,212,170,0.08);
      border-radius: 14px;
    }

    .stat-item { text-align: center; }

    .stat-value {
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 18px;
      color: #00d4aa;
    }

    .stat-label {
      font-size: 10px;
      color: #445566;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="chatbot-root">
        <div className="bg-grid" />
        <div className="bg-glow-1" />
        <div className="bg-glow-2" />

        {particles.map((p) => (
          <div key={p.id} className="particle" style={{
            left: `${p.x}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }} />
        ))}

        <div className="main-wrapper">
          <div className="brand-bar">
            <div className="brand-logo">
              {config.businessName.slice(0, -4)}
              <span>{config.businessName.slice(-4)}</span>
            </div>
            <div className="brand-badge">
              <div className="badge-dot" />
              AI Assistant Online
            </div>
          </div>

          <div className="chat-window">
            <div className="chat-header">
              <div className="agent-info">
                <div className="agent-avatar">{config.avatarEmoji}</div>
                <div>
                  <div className="agent-name">{config.businessName} AI</div>
                  <div className="agent-status">
                    <div className="badge-dot" style={{ width: "7px", height: "7px" }} />
                    {isTyping ? "Typing..." : "Online · Replies instantly"}
                  </div>
                </div>
              </div>
              <div className="header-actions">
                <button className="btn-icon" onClick={() => setShowConfig(!showConfig)}>
                  ⚙️ Customize
                </button>
                <button className="btn-icon" onClick={clearChat}>🗑️</button>
              </div>
            </div>

            {showConfig && (
              <div className="config-panel">
                <div className="config-title">⚙ CUSTOMIZE FOR YOUR CLIENT</div>
                <div className="config-grid">
                  <div className="config-field">
                    <label>Business Name</label>
                    <input className="config-input" value={config.businessName}
                      onChange={(e) => setConfig({ ...config, businessName: e.target.value })} />
                  </div>
                  <div className="config-field">
                    <label>Avatar Emoji</label>
                    <input className="config-input" value={config.avatarEmoji}
                      onChange={(e) => setConfig({ ...config, avatarEmoji: e.target.value })} />
                  </div>
                </div>
                <div className="config-field" style={{ marginBottom: "12px" }}>
                  <label>Welcome Message</label>
                  <input className="config-input" value={config.welcomeMessage}
                    onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })} />
                </div>
                <div className="config-field">
                  <label>System Prompt (Business Knowledge)</label>
                  <textarea className="config-textarea" rows={6} value={config.systemPrompt}
                    onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })} />
                </div>
                <div className="config-hint">
                  💡 Replace business info with your client's details. Takes 15 minutes per order.
                </div>
              </div>
            )}

            <div className="messages-area">
              {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.role === "user" ? "user" : ""}`}>
                  <div className={`msg-avatar ${msg.role === "user" ? "user-av" : "bot"}`}>
                    {msg.role === "user" ? "👤" : config.avatarEmoji}
                  </div>
                  <div className="msg-content">
                    <div className={`msg-bubble ${msg.role === "user" ? "user" : "bot"}`}>
                      {msg.content}
                    </div>
                    <div className="msg-time">{msg.time}</div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="message-row">
                  <div className="msg-avatar bot">{config.avatarEmoji}</div>
                  <div className="typing-bubble">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="quick-replies">
              {QUICK_REPLIES.map((q, i) => (
                <button key={i} className="quick-btn" onClick={() => sendMessage(q.text)}>
                  {q.label}
                </button>
              ))}
            </div>

            <div className="input-area">
              <div className="input-row">
                <div className="input-wrapper">
                  <input
                    ref={inputRef}
                    className="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ask me anything about our services..."
                    disabled={loading}
                  />
                </div>
                <button className="send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                  {loading ? "⏳" : "↑"}
                </button>
              </div>
              <div className="input-hint">Powered by Claude AI · Press Enter to send</div>
            </div>
          </div>

          <div className="stats-bar">
            <div className="stat-item">
              <div className="stat-value">24/7</div>
              <div className="stat-label">Always Online</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">&lt;1s</div>
              <div className="stat-label">Response Time</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">∞</div>
              <div className="stat-label">Conversations</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">100%</div>
              <div className="stat-label">AI Powered</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
