import type { Metadata } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = "https://nexvordev-site.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "NexvorDEV | زیرساخت و توسعه سرورهای بازی",
    template: "%s | NexvorDEV",
  },
  description:
    "توسعه پلاگین اختصاصی، راه‌اندازی و بهینه‌سازی سرورهای بازی با تمرکز بر ماینکرفت و کانتر استرایک.",
  applicationName: "NexvorDEV",
  alternates: { canonical: "/" },
  icons: { icon: "/nexvordev-logo.jpg", shortcut: "/nexvordev-logo.jpg", apple: "/nexvordev-logo.jpg" },
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "NexvorDEV | زیرساختی فراتر از بازی",
    description: "از ایده تا اجرای یک سرور بازی حرفه‌ای؛ کنار شما هستیم.",
    siteName: "NexvorDEV",
    locale: "fa_IR",
    type: "website",
    url: siteUrl,
    images: [{ url: "/nexvordev-logo.jpg", width: 180, height: 180, alt: "لوگوی NexvorDEV" }],
  },
  twitter: { card: "summary", title: "NexvorDEV | توسعه سرورهای بازی", description: "توسعه پلاگین، راه‌اندازی و بهینه‌سازی سرورهای بازی.", images: ["/nexvordev-logo.jpg"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.variable} ${inter.variable}`}>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "NexvorDEV", url: siteUrl, logo: `${siteUrl}/nexvordev-logo.jpg`, description: "توسعه پلاگین اختصاصی، راه‌اندازی، کانفیگ و بهینه‌سازی سرورهای بازی.", sameAs: ["https://t.me/TheROMZDEV"], contactPoint: { "@type": "ContactPoint", contactType: "sales and support", url: "https://t.me/TheROMZDEV", availableLanguage: ["fa"] } }) }} />
      </body>
    </html>
  );
}
