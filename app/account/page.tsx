import "../pages.css";
import type { Metadata } from "next";
import AccountForm from "@/components/account-form";
import { PageShell } from "@/components/site-chrome";

export const metadata: Metadata = { title: "حساب کاربری", alternates: { canonical: "/account" } };

export default function AccountPage() {
  return (
    <PageShell active="/account" bare>
      <section className="hx-account"><AccountForm /></section>
    </PageShell>
  );
}
