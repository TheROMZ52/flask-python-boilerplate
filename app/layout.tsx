import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexvordev-pearl.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "NexvorDEV | زیرساخت و توسعه سرورهای بازی",
    template: "%s | NexvorDEV",
  },
  description:
    "توسعه پلاگین اختصاصی، راه‌اندازی و بهینه‌سازی سرورهای بازی با تمرکز بر ماینکرفت و کانتر استرایک.",
  applicationName: "NexvorDEV",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "NexvorDEV | زیرساختی فراتر از بازی",
    description: "از ایده تا اجرای یک سرور بازی حرفه‌ای؛ کنار شما هستیم.",
    siteName: "NexvorDEV",
    locale: "fa_IR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
