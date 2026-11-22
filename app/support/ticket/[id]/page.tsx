import "../../../pages.css";
import SupportChat from "@/components/support-chat";
import { PageShell } from "@/components/site-chrome";

export const metadata = { title: "گفت‌وگوی پشتیبانی", robots: { index: false, follow: false } };
type Props = { params: Promise<{ id: string }> };

export default async function SupportTicketPage({ params }: Props) {
  const { id } = await params;
  return (
    <PageShell active="/support">
      <section className="hx-section hx-chat-section"><div className="hx-wrap hx-narrow"><div className="hx-glass hx-form-card"><SupportChat ticketId={id} /></div></div></section>
    </PageShell>
  );
}
