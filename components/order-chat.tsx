"use client";
import { useCallback, useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowUpLeft, LoaderCircle, Send } from "lucide-react";

type Order = { id: string; service_type: string; priority: string; status: string; quoted_price: string | null; created_at: string; details: string };
type Message = { id: string; sender_role: "customer" | "admin"; body: string; created_at: string };
const statusLabels: Record<string, string> = { new: "ثبت شده", reviewing: "در حال بررسی", in_progress: "در حال انجام", completed: "تکمیل شده", rejected: "رد شده" };

export default function OrderChat({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/account/orders/${orderId}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "دریافت سفارش انجام نشد.");
    setOrder(data.order);
    setMessages(data.messages || []);
    setError("");
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    let active = true;
    const load = async () => { try { await refresh(); } catch (caught) { if (active) { setError(caught instanceof Error ? caught.message : "خطا در دریافت سفارش"); setLoading(false); } } };
    void load();
    const timer = window.setInterval(() => { void load(); }, 7000);
    return () => { active = false; window.clearInterval(timer); };
  }, [refresh]);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/account/orders/${orderId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ارسال پیام انجام نشد.");
      setBody(""); await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "ارسال پیام انجام نشد."); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="support-loading"><LoaderCircle className="support-spin" /> در حال دریافت سفارش...</div>;
  if (!order) return <section className="support-chat-panel"><p className="support-error">{error || "سفارش پیدا نشد."}</p><Link className="dash-mini" href="/account">بازگشت به حساب</Link></section>;

  return <section className="support-chat-panel">
    <div className="support-chat-head"><div><span className="support-kicker">NEXVORDEV / ORDER</span><h1>{order.service_type}</h1><p>سفارش {order.id.slice(0, 8)} · {statusLabels[order.status] || order.status}{order.quoted_price ? ` · ${order.quoted_price}` : ""}</p></div><Link className="dash-mini" href="/account?tab=orders"><ArrowUpLeft size={14} /> سفارش‌ها</Link></div>
    <div className="support-messages">
      <article className="support-message from-customer"><div className="support-message-meta">شرح اولیه سفارش<time>{new Date(order.created_at).toLocaleString("fa-IR")}</time></div><p>{order.details}</p></article>
      {messages.map(message => <article key={message.id} className={`support-message ${message.sender_role === "admin" ? "from-admin" : "from-customer"}`}><div className="support-message-meta">{message.sender_role === "admin" ? "تیم NexvorDEV" : "شما"}<time>{new Date(message.created_at).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })}</time></div><p>{message.body}</p></article>)}
      {messages.length === 0 && <p className="support-empty">هنوز پیامی درباره این سفارش ردوبدل نشده است.</p>}
    </div>
    {error && <p className="support-error" role="alert">{error}</p>}
    <form className="support-reply-form" onSubmit={sendMessage}><div className="support-reply-field"><textarea value={body} onChange={event => setBody(event.target.value)} onKeyDown={onKeyDown} rows={3} maxLength={4000} placeholder="پیام خودت درباره سفارش را بنویس..." /><span className="support-field-hint"><span>Enter: ارسال · Shift + Enter: خط جدید</span><span>{body.length}/4000</span></span></div><button className="button button-primary" disabled={busy || !body.trim()}>{busy ? <LoaderCircle className="support-spin" size={17} /> : <Send size={17} />} ارسال پیام</button></form>
    <div className="support-chat-foot">پیام‌ها به‌صورت خودکار به‌روزرسانی می‌شوند و در سایت و تلگرام همگام هستند.</div>
  </section>;
}
