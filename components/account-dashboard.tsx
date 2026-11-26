"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowUpLeft, Bell, CheckCircle2, ClipboardList, Clock3, Download, FileText, Globe2, LifeBuoy, LoaderCircle, LogOut, Mail, MailWarning, MessageCircle, Plus, UserRound } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { readStorage } from "@/lib/safe-storage";

type Ticket = { id: string; subject: string; status: string; created_at: string; last_message_at: string };
type Req = { id: string; service_type: string; priority: string; status: string; quoted_price: string | null; created_at: string; updated_at: string };
type Invoice = { id: string; number: string; description: string; amount: number | null; payment_status: string; issued_at: string };
type Notice = { id: string; kind: string; title: string; body: string; href: string | null; read_at: string | null; created_at: string };
type Info = { id: string; email: string | null; name: string; firstName: string; lastName: string; avatar: string | null; telegram: string; telegramLinked: boolean; telegramUsername: string | null; providers: string[]; createdAt: string; verified: boolean };
type Tab = "orders" | "invoices" | "tickets" | "notifications" | "profile";

const reqSteps = ["new", "reviewing", "in_progress", "completed"];
const reqLabels: Record<string, string> = { new: "ثبت شد", reviewing: "در حال بررسی", in_progress: "در حال انجام", completed: "تکمیل شد", rejected: "رد شد" };
const ticketLabels: Record<string, string> = { waiting: "در انتظار پاسخ", answered: "پاسخ داده شد", closed: "بسته شد" };
const payLabels: Record<string, string> = { unpaid: "در انتظار پرداخت", paid: "پرداخت‌شده", cancelled: "لغوشده" };
const priorities: Record<string, string> = { normal: "عادی", urgent: "فوری", critical: "اضطراری" };
const providerNames: Record<string, string> = { email: "ایمیل", google: "گوگل", github: "گیت‌هاب", discord: "دیسکورد" };
const subdomainType = "درخواست خرید ساب‌دامنه";
const tabs = ["orders", "invoices", "tickets", "notifications", "profile"] as const;

const date = (value: string) => new Date(value).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });
const money = (amount: number | null) => (amount === null ? "پس از بررسی" : `${amount.toLocaleString("fa-IR")} تومان`);

async function api(url: string, method: string, body?: Record<string, unknown>) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return (await response.json().catch(() => ({ ok: false }))) as { ok?: boolean; error?: string };
}

export default function AccountDashboard() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [info, setInfo] = useState<Info | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [requests, setRequests] = useState<Req[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("orders");
  const [pending, setPending] = useState<Array<{ id: string; token: string }>>([]);
  const [claiming, setClaiming] = useState(false);
  const [notice, setNotice] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [telegram, setTelegram] = useState("");
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkCode, setLinkCode] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyInvoice, setBusyInvoice] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/account/overview", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "دریافت اطلاعات حساب ممکن نشد.");
      setInfo(data.user); setTickets(data.tickets); setRequests(data.requests); setInvoices(data.invoices); setNotices(data.notifications); setUnread(data.unread);
      setTelegramLinked(Boolean(data.user.telegramLinked)); setTelegramUsername(data.user.telegramUsername || null);
      setFirst(current => current || data.user.firstName); setLast(current => current || data.user.lastName); setTelegram(current => current || data.user.telegram);
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

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      await load();
      const wanted = new URLSearchParams(window.location.search).get("tab");
      if (active && wanted && (tabs as readonly string[]).includes(wanted)) setTab(wanted as Tab);
    };
    void initialize();
    return () => { active = false; };
  }, [load]);

  async function claim() {
    setClaiming(true);
    await api("/api/account/claim", "POST", { items: pending });
    await load();
    setClaiming(false);
  }

  async function createTelegramLink() {
    setLinkBusy(true); setError(""); setNotice("");
    const result = await api("/api/account/telegram/link", "POST");
    setLinkBusy(false);
    if (result.ok && "url" in result && typeof result.url === "string") setLinkUrl(result.url);
    else setError(result.error || "ساخت لینک اتصال انجام نشد.");
  }

  async function connectTelegramCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLinkBusy(true); setError(""); setNotice("");
    const result = await api("/api/account/telegram/link", "POST", { code: linkCode });
    setLinkBusy(false);
    if (result.ok) { setLinkCode(""); setLinkUrl(""); setNotice("حساب تلگرام با موفقیت متصل شد."); await load(); }
    else setError(result.error || "اتصال حساب انجام نشد.");
  }

  async function disconnectTelegram() {
    setLinkBusy(true); setError("");
    const response = await fetch("/api/account/telegram/link", { method: "DELETE" });
    const result = await response.json();
    setLinkBusy(false);
    if (response.ok && result.ok) { setLinkUrl(""); setNotice("اتصال تلگرام قطع شد."); await load(); }
    else setError(result.error || "قطع اتصال انجام نشد.");
  }

  async function resendVerify() {
    if (!info?.email) return;
    const result = await api("/api/auth/resend", "POST", { email: info.email });
    setNotice(result.ok ? "ایمیل تأیید دوباره ارسال شد." : result.error || "ارسال انجام نشد.");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setNotice(""); setError("");
    const result = await api("/api/account/profile", "PATCH", { first_name: first, last_name: last, telegram });
    setSaving(false);
    if (result.ok) { setNotice("اطلاعات ذخیره شد."); load(); } else setError(result.error || "ذخیره انجام نشد.");
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (String(data.get("password")) !== String(data.get("confirm"))) return setError("تکرار رمز جدید یکسان نیست.");
    setSaving(true); setNotice(""); setError("");
    const result = await api("/api/account/password", "POST", { current: data.get("current"), password: data.get("password") });
    setSaving(false);
    if (result.ok) { setNotice("رمز عبور تغییر کرد."); form.reset(); load(); } else setError(result.error || "تغییر رمز انجام نشد.");
  }

  async function resendInvoice(id: string) {
    setBusyInvoice(id); setNotice(""); setError("");
    const result = await api(`/api/account/invoices/${id}/resend`, "POST");
    setBusyInvoice("");
    if (result.ok) setNotice("فاکتور به ایمیلت ارسال شد."); else setError(result.error || "ارسال انجام نشد.");
  }

  async function readAll() {
    await api("/api/account/notifications", "POST", {});
    load();
  }

  async function openNotice(item: Notice) {
    if (!item.read_at) await api("/api/account/notifications", "POST", { id: item.id });
    if (item.href) window.location.assign(item.href); else load();
  }

  if (loading) return <div className="dash"><div className="support-loading"><LoaderCircle className="support-spin" /> در حال دریافت حساب...</div></div>;

  const display = info?.name || info?.email?.split("@")[0] || "کاربر";
  const header = (
    <header className="dash-head hx-glass">
      <div className="dash-avatar">{info?.avatar ? <img src={info.avatar} alt="" referrerPolicy="no-referrer" /> : <span>{display.slice(0, 1).toUpperCase()}</span>}</div>
      <div className="dash-who">
        <h1>سلام، {display} 👋</h1>
        <p dir="ltr">{info?.email}</p>
        <div className="dash-providers">{(info?.providers.length ? info.providers : ["email"]).map(provider => <span key={provider}>{providerNames[provider] || provider}</span>)}</div>
      </div>
      <button className="dash-out" type="button" onClick={() => supabase.auth.signOut()}><LogOut size={15} /> خروج</button>
    </header>
  );

  if (info && !info.verified) {
    return (
      <div className="dash">
        {header}
        <div className="dash-verify hx-glass">
          <MailWarning size={28} />
          <div><strong>ایمیلت هنوز تأیید نشده</strong><p>لینک تأیید به <span dir="ltr">{info.email}</span> ارسال شده. بعد از تأیید، ثبت سفارش و تیکت فعال می‌شود.</p></div>
          <button className="hx-cta hx-cta-sm" type="button" onClick={resendVerify}>ارسال مجدد ایمیل</button>
        </div>
        {notice && <p className="account-notice">{notice}</p>}
        {error && <p className="support-error">{error}</p>}
      </div>
    );
  }

  const openTickets = tickets.filter(ticket => ticket.status !== "closed").length;
  const active = requests.filter(request => ["new", "reviewing", "in_progress"].includes(request.status)).length;
  const done = requests.filter(request => request.status === "completed").length;
  const hasPassword = (info?.providers || []).includes("email");

  return (
    <div className="dash">
      {header}

      <div className="dash-stats">
        <div className="hx-glass"><strong>{active.toLocaleString("fa-IR")}</strong><span>سفارش در جریان</span></div>
        <div className="hx-glass"><strong>{done.toLocaleString("fa-IR")}</strong><span>سفارش تکمیل‌شده</span></div>
        <div className="hx-glass"><strong>{openTickets.toLocaleString("fa-IR")}</strong><span>تیکت باز</span></div>
        <div className="hx-glass"><strong>{invoices.length.toLocaleString("fa-IR")}</strong><span>فاکتور</span></div>
      </div>

      <div className="dash-actions">
        <Link className="hx-cta" href="/request"><Plus size={17} /> ثبت سفارش جدید</Link>
        <Link className="hx-ghost" href="/support"><LifeBuoy size={16} /> تیکت جدید</Link>
        <Link className="hx-ghost" href="/subdomains"><Globe2 size={16} /> ساب‌دامنه</Link>
      </div>

      {notice && <p className="account-notice" role="status">{notice}</p>}
      {error && <p className="support-error" role="alert">{error}</p>}
      {pending.length > 0 && (
        <div className="dash-claim hx-glass">
          <div><strong>{pending.length.toLocaleString("fa-IR")} تیکت قبلی روی این مرورگر پیدا شد</strong><p>با اضافه‌کردنشان به حساب، از هر دستگاهی می‌توانی پیگیری‌شان کنی.</p></div>
          <button className="hx-cta hx-cta-sm" type="button" onClick={claim} disabled={claiming}>{claiming ? "کمی صبر کن…" : "افزودن به حساب"}</button>
        </div>
      )}

      <div className="dash-tabs" role="tablist">
        {([["orders", "سفارش‌ها", ClipboardList], ["invoices", "فاکتورها", FileText], ["tickets", "تیکت‌ها", MessageCircle], ["notifications", "اعلان‌ها", Bell], ["profile", "پروفایل", UserRound]] as const).map(([key, label, Icon]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>
            <Icon size={16} /> {label}{key === "notifications" && unread > 0 && <b className="dash-badge">{unread.toLocaleString("fa-IR")}</b>}
          </button>
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
            <Link className="dash-mini" href={`/account/orders/${request.id}`}><MessageCircle size={14} /> گفت‌وگو و پاسخ درباره سفارش <ArrowUpLeft size={14} /></Link>
          </article>
        );
      })}</div> : <div className="dash-empty hx-glass"><ClipboardList size={26} /><strong>هنوز سفارشی ثبت نکرده‌ای</strong><p>اولین سفارشت رو ثبت کن تا مراحل پیشرفتش رو از همین‌جا ببینی.</p><Link className="hx-cta hx-cta-sm" href="/request">ثبت سفارش</Link></div>)}

      {tab === "invoices" && (invoices.length ? <div className="dash-list">{invoices.map(invoice => (
        <article className="dash-item hx-glass" key={invoice.id}>
          <div className="dash-item-top"><h3>{invoice.description}</h3><span className={`dash-chip pay-${invoice.payment_status}`}>{payLabels[invoice.payment_status] || invoice.payment_status}</span></div>
          <div className="dash-meta"><span dir="ltr">{invoice.number}</span><span><Clock3 size={13} /> {date(invoice.issued_at)}</span><span>مبلغ: {money(invoice.amount)}</span></div>
          <div className="dash-inv-actions">
            <Link className="dash-mini" href={`/account/invoices/${invoice.id}`}><ArrowUpLeft size={14} /> مشاهده</Link>
            <a className="dash-mini" href={`/api/account/invoices/${invoice.id}/pdf`}><Download size={14} /> PDF</a>
            <button className="dash-mini" type="button" onClick={() => resendInvoice(invoice.id)} disabled={busyInvoice === invoice.id}><Mail size={14} /> {busyInvoice === invoice.id ? "در حال ارسال…" : "ارسال مجدد"}</button>
          </div>
        </article>
      ))}</div> : <div className="dash-empty hx-glass"><FileText size={26} /><strong>فاکتوری وجود ندارد</strong><p>بعد از ثبت هر سفارش، فاکتور آن به ایمیلت ارسال و اینجا نگهداری می‌شود.</p></div>)}

      {tab === "tickets" && (tickets.length ? <div className="dash-list">{tickets.map(ticket => (
        <Link className="dash-item hx-glass dash-link" key={ticket.id} href={`/support/ticket/${ticket.id}`}>
          <div className="dash-item-top"><h3>{ticket.subject}</h3><span className={`dash-chip tk-${ticket.status}`}>{ticketLabels[ticket.status] || ticket.status}</span></div>
          <div className="dash-meta"><span><Clock3 size={13} /> آخرین پیام {date(ticket.last_message_at || ticket.created_at)}</span><span className="dash-open">باز کردن گفت‌وگو <ArrowUpLeft size={14} /></span></div>
        </Link>
      ))}</div> : <div className="dash-empty hx-glass"><MessageCircle size={26} /><strong>تیکتی نداری</strong><p>برای هر سؤال یا مشکلی می‌تونی یک گفت‌وگوی اختصاصی با پشتیبانی باز کنی.</p><Link className="hx-cta hx-cta-sm" href="/support">ثبت تیکت</Link></div>)}

      {tab === "notifications" && (notices.length ? (
        <div className="dash-list">
          {unread > 0 && <button className="dash-mini dash-readall" type="button" onClick={readAll}><CheckCircle2 size={14} /> علامت‌گذاری همه به‌عنوان خوانده‌شده</button>}
          {notices.map(item => (
            <button className={`dash-item hx-glass dash-notice ${item.read_at ? "" : "unread"}`} key={item.id} type="button" onClick={() => openNotice(item)}>
              <div className="dash-item-top"><h3>{item.title}</h3><span className="dash-meta"><Clock3 size={13} /> {date(item.created_at)}</span></div>
              {item.body && <p>{item.body}</p>}
            </button>
          ))}
        </div>
      ) : <div className="dash-empty hx-glass"><Bell size={26} /><strong>اعلانی ندارید</strong><p>تغییر وضعیت سفارش، فاکتور و پاسخ تیکت‌ها اینجا نمایش داده می‌شود.</p></div>)}

      {tab === "profile" && (
        <div className="dash-forms">
          <form className="dash-profile hx-glass" onSubmit={saveProfile}>
            <h2>اطلاعات پروفایل</h2>
            <p>با پر کردن این بخش، فرم‌های سفارش و پشتیبانی خودکار برایت تکمیل می‌شوند.</p>
            <div className="dash-two">
              <label>نام<input value={first} onChange={event => setFirst(event.target.value)} maxLength={40} required minLength={2} /></label>
              <label>نام خانوادگی<input value={last} onChange={event => setLast(event.target.value)} maxLength={40} required minLength={2} /></label>
            </div>
            <label>آیدی تلگرام<input value={telegram} onChange={event => setTelegram(event.target.value)} maxLength={64} dir="ltr" placeholder="username" /></label>
            <label>ایمیل<input value={info?.email || ""} readOnly dir="ltr" /></label>
            <div className="dash-save"><button className="hx-cta" type="submit" disabled={saving}>{saving ? "در حال ذخیره…" : "ذخیره تغییرات"}</button></div>
            <small>عضویت از {info ? date(info.createdAt) : ""}</small>
          </form>
          <section className="dash-profile hx-glass">
            <h2>اتصال تلگرام</h2>
            <p>با اتصال بات NexvorDEV، پیام‌های سفارش و اعلان‌ها بین سایت و تلگرام همگام می‌شوند.</p>
            {telegramLinked ? <>
              <div className="account-notice">متصل است {telegramUsername ? `· @${telegramUsername}` : ""}</div>
              <button className="hx-ghost" type="button" onClick={disconnectTelegram} disabled={linkBusy}>{linkBusy ? "در حال انجام…" : "قطع اتصال تلگرام"}</button>
            </> : <>
              <button className="hx-cta" type="button" onClick={createTelegramLink} disabled={linkBusy}>{linkBusy ? "در حال ساخت لینک…" : "ساخت لینک اتصال به بات"}</button>
              {linkUrl && <a className="dash-mini" href={linkUrl} target="_blank" rel="noreferrer">باز کردن بات تلگرام <ArrowUpLeft size={14} /></a>}
              <form className="dash-link-form" onSubmit={connectTelegramCode}>
                <label>یا کدی که بات با دستور /link می‌دهد وارد کن<input value={linkCode} onChange={event => setLinkCode(event.target.value.toUpperCase())} maxLength={12} minLength={12} dir="ltr" placeholder="12-CHAR CODE" /></label>
                <button className="hx-ghost" type="submit" disabled={linkBusy || linkCode.trim().length !== 12}>اتصال با کد بات</button>
              </form>
            </>}
          </section>
          {hasPassword ? (
            <form className="dash-profile hx-glass" onSubmit={changePassword}>
              <h2>تغییر رمز عبور</h2>
              <label>رمز فعلی<input name="current" type="password" dir="ltr" autoComplete="current-password" required /></label>
              <label>رمز جدید<input name="password" type="password" dir="ltr" autoComplete="new-password" required minLength={8} /></label>
              <label>تکرار رمز جدید<input name="confirm" type="password" dir="ltr" autoComplete="new-password" required minLength={8} /></label>
              <div className="dash-save"><button className="hx-cta" type="submit" disabled={saving}>تغییر رمز</button></div>
            </form>
          ) : (
            <div className="dash-profile hx-glass"><h2>رمز عبور</h2><p>حساب تو با {(info?.providers || []).map(provider => providerNames[provider] || provider).join("، ")} وارد می‌شود و رمز جداگانه‌ای ندارد.</p></div>
          )}
        </div>
      )}
    </div>
  );
}
