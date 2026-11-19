"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpLeft, Clock3, LoaderCircle, MessageCircle, Ticket } from "lucide-react";

type SavedTicket = { id: string; token: string };
type TicketInfo = { id: string; subject: string; status: string; created_at: string; last_message_at: string };
type TicketItem = { ticket: TicketInfo; token: string };

const STORAGE_KEY = "nexvor-support-ticket-list";

function readSaved(): SavedTicket[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter((x): x is SavedTicket => typeof x?.id === "string" && typeof x?.token === "string") : [];
  } catch { return []; }
}

export default function MySupportTickets() {
  const [items, setItems] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const saved = readSaved();
      const results = await Promise.all(saved.map(async item => {
        try {
          const response = await fetch(`/api/support/tickets/${encodeURIComponent(item.id)}`, {
            headers: { "x-ticket-token": item.token }, cache: "no-store"
          });
          if (!response.ok) return null;
          const data = await response.json();
          return { ticket: data.ticket as TicketInfo, token: item.token } as TicketItem;
        } catch { return null; }
      }));
      if (!active) return;
      const valid = results.filter((x): x is TicketItem => x !== null)
        .sort((a,b) => new Date(b.ticket.last_message_at || b.ticket.created_at).getTime() - new Date(a.ticket.last_message_at || a.ticket.created_at).getTime());
      setItems(valid);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid.map(x => ({ id: x.ticket.id, token: x.token }))));
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  return <section className="support-my-tickets">
    <div className="support-my-tickets-heading"><div><span className="support-kicker">YOUR REQUESTS</span><h2><Ticket size={20} /> تیکت‌های من</h2><p>درخواست‌هایی که با همین مرورگر ثبت کرده‌ای.</p></div><span className="support-ticket-count">{items.length}</span></div>
    {loading ? <div className="support-loading"><LoaderCircle className="support-spin" /> در حال دریافت تیکت‌ها...</div> :
      items.length ? <div className="support-my-ticket-list">{items.map(({ticket,token}) => <Link key={ticket.id} href={`/support/ticket/${ticket.id}?token=${encodeURIComponent(token)}`} className="support-my-ticket">
        <span className="support-my-ticket-icon"><MessageCircle size={18} /></span><span className="support-my-ticket-copy"><strong>{ticket.subject}</strong><small><Clock3 size={12} /> {new Date(ticket.last_message_at || ticket.created_at).toLocaleString("fa-IR")}</small></span><span className={`support-status status-${ticket.status}`}>{ticket.status === "answered" ? "پاسخ داده شده" : ticket.status === "closed" ? "بسته شده" : "در انتظار پاسخ"}</span><ArrowUpLeft size={17} className="support-my-ticket-arrow" />
      </Link>)}</div> :
      <div className="support-my-ticket-empty"><MessageCircle size={24} /><strong>هنوز تیکتی ثبت نکردی</strong><span>بعد از ثبت اولین درخواست، از همین بخش می‌تونی دوباره وارد گفت‌وگوت بشی.</span></div>}
    <p className="support-my-ticket-note">برای امنیت، فهرست تیکت‌ها روی همین مرورگر ذخیره می‌شود. پاک‌کردن اطلاعات مرورگر ممکن است دسترسی به این فهرست را از بین ببرد.</p>
  </section>;
}
