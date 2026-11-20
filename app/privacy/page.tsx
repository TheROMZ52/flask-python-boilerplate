import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";

export const metadata: Metadata = {
  title: "سیاست حفظ حریم خصوصی",
  description: "سیاست حفظ حریم خصوصی و نحوه جمع‌آوری، استفاده و نگهداری اطلاعات در NexvorDEV.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}
