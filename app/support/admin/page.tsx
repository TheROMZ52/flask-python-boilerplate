import SupportAdmin from "@/components/support-admin";
import { PageShell } from "@/components/site-chrome";

export const metadata = { title: "مدیریت پشتیبانی", robots: { index: false, follow: false } };

export default function SupportAdminPage() {
  return (
    <PageShell active="/support/admin" bare>
      <section className="hx-section hx-chat-section"><div className="hx-wrap"><SupportAdmin /></div></section>
    </PageShell>
  );
}
