import { useState, useEffect } from "react";

const LEADS_URL = window.location.hostname === "localhost"
  ? "http://localhost:3001/api/leads"
  : "https://my-chatbot-production-7d09.up.railway.app/api/leads";

const ADMIN_LOGIN_URL = window.location.hostname === "localhost"
  ? "http://localhost:3001/api/admin/login"
  : "https://my-chatbot-production-7d09.up.railway.app/api/admin/login";

const ADMIN_VERIFY_URL = window.location.hostname === "localhost"
  ? "http://localhost:3001/api/admin/verify"
  : "https://my-chatbot-production-7d09.up.railway.app/api/admin/verify";

const ADMIN_TOKEN_KEY = "tameen24_admin_token";

function getStoredAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    verifyAdminSession();
  }, []);

  async function verifyAdminSession() {
    const token = getStoredAdminToken();
    if (!token) {
      setAuthLoading(false);
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(ADMIN_VERIFY_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setIsAuthorized(false);
        setLoginError("Session expired. Please login again.");
      } else {
        setIsAuthorized(true);
        await fetchLeads(token);
      }
    } catch {
      setLoginError("Server connection error.");
      setIsAuthorized(false);
    } finally {
      setAuthLoading(false);
      setLoading(false);
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    setLoginError("");
    if (!adminKeyInput.trim()) {
      setLoginError("Enter admin key.");
      return;
    }

    setLoginBusy(true);
    try {
      const res = await fetch(ADMIN_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey: adminKeyInput.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data?.token) {
        setLoginError(data?.error || "Login failed.");
        return;
      }

      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      setIsAuthorized(true);
      setAdminKeyInput("");
      setLoading(true);
      await fetchLeads(data.token);
      setLoading(false);
    } catch {
      setLoginError("Connection error. Please try again.");
    } finally {
      setLoginBusy(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setIsAuthorized(false);
    setLeads([]);
    setError("");
  }

  async function fetchLeads(passedToken) {
    try {
      const token = passedToken || getStoredAdminToken();
      if (!token) {
        setError("Unauthorized");
        return;
      }

      const res = await fetch(LEADS_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.status === 401) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setIsAuthorized(false);
        setError("");
        setLoginError("Unauthorized. Please login again.");
        return;
      }

      if (data.leads) {
        setLeads(data.leads);
        setError("");
      } else {
        setError("Failed to load leads");
      }
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  }

  const insuranceTypes = ["All", ...new Set(leads.map(l => l.insurance).filter(Boolean))];

  function toDate(value) {
    const d = value ? new Date(value) : null;
    return d && !Number.isNaN(d.getTime()) ? d : null;
  }

  function isWithinDayRange(date, dayCount) {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (dayCount - 1));
    return date >= start && date <= now;
  }

  function isThisMonth(date) {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  function matchesDateFilter(leadDate) {
    if (!leadDate) return dateFilter === "all";
    if (dateFilter === "today") return isWithinDayRange(leadDate, 1);
    if (dateFilter === "7days") return isWithinDayRange(leadDate, 7);
    if (dateFilter === "30days") return isWithinDayRange(leadDate, 30);
    if (dateFilter === "month") return isThisMonth(leadDate);
    return true;
  }

  const filtered = leads.filter(l => {
    const leadDate = toDate(l.timestamp);
    const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search) || l.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || l.insurance === filter;
    const matchDate = matchesDateFilter(leadDate);
    return matchSearch && matchFilter && matchDate;
  }).sort((a, b) => {
    const aTime = toDate(a.timestamp)?.getTime() || 0;
    const bTime = toDate(b.timestamp)?.getTime() || 0;
    return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
  });

  const insuranceChart = Object.entries(
    filtered.reduce((acc, lead) => {
      const key = lead.insurance || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const dailyChart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString([], { weekday: "short" });
    const count = filtered.filter(lead => {
      const leadDate = toDate(lead.timestamp);
      return leadDate && leadDate.toDateString() === d.toDateString();
    }).length;
    return { label, count };
  });

  const maxInsurance = Math.max(1, ...insuranceChart.map(([, count]) => count));
  const maxDaily = Math.max(1, ...dailyChart.map(day => day.count));

  function normalizeExportValue(value) {
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const headers = ["Name", "Phone", "Email", "Insurance", "Language", "Time"];
    const escapeCsv = (value) => `"${normalizeExportValue(value).replace(/"/g, '""')}"`;

    const rows = filtered.map(lead => [
      lead.name,
      lead.phone,
      lead.email,
      lead.insurance,
      lead.lang === "ar" ? "AR" : "EN",
      lead.timestamp ? new Date(lead.timestamp).toLocaleString() : "-",
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map(row => row.map(escapeCsv).join(",")),
    ].join("\n");

    downloadFile("tameen24-leads.csv", csvContent, "text/csv;charset=utf-8;");
  }

  function exportExcel() {
    const headers = ["Name", "Phone", "Email", "Insurance", "Language", "Time"];

    const rows = filtered.map(lead => [
      normalizeExportValue(lead.name),
      normalizeExportValue(lead.phone),
      normalizeExportValue(lead.email),
      normalizeExportValue(lead.insurance),
      lead.lang === "ar" ? "AR" : "EN",
      lead.timestamp ? new Date(lead.timestamp).toLocaleString() : "-",
    ]);

    const tableRows = rows
      .map(cols => `<tr>${cols.map(col => `<td>${col}</td>`).join("")}</tr>`)
      .join("");

    const html = `\uFEFF
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8" /></head>
        <body>
          <table border="1">
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>`;

    downloadFile("tameen24-leads.xls", html, "application/vnd.ms-excel;charset=utf-8;");
  }

  function buildWhatsAppLink(phone) {
    const rawPhone = (phone || "").toString().trim();
    if (!rawPhone) return null;

    let digits = rawPhone.replace(/\D/g, "");
    if (digits.startsWith("00")) digits = digits.slice(2);

    // Convert UAE local mobile format (05xxxxxxxx) to international (9715xxxxxxxx).
    if (digits.startsWith("0") && digits.length === 10) {
      digits = `971${digits.slice(1)}`;
    }

    if (digits.length < 8) return null;
    return `https://wa.me/${digits}`;
  }

  function buildEmailLink(lead) {
    const email = (lead?.email || "").toString().trim();
    if (!email) return null;

    const leadName = lead?.name || "Customer";
    const insuranceType = lead?.insurance || "Insurance";
    const subject = encodeURIComponent(`Tameen24 Quote Follow-up - ${insuranceType}`);
    const body = encodeURIComponent(
      `Hi ${leadName},\n\nThank you for your interest in ${insuranceType}. Our team at Tameen24 is ready to assist you with your quote.\n\nBest regards,\nTameen24 Team`
    );

    return `mailto:${email}?subject=${subject}&body=${body}`;
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f0f4f0; min-height: 100vh; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 30px 20px; }
    .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .logo { font-size: 24px; font-weight: 800; color: #1a1a2e; }
    .logo span { color: #00a651; }
    .auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .auth-card { width: min(420px, 100%); background: #fff; border: 1px solid #e8f0e8; border-radius: 16px; padding: 24px; box-shadow: 0 14px 34px rgba(0,0,0,0.08); }
    .auth-title { font-size: 22px; font-weight: 800; color: #1a1a2e; margin-bottom: 6px; }
    .auth-sub { font-size: 13px; color: #667; margin-bottom: 16px; }
    .auth-input { width: 100%; padding: 11px 13px; border: 1.5px solid #d6dfd6; border-radius: 10px; font-size: 14px; font-family: inherit; margin-bottom: 10px; outline: none; }
    .auth-input:focus { border-color: #00a651; }
    .auth-btn { width: 100%; padding: 11px 13px; border: none; border-radius: 10px; background: linear-gradient(135deg, #00a651, #007a3d); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .auth-err { font-size: 12px; color: #c62828; margin-bottom: 10px; }
    .logout-btn { padding: 10px 14px; border: 1.5px solid #d4d4d4; border-radius: 10px; background: #fff; color: #333; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .badge { background: #00a651; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .stat { background: #fff; border-radius: 14px; padding: 18px 20px; border: 1px solid #e8f0e8; }
    .stat-val { font-size: 28px; font-weight: 800; color: #00a651; }
    .stat-lab { font-size: 12px; color: #888; margin-top: 3px; font-weight: 600; }
    .controls { display: flex; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
    .search { flex: 1; min-width: 200px; padding: 10px 14px; border: 1.5px solid #ddd; border-radius: 10px; font-size: 13px; font-family: inherit; outline: none; }
    .search:focus { border-color: #00a651; }
    .filt { padding: 10px 14px; border: 1.5px solid #ddd; border-radius: 10px; font-size: 13px; font-family: inherit; outline: none; background: #fff; cursor: pointer; }
    .ref { padding: 10px 16px; background: #00a651; color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .exp { padding: 10px 14px; background: #fff; color: #00a651; border: 1.5px solid #00a651; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .exp:hover { background: #eafff2; }
    .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
    .chart-card { background: #fff; border-radius: 16px; border: 1px solid #e8f0e8; padding: 16px; }
    .chart-title { font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 12px; }
    .bar-row { display: grid; grid-template-columns: 110px 1fr 34px; align-items: center; gap: 10px; margin-bottom: 8px; }
    .bar-label { font-size: 12px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bar-track { height: 9px; border-radius: 999px; background: #eef6ee; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #00a651, #3ac47a); }
    .bar-value { font-size: 12px; font-weight: 700; color: #00a651; text-align: right; }
    .day-bars { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; align-items: end; min-height: 130px; }
    .day-col { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 8px; }
    .day-bar { width: 100%; max-width: 34px; border-radius: 10px 10px 6px 6px; background: linear-gradient(180deg, #00a651, #007b3d); min-height: 8px; }
    .day-count { font-size: 11px; color: #00a651; font-weight: 700; }
    .day-label { font-size: 11px; color: #777; }
    .empty-chart { font-size: 12px; color: #999; padding: 8px 0; }
    .table-wrap { background: #fff; border-radius: 16px; border: 1px solid #e8f0e8; overflow: hidden; }
    .tbl { width: 100%; border-collapse: collapse; }
    .tbl th { background: #f8fdf8; padding: 12px 16px; text-align: left; font-size: 12px; color: #666; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #eee; }
    .tbl td { padding: 13px 16px; font-size: 13px; color: #1a1a2e; border-bottom: 1px solid #f5f5f5; }
    .tbl tr:last-child td { border-bottom: none; }
    .tbl tr:hover td { background: #f8fdf8; }
    .lang-badge { padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .lang-en { background: #e8f4ff; color: #0066cc; }
    .lang-ar { background: #fff3e8; color: #cc6600; }
    .ins-badge { padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #f0fff6; color: #00a651; border: 1px solid #c0e8c0; }
    .wa-link { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 10px; background: #e8fff2; color: #00a651; text-decoration: none; border: 1px solid #bde8cf; font-size: 17px; transition: all 0.2s; }
    .wa-link:hover { background: #00a651; color: #fff; transform: translateY(-1px); }
    .email-link { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 10px; background: #eef4ff; color: #2f6de0; text-decoration: none; border: 1px solid #cfe0ff; font-size: 16px; transition: all 0.2s; }
    .email-link:hover { background: #2f6de0; color: #fff; transform: translateY(-1px); }
    .wa-disabled { color: #bbb; font-size: 12px; }
    .empty { text-align: center; padding: 40px; color: #aaa; font-size: 14px; }
    .loading { text-align: center; padding: 40px; color: #00a651; font-size: 14px; }
    @media(max-width:900px) { .charts { grid-template-columns: 1fr; } }
    @media(max-width:600px) { .tbl th:nth-child(6), .tbl td:nth-child(6) { display: none; } }
  `;

  const todayLeads = leads.filter(l => {
    const d = new Date(l.timestamp);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const arLeads = leads.filter(l => l.lang === "ar").length;

  if (authLoading) {
    return (
      <>
        <style>{css}</style>
        <div className="auth-wrap">
          <div className="auth-card">
            <div className="auth-title">Admin Access</div>
            <div className="auth-sub">Checking your session...</div>
          </div>
        </div>
      </>
    );
  }

  if (!isAuthorized) {
    return (
      <>
        <style>{css}</style>
        <div className="auth-wrap">
          <form className="auth-card" onSubmit={handleAdminLogin}>
            <div className="auth-title">Tameen24 Admin</div>
            <div className="auth-sub">Only authorized admins can access leads dashboard.</div>
            {loginError ? <div className="auth-err">{loginError}</div> : null}
            <input
              type="password"
              className="auth-input"
              placeholder="Enter admin key"
              value={adminKeyInput}
              onChange={(e) => setAdminKeyInput(e.target.value)}
              autoComplete="current-password"
            />
            <button className="auth-btn" type="submit" disabled={loginBusy}>
              {loginBusy ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="wrap">
        <div className="top">
          <div className="logo">Tameen<span>24</span> — Leads Dashboard</div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div className="badge">Admin Panel</div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="stat-val">{leads.length}</div>
            <div className="stat-lab">Total Leads</div>
          </div>
          <div className="stat">
            <div className="stat-val">{todayLeads}</div>
            <div className="stat-lab">Today's Leads</div>
          </div>
          <div className="stat">
            <div className="stat-val">{arLeads}</div>
            <div className="stat-lab">Arabic Leads</div>
          </div>
          <div className="stat">
            <div className="stat-val">{leads.length - arLeads}</div>
            <div className="stat-lab">English Leads</div>
          </div>
        </div>

        <div className="controls">
          <input className="search" placeholder="🔍 Search by name, phone, email..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filt" value={filter} onChange={e => setFilter(e.target.value)}>
            {insuranceTypes.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="filt" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="month">This Month</option>
          </select>
          <select className="filt" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <button className="exp" onClick={exportCsv}>Export CSV</button>
          <button className="exp" onClick={exportExcel}>Export Excel</button>
          <button className="ref" onClick={() => fetchLeads()}>🔄 Refresh</button>
        </div>

        <div className="charts">
          <div className="chart-card">
            <div className="chart-title">Leads By Insurance</div>
            {insuranceChart.length === 0 ? (
              <div className="empty-chart">No data for selected filters.</div>
            ) : (
              insuranceChart.map(([name, count]) => (
                <div className="bar-row" key={name}>
                  <div className="bar-label" title={name}>{name}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.max(5, (count / maxInsurance) * 100)}%` }} />
                  </div>
                  <div className="bar-value">{count}</div>
                </div>
              ))
            )}
          </div>

          <div className="chart-card">
            <div className="chart-title">Last 7 Days Leads</div>
            <div className="day-bars">
              {dailyChart.map(day => (
                <div className="day-col" key={day.label}>
                  <div className="day-count">{day.count}</div>
                  <div
                    className="day-bar"
                    style={{ height: `${Math.max(8, (day.count / maxDaily) * 100)}px` }}
                    title={`${day.label}: ${day.count}`}
                  />
                  <div className="day-label">{day.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading">Loading leads...</div>
          ) : error ? (
            <div className="empty">❌ {error}</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No leads found yet. They'll appear here when customers submit the form.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>WhatsApp</th>
                  <th>Email Action</th>
                  <th>Email</th>
                  <th>Insurance</th>
                  <th>Lang</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => {
                  const waLink = buildWhatsAppLink(lead.phone);
                  const emailLink = buildEmailLink(lead);

                  return (
                    <tr key={lead.id}>
                      <td style={{ color: "#aaa", fontSize: "12px" }}>{i + 1}</td>
                      <td style={{ fontWeight: "700" }}>{lead.name}</td>
                      <td style={{ color: "#00a651", fontWeight: "600" }}>{lead.phone}</td>
                      <td>
                        {waLink ? (
                          <a
                            className="wa-link"
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            title="Open WhatsApp chat"
                            aria-label={`Open WhatsApp chat with ${lead.name || "lead"}`}
                          >
                            💬
                          </a>
                        ) : (
                          <span className="wa-disabled">N/A</span>
                        )}
                      </td>
                      <td>
                        {emailLink ? (
                          <a
                            className="email-link"
                            href={emailLink}
                            title="Send email"
                            aria-label={`Send email to ${lead.name || "lead"}`}
                          >
                            ✉
                          </a>
                        ) : (
                          <span className="wa-disabled">N/A</span>
                        )}
                      </td>
                      <td style={{ color: "#666" }}>{lead.email || "—"}</td>
                      <td><span className="ins-badge">{lead.insurance}</span></td>
                      <td><span className={`lang-badge ${lead.lang === "ar" ? "lang-ar" : "lang-en"}`}>{lead.lang === "ar" ? "AR" : "EN"}</span></td>
                      <td style={{ color: "#aaa", fontSize: "12px" }}>{lead.timestamp ? new Date(lead.timestamp).toLocaleString() : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}