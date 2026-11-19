"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Send } from "lucide-react";

const serviceGroups = [
  {
    label: "خدمات ماینکرفت",
    options: [
      "نصب و کانفیگ انواع پلاگین ماینکرفت",
      "کانفیگ کامل سرور ماینکرفت",
      "راه‌اندازی سرور اختصاصی ماینکرفت",
      "راه‌اندازی سرور Survival، SMP، SkyBlock و سایر گیم‌مودها",
      "نصب و تنظیم پلاگین‌های اقتصادی",
      "راه‌اندازی سیستم فروشگاه و اقتصاد",
      "تنظیم سیستم رنک و پرمیشن",
      "راه‌اندازی سیستم کلیم (Claim)",
      "کانفیگ سیستم کیت (Kit)",
      "راه‌اندازی سیستم Auto Mine",
      "تنظیم سیستم‌های Mining و Regeneration",
      "کانفیگ TAB، Scoreboard و Chat",
      "راه‌اندازی سیستم‌های ضدتقلب و امنیتی",
      "بهینه‌سازی سرور و کاهش لگ",
      "رفع مشکلات و خطاهای پلاگین‌ها",
      "سازگاری و هماهنگ‌سازی پلاگین‌ها",
      "کانفیگ اختصاصی متناسب با نیاز مشتری",
    ],
  },
  {
    label: "برنامه‌نویسی و توسعه اختصاصی",
    options: [
      "ساخت پلاگین اختصاصی ماینکرفت",
      "توسعه قابلیت‌های جدید برای پلاگین‌ها",
      "برنامه‌نویسی سیستم‌های اختصاصی",
      "توسعه بات تلگرام",
      "ساخت ابزارهای مدیریتی",
      "اتصال سرویس‌ها به API",
      "طراحی و پیاده‌سازی سیستم‌های اتوماسیون",
      "رفع باگ و توسعه پروژه‌های موجود",
    ],
  },
  {
    label: "طراحی و توسعه وب‌سایت",
    options: [
      "طراحی سایت اختصاصی",
      "طراحی سایت شرکتی و خدماتی",
      "طراحی سایت فروشگاهی",
      "طراحی سایت معرفی سرور ماینکرفت",
      "طراحی سایت پورتفولیو و شخصی",
      "طراحی پنل مدیریت اختصاصی",
      "طراحی سیستم ثبت‌نام و ورود",
      "توسعه سیستم پشتیبانی و تیکت",
      "اتصال سایت به پایگاه داده",
      "طراحی رابط کاربری مدرن و واکنش‌گرا",
      "توسعه فرانت‌اند و بک‌اند",
      "پیاده‌سازی انیمیشن‌ها و جلوه‌های تعاملی",
      "استقرار و انتشار سایت روی هاست و سرویس‌های میزبانی",
      "رفع باگ و پشتیبانی فنی وب‌سایت",
    ],
  },
  {
    label: "خدمات سرور و زیرساخت",
    options: [
      "راه‌اندازی سرور روی VPS",
      "نصب و تنظیم محیط اجرای سرور",
      "راه‌اندازی پروکسی Velocity",
      "اتصال چند سرور به یکدیگر",
      "تنظیم شبکه سرورها",
      "مدیریت منابع و بهینه‌سازی عملکرد",
      "تنظیمات امنیتی و دسترسی‌ها",
      "بررسی مشکلات زیرساختی",
    ],
  },
  {
    label: "پشتیبانی و خدمات فنی",
    options: [
      "بررسی و عیب‌یابی مشکلات",
      "رفع خطاهای سرور",
      "بررسی مشکلات پلاگین‌ها",
      "به‌روزرسانی و نگهداری پروژه‌ها",
      "اعمال تغییرات در پروژه‌های قبلی",
      "مشاوره فنی برای راه‌اندازی مجموعه",
      "پشتیبانی پس از تحویل طبق توافق پروژه",
    ],
  },
  { label: "سایر", options: ["سایر خدمات"] },
];

const serviceOptions = serviceGroups.flatMap(group => group.options);

export default function ServiceRequestForm() {
  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [service, setService] = useState(serviceOptions[0]);
  const [priority, setPriority] = useState("normal");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, telegram, service, priority, details }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "ارسال درخواست انجام نشد.");
      setStatus("success");
      setName("");
      setTelegram("");
      setService(serviceOptions[0]);
      setPriority("normal");
      setDetails("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "خطایی در ارسال درخواست رخ داد.");
      setStatus("error");
    }
  }

  function handleDetailsKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form className="service-request-form" onSubmit={submitRequest}>
      <div className="service-request-fields">
        <label>
          نام و نام خانوادگی
          <input value={name} onChange={event => setName(event.target.value)} placeholder="مثلاً مهبد رضایی" maxLength={100} required />
        </label>
        <label>
          آیدی تلگرام یا راه ارتباطی
          <input value={telegram} onChange={event => setTelegram(event.target.value)} placeholder="@username" maxLength={100} required dir="ltr" />
        </label>
        <label className="service-request-full">
          نوع خدمات
          <select value={service} onChange={event => setService(event.target.value)} required>
            {serviceGroups.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map(option => <option key={option} value={option}>{option}</option>)}
              </optgroup>
            ))}
          </select>
          <span className="service-request-hint">خدمت دقیق موردنظرت رو از دسته‌بندی مربوط انتخاب کن.</span>
        </label>
        <fieldset className="service-request-priority">
          <legend>اولویت درخواست</legend>
          <div className="service-priority-options">
            <label className={priority === "normal" ? "selected" : ""}><input type="radio" name="priority" value="normal" checked={priority === "normal"} onChange={() => setPriority("normal")} /><span>عادی</span></label>
            <label className={priority === "urgent" ? "selected" : ""}><input type="radio" name="priority" value="urgent" checked={priority === "urgent"} onChange={() => setPriority("urgent")} /><span>فوری</span></label>
            <label className={priority === "critical" ? "selected" : ""}><input type="radio" name="priority" value="critical" checked={priority === "critical"} onChange={() => setPriority("critical")} /><span>اضطراری</span></label>
          </div>
        </fieldset>
        <label className="service-request-full">
          توضیحات کامل پروژه
          <textarea
            value={details}
            onChange={event => setDetails(event.target.value)}
            onKeyDown={handleDetailsKeyDown}
            placeholder={"دقیق توضیح بده چه چیزی نیاز داری...\n\nنسخه سرور، پلاگین‌های فعلی، امکانات موردنظر، بودجه و زمان‌بندی مدنظرت رو بنویس.\n\nEnter برای ارسال · Shift + Enter برای رفتن به خط بعد"}
            rows={7}
            maxLength={3000}
            required
          />
          <span className="service-request-hint"><span>Enter: ارسال · Shift + Enter: خط جدید</span><span>{details.length}/3000</span></span>
        </label>
      </div>

      {status === "success" && <div className="service-request-feedback success"><CheckCircle2 size={18} /> درخواستت با موفقیت برای تیم NexvorDEV ارسال شد.</div>}
      {status === "error" && <div className="service-request-feedback error"><AlertCircle size={18} /> {error}</div>}

      <button className="service-request-submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? <LoaderCircle className="service-request-spinner" size={18} /> : <Send size={17} />}
        {status === "sending" ? "در حال ارسال..." : "ارسال درخواست"}
      </button>
      <p className="service-request-footnote">بعد از بررسی درخواست، برای ادامه هماهنگی با شما ارتباط می‌گیریم.</p>
    </form>
  );
}
