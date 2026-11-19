import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function SupportLauncher() {
  return <Link className="support-launcher" href="/support" aria-label="گفت‌وگو با پشتیبانی"><MessageCircle size={22} /><span>پشتیبانی</span></Link>;
}
