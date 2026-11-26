"use client";
import { useCallback, useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { LoaderCircle, Send, ShieldCheck } from "lucide-react";
import { readStorage, writeStorage } from "@/lib/safe-storage";

type Ticket = { id: string; first_name: string; last_name: string; subject: string; status: string; created_at: string };
type Message = { id: string; sender_role: "customer" | "admin"; body: string; created_at: string };

export default function SupportChat({ ticketId }: { ticketId: string }) {
  const [token, setToken] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (accessToken: string) => {
    const response = await fetch(`/api/support/tickets/${ticketId}`, { headers: { "x-ticket-token": accessToken }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "گفتگو در دسترس نیست.");
    setTicket(data.ticket);
    setMessages(data.messages || []);
  }, [ticketId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get("token");
    const storedToken = queryToken || readStorage(`nexvor-support-${ticketId}`) || "";
    if (queryToken) {
      writeStorage(`nexvor-support-${ticketId}`, queryToken);
      window.history.replaceState({}, "", window.location.pathname);
    }
    Promise.resolve().then(() => setToken(storedToken));
    const initialize = async () => { try { await refresh(storedToken); } catch (e) { setError(e instanceof Error ? e.message : "خطا در دریافت گفتگو"); } };
    void initialize();
    const timer = window.setInterval(() => refresh(storedToken).catch(() => undefined), 5000);
    return () => window.clearInterval(timer);
  }, [ticketId, refresh]);

  function handleReplyKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-ticket-token": token },
        body: JSON.stringify({ body }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ارسال پیام انجام نشد.");
      setBody("");
      await refresh(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ارسال پیام انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  if (!ticket && !error) return <div className="support-loading"><LoaderCircle className="support-spin" /> در حال دریافت گفتگو...</div>;

  return <section className="support-chat-panel">
    <div className="support-chat-head"><div><span className="support-kicker">NEXVORDEV / SUPPORT</span><h1>{ticket?.subject || "گفتگوی پشتیبانی"}</h1><p>درخواست شما · {ticketId.slice(0, 8)}</p></div><span className={`support-status status-${ticket?.status || "waiting"}`}>{ticket?.status === "answered" ? "پاسخ داده شده" : ticket?.status === "closed" ? "بسته شده" : "در انتظار پاسخ"}</span></div>
    <div className="support-messages">
      {messages.map(message => <article key={message.id} className={`support-message ${message.sender_role === "admin" ? "from-admin" : "from-customer"}`}>
        <div className="support-message-meta">{message.sender_role === "admin" ? "پشتیبانی NexvorDEV" : "شما"}<time>{new Date(message.created_at).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })}</time></div>
        <p>{message.body}</p>
      </article>)}
      {messages.length === 0 && <p className="support-empty">هنوز پیامی ثبت نشده است.</p>}
    </div>
    {error && <p className="support-error">{error}</p>}
    {ticket?.status === "closed" ? <div className="support-closed">این درخواست بسته شده است و امکان ارسال پیام جدید وجود ندارد.</div> : <form className="support-reply-form" onSubmit={send}><div className="support-reply-field"><textarea value={body} onChange={e => setBody(e.target.value)} onKeyDown={handleReplyKeyDown} rows={3} maxLength={4000} placeholder={"پیامت رو بنویس...\n\nEnter برای ارسال · Shift + Enter برای خط جدید"} /><span className="support-field-hint"><span>Enter: ارسال · Shift + Enter: خط جدید</span><span>{body.length}/4000</span></span></div><button className="button button-primary" disabled={busy || !body.trim()}>{busy ? <LoaderCircle className="support-spin" size={17} /> : <Send size={17} />} ارسال</button></form>}
    <div className="support-chat-foot"><ShieldCheck size={14} /> پیام‌ها به‌صورت خودکار به‌روزرسانی می‌شوند؛ نیازی به رفرش نیست.</div>
  </section>;
}
