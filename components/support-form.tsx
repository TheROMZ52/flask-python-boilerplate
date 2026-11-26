"use client";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/use-profile";
import { ArrowLeft, LoaderCircle, MessageCircle, ShieldCheck } from "lucide-react";
import { readStorage, writeStorage } from "@/lib/safe-storage";

export default function SupportForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ first_name: "", last_name: "", age: "", telegram_username: "", subject: "", message: "" });

  const profile = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!profile) return;
    const [first, ...rest] = profile.name.trim().split(/\s+/);
    Promise.resolve().then(() => setForm(current => ({ ...current, first_name: current.first_name || first || "", last_name: current.last_name || rest.join(" "), telegram_username: current.telegram_username || profile.telegram })));
  }, [profile]);

  function change(key: keyof typeof form, value: string) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function handleMessageKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: Number(form.age) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "ثبت درخواست انجام نشد.");
      let saved: unknown = [];
      try { saved = JSON.parse(readStorage("nexvor-support-ticket-list") || "[]"); } catch {}
      const list = Array.isArray(saved) ? saved.filter((item: { id?: string }) => item?.id !== result.ticketId) : [];
      list.unshift({ id: result.ticketId, token: result.accessToken });
      writeStorage("nexvor-support-ticket-list", JSON.stringify(list.slice(0, 50)));
      writeStorage(`nexvor-support-${result.ticketId}`, result.accessToken);
      router.push(`/support/ticket/${result.ticketId}?token=${encodeURIComponent(result.accessToken)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ارتباط با سرور برقرار نشد.");
      setBusy(false);
    }
  }

  return <form className="support-form" onSubmit={submit}>
    <div className="support-form-grid">
      <label>نام<input required maxLength={80} value={form.first_name} onChange={e => change("first_name", e.target.value)} placeholder="نام شما" /></label>
      <label>نام خانوادگی<input required maxLength={80} value={form.last_name} onChange={e => change("last_name", e.target.value)} placeholder="نام خانوادگی" /></label>
      <label>سن<input required type="number" min={13} max={110} value={form.age} onChange={e => change("age", e.target.value)} placeholder="سن" /></label>
      <label>آیدی تلگرام<input required maxLength={64} value={form.telegram_username} onChange={e => change("telegram_username", e.target.value)} placeholder="@username" dir="ltr" /></label>
      <label className="support-full">موضوع درخواست<input required maxLength={120} value={form.subject} onChange={e => change("subject", e.target.value)} placeholder="مثلاً مشکل در راه‌اندازی سرور" /></label>
      <label className="support-full">توضیحات<textarea required maxLength={4000} rows={5} value={form.message} onChange={e => change("message", e.target.value)} onKeyDown={handleMessageKeyDown} placeholder={"جزئیات درخواستت رو اینجا بنویس...\n\nEnter برای ارسال · Shift + Enter برای رفتن به خط بعد"} />
        <span className="support-field-hint"><span>Enter: ارسال · Shift + Enter: خط جدید</span><span>{form.message.length}/4000</span></span></label>
    </div>
    {error && <p className="support-error">{error}</p>}
    <button className="button button-primary support-submit" disabled={busy}>{busy ? <LoaderCircle className="support-spin" size={17} /> : <MessageCircle size={17} />} ثبت درخواست و شروع گفتگو <ArrowLeft size={16} /></button>
    <p className="support-privacy"><ShieldCheck size={14} /> لینک اختصاصی گفتگو فقط در اختیار شماست؛ آن را با دیگران به اشتراک نگذارید.</p>
  </form>;
}
