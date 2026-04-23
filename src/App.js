import { useState, useRef, useEffect } from "react";
import tameenLogo from "./assets/tameen24-logo.jpeg";
import chatbotIcon from "./assets/chatbot-icon.svg";

const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:3001/api/chat"
  : "https://my-chatbot-production-7d09.up.railway.app/api/chat";

const LEADS_URL = window.location.hostname === "localhost"
  ? "http://localhost:3001/api/lead"
  : "https://my-chatbot-production-7d09.up.railway.app/api/lead";

const T = {
  en: {
    dir: "ltr",
    bubbleMsg: "🛡️ Get your insurance quote in 2 minutes!",
    onlineStatus: "Online · Replies instantly",
    typing: "Typing...",
    placeholder: "Type your message...",
    poweredBy: "Powered by AI · Tameen24",
    quickReplies: [
      { label: "🚗 Car Insurance", text: "I need car insurance" },
      { label: "🏥 Medical Insurance", text: "I need medical insurance" },
      { label: "🏠 Property Insurance", text: "I need property insurance" },
      { label: "💰 Get a Quote", text: "I want to get a quote" },
      { label: "📋 Claim Help", text: "I need help with a claim" },
      { label: "🔄 Renew Policy", text: "I want to renew my policy" },
    ],
    leadTitle: "Get Your Free Quote",
    leadSubtitle: "Our expert will contact you within 1 hour",
    nameLabel: "Full Name", phoneLabel: "Phone Number",
    emailLabel: "Email Address", insuranceLabel: "Insurance Type",
    submitBtn: "Get Free Quote →",
    thankYou: "✅ Thank you! Our agent will call you within 1 hour.",
    namePh: "Enter your full name", phonePh: "+971 XX XXX XXXX", emailPh: "your@email.com",
    insuranceTypes: ["Car Insurance","Medical Insurance","Property Insurance","Marine Insurance","Fire Insurance","Life Insurance","Other"],
    welcome: "Welcome to Tameen24! 🛡️\n\nI'm your AI insurance assistant. I can help you with:\n• Car & Motor Insurance\n• Medical & Health Insurance\n• Property Insurance\n• Claims & Renewals\n\nHow can I help you today?",
    langBtn: "عربي",
  },
  ar: {
    dir: "rtl",
    bubbleMsg: "🛡️ احصل على عرض تأمين خلال دقيقتين!",
    onlineStatus: "متصل · يرد فوراً",
    typing: "يكتب...",
    placeholder: "اكتب رسالتك...",
    poweredBy: "مدعوم بالذكاء الاصطناعي · تأمين24",
    quickReplies: [
      { label: "🚗 تأمين السيارة", text: "أحتاج تأمين سيارة" },
      { label: "🏥 التأمين الطبي", text: "أحتاج تأمين طبي" },
      { label: "🏠 تأمين الممتلكات", text: "أحتاج تأمين ممتلكات" },
      { label: "💰 احصل على عرض", text: "أريد الحصول على عرض سعر" },
      { label: "📋 مساعدة في المطالبة", text: "أحتاج مساعدة في المطالبة" },
      { label: "🔄 تجديد الوثيقة", text: "أريد تجديد وثيقتي" },
    ],
    leadTitle: "احصل على عرض مجاني",
    leadSubtitle: "سيتواصل معك خبيرنا خلال ساعة",
    nameLabel: "الاسم الكامل", phoneLabel: "رقم الهاتف",
    emailLabel: "البريد الإلكتروني", insuranceLabel: "نوع التأمين",
    submitBtn: "احصل على عرض مجاني ←",
    thankYou: "✅ شكراً! سيتصل بك وكيلنا خلال ساعة واحدة.",
    namePh: "أدخل اسمك الكامل", phonePh: "٩٧١ XX XXX XXXX+", emailPh: "بريدك@email.com",
    insuranceTypes: ["تأمين السيارة","التأمين الطبي","تأمين الممتلكات","التأمين البحري","تأمين الحريق","التأمين على الحياة","أخرى"],
    welcome: "مرحباً بك في تأمين24! 🛡️\n\nأنا مساعدك الذكي للتأمين. يمكنني مساعدتك في:\n• تأمين السيارات\n• التأمين الطبي والصحي\n• تأمين الممتلكات\n• المطالبات والتجديد\n\nكيف يمكنني مساعدتك اليوم؟",
    langBtn: "English",
  },
};

const SYSTEM = {
  en: `You are an expert AI insurance assistant for Tameen24, a leading UAE insurance company.
Services: Car Insurance, Medical Insurance, Property Insurance, Liability, Fire, Marine Insurance.
Coverage: All UAE Emirates - Dubai, Abu Dhabi, Sharjah, Ajman, RAK, Fujairah.
Rules: Keep answers under 4 sentences. Never give exact prices - say our agent will give the best rate. After 2-3 questions suggest a free quote. Always end with a helpful question.`,
  ar: `أنت مساعد تأمين ذكي خبير لشركة تأمين24 في الإمارات العربية المتحدة.
الخدمات: تأمين السيارات، التأمين الطبي، تأمين الممتلكات، تأمين المسؤولية، تأمين الحريق، التأمين البحري.
التغطية: جميع إمارات الإمارات - دبي، أبوظبي، الشارقة، عجمان، رأس الخيمة، الفجيرة.
القواعد: اجعل إجاباتك موجزة لا تتجاوز 4 جمل. لا تعطِ أسعاراً محددة. اقترح عرضاً مجانياً بعد 2-3 أسئلة. اختم دائماً بسؤال مفيد.`,
};

function LeadForm({ lang, onClose }) {
  const t = T[lang];
  const [form, setForm] = useState({ name: "", phone: "", email: "", insurance: t.insuranceTypes[0] });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      await fetch(LEADS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, lang, timestamp: new Date().toISOString() }),
      });
    } catch (e) { console.error(e); }
    setSaving(false);
    setSubmitted(true);
    setTimeout(onClose, 3000);
  }

  if (submitted) return (
    <div style={{ padding: "24px", textAlign: "center" }}>
      <div style={{ fontSize: "40px", marginBottom: "10px" }}>✅</div>
      <div style={{ color: "#00a651", fontWeight: "700", fontSize: "14px" }}>{t.thankYou}</div>
    </div>
  );

  return (
    <div style={{ padding: "16px 18px", direction: t.dir }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
        <div style={{ fontWeight: "800", fontSize: "15px", color: "#1a1a2e" }}>{t.leadTitle}</div>
        <button
          onClick={onClose}
          aria-label="Close quote form"
          style={{
            width: "28px",
            height: "28px",
            border: "1px solid #d9e7d9",
            borderRadius: "8px",
            background: "#fff",
            color: "#666",
            cursor: "pointer",
            fontSize: "16px",
            lineHeight: "1",
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ fontSize: "11px", color: "#888", marginBottom: "14px" }}>{t.leadSubtitle}</div>
      {[["name",t.nameLabel,t.namePh,"text"],["phone",t.phoneLabel,t.phonePh,"tel"],["email",t.emailLabel,t.emailPh,"email"]].map(([k,l,p,tp]) => (
        <div key={k} style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#555", marginBottom: "3px" }}>{l}</label>
          <input type={tp} placeholder={p} value={form[k]}
            onChange={e => setForm({ ...form, [k]: e.target.value })}
            style={{ width: "100%", padding: "9px 11px", border: "1.5px solid #e0e0e0", borderRadius: "9px", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
      ))}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#555", marginBottom: "3px" }}>{t.insuranceLabel}</label>
        <select value={form.insurance} onChange={e => setForm({ ...form, insurance: e.target.value })}
          style={{ width: "100%", padding: "9px 11px", border: "1.5px solid #e0e0e0", borderRadius: "9px", fontSize: "13px", fontFamily: "inherit", outline: "none", background: "#fff", boxSizing: "border-box" }}>
          {t.insuranceTypes.map(i => <option key={i}>{i}</option>)}
        </select>
      </div>
      <button onClick={handleSubmit} disabled={saving || !form.name || !form.phone}
        style={{ width: "100%", padding: "11px", background: saving ? "#ccc" : "linear-gradient(135deg,#00a651,#007a3d)", color: "#fff", border: "none", borderRadius: "9px", fontSize: "13px", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
        {saving ? "..." : t.submitBtn}
      </button>
    </div>
  );
}

export default function Tameen24Chat() {
  const [lang, setLang] = useState("en");
  const [isOpen, setIsOpen] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [autoLeadShownOnce, setAutoLeadShownOnce] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const t = T[lang];

  useEffect(() => {
    setMessages([{ role: "assistant", content: T[lang].welcome, time: now() }]);
    setShowLeadForm(false);
    setAutoLeadShownOnce(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const userMsgCount = messages.filter(m => m.role === "user").length;
    if (!autoLeadShownOnce && userMsgCount >= 4 && !showLeadForm) {
      setTimeout(() => {
        setShowLeadForm(true);
        setAutoLeadShownOnce(true);
      }, 700);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  function now() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    const lowered = userText.toLowerCase();
    const leadIntentWords = [
      "quote", "price", "cost", "buy", "renew", "renewal", "policy", "call me", "contact me",
      "عرض", "سعر", "تكلفة", "كم", "تجديد", "وثيقة", "اتصل", "تواصل",
    ];
    if (leadIntentWords.some(k => lowered.includes(k))) {
      setShowLeadForm(true);
    }
    const newMsgs = [...messages, { role: "user", content: userText, time: now() }];
    setMessages(newMsgs);
    setInput(""); setLoading(true); setIsTyping(true);
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_tokens: 500, system: SYSTEM[lang], messages: newMsgs.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok && data?.error) console.warn("Chat API error:", data.error);
      if (!res.ok && data?.debug) console.warn("Chat API debug:", data.debug);
      const reply = data.content?.[0]?.text || "Sorry, please try again.";
      setIsTyping(false);
      setMessages([...newMsgs, { role: "assistant", content: reply, time: now() }]);
    } catch {
      setIsTyping(false);
      setMessages([...newMsgs, { role: "assistant", content: lang === "en" ? "⚠️ Connection error. Please try again." : "⚠️ خطأ في الاتصال.", time: now() }]);
    } finally { setLoading(false); inputRef.current?.focus(); }
  }

  function handleKey(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }
  function toggleChat() { setIsOpen(!isOpen); }
  function switchLang() { setLang(l => l === "en" ? "ar" : "en"); setShowLeadForm(false); }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #ffffff; min-height: 100vh; }

    .demo-bg {
      min-height: 100vh;
      background: linear-gradient(180deg, #ffffff 0%, #f8fffb 52%, #f3fcf7 100%);
      display: flex; align-items: center; justify-content: center;
      padding: 28px 20px 110px; position: relative; overflow: hidden;
    }
    .demo-bg::before {
      content: ''; position: absolute; inset: 0;
      background-image: radial-gradient(circle at 16% 24%, rgba(0,166,81,0.13) 0%, transparent 45%), radial-gradient(circle at 84% 12%, rgba(0,166,81,0.12) 0%, transparent 42%);
    }
    .demo-bg::after {
      content: ''; position: absolute; left: 50%; transform: translateX(-50%); bottom: -140px;
      width: min(860px, 130vw); height: 280px;
      background: radial-gradient(ellipse at center, rgba(0, 166, 81, 0.10) 0%, rgba(0, 166, 81, 0.04) 35%, transparent 70%);
      pointer-events: none;
    }
    .hero-panel {
      width: min(980px, 94vw);
      position: relative;
      z-index: 1;
      border-radius: 30px;
      border: 1px solid #d9f0e4;
      background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,255,251,0.98));
      box-shadow: 0 24px 70px rgba(0, 83, 43, 0.12), 0 2px 0 rgba(255,255,255,0.9) inset;
      padding: 34px 26px 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    .hero-tag {
      padding: 6px 12px;
      border-radius: 999px;
      background: #e9fff3;
      border: 1px solid #c9efdb;
      color: #0a7f46;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }
    .demo-logo { width: min(560px, 90vw); height: auto; display: block; position: relative; z-index: 1; filter: drop-shadow(0 8px 20px rgba(0,166,81,0.12)); }
    .demo-title { color: #0a3b23; font-size: clamp(24px, 4vw, 36px); text-align: center; font-weight: 800; letter-spacing: -0.6px; line-height: 1.2; max-width: 820px; }
    .demo-sub { color: #0b5f35; font-size: 15px; text-align: center; position: relative; z-index: 1; font-weight: 600; letter-spacing: 0.1px; }
    .demo-shield { width: 74px; height: 74px; border-radius: 20px; margin-bottom: 6px; position: relative; z-index: 1; animation: shieldFloat 3s ease-in-out infinite; background: linear-gradient(135deg, #e9fff3, #d4f8e4); display: flex; align-items: center; justify-content: center; border: 1px solid #b5ebcb; overflow: hidden; }
    .demo-shield img { width: 100%; height: 100%; object-fit: cover; }
    @keyframes shieldFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    .demo-cards { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 14px; position: relative; z-index: 1; }
    .demo-card { background: #ffffff; border: 1px solid #d8f2e3; border-radius: 999px; padding: 10px 16px; text-align: center; color: #0f5534; box-shadow: 0 8px 24px rgba(0, 166, 81, 0.08); display: inline-flex; align-items: center; gap: 8px; }
    .demo-card-icon { font-size: 18px; margin-bottom: 0; }
    .demo-card-label { font-size: 12px; opacity: 0.9; font-weight: 700; }
    .hero-stats { width: min(760px, 100%); margin-top: 8px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .hero-stat { background: #ffffff; border: 1px solid #d7efdf; border-radius: 14px; text-align: center; padding: 12px 10px; box-shadow: 0 8px 20px rgba(0, 120, 62, 0.07); }
    .hero-stat-value { font-size: 18px; font-weight: 800; color: #06783e; }
    .hero-stat-label { margin-top: 2px; font-size: 11px; color: #5f7f6f; font-weight: 600; }
    .demo-hint { color: #4b8f66; font-size: 13px; margin-top: 12px; text-align: center; animation: hb 1.5s infinite; position: relative; z-index: 1; font-weight: 600; }
    @keyframes hb { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }

    .chat-bubble {
      position: fixed; bottom: 95px; right: 24px;
      background: transparent; border: none;
      box-shadow: none; cursor: pointer; z-index: 999;
      display: flex; align-items: center; justify-content: center;
      animation: bIn 0.4s ease, bFloat 3s ease-in-out infinite;
      isolation: isolate;
      padding: 0;
    }
    .chat-bubble .demo-shield {
      width: 64px; height: 64px; margin: 0;
      position: relative;
      z-index: 2;
      box-shadow: 0 12px 28px rgba(0, 97, 49, 0.28);
    }
    .chat-bubble-note {
      position: absolute;
      top: -8px;
      right: 24px;
      background: #00a651;
      color: #fff;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 700;
      border: 2px solid #fff;
      box-shadow: 0 6px 14px rgba(0, 166, 81, 0.35);
      line-height: 1;
      white-space: nowrap;
      z-index: 3;
      pointer-events: none;
    }
    @keyframes bIn { from{opacity:0;transform:scale(0.8) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes bFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

    .chat-win {
      position: fixed; bottom: 95px; right: 24px;
      width: 390px; height: 600px;
      background: #fff; border-radius: 22px; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05);
      z-index: 1000; display: flex; flex-direction: column;
      animation: wIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes wIn { from{opacity:0;transform:translateY(20px) scale(0.94)} to{opacity:1;transform:translateY(0) scale(1)} }

    @media(max-width:480px) {
      .hero-panel { border-radius: 22px; padding: 24px 14px 20px; }
      .hero-stats { grid-template-columns: 1fr; }
      .chat-win { width: calc(100vw - 16px); height: calc(100vh - 100px); right: 8px; bottom: 82px; border-radius: 18px; }
      .chat-bubble { right: 12px; }
      .chat-bubble-note { font-size: 10px; padding: 5px 8px; right: 20px; }
    }

    .head { background: linear-gradient(135deg, #00a651, #007a3d); padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .hl { display: flex; align-items: center; gap: 11px; }
    .hav { width: 42px; height: 42px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; position: relative; border: 2px solid rgba(255,255,255,0.3); color: #d6ffe8; overflow: hidden; }
    .chatbot-icon { width: 100%; height: 100%; object-fit: cover; }
    .hav::after { content: ''; position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; background: #a8ffce; border-radius: 50%; border: 2px solid #007a3d; }
    .hname { font-weight: 800; font-size: 15px; color: #fff; }
    .hstat { font-size: 11px; color: rgba(255,255,255,0.8); margin-top: 1px; display: flex; align-items: center; gap: 4px; }
    .sp { width: 6px; height: 6px; background: #a8ffce; border-radius: 50%; animation: sp 2s infinite; }
    @keyframes sp { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .hbtn { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; padding: 5px 10px; cursor: pointer; font-size: 11px; font-weight: 600; font-family: inherit; transition: all 0.2s; }
    .hbtn:hover { background: rgba(255,255,255,0.25); }

    .msgs { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #f8fafb; }
    .msgs::-webkit-scrollbar { width: 3px; }
    .msgs::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
    .mr { display: flex; gap: 8px; animation: ms 0.25s ease; }
    .mr.user { flex-direction: row-reverse; }
    @keyframes ms { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .mav { width: 30px; height: 30px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 2px; }
    .mav.bot { background: #e8fff2; border: 1px solid #bce9cf; overflow: hidden; }
    .mav.usr { background: #e8f4ff; border: 1px solid #c0d8f0; }
    .mb2 { max-width: 76%; display: flex; flex-direction: column; gap: 3px; }
    .bub { padding: 10px 13px; font-size: 13.5px; line-height: 1.55; white-space: pre-wrap; }
    .bub.bot { background: #fff; color: #1a1a2e; border-radius: 4px 16px 16px 16px; border: 1px solid #e8edf2; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .bub.usr { background: linear-gradient(135deg,#00a651,#007a3d); color: #fff; border-radius: 16px 4px 16px 16px; }
    .mt { font-size: 10px; color: #aaa; padding: 0 3px; }
    .mr.user .mt { text-align: right; }
    .tb { background: #fff; border: 1px solid #e8edf2; border-radius: 4px 16px 16px 16px; padding: 12px 16px; display: flex; gap: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .td { width: 7px; height: 7px; background: #00a651; border-radius: 50%; animation: td 1.2s infinite; }
    @keyframes td { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-6px);opacity:1} }

    .qr { padding: 8px 16px 10px; display: flex; flex-wrap: wrap; gap: 6px; flex-shrink: 0; background: #f8fafb; border-top: 1px solid #f0f0f0; }
    .qb { background: #fff; border: 1.5px solid #00a651; border-radius: 20px; color: #00a651; padding: 5px 12px; font-size: 11.5px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .qb:hover { background: #00a651; color: #fff; transform: translateY(-1px); }

    .lfw { flex-shrink: 0; border-top: 2px solid #00a651; max-height: 340px; overflow-y: auto; background: linear-gradient(180deg,#f0fff6,#fff); }

    .ia { padding: 10px 14px 13px; border-top: 1px solid #eee; flex-shrink: 0; background: #fff; }
    .ir { display: flex; gap: 8px; align-items: center; }
    .inp { flex: 1; padding: 10px 14px; border: 1.5px solid #e0e0e0; border-radius: 12px; font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.2s; color: #1a1a2e; }
    .inp:focus { border-color: #00a651; }
    .inp::placeholder { color: #bbb; }
    .snd { width: 40px; height: 40px; background: linear-gradient(135deg,#00a651,#007a3d); border: none; border-radius: 12px; color: #fff; cursor: pointer; font-size: 17px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; box-shadow: 0 3px 10px rgba(0,166,81,0.35); }
    .snd:hover:not(:disabled) { transform: translateY(-1px); }
    .snd:disabled { opacity: 0.4; cursor: not-allowed; }
    .pw { text-align: center; font-size: 10px; color: #ccc; margin-top: 6px; }
  `;

  return (
    <>
      <style>{css}</style>

      {/* Demo page */}
      <div className="demo-bg">
        <div className="hero-panel">
          <div className="hero-tag">Trusted UAE Insurance Marketplace</div>
          <div className="demo-shield"><img src={chatbotIcon} alt="Chatbot" /></div>
          <img src={tameenLogo} alt="Tameen24 logo" className="demo-logo" />
          <div className="demo-title">Compare plans, get expert guidance, and secure your policy with confidence.</div>
          <div className="demo-sub">Your Trusted Insurance Partner in UAE</div>
          <div className="demo-cards">
            {[ ["🚗","Car"],["🏥","Medical"],["🏠","Property"],["⛵","Marine"],["🔥","Fire"],["👨‍👩‍👧‍👦","Life"]].map(([i,l]) => (
              <div key={l} className="demo-card">
                <div className="demo-card-icon">{i}</div>
                <div className="demo-card-label">{l}</div>
              </div>
            ))}
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">24/7</div>
              <div className="hero-stat-label">AI Assistant</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">1 hr</div>
              <div className="hero-stat-label">Agent Callback</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">All UAE</div>
              <div className="hero-stat-label">Coverage Support</div>
            </div>
          </div>
          <div className="demo-hint">Try our AI assistant. Click the green button below.</div>
        </div>
      </div>

      {/* Bubble */}
      {!isOpen && (
        <div className="chat-bubble" onClick={toggleChat} title={t.bubbleMsg} aria-label={t.bubbleMsg}>
          <div className="demo-shield"><img src={chatbotIcon} alt="Chatbot" /></div>
          <div className="chat-bubble-note">Hi! Need a quote?</div>
        </div>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="chat-win" style={{ direction: t.dir }}>
          <div className="head">
            <div className="hl">
              <div className="hav"><img src={chatbotIcon} alt="Chatbot" className="chatbot-icon" /></div>
              <div>
                <div className="hname">Tameen24 AI</div>
                <div className="hstat">
                  <div className="sp" />
                  {isTyping ? t.typing : t.onlineStatus}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button className="hbtn" onClick={switchLang}>{t.langBtn}</button>
              <button className="hbtn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          <div className="msgs">
            {messages.map((msg, i) => (
              <div key={i} className={`mr ${msg.role === "user" ? "user" : ""}`}>
                <div className={`mav ${msg.role === "user" ? "usr" : "bot"}`}>
                  {msg.role === "user" ? "👤" : <img src={chatbotIcon} alt="Bot" className="chatbot-icon" />}
                </div>
                <div className="mb2">
                  <div className={`bub ${msg.role === "user" ? "usr" : "bot"}`}>{msg.content}</div>
                  <div className="mt">{msg.time}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="mr">
                <div className="mav bot"><img src={chatbotIcon} alt="Bot" className="chatbot-icon" /></div>
                <div className="tb">
                  {[0,1,2].map(i => <div key={i} className="td" style={{ animationDelay: `${i*0.2}s` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="qr">
            {t.quickReplies.map((q, i) => (
              <button key={i} className="qb" onClick={() => sendMessage(q.text)}>{q.label}</button>
            ))}
          </div>

          {showLeadForm && (
            <div className="lfw">
              <LeadForm lang={lang} onClose={() => setShowLeadForm(false)} />
            </div>
          )}

          {!showLeadForm && (
            <div className="ia">
              <div className="ir">
                <input ref={inputRef} className="inp" value={input}
                  onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                  placeholder={t.placeholder} disabled={loading} dir={t.dir} />
                <button className="snd" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                  {loading ? "⏳" : "↑"}
                </button>
              </div>
              <div className="pw">{t.poweredBy}</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}