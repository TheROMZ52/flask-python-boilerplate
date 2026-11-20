import type { Metadata } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import "./globals.css";
import SupportLauncher from "@/components/support-launcher";

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
const socialImage = "/og-preview.png?v=1";

export const metadata: Metadata = {
  title: {
    default: "NexvorDEV | Development • Web • Minecraft",
    template: "%s | NexvorDEV",
  },
  description: "NexvorDEV؛ توسعه، وب و ماینکرفت — از ایده تا اجرا.",
  applicationName: "NexvorDEV",
  verification: { google: "UBGnEutATLIfEjjhY1bx48d_CIKWmrfUd_Xz22AvRU8" },
  other: { enamad: ["4459776", "۴۴۵۹۷۷۶"] },
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/nexvordev-logo.jpg",
  },
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "NexvorDEV | Development • Web • Minecraft",
    description: "توسعه، وب و ماینکرفت — از ایده تا اجرا.",
    siteName: "NexvorDEV",
    locale: "fa_IR",
    type: "website",
    url: siteUrl,
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: "NexvorDEV — Development • Web • Minecraft",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NexvorDEV | Development • Web • Minecraft",
    description: "توسعه، وب و ماینکرفت — از ایده تا اجرا.",
    images: [socialImage],
  },
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
        <SupportLauncher />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "NexvorDEV",
              url: siteUrl,
              logo: `${siteUrl}/nexvordev-logo.jpg`,
              description:
                "توسعه پلاگین اختصاصی، راه‌اندازی، کانفیگ و بهینه‌سازی سرورهای بازی.",
              sameAs: ["https://t.me/TheROMZDEV"],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "sales and support",
                url: "https://t.me/TheROMZDEV",
                availableLanguage: ["fa"],
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
