"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, LoaderCircle, LogOut, Send } from "lucide-react";
import ServiceRequestsAdmin from "@/components/service-requests-admin";

type Ticket = { id: string; first_name: string; last_name: string; age: number; telegram_username: string; subject: string; status: string; last_message_at: string };
type Message = { id: string; sender_role: "customer" | "admin"; body: string; created_at: string };

export default function SupportAdmin() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState<"tickets" | "orders">("tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadTickets = useCallback(async () => {
    const response = await fetch("/api/support/admin/tickets", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "دریافت تیکت‌ها ناموفق بود.");
    setTickets(data.tickets || []);
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const response = await fetch(`/api/support/admin/tickets/${id}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "دریافت گفتگو ناموفق بود.");
    setSelected(data.ticket);
    setMessages(data.messages || []);
  }, []);

  useEffect(() => {
    fetch("/api/support/admin/tickets", { cache: "no-store" }).then(response => { if (response.ok) setLoggedIn(true); }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!loggedIn || view !== "tickets") return;
    const refresh = async () => { try { await loadTickets(); } catch (e) { setError(e instanceof Error ? e.message : "دریافت تیکت‌ها ناموفق بود."); } };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 5000);
    return () => window.clearInterval(timer);
  }, [loggedIn, view, loadTickets]);

  useEffect(() => {
    if (!loggedIn || view !== "tickets" || !selected?.id) return;
    const timer = window.setInterval(() => loadDetail(selected.id).catch(() => undefined), 5000);
    return () => window.clearInterval(timer);
  }, [loggedIn, view, selected?.id, loadDetail]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/support/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ورود ناموفق بود.");
      setLoggedIn(true); setPassword("");
    } catch (e) { setError(e instanceof Error ? e.message : "ورود ناموفق بود."); }
    finally { setBusy(false); }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/support/admin/tickets/${selected.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: reply }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ارسال پاسخ ناموفق بود.");
      setReply(""); await loadDetail(selected.id); await loadTickets();
    } catch (e) { setError(e instanceof Error ? e.message : "ارسال پاسخ ناموفق بود."); }
    finally { setBusy(false); }
  }

  async function changeStatus(status: string) {
    if (!selected) return;
    const response = await fetch(`/api/support/admin/tickets/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "تغییر وضعیت ناموفق بود."); return; }
    await loadDetail(selected.id); await loadTickets();
  }

  async function logout() {
    await fetch("/api/support/admin/session", { method: "DELETE" });
    setLoggedIn(false); setSelected(null); setTickets([]); setMessages([]);
  }

  if (!loggedIn) return <form className="support-admin-login" onSubmit={login}><span className="support-kicker">NEXVORDEV / PRIVATE AREA</span><h1>ورود مدیریت پشتیبانی</h1><p>این بخش فقط برای مدیران مجاز است.</p><label>رمز عبور مدیریت<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>{error && <p className="support-error">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="support-spin" /> : <ArrowLeft size={17} />} ورود به پنل</button></form>;

  return <div className={`support-admin ${view === "orders" ? "is-orders" : ""}`}>
    <aside className="support-admin-sidebar"><div className="support-admin-title"><div><span className="support-kicker">NEXVORDEV</span><h1>مرکز مدیریت</h1></div><button className="support-icon-button" onClick={logout} aria-label="خروج"><LogOut size={18} /></button></div><div className="support-admin-nav"><button type="button" className={view === "tickets" ? "active" : ""} onClick={() => setView("tickets")}>تیکت‌ها</button><button type="button" className={view === "orders" ? "active" : ""} onClick={() => setView("orders")}>سفارش‌ها</button></div><div className="support-ticket-list" hidden={view !== "tickets"}>
      {tickets.map(ticket => <button key={ticket.id} className={`support-ticket-item ${selected?.id === ticket.id ? "active" : ""}`} onClick={() => { setError(""); loadDetail(ticket.id).catch(e => setError(e.message)); }}><span className="support-ticket-item-top"><b>{ticket.first_name} {ticket.last_name}</b><small>{ticket.status === "answered" ? "پاسخ داده شده" : ticket.status === "closed" ? "بسته" : "جدید"}</small></span><strong>{ticket.subject}</strong><span className="support-ticket-date">{new Date(ticket.last_message_at).toLocaleString("fa-IR")}</span></button>)}
      {tickets.length === 0 && <p className="support-empty">هنوز تیکتی ثبت نشده است.</p>}
    </div>{view === "orders" && <p className="support-empty">فهرست سفارش‌ها در پنل سمت راست نمایش داده می‌شود.</p>}</aside>
    <section className="support-admin-main">{view === "orders" ? <ServiceRequestsAdmin /> : selected ? <>
      <header className="support-admin-detail-head"><div><span className="support-kicker">TICKET / {selected.id.slice(0, 8)}</span><h2>{selected.subject}</h2><p>{selected.first_name} {selected.last_name} · {selected.age} سال · @{selected.telegram_username}</p></div><select value={selected.status} onChange={e => changeStatus(e.target.value)}><option value="waiting">در انتظار پاسخ</option><option value="answered">پاسخ داده شده</option><option value="closed">بسته شده</option></select></header>
      <div className="support-admin-messages">{messages.map(message => <article key={message.id} className={`support-message ${message.sender_role === "admin" ? "from-admin" : "from-customer"}`}><div className="support-message-meta">{message.sender_role === "admin" ? "مدیریت" : "مشتری"}<time>{new Date(message.created_at).toLocaleString("fa-IR")}</time></div><p>{message.body}</p></article>)}</div>
      {selected.status !== "closed" && <form className="support-reply-form" onSubmit={sendReply}><textarea value={reply} onChange={e => setReply(e.target.value)} rows={2} placeholder="پاسخ به مشتری..." /><button className="button button-primary" disabled={busy || !reply.trim()}>{busy ? <LoaderCircle size={17} /> : <Send size={17} />} ارسال پاسخ</button></form>}
    </> : <div className="support-admin-placeholder">یک درخواست را از فهرست انتخاب کن.</div>}{error && <p className="support-error">{error}</p>}</section>
  </div>;
}
