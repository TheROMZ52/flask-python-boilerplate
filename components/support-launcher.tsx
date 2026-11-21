"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

export default function SupportLauncher() {
  const pathname = usePathname();
  if (pathname?.startsWith("/support") || pathname === "/account") return null;
  return <Link className="support-launcher" href="/support" aria-label="گفت‌وگو با پشتیبانی"><MessageCircle size={22} /><span>پشتیبانی</span></Link>;
}
