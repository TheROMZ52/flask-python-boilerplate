"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Download, Mail } from "lucide-react";

export default function InvoiceActions({ id }: { id: string }) {
  const [state, setState] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function resend() {
    setState("busy"); setMessage("");
    try {
      const response = await fetch(`/api/account/invoices/${id}/resend`, { method: "POST" });
      const result = await response.json();
      setState(result.ok ? "ok" : "error");
      setMessage(result.ok ? "فاکتور دوباره به ایمیلت ارسال شد." : result.error || "ارسال انجام نشد.");
    } catch { setState("error"); setMessage("اتصال برقرار نشد."); }
  }

  return (
    <div className="inv-actions">
      <a className="hx-cta hx-cta-sm" href={`/api/account/invoices/${id}/pdf`}><Download size={15} /> دانلود PDF</a>
      <button className="hx-ghost" type="button" onClick={resend} disabled={state === "busy"}><Mail size={15} /> {state === "busy" ? "در حال ارسال…" : "ارسال مجدد به ایمیل"}</button>
      <Link className="hx-ghost" href="/account?tab=invoices"><ArrowRight size={15} /> بازگشت</Link>
      {message && <p className={state === "ok" ? "account-notice" : "account-error"} role="status">{message}</p>}
    </div>
  );
}
