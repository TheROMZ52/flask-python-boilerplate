import "../pages.css";
import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";

export const metadata: Metadata = {
  title: "شرایط و قوانین استفاده",
  description: "شرایط استفاده از خدمات، ثبت سفارش، پرداخت و پشتیبانی NexvorDEV.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}
