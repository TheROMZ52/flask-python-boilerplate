import type { Metadata } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import "./globals.css";
import "./home.css";
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

const siteUrl = "https://nexvordev.ir";
const socialImage = `${siteUrl}/nexvordev-social-card.jpg?v=6`;

export const metadata: Metadata = {
  title: {
    default: "خدمات تخصصی ماینکرفت و سرور بازی | NexvorDEV",
    template: "%s | NexvorDEV",
  },
  description: "NexvorDEV؛ راه‌اندازی و کانفیگ سرور ماینکرفت، پلاگین و بات اختصاصی، طراحی وب‌سایت و زیرساخت سرور؛ با هزینه‌ی روشن قبل از شروع.",
  applicationName: "NexvorDEV",
  verification: { google: "LVRc98jd-dbb5DyF77arcvzGDLlp46q1fneg0IX3ZFc" },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/nexvordev-logo.jpg",
  },
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "خدمات تخصصی ماینکرفت و سرور بازی | NexvorDEV",
    description: "راه‌اندازی سرور، پلاگین و بات اختصاصی، طراحی وب‌سایت و زیرساخت.",
    siteName: "NexvorDEV",
    locale: "fa_IR",
    type: "website",
    url: siteUrl,
    images: [
      {
        url: socialImage,
        width: 700,
        height: 247,
        type: "image/jpeg",
        alt: "NexvorDEV — Development • Web • Minecraft",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "خدمات تخصصی ماینکرفت و سرور بازی | NexvorDEV",
    description: "راه‌اندازی سرور، پلاگین و بات اختصاصی، طراحی وب‌سایت و زیرساخت.",
    images: [{ url: socialImage, width: 700, height: 247 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
      </head>
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
