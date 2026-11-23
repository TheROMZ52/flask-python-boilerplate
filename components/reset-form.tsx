"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function ResetForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password !== String(form.get("confirm") || "")) return setError("تکرار رمز با رمز جدید یکسان نیست.");
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const result = await response.json();
      if (!result.ok) setError(result.error || "تغییر رمز انجام نشد."); else setDone(true);
    } catch { setError("اتصال برقرار نشد؛ دوباره تلاش کن."); }
    setBusy(false);
  }

  return (
    <div className="account-orb">
      <div className="account-ring" aria-hidden />
      <div className="account-card">
        <span className="account-kicker">NEXVORDEV</span>
        {done ? (
          <>
            <h1>رمز تغییر کرد</h1>
            <p className="account-sub">حالا با رمز جدید وارد شو.</p>
            <Link className="account-submit" href="/account">ورود به حساب</Link>
          </>
        ) : !token ? (
          <>
            <h1>لینک نامعتبر است</h1>
            <p className="account-sub">لینک بازیابی کامل نیست. دوباره درخواست بده.</p>
            <Link className="account-submit" href="/account">بازگشت</Link>
          </>
        ) : (
          <>
            <h1>تعیین رمز جدید</h1>
            <p className="account-sub">رمز جدید حداقل ۸ کاراکتر و شامل حرف و عدد باشد.</p>
            <form onSubmit={submit} className="account-fields">
              <label className="account-field"><Lock size={15} /><input name="password" type={show ? "text" : "password"} dir="ltr" autoComplete="new-password" placeholder="رمز جدید" required minLength={8} />
                <button type="button" className="account-eye" onClick={() => setShow(!show)} aria-label="نمایش رمز">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button></label>
              <label className="account-field"><Lock size={15} /><input name="confirm" type={show ? "text" : "password"} dir="ltr" autoComplete="new-password" placeholder="تکرار رمز جدید" required minLength={8} /></label>
              {error && <p className="account-error" role="alert">{error}</p>}
              <button className="account-submit" type="submit" disabled={busy}>{busy ? "کمی صبر کنید…" : "ذخیره رمز جدید"}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
