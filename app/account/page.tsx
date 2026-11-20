import type { Metadata } from "next";
import Image from "next/image";
import AccountForm from "@/components/account-form";

export const metadata: Metadata = { title: "حساب کاربری", alternates: { canonical: "/account" } };

export default function AccountPage() {
  return (
    <main className="account-page">
      <a className="brand account-brand" href="/"><Image className="brand-logo" src="/nexvordev-logo.jpg" alt="لوگوی NexvorDEV" width={44} height={44} priority /><span>NEXVOR<span className="brand-accent">DEV</span><small>DEVELOPMENT</small></span></a>
      <AccountForm />
    </main>
  );
}
