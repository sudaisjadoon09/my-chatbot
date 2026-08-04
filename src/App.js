import { useState, useRef, useEffect } from "react";
import chatbotIcon from "./assets/chatbot-icon.svg";

const DEFAULT_RAILWAY_BASE_URL = "https://my-chatbot-production-7d09.up.railway.app";
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || DEFAULT_RAILWAY_BASE_URL).replace(/\/$/, "");

const API_URL = `${API_BASE_URL}/api/chat`;
const LEADS_URL = `${API_BASE_URL}/api/lead`;
const LEAD_SUBMIT_TIMEOUT_MS = 8000;

const T = {
  en: {
    dir: "ltr",
    bubbleMsg: "🏡 Find your dream home in US!",
    onlineStatus: "Agent Online · Premium Support",
    typing: "AI Agent is thinking...",
    placeholder: "Ask about properties, areas, or mortgages...",
    poweredBy: "Premium AI Real Estate Agent · Enterprise Edition",
    quickReplies: [
      { label: "🏠 Buy a Home", text: "I'm looking to buy a property." },
      { label: "💰 Home Valuation", text: "How much is my home worth?" },
      { label: "📈 Market Trends", text: "Tell me about current real estate trends." },
      { label: "📅 Book a Tour", text: "I want to schedule a property viewing." },
      { label: "🏦 Mortgage Help", text: "I need information about mortgage rates." },
    ],
    leadTitle: "Premium Property Access",
    leadSubtitle: "Enter details to get exclusive off-market listings",
    nameLabel: "Full Name", phoneLabel: "Phone Number",
    emailLabel: "Email Address", insuranceLabel: "Property Type",
    submitBtn: "Get Exclusive Access →",
    thankYou: "✅ Success! A Senior Agent will contact you shortly with personalized listings.",
    submitSuccessShort: "Profile submitted to our VIP database.",
    namePh: "John Doe", phonePh: "+1 (XXX) XXX-XXXX", emailPh: "john@example.com",
    insuranceTypes: ["Single Family Home","Luxury Villa","Condo/Apartment","Townhouse","Commercial","Investment Property","Land"],
    welcome: "Welcome to our Premium Real Estate Concierge! 🏡\n\nI am your AI Property Specialist. Whether you are looking to buy your dream home, sell at the best price, or invest in the US market, I'm here to assist you 24/7.\n\nWhat are you looking for today?",
    langBtn: "عربي",
  },
  ar: {
    dir: "rtl",
    bubbleMsg: "🏡 ابحث عن منزل أحلامك في أمريكا!",
    onlineStatus: "الوكيل متصل · دعم متميز",
    typing: "الوكيل الذكي يفكر...",
    placeholder: "اسأل عن العقارات، المناطق، أو الرهن العقاري...",
    poweredBy: "وكيل عقارات ذكي متميز · نسخة المؤسسات",
    quickReplies: [
      { label: "🏠 شراء منزل", text: "أبحث عن شراء عقار." },
      { label: "💰 تقييم العقار", text: "كم تبلغ قيمة منزلي؟" },
      { label: "📈 اتجاهات السوق", text: "أخبرني عن اتجاهات السوق العقاري حالياً." },
      { label: "📅 حجز جولة", text: "أريد جدولة موعد لمعاينة عقار." },
      { label: "🏦 الرهن العقاري", text: "أحتاج معلومات عن أسعار الرهن العقاري." },
    ],
    leadTitle: "وصول حصري للعقارات",
    leadSubtitle: "أدخل بياناتك للحصول على قوائم عقارات حصرية خارج السوق",
    nameLabel: "الاسم الكامل", phoneLabel: "رقم الهاتف",
    emailLabel: "البريد الإلكتروني", insuranceLabel: "نوع العقار",
    submitBtn: "احصل على وصول حصري ←",
    thankYou: "✅ تم بنجاح! سيتصل بك وكيل عقارات خبير قريباً مع قوائم مخصصة.",
    submitSuccessShort: "تم إرسال ملفك إلى قاعدة بيانات كبار الشخصيات.",
    namePh: "فلان الفلاني", phonePh: "+1 (XXX) XXX-XXXX", emailPh: "email@example.com",
    insuranceTypes: ["منزل عائلي","فيلا فاخرة","شقة/كوندو","تاون هاوس","تجاري","عقار استثماري","أرض"],
    welcome: "مرحباً بك في خدماتنا العقارية المتميزة! 🏡\n\nأنا مساعدك العقاري الذكي. سواء كنت تبحث عن منزل أحلامك، أو ترغب في البيع بأفضل سعر، أو الاستثمار في السوق الأمريكي، أنا هنا لمساعدتك على مدار الساعة.\n\nما الذي تبحث عنه اليوم؟",
    langBtn: "English",
  },
};

const SYSTEM = {
  en: `You are a premium AI real estate assistant for LuxeEstate.
Your job is to answer property questions, recommend homes from the provided listings, and qualify interested leads.

Rules:
1. Keep responses concise, professional, and high-end.
2. When the user asks about budget, location, or listings, recommend 1 or 2 suitable properties.
3. If the user shows interest in a property, ask for contact details.
4. Never invent property details that are not in the provided listings.`,
  ar: `أنت مساعد عقاري ذكي ومتميز لشركة LuxeEstate.
مهمتك هي الإجابة عن أسئلة العقارات، واقتراح منازل من القوائم المتاحة، وتأهيل العملاء المهتمين.

القواعد:
1. اجعل الردود مختصرة واحترافية وفاخرة.
2. عندما يسأل المستخدم عن الميزانية أو الموقع أو القوائم، اقترح عقاراً أو عقارين مناسبين.
3. إذا أظهر المستخدم اهتماماً بعقار معين، اطلب بيانات التواصل.
4. لا تخترع تفاصيل عقارية غير موجودة في القوائم المتاحة.`,
};

// --- Dummy Property Data for Frontend Rendering ---
const LUXURY_PROPERTIES = [
  {
    id: 'prop_1',
    title: 'The Glass Pavilion',
    price: '$12,500,000',
    location: 'Beverly Hills, CA',
    beds: 6, baths: 8, sqft: '14,000',
    tags: ['Pool', 'View', 'Modern'],
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'prop_2',
    title: 'Azure Penthouse',
    price: '$8,200,000',
    location: 'Miami Beach, FL',
    beds: 4, baths: 5, sqft: '5,500',
    tags: ['Oceanfront', 'Smart Home'],
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'prop_3',
    title: 'Skyline Mansion',
    price: '$25,000,000',
    location: 'Manhattan, NY',
    beds: 5, baths: 6, sqft: '8,200',
    tags: ['Penthouse', 'Central Park View'],
    image: 'https://images.unsplash.com/photo-1600607687940-c52af096999c?auto=format&fit=crop&w=800&q=80'
  }
];

function PropertyCard({ property }) {
  return (
    <div className="prop-card">
      <img src={property.image} alt={property.title} className="prop-img" />
      <div className="prop-info">
        <div className="prop-price">{property.price}</div>
        <div className="prop-title">{property.title}</div>
        <div className="prop-loc">{property.location}</div>
        <div style={{ marginBottom: '8px' }}>
          {property.tags.map(t => <span key={t} className="prop-tag">{t}</span>)}
        </div>
        <div className="prop-stats">
          <span>🛏️ {property.beds} Beds</span>
          <span>🚿 {property.baths} Baths</span>
          <span>📏 {property.sqft} sqft</span>
        </div>
      </div>
    </div>
  );
}

function LeadForm({ lang, onClose }) {
  const t = T[lang];
  const [form, setForm] = useState({ name: "", phone: "", email: "", insurance: t.insuranceTypes[0] });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  async function handleSubmit() {
    if (!form.name || !form.phone) return;
    setSaving(true);
    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, LEAD_SUBMIT_TIMEOUT_MS);

    try {
      const res = await fetch(LEADS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ ...form, lang, timestamp: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(`Lead submit failed: ${res.status}`);
    } catch (e) {
      // If request timed out, assume backend may still have saved the lead and continue to success UI.
      if (!timedOut) {
        console.error(e);
      }
    } finally {
      clearTimeout(timeoutId);
    }

    setSaving(false);
    setSubmitted(true);
    closeTimerRef.current = setTimeout(onClose, 4000);
  }

  if (submitted) return (
    <div style={{ padding: "24px", textAlign: "center" }}>
      <div
        style={{
          width: "64px",
          height: "64px",
          margin: "0 auto 10px",
          borderRadius: "50%",
          border: "2px solid #00a651",
          color: "#00a651",
          fontWeight: "800",
          fontSize: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3fff8",
        }}
      >
        ✓
      </div>
      <div style={{ color: "#00a651", fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>{t.submitSuccessShort}</div>
      <div style={{ color: "#5a6d60", fontWeight: "600", fontSize: "12px" }}>{t.thankYou}</div>
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
        {saving ? (lang === "en" ? "Submitting..." : "جارٍ الإرسال...") : t.submitBtn}
      </button>
    </div>
  );
}

export default function LuxeEstateChat() {
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
      background: #0a0f0d; /* Deep Dark Theme for Luxury */
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      padding: 0; position: relative; overflow: hidden;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .hero-section {
      width: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top right, rgba(197, 160, 89, 0.15), transparent),
                  radial-gradient(circle at bottom left, rgba(0, 77, 64, 0.2), transparent);
      padding: 60px 20px;
      text-align: center;
    }
    .luxury-tag {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #c5a059; /* Gold Accent */
      margin-bottom: 20px;
      font-weight: 700;
    }
    .main-title {
      font-size: clamp(40px, 8vw, 72px);
      font-weight: 800;
      line-height: 1;
      margin-bottom: 24px;
      background: linear-gradient(to right, #fff, #c5a059);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sub-title {
      font-size: 18px;
      color: #a0a0a0;
      max-width: 700px;
      line-height: 1.6;
      margin-bottom: 40px;
    }
    .cta-container {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .btn-premium {
      padding: 16px 32px;
      border-radius: 4px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 14px;
    }
    .btn-gold {
      background: #c5a059;
      color: #0a0f0d;
      border: none;
    }
    .btn-gold:hover { background: #d4b477; transform: translateY(-2px); }
    .btn-outline {
      background: transparent;
      color: #fff;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .btn-outline:hover { border-color: #c5a059; color: #c5a059; }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      width: 100%;
      max-width: 1100px;
      margin-top: 80px;
    }
    .feature-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      padding: 30px;
      border-radius: 8px;
      text-align: left;
      transition: all 0.3s;
    }
    .feature-card:hover { background: rgba(255,255,255,0.06); border-color: #c5a059; }
    .feature-icon { color: #c5a059; font-size: 24px; margin-bottom: 15px; }
    .feature-h { font-size: 18px; font-weight: 700; margin-bottom: 10px; color: #fff; }
    .feature-p { font-size: 14px; color: #888; line-height: 1.5; }
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

    .head { background: linear-gradient(135deg, #004d40, #002d26); padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .hl { display: flex; align-items: center; gap: 11px; }
    .hav { width: 42px; height: 42px; background: rgba(255,255,255,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; position: relative; border: 1px solid rgba(255,255,255,0.2); color: #fff; overflow: hidden; }
    .chatbot-icon { width: 100%; height: 100%; object-fit: cover; }
    .hav::after { content: ''; position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; background: #c5a059; border-radius: 50%; border: 2px solid #002d26; }
    .hname { font-weight: 800; font-size: 15px; color: #fff; }
    .hstat { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 1px; display: flex; align-items: center; gap: 4px; }
    .sp { width: 6px; height: 6px; background: #c5a059; border-radius: 50%; animation: sp 2s infinite; }
    @keyframes sp { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .hbtn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; padding: 5px 10px; cursor: pointer; font-size: 11px; font-weight: 600; font-family: inherit; transition: all 0.2s; }
    .hbtn:hover { background: rgba(255,255,255,0.2); }

    .msgs { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #fdfdfd; }
    .msgs::-webkit-scrollbar { width: 3px; }
    .msgs::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
    .mr { display: flex; gap: 8px; animation: ms 0.25s ease; }
    .mr.user { flex-direction: row-reverse; }
    @keyframes ms { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .mav { width: 30px; height: 30px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 2px; }
    .mav.bot { background: #f0f7f5; border: 1px solid #d1e2dd; overflow: hidden; }
    .mav.usr { background: #f5f5f5; border: 1px solid #e0e0e0; }
    .mb2 { max-width: 76%; display: flex; flex-direction: column; gap: 3px; }
    .bub { padding: 10px 13px; font-size: 13.5px; line-height: 1.55; white-space: pre-wrap; }
    .bub.bot { background: #fff; color: #1a1a2e; border-radius: 4px 16px 16px 16px; border: 1px solid #e8edf2; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
    
    .prop-card {
      margin-top: 10px;
      border: 1px solid #eee;
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      max-width: 300px;
    }
    .prop-img { width: 100%; height: 160px; object-fit: cover; }
    .prop-info { padding: 12px; }
    .prop-price { color: #c5a059; font-weight: 800; font-size: 18px; margin-bottom: 4px; }
    .prop-title { font-weight: 700; font-size: 14px; margin-bottom: 2px; }
    .prop-loc { font-size: 12px; color: #888; margin-bottom: 8px; }
    .prop-stats { display: flex; gap: 10px; font-size: 11px; color: #555; font-weight: 600; border-top: 1px solid #f5f5f5; padding-top: 8px; }
    .prop-tag { background: #f0f7f5; color: #004d40; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 4px; }
    .mt { font-size: 10px; color: #aaa; padding: 0 3px; }
    .mr.user .mt { text-align: right; }
    .tb { background: #fff; border: 1px solid #e8edf2; border-radius: 4px 16px 16px 16px; padding: 12px 16px; display: flex; gap: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .td { width: 7px; height: 7px; background: #004d40; border-radius: 50%; animation: td 1.2s infinite; }
    @keyframes td { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-6px);opacity:1} }

    .qr { padding: 8px 16px 10px; display: flex; flex-wrap: wrap; gap: 6px; flex-shrink: 0; background: #fdfdfd; border-top: 1px solid #f0f0f0; }
    .qb { background: #fff; border: 1.5px solid #004d40; border-radius: 20px; color: #004d40; padding: 5px 12px; font-size: 11.5px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .qb:hover { background: #004d40; color: #fff; transform: translateY(-1px); }

    .lfw { flex-shrink: 0; border-top: 2px solid #004d40; max-height: 340px; overflow-y: auto; background: linear-gradient(180deg,#f8faf9,#fff); }

    .ia { padding: 10px 14px 13px; border-top: 1px solid #eee; flex-shrink: 0; background: #fff; }
    .ir { display: flex; gap: 8px; align-items: center; }
    .inp { flex: 1; padding: 10px 14px; border: 1.5px solid #e0e0e0; border-radius: 12px; font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.2s; color: #1a1a2e; }
    .inp:focus { border-color: #004d40; }
    .inp::placeholder { color: #bbb; }
    .snd { width: 40px; height: 40px; background: linear-gradient(135deg,#004d40,#002d26); border: none; border-radius: 12px; color: #fff; cursor: pointer; font-size: 17px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; box-shadow: 0 3px 10px rgba(0,77,64,0.3); }
    .snd:hover:not(:disabled) { transform: translateY(-1px); }
    .snd:disabled { opacity: 0.4; cursor: not-allowed; }
    .pw { text-align: center; font-size: 10px; color: #ccc; margin-top: 6px; }
  `;

  return (
    <>
      <style>{css}</style>

      {/* Premium Landing Page */}
      <div className="demo-bg">
        <div className="hero-section">
          <div className="luxury-tag">LuxeEstate AI — Sovereign Edition</div>
          <h1 className="main-title">The Future of Luxury Real Estate Automation</h1>
          <p className="sub-title">
            Empower your agency with autonomous AI Sales Representatives. 
            Qualified leads, intelligent property analysis, and seamless VIP bookings — all in one sovereign suite.
          </p>
          
          <div className="cta-container">
            <button className="btn-premium btn-gold" onClick={() => setIsOpen(true)}>Initialize AI Concierge</button>
            <button className="btn-premium btn-outline">Watch Enterprise Demo</button>
          </div>

          <div className="feature-grid">
            {[
              { icon: "⚡", h: "Lead Acceleration", p: "Convert website traffic into hot, qualified leads in under 60 seconds with behavioral analysis." },
              { icon: "💎", h: "VIP Experience", p: "Provide high-net-worth clients with 24/7 personalized property guidance in multiple languages." },
              { icon: "📉", h: "Predictive CRM", p: "AI-driven lead scoring that prioritizes high-value prospects for your senior agents." },
              { icon: "📅", h: "Autonomous Booking", p: "Directly schedule property tours and consultations without human intervention." }
            ].map(f => (
              <div key={f.h} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-h">{f.h}</div>
                <div className="feature-p">{f.p}</div>
              </div>
            ))}
          </div>
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
                <div className="hname">LuxeEstate Concierge</div>
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
                  <div className={`bub ${msg.role === "user" ? "usr" : "bot"}`}>
                    {msg.content}
                    {!msg.role !== 'user' && LUXURY_PROPERTIES.map(p => {
                      if (msg.content.includes(p.title)) {
                        return <PropertyCard key={p.id} property={p} />;
                      }
                      return null;
                    })}
                  </div>
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