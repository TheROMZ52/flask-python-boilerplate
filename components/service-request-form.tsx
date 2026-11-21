"use client";

import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { useProfile } from "@/lib/use-profile";
import { serviceGroups, serviceOptions } from "@/lib/services";
import { AlertCircle, CheckCircle2, LoaderCircle, Send } from "lucide-react";


export default function ServiceRequestForm() {
  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [service, setService] = useState(serviceOptions[0]);
  const [priority, setPriority] = useState("normal");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const profile = useProfile();

  useEffect(() => {
    if (!profile) return;
    setName(current => current || profile.name);
    setTelegram(current => current || (profile.telegram ? `@${profile.telegram}` : ""));
  }, [profile]);

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
