"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowUpLeft, CheckCircle2, ClipboardList, Clock3, Globe2, LifeBuoy, LoaderCircle, LogOut, MessageCircle, Plus, UserRound } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { readStorage } from "@/lib/safe-storage";

type Ticket = { id: string; subject: string; status: string; created_at: string; last_message_at: string };
type Req = { id: string; service_type: string; priority: string; status: string; quoted_price: string | null; created_at: string; updated_at: string };
type Info = { id: string; email: string | null; name: string; avatar: string | null; telegram: string; providers: string[]; createdAt: string };

const reqSteps = ["new", "reviewing", "in_progress", "completed"];
const reqLabels: Record<string, string> = { new: "ثبت شد", reviewing: "در حال بررسی", in_progress: "در حال انجام", completed: "تکمیل شد", rejected: "رد شد" };
const ticketLabels: Record<string, string> = { waiting: "در انتظار پاسخ", answered: "پاسخ داده شد", closed: "بسته شد" };
const priorities: Record<string, string> = { normal: "عادی", urgent: "فوری", critical: "اضطراری" };
const providerNames: Record<string, string> = { email: "ایمیل", google: "گوگل", github: "گیت‌هاب", discord: "دیسکورد" };
const subdomainType = "درخواست خرید ساب‌دامنه";

const date = (value: string) => new Date(value).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });

export default function AccountDashboard() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [info, setInfo] = useState<Info | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"orders" | "tickets" | "profile">("orders");
  const [pending, setPending] = useState<Array<{ id: string; token: string }>>([]);
  const [claiming, setClaiming] = useState(false);
  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/account/overview", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "دریافت اطلاعات حساب ممکن نشد.");
      setInfo(data.user); setTickets(data.tickets); setRequests(data.requests);
      setName(current => current || data.user.name); setTelegram(current => current || data.user.telegram);
      let local: Array<{ id: string; token: string }> = [];
      try { const parsed = JSON.parse(readStorage("nexvor-support-ticket-list") || "[]"); if (Array.isArray(parsed)) local = parsed.filter(item => typeof item?.id === "string" && typeof item?.token === "string"); } catch {}
      const known = new Set((data.tickets as Ticket[]).map(ticket => ticket.id));
      setPending(local.filter(item => !known.has(item.id)));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "دریافت اطلاعات حساب ممکن نشد.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function claim() {
    setClaiming(true);
    try {
      await fetch("/api/account/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: pending }) });
      await load();
    } catch { setError("اضافه‌کردن تیکت‌ها ممکن نشد."); }
    setClaiming(false);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setSaved(false);
    const { error: failure } = await supabase.auth.updateUser({ data: { full_name: name.trim().slice(0, 80), telegram: telegram.trim().replace(/^@/, "").slice(0, 64) } });
    setSaving(false);
    if (failure) setError("ذخیره پروفایل انجام نشد."); else { setSaved(true); setError(""); load(); }
  }

  if (loading) return <div className="dash"><div className="support-loading"><LoaderCircle className="support-spin" /> در حال دریافت حساب...</div></div>;

  const openTickets = tickets.filter(ticket => ticket.status !== "closed").length;
  const active = requests.filter(request => ["new", "reviewing", "in_progress"].includes(request.status)).length;
  const done = requests.filter(request => request.status === "completed").length;
  const display = info?.name || info?.email?.split("@")[0] || "کاربر";

  return (
    <div className="dash">
      <header className="dash-head hx-glass">
        <div className="dash-avatar">{info?.avatar ? <img src={info.avatar} alt="" referrerPolicy="no-referrer" /> : <span>{display.slice(0, 1).toUpperCase()}</span>}</div>
        <div className="dash-who">
          <h1>سلام، {display} 👋</h1>
          <p dir="ltr">{info?.email}</p>
          <div className="dash-providers">{(info?.providers.length ? info.providers : ["email"]).map(provider => <span key={provider}>{providerNames[provider] || provider}</span>)}</div>
        </div>
        <button className="dash-out" type="button" onClick={() => supabase.auth.signOut()}><LogOut size={15} /> خروج</button>
      </header>

      <div className="dash-stats">
        <div className="hx-glass"><strong>{active.toLocaleString("fa-IR")}</strong><span>سفارش در جریان</span></div>
        <div className="hx-glass"><strong>{done.toLocaleString("fa-IR")}</strong><span>سفارش تکمیل‌شده</span></div>
        <div className="hx-glass"><strong>{openTickets.toLocaleString("fa-IR")}</strong><span>تیکت باز</span></div>
        <div className="hx-glass"><strong>{requests.length.toLocaleString("fa-IR")}</strong><span>کل سفارش‌ها</span></div>
      </div>

      <div className="dash-actions">
        <Link className="hx-cta" href="/request"><Plus size={17} /> ثبت سفارش جدید</Link>
        <Link className="hx-ghost" href="/support"><LifeBuoy size={16} /> تیکت جدید</Link>
        <Link className="hx-ghost" href="/subdomains"><Globe2 size={16} /> ساب‌دامنه</Link>
      </div>

      {error && <p className="support-error">{error}</p>}
      {pending.length > 0 && (
        <div className="dash-claim hx-glass">
          <div><strong>{pending.length.toLocaleString("fa-IR")} تیکت قبلی روی این مرورگر پیدا شد</strong><p>با اضافه‌کردنشان به حساب، از هر دستگاهی می‌توانی پیگیری‌شان کنی.</p></div>
          <button className="hx-cta hx-cta-sm" type="button" onClick={claim} disabled={claiming}>{claiming ? "کمی صبر کن…" : "افزودن به حساب"}</button>
        </div>
      )}

      <div className="dash-tabs" role="tablist">
        {([["orders", "سفارش‌ها", ClipboardList], ["tickets", "تیکت‌ها", MessageCircle], ["profile", "پروفایل", UserRound]] as const).map(([key, label, Icon]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}><Icon size={16} /> {label}</button>
        ))}
      </div>

      {tab === "orders" && (requests.length ? <div className="dash-list">{requests.map(request => {
        const index = reqSteps.indexOf(request.status);
        return (
          <article className="dash-item hx-glass" key={request.id}>
            <div className="dash-item-top">
              <h3>{request.service_type === subdomainType ? "خرید ساب‌دامنه" : request.service_type}</h3>
              <span className={`dash-chip st-${request.status}`}>{reqLabels[request.status] || request.status}</span>
            </div>
            <div className="dash-meta"><span><Clock3 size={13} /> {date(request.created_at)}</span><span>اولویت {priorities[request.priority] || request.priority}</span>{request.quoted_price && <span>هزینه اعلام‌شده: {request.quoted_price}</span>}</div>
            {request.status === "rejected" ? null : <ol className="dash-steps">{reqSteps.map((step, i) => <li key={step} className={i <= index ? "done" : ""}><i>{i < index || request.status === "completed" ? <CheckCircle2 size={14} /> : null}</i><span>{reqLabels[step]}</span></li>)}</ol>}
          </article>
        );
      })}</div> : <div className="dash-empty hx-glass"><ClipboardList size={26} /><strong>هنوز سفارشی ثبت نکرده‌ای</strong><p>اولین سفارشت رو ثبت کن تا مراحل پیشرفتش رو از همین‌جا ببینی.</p><Link className="hx-cta hx-cta-sm" href="/request">ثبت سفارش</Link></div>)}

      {tab === "tickets" && (tickets.length ? <div className="dash-list">{tickets.map(ticket => (
        <Link className="dash-item hx-glass dash-link" key={ticket.id} href={`/support/ticket/${ticket.id}`}>
          <div className="dash-item-top"><h3>{ticket.subject}</h3><span className={`dash-chip tk-${ticket.status}`}>{ticketLabels[ticket.status] || ticket.status}</span></div>
          <div className="dash-meta"><span><Clock3 size={13} /> آخرین پیام {date(ticket.last_message_at || ticket.created_at)}</span><span className="dash-open">باز کردن گفت‌وگو <ArrowUpLeft size={14} /></span></div>
        </Link>
      ))}</div> : <div className="dash-empty hx-glass"><MessageCircle size={26} /><strong>تیکتی نداری</strong><p>برای هر سؤال یا مشکلی می‌تونی یک گفت‌وگوی اختصاصی با پشتیبانی باز کنی.</p><Link className="hx-cta hx-cta-sm" href="/support">ثبت تیکت</Link></div>)}

      {tab === "profile" && (
        <form className="dash-profile hx-glass" onSubmit={saveProfile}>
          <h2>اطلاعات پروفایل</h2>
          <p>با پر کردن این بخش، فرم‌های سفارش و پشتیبانی خودکار برایت تکمیل می‌شن.</p>
          <label>نام نمایشی<input value={name} onChange={event => setName(event.target.value)} maxLength={80} placeholder="مثلاً مهبد رضایی" /></label>
          <label>آیدی تلگرام<input value={telegram} onChange={event => setTelegram(event.target.value)} maxLength={64} dir="ltr" placeholder="username" /></label>
          <label>ایمیل<input value={info?.email || ""} readOnly dir="ltr" /></label>
          <div className="dash-save"><button className="hx-cta" type="submit" disabled={saving}>{saving ? "در حال ذخیره…" : "ذخیره تغییرات"}</button>{saved && <span><CheckCircle2 size={15} /> ذخیره شد</span>}</div>
          <small>عضویت از {info ? date(info.createdAt) : ""}</small>
        </form>
      )}
    </div>
  );
}
