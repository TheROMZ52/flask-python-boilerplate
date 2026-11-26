"use client";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { LoaderCircle, RefreshCw, Search, Send } from "lucide-react";

type RequestItem = { id: string; customer_name: string; telegram_contact: string; service_type: string; priority: string; status: string; quoted_price: string | null; assigned_to: string | null; awaiting_reply: boolean; created_at: string; last_message_at: string | null; details?: string; internal_note?: string | null };
type Message = { id: string; sender_role: "customer" | "admin"; body: string; created_at: string };
type Event = { actor_telegram_id: string; event_type: string; old_value: string | null; new_value: string | null; note: string | null; created_at: string };
const labels: Record<string, string> = { new: "جدید", reviewing: "در حال بررسی", in_progress: "در حال انجام", completed: "تکمیل‌شده", rejected: "ردشده" };
const priorities: Record<string, string> = { normal: "عادی", urgent: "فوری", critical: "اضطراری" };

export default function ServiceRequestsAdmin() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [reply, setReply] = useState("");
  const [quote, setQuote] = useState("");
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    const response = await fetch("/api/support/admin/requests", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "دریافت سفارش‌ها ناموفق بود.");
    setRequests(data.requests || []);
  }, []);
  const loadDetail = useCallback(async (id: string) => {
    const response = await fetch(`/api/support/admin/requests/${id}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "دریافت جزئیات سفارش ناموفق بود.");
    setSelected(data.request); setMessages(data.messages || []); setEvents(data.events || []);
    return data.request as RequestItem;
  }, []);

  async function openRequest(id: string) {
    const item = await loadDetail(id);
    setQuote(item.quoted_price || ""); setNote(item.internal_note || ""); setAssignee(item.assigned_to || "");
  }

  useEffect(() => {
    let active = true;
    const refresh = async () => { try { await loadRequests(); } catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "خطا در دریافت سفارش‌ها"); } };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 7000);
    return () => { active = false; window.clearInterval(timer); };
  }, [loadRequests]);
  useEffect(() => {
    if (!selected?.id) return;
    let active = true;
    const refresh = async () => { try { await loadDetail(selected.id); } catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "خطا در دریافت جزئیات"); } };
    const timer = window.setInterval(() => { void refresh(); }, 7000);
    return () => { active = false; window.clearInterval(timer); };
  }, [selected?.id, loadDetail]);

  const filtered = useMemo(() => requests.filter(item => {
    const matchesFilter = filter === "all" || (filter === "awaiting" ? item.awaiting_reply : item.status === filter);
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [item.customer_name, item.telegram_contact, item.service_type, item.id].some(value => String(value || "").toLowerCase().includes(term));
    return matchesFilter && matchesSearch;
  }), [requests, filter, search]);

  async function update(fields: Record<string, unknown>) {
    if (!selected) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/support/admin/requests/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ذخیره تغییرات انجام نشد.");
      await loadDetail(selected.id); await loadRequests();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "ذخیره تغییرات انجام نشد."); }
    finally { setBusy(false); }
  }
  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || !reply.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/support/admin/requests/${selected.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: reply }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ارسال پاسخ انجام نشد.");
      setReply(""); await loadDetail(selected.id); await loadRequests();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "ارسال پاسخ انجام نشد."); }
    finally { setBusy(false); }
  }

  return <div className="service-admin-workspace">
    <aside className="service-admin-list">
      <div className="service-admin-tools"><label className="service-admin-search"><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="جست‌وجوی مشتری، خدمت یا شناسه" /></label><select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">همه سفارش‌ها</option><option value="awaiting">منتظر پاسخ تیم</option><option value="new">جدید</option><option value="reviewing">در حال بررسی</option><option value="in_progress">در حال انجام</option><option value="completed">تکمیل‌شده</option><option value="rejected">ردشده</option></select><button type="button" className="support-icon-button" onClick={() => void loadRequests()} aria-label="به‌روزرسانی"><RefreshCw size={16} /></button></div>
      <div className="service-admin-counts"><span>کل: {requests.length}</span><span>پاسخ‌خواه: {requests.filter(item => item.awaiting_reply).length}</span><span>فوری: {requests.filter(item => item.priority !== "normal" && !["completed", "rejected"].includes(item.status)).length}</span></div>
      <div className="support-ticket-list">{filtered.map(item => <button key={item.id} type="button" className={`support-ticket-item ${selected?.id === item.id ? "active" : ""}`} onClick={() => { setError(""); void openRequest(item.id).catch(caught => setError(caught instanceof Error ? caught.message : "دریافت سفارش ناموفق بود.")); }}><span className="support-ticket-item-top"><b>{item.customer_name}</b><small>{labels[item.status] || item.status}</small></span><strong>{item.service_type}</strong><span className="support-ticket-date">{priorities[item.priority] || item.priority} · {item.telegram_contact}</span>{item.awaiting_reply && <span className="service-awaiting">پیام جدید مشتری</span>}</button>)}{filtered.length === 0 && <p className="support-empty">سفارشی مطابق جست‌وجو پیدا نشد.</p>}</div>
    </aside>
    <section className="service-admin-detail">
      {selected ? <>
        <header className="support-admin-detail-head"><div><span className="support-kicker">ORDER / {selected.id.slice(0, 8)}</span><h2>{selected.service_type}</h2><p>{selected.customer_name} · {selected.telegram_contact}</p></div><select value={selected.status} onChange={event => void update({ status: event.target.value })}><option value="new">جدید</option><option value="reviewing">در حال بررسی</option><option value="in_progress">در حال انجام</option><option value="completed">تکمیل‌شده</option><option value="rejected">ردشده</option></select></header>
        <div className="service-admin-meta"><span>اولویت: {priorities[selected.priority] || selected.priority}</span><span>ثبت: {new Date(selected.created_at).toLocaleString("fa-IR")}</span><span>شناسه: {selected.id.slice(0, 8)}</span></div>
        <article className="support-message from-customer service-order-description"><div className="support-message-meta">شرح اولیه مشتری</div><p>{selected.details}</p></article>
        <div className="support-admin-messages service-order-messages">{messages.map(message => <article key={message.id} className={`support-message ${message.sender_role === "admin" ? "from-admin" : "from-customer"}`}><div className="support-message-meta">{message.sender_role === "admin" ? "مدیریت" : "مشتری"}<time>{new Date(message.created_at).toLocaleString("fa-IR")}</time></div><p>{message.body}</p></article>)}{messages.length === 0 && <p className="support-empty">هنوز گفت‌وگویی ثبت نشده است.</p>}</div>
        <form className="support-reply-form" onSubmit={sendReply}><textarea value={reply} onChange={event => setReply(event.target.value)} rows={2} maxLength={4000} placeholder="پاسخ به مشتری؛ در سایت و تلگرام نمایش داده می‌شود..." /><button className="button button-primary" disabled={busy || !reply.trim()}>{busy ? <LoaderCircle size={17} /> : <Send size={17} />} ارسال پاسخ</button></form>
        <div className="service-admin-actions"><label>قیمت پیشنهادی<input value={quote} onChange={event => setQuote(event.target.value)} placeholder="مثلاً 850,000 تومان" /></label><button type="button" className="button button-primary" disabled={busy || !quote.trim()} onClick={() => void update({ quoted_price: quote })}>ثبت قیمت و اطلاع به مشتری</button><label>مسئول پیگیری<input value={assignee} onChange={event => setAssignee(event.target.value)} placeholder="نام یا شناسه مدیر" /></label><button type="button" className="button" disabled={busy} onClick={() => void update({ assigned_to: assignee })}>ذخیره مسئول</button><label className="service-admin-note">یادداشت داخلی<textarea value={note} onChange={event => setNote(event.target.value)} rows={2} maxLength={1000} placeholder="فقط برای مدیران؛ مشتری نمی‌بیند" /></label><button type="button" className="button" disabled={busy} onClick={() => void update({ internal_note: note })}>ذخیره یادداشت</button></div>
        {events.length > 0 && <details className="service-admin-history"><summary>تاریخچه تغییرات ({events.length})</summary>{events.map((event, index) => <p key={`${event.created_at}-${index}`}>{event.event_type} · {event.old_value || "—"} ← {event.new_value || event.note || "—"} <time>{new Date(event.created_at).toLocaleString("fa-IR")}</time></p>)}</details>}
      </> : <div className="support-admin-placeholder">یک سفارش را از فهرست انتخاب کن.</div>}
      {error && <p className="support-error" role="alert">{error}</p>}
    </section>
  </div>;
}
