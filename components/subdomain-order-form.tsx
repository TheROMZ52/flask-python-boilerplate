"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Send, Check } from "lucide-react";

const plans = [
  { id: "1m", label: "یک‌ماهه", days: "۳۰ روز", price: 25000 },
  { id: "3m", label: "سه‌ماهه", days: "۹۰ روز", price: 60000 },
  { id: "6m", label: "شش‌ماهه", days: "۱۸۰ روز", price: 100000 },
  { id: "12m", label: "یک‌ساله", days: "۳۶۵ روز", price: 160000 },
];

const money = (value: number) => new Intl.NumberFormat("fa-IR").format(value);

export default function SubdomainOrderForm() {
  const [label, setLabel] = useState("");
  const [plan, setPlan] = useState("3m");
  const [telegram, setTelegram] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const selected = useMemo(() => plans.find(item => item.id === plan) ?? plans[1], [plan]);
  const normalized = label.trim().toLowerCase();
  const validName = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(normalized);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    if (!/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(normalized)) {
      setError("نام ساب‌دامنه فقط می‌تواند شامل حروف انگلیسی، عدد و خط تیره باشد.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setError("");
    const orderDetails = [
      "نوع درخواست: خرید ساب‌دامنه",
      `آدرس درخواستی: ${normalized}.nexvordev.ir`,
      `مدت: ${selected.label}`,
      `قیمت اعلام‌شده: ${money(selected.price)} تومان`,
      `توضیحات: ${details.trim() || "ندارد"}`,
    ].join("\n");
    try {
      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "درخواست خرید ساب‌دامنه",
          telegram,
          service: "درخواست خرید ساب‌دامنه",
          priority: "normal",
          details: orderDetails,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "ثبت درخواست انجام نشد.");
      setStatus("success");
      setLabel("");
      setTelegram("");
      setDetails("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "خطایی در ثبت درخواست رخ داد.");
      setStatus("error");
    }
  }

  return (
    <form className="subdomain-form" onSubmit={submit}>
      <fieldset className="subdomain-plans">
        <legend>مدت اشتراک رو انتخاب کن</legend>
        <div className="subdomain-plan-grid">
          {plans.map(item => (
            <label className={plan === item.id ? "subdomain-plan selected" : "subdomain-plan"} key={item.id}>
              <input type="radio" name="duration" value={item.id} checked={plan === item.id} onChange={() => setPlan(item.id)} />
              <strong>{item.label}</strong>
              <span>{money(item.price)} تومان</span>
              <small>{item.days}</small>{plan === item.id && <Check className="subdomain-plan-check" size={15} aria-hidden="true" />}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="subdomain-field">
        نام دلخواه ساب‌دامنه
        <div className="subdomain-address">
          <input value={label} onChange={event => { setLabel(event.target.value.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 40)); if (status !== "idle") setStatus("idle"); }} placeholder="مثلاً myserver" dir="ltr" required minLength={2} maxLength={40} aria-invalid={label.length > 0 && !validName} />
          <span dir="ltr">.nexvordev.ir</span>
        </div>
        <div className="subdomain-hint"><small>فقط حروف انگلیسی، عدد و خط تیره؛ نام‌های رزروشده یا تکراری قابل ثبت نیستند.</small><strong className={label.length === 0 ? "" : validName ? "valid" : "invalid"} dir="ltr">{normalized ? (validName ? "✓ نام از نظر ساختار معتبر است" : "نام نامعتبر است") : "نام را وارد کن"}</strong></div><div className="subdomain-live-preview" aria-live="polite"><span>پیش‌نمایش آدرس</span><strong dir="ltr">{normalized || "yourname"}.nexvordev.ir</strong></div>
      </label>

      <label className="subdomain-field">
        آیدی تلگرام برای هماهنگی
        <input value={telegram} onChange={event => setTelegram(event.target.value)} placeholder="@username" dir="ltr" required maxLength={100} />
      </label>

      <label className="subdomain-field">
        توضیحات <span>اختیاری</span>
        <textarea value={details} onChange={event => setDetails(event.target.value)} placeholder="اگر توضیح یا درخواست خاصی داری بنویس..." rows={4} maxLength={1000} />
      </label>

      <div className="subdomain-total"><span>مبلغ پلن انتخابی <small>{selected.label}</small></span><strong>{money(selected.price)} <small>تومان</small></strong></div>
      {status === "success" && <div className="subdomain-feedback success"><CheckCircle2 size={18} /> درخواستت ثبت شد؛ برای بررسی نام و ادامه هماهنگی باهات تماس می‌گیریم.</div>}
      {status === "error" && <div className="subdomain-feedback error"><AlertCircle size={18} /> {error}</div>}
      <button className="subdomain-submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? <LoaderCircle className="subdomain-spinner" size={18} /> : <Send size={17} />}
        {status === "sending" ? "در حال ثبت..." : "ثبت درخواست خرید"}
      </button>
      <p className="subdomain-note">ثبت درخواست به‌معنای پرداخت یا فعال‌سازی خودکار نیست؛ پس از بررسی آزادبودن نام، هماهنگی پرداخت و فعال‌سازی انجام می‌شه.</p>
    </form>
  );
}
