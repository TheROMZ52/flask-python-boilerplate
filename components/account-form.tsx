"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, LogOut, Mail, ShieldCheck, User } from "lucide-react";

type Mode = "signup" | "login";

export default function AccountForm() {
  const [mode, setMode] = useState<Mode>("signup");
  const [user, setUser] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    fetch("/api/account").then(r => r.json()).then(d => setUser(d.user?.username ?? null)).catch(() => {}).finally(() => setReady(true));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, username: data.get("username"), email: data.get("email"), password: data.get("password"), remember }),
      });
      const result = await response.json();
      if (!result.ok) setError(result.error || "مشکلی پیش آمد.");
      else setUser(result.user.username);
    } catch {
      setError("اتصال برقرار نشد، دوباره تلاش کنید.");
    }
    setBusy(false);
  }

  async function logout() {
    await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    setUser(null);
  }

  return (
    <div className="account-orb">
      <div className="account-ring" aria-hidden />
      <div className="account-card">
        <span className="account-kicker">NEXVORDEV</span>
        {!ready ? null : user ? (
          <>
            <h1>خوش آمدی</h1>
            <p className="account-sub" dir="ltr">{user}</p>
            <a className="account-submit" href="/support">پشتیبانی و تیکت‌ها</a>
            <button className="account-link" type="button" onClick={logout}><LogOut size={13} /> خروج از حساب</button>
          </>
        ) : (
          <>
            <h1>{mode === "signup" ? "ساخت حساب کاربری" : "ورود به حساب"}</h1>
            <p className="account-sub">{mode === "signup" ? "در چند ثانیه حساب خودتان را بسازید" : "به حساب کاربری خود وارد شوید"}</p>
            <form onSubmit={submit} className="account-fields">
              <label className="account-field"><User size={15} /><input name="username" dir="ltr" autoComplete="username" placeholder="نام کاربری" required minLength={3} maxLength={24} /></label>
              {mode === "signup" && <label className="account-field"><Mail size={15} /><input name="email" type="email" dir="ltr" autoComplete="email" placeholder="ایمیل (اختیاری)" /></label>}
              <label className="account-field"><Lock size={15} /><input name="password" type={show ? "text" : "password"} dir="ltr" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="رمز عبور" required minLength={mode === "signup" ? 8 : 1} />
                <button type="button" className="account-eye" onClick={() => setShow(!show)} aria-label="نمایش رمز">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </label>
              <label className="account-remember"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> مرا به خاطر بسپار</label>
              {error && <p className="account-error" role="alert">{error}</p>}
              <button className="account-submit" type="submit" disabled={busy}>{busy ? "کمی صبر کنید…" : mode === "signup" ? "ساخت حساب" : "ورود"}</button>
            </form>
            <p className="account-switch">
              {mode === "signup" ? "قبلاً حساب ساخته‌اید؟" : "هنوز حساب ندارید؟"}{" "}
              <button type="button" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }}>{mode === "signup" ? "ورود" : "ساخت حساب"}</button>
            </p>
          </>
        )}
      </div>
      <p className="account-secure"><ShieldCheck size={14} /> اطلاعات حساب شما محفوظ و امن است</p>
    </div>
  );
}
