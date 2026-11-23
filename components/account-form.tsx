"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail, MailCheck, ShieldCheck, User } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import AccountDashboard from "@/components/account-dashboard";

type Mode = "signup" | "login" | "forgot" | "sent";

const messages: Record<string, string> = {
  "Invalid login credentials": "ایمیل یا رمز عبور درست نیست.",
  "Email not confirmed": "ایمیل شما هنوز تأیید نشده است. لینک ارسال‌شده به ایمیلت را باز کن.",
};

function GoogleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 0 1 0-12.4c1.9 0 3.2.8 3.9 1.5l2.7-2.6A9.9 9.9 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-2H12z" /></svg>;
}
function GithubIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" /></svg>;
}
function DiscordIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2" aria-hidden><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 2.9l-.2.4c-.2.4-.4.9-.6 1.3a18.3 18.3 0 0 0-5.5 0c-.2-.4-.4-.9-.6-1.3l-.2-.4A19.7 19.7 0 0 0 3.7 4.4C.5 9 -.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3c.5-.6.9-1.3 1.2-2-.7-.2-1.3-.5-1.9-.9l.2-.1a14.2 14.2 0 0 0 12.1 0l.2.1c-.6.4-1.2.7-1.9.9.4.7.8 1.4 1.2 2a19.9 19.9 0 0 0 6-3c.5-5.2-.8-9.7-3.5-13.7zM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4z" /></svg>;
}

const safeNext = (value: string | null) => (value && value.startsWith("/") && !value.startsWith("//") ? value : "");

export default function AccountForm() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [mode, setMode] = useState<Mode>("login");
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [show, setShow] = useState(false);
  const [sentTo, setSentTo] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verify = params.get("verify");
    if (verify === "ok") setNotice("ایمیلت تأیید شد؛ حالا وارد شو.");
    else if (verify) setError("لینک تأیید نامعتبر یا منقضی شده است. در صفحه ورود، ارسال مجدد را بزن.");
    if (params.get("error")) setError("ورود انجام نشد، دوباره تلاش کن.");
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user)).finally(() => setReady(true));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(!!session?.user));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function post(url: string, payload: Record<string, unknown>) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return (await response.json().catch(() => ({ ok: false }))) as { ok?: boolean; error?: string };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "signup") {
        const result = await post("/api/auth/signup", { first_name: form.get("first_name"), last_name: form.get("last_name"), email, password });
        if (result.ok) { setSentTo(email); setMode("sent"); } else setError(result.error || "ساخت حساب انجام نشد.");
      } else if (mode === "forgot") {
        const result = await post("/api/auth/forgot", { email });
        if (result.ok) setNotice("اگر این ایمیل ثبت شده باشد، لینک بازیابی برایش ارسال شد."); else setError(result.error || "ارسال انجام نشد.");
      } else {
        const { error: failure } = await supabase.auth.signInWithPassword({ email, password });
        if (failure) {
          setError(messages[failure.message] || "ورود انجام نشد.");
          if (failure.message === "Email not confirmed") setSentTo(email);
        } else {
          const next = safeNext(new URLSearchParams(window.location.search).get("next"));
          const overview = await fetch("/api/account/overview", { cache: "no-store" }).then(r => r.json()).catch(() => null);
          if (next && overview?.user?.verified) window.location.assign(next);
        }
      }
    } catch { setError("اتصال برقرار نشد، دوباره تلاش کن."); }
    setBusy(false);
  }

  async function resend() {
    if (!sentTo) return;
    setBusy(true); setError("");
    const result = await post("/api/auth/resend", { email: sentTo });
    setBusy(false);
    if (result.ok) setNotice("ایمیل تأیید دوباره ارسال شد."); else setError(result.error || "ارسال انجام نشد.");
  }

  async function social(provider: "google" | "github" | "discord") {
    setError("");
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    const { error: failure } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}` } });
    if (failure) setError("ورود با این روش در دسترس نیست.");
  }

  if (ready && signedIn) return <AccountDashboard />;

  const title = mode === "signup" ? "ساخت حساب کاربری" : mode === "forgot" ? "بازیابی رمز عبور" : mode === "sent" ? "ایمیل خود را بررسی کن" : "ورود به حساب";
  const sub = mode === "signup" ? "با ایمیل خودت حساب بساز" : mode === "forgot" ? "ایمیل حسابت را وارد کن تا لینک بازیابی بفرستیم" : mode === "sent" ? "" : "به حساب کاربری خود وارد شو";

  return (
    <div className="account-orb">
      <div className="account-ring" aria-hidden />
      <div className="account-card">
        <span className="account-kicker">NEXVORDEV</span>
        {!ready ? null : mode === "sent" ? (
          <>
            <MailCheck size={34} className="account-mailicon" />
            <h1>{title}</h1>
            <p className="account-sub">لینک تأیید به <b dir="ltr">{sentTo}</b> ارسال شد. بعد از تأیید می‌توانی وارد شوی.</p>
            {error && <p className="account-error" role="alert">{error}</p>}
            {notice && <p className="account-notice" role="status">{notice}</p>}
            <button className="account-submit" type="button" onClick={resend} disabled={busy}>{busy ? "کمی صبر کن…" : "ارسال مجدد ایمیل"}</button>
            <button className="account-link" type="button" onClick={() => { setMode("login"); setError(""); setNotice(""); }}>بازگشت به ورود</button>
          </>
        ) : (
          <>
            <h1>{title}</h1>
            <p className="account-sub">{sub}</p>
            {mode !== "forgot" && (
              <>
                <div className="account-social">
                  <button type="button" onClick={() => social("google")}><GoogleIcon /> گوگل</button>
                  <button type="button" onClick={() => social("github")}><GithubIcon /> گیت‌هاب</button>
                  <button type="button" onClick={() => social("discord")}><DiscordIcon /> دیسکورد</button>
                </div>
                <div className="account-or"><span>یا</span></div>
              </>
            )}
            <form onSubmit={submit} className="account-fields">
              {mode === "signup" && (
                <div className="account-two">
                  <label className="account-field"><User size={15} /><input name="first_name" autoComplete="given-name" placeholder="نام" required minLength={2} maxLength={40} /></label>
                  <label className="account-field"><input name="last_name" autoComplete="family-name" placeholder="نام خانوادگی" required minLength={2} maxLength={40} /></label>
                </div>
              )}
              <label className="account-field"><Mail size={15} /><input name="email" type="email" dir="ltr" autoComplete="email" placeholder="ایمیل" required /></label>
              {mode !== "forgot" && (
                <label className="account-field"><Lock size={15} /><input name="password" type={show ? "text" : "password"} dir="ltr" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="رمز عبور" required minLength={mode === "signup" ? 8 : 1} />
                  <button type="button" className="account-eye" onClick={() => setShow(!show)} aria-label="نمایش رمز">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </label>
              )}
              {mode === "signup" && <p className="account-hint">رمز حداقل ۸ کاراکتر و شامل حرف انگلیسی و عدد باشد.</p>}
              {mode === "login" && <button type="button" className="account-forgot" onClick={() => { setMode("forgot"); setError(""); setNotice(""); }}>رمز عبورت را فراموش کرده‌ای؟</button>}
              {error && <p className="account-error" role="alert">{error}</p>}
              {notice && <p className="account-notice" role="status">{notice}</p>}
              {sentTo && mode === "login" && error.includes("تأیید") && <button type="button" className="account-link" onClick={resend}>ارسال مجدد ایمیل تأیید</button>}
              <button className="account-submit" type="submit" disabled={busy}>{busy ? "کمی صبر کن…" : mode === "signup" ? "ساخت حساب" : mode === "forgot" ? "ارسال لینک بازیابی" : "ورود"}</button>
            </form>
            <p className="account-switch">
              {mode === "signup" ? "قبلاً حساب ساخته‌ای؟" : mode === "forgot" ? "یادت اومد؟" : "هنوز حساب نداری؟"}{" "}
              <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setNotice(""); }}>{mode === "login" ? "ساخت حساب" : "ورود"}</button>
            </p>
          </>
        )}
      </div>
      <p className="account-secure"><ShieldCheck size={14} /> اطلاعات حساب شما محفوظ است</p>
    </div>
  );
}
