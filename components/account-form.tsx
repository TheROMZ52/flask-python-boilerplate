"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Lock, LogOut, Mail, ShieldCheck } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Mode = "signup" | "login";

const messages: Record<string, string> = {
  "Invalid login credentials": "ایمیل یا رمز عبور درست نیست.",
  "User already registered": "با این ایمیل قبلاً حساب ساخته شده است.",
  "Email not confirmed": "ابتدا ایمیل خود را تأیید کنید.",
};

function GoogleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 0 1 0-12.4c1.9 0 3.2.8 3.9 1.5l2.7-2.6A9.9 9.9 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-2H12z" /></svg>;
}

function GithubIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" /></svg>;
}

export default function AccountForm() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error")) setError("ورود انجام نشد، دوباره تلاش کنید.");
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null)).finally(() => setReady(true));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setEmail(session?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const address = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    setBusy(true);
    setError("");
    setNotice("");
    if (mode === "signup") {
      const { data, error: failure } = await supabase.auth.signUp({ email: address, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (failure) setError(messages[failure.message] || (failure.message.includes("at least") ? "رمز عبور باید حداقل ۸ کاراکتر باشد." : "ساخت حساب انجام نشد."));
      else if (!data.session) setNotice("لینک تأیید به ایمیل شما ارسال شد. بعد از تأیید وارد شوید.");
    } else {
      const { error: failure } = await supabase.auth.signInWithPassword({ email: address, password });
      if (failure) setError(messages[failure.message] || "ورود انجام نشد.");
    }
    setBusy(false);
  }

  async function social(provider: "google" | "github") {
    setError("");
    const { error: failure } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (failure) setError("ورود با این روش در دسترس نیست.");
  }

  return (
    <div className="account-orb">
      <div className="account-ring" aria-hidden />
      <div className="account-card">
        <span className="account-kicker">NEXVORDEV</span>
        {!ready ? null : email ? (
          <>
            <h1>خوش آمدی</h1>
            <p className="account-sub" dir="ltr">{email}</p>
            <a className="account-submit" href="/support">پشتیبانی و تیکت‌ها</a>
            <button className="account-link" type="button" onClick={() => supabase.auth.signOut()}><LogOut size={13} /> خروج از حساب</button>
          </>
        ) : (
          <>
            <h1>{mode === "signup" ? "ساخت حساب کاربری" : "ورود به حساب"}</h1>
            <p className="account-sub">{mode === "signup" ? "در چند ثانیه حساب خودتان را بسازید" : "به حساب کاربری خود وارد شوید"}</p>
            <div className="account-social">
              <button type="button" onClick={() => social("google")}><GoogleIcon /> گوگل</button>
              <button type="button" onClick={() => social("github")}><GithubIcon /> گیت‌هاب</button>
            </div>
            <div className="account-or"><span>یا</span></div>
            <form onSubmit={submit} className="account-fields">
              <label className="account-field"><Mail size={15} /><input name="email" type="email" dir="ltr" autoComplete="email" placeholder="ایمیل" required /></label>
              <label className="account-field"><Lock size={15} /><input name="password" type={show ? "text" : "password"} dir="ltr" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="رمز عبور" required minLength={mode === "signup" ? 8 : 1} />
                <button type="button" className="account-eye" onClick={() => setShow(!show)} aria-label="نمایش رمز">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </label>
              {error && <p className="account-error" role="alert">{error}</p>}
              {notice && <p className="account-notice" role="status">{notice}</p>}
              <button className="account-submit" type="submit" disabled={busy}>{busy ? "کمی صبر کنید…" : mode === "signup" ? "ساخت حساب" : "ورود"}</button>
            </form>
            <p className="account-switch">
              {mode === "signup" ? "قبلاً حساب ساخته‌اید؟" : "هنوز حساب ندارید؟"}{" "}
              <button type="button" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setNotice(""); }}>{mode === "signup" ? "ورود" : "ساخت حساب"}</button>
            </p>
          </>
        )}
      </div>
      <p className="account-secure"><ShieldCheck size={14} /> اطلاعات حساب شما محفوظ و امن است</p>
    </div>
  );
}
