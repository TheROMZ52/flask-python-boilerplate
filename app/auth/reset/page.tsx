import type { Metadata } from "next";
import ResetForm from "@/components/reset-form";
import { PageShell } from "@/components/site-chrome";

export const metadata: Metadata = { title: "تعیین رمز جدید", robots: { index: false, follow: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <PageShell bare>
      <section className="hx-account"><ResetForm token={token || ""} /></section>
    </PageShell>
  );
}
