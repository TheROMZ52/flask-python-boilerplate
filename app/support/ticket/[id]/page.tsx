import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SupportChat from "@/components/support-chat";

export const metadata = { title: "گفت‌وگوی پشتیبانی | NexvorDEV" };
type Props = { params: Promise<{ id: string }> };

export default async function SupportTicketPage({ params }: Props) {
  const { id } = await params;
  return <main className="support-page"><div className="support-shell">
    <Link href="/" className="support-back"><ArrowRight size={16} /> بازگشت به سایت</Link>
    <section className="support-card"><SupportChat ticketId={id} /></section>
  </div></main>;
}
