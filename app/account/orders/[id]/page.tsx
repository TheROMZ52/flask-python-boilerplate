import "../../../pages.css";
import { PageShell } from "@/components/site-chrome";
import OrderChat from "@/components/order-chat";
import { currentAccount } from "@/lib/auth/account";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };
export const metadata = { title: "گفت‌وگوی سفارش", robots: { index: false, follow: false } };

export default async function OrderPage({ params }: Props) {
  const account = await currentAccount();
  if (!account?.verified) redirect("/account");
  const { id } = await params;
  return <PageShell active="/account" bare><section className="hx-section hx-chat-section"><div className="hx-wrap"><OrderChat orderId={id} /></div></section></PageShell>;
}
