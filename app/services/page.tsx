import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft } from "lucide-react";
import { PageHero, PageShell } from "@/components/site-chrome";
import { serviceGroups } from "@/lib/services";
import "./services.css";

const descriptions: Record<string, string> = {
  "خدمات ماینکرفت": "از نصب و کانفیگ پلاگین تا ساخت گیم‌مود، تنظیم اقتصاد، رفع خطا و بهینه‌سازی سرورهای ماینکرفت.",
  "برنامه‌نویسی و توسعه اختصاصی": "پیاده‌سازی قابلیت‌های سفارشی، پلاگین اختصاصی، ربات تلگرام، ابزار مدیریتی و اتصال سرویس‌ها به API.",
  "طراحی و توسعه وب‌سایت": "طراحی و توسعه وب‌سایت شرکتی و فروشگاهی، پنل مدیریت، سیستم ورود، تیکت و زیرساخت فرانت‌اند و بک‌اند.",
  "خدمات سرور و زیرساخت": "راه‌اندازی VPS، نصب محیط اجرا، پیکربندی ولوسیتی، اتصال سرورها و بهبود امنیت و عملکرد زیرساخت.",
  "پشتیبانی و خدمات فنی": "عیب‌یابی، رفع خطا، نگهداری، به‌روزرسانی و مشاوره فنی برای پروژه‌های نرم‌افزاری و سرور.",
};

const groups = serviceGroups.filter((group) => group.label !== "سایر");
const allServices = groups.flatMap((group) => group.options);

export const metadata: Metadata = {
  title: "فهرست خدمات برنامه‌نویسی، طراحی سایت و سرور بازی",
  description:
    "فهرست خدمات NexvorDEV شامل نصب و کانفیگ پلاگین ماینکرفت، ساخت پلاگین اختصاصی، طراحی سایت، برنامه‌نویسی، راه‌اندازی VPS، پروکسی ولوسیتی و پشتیبانی فنی.",
  keywords: [
    "خدمات ماینکرفت",
    "نصب پلاگین ماینکرفت",
    "کانفیگ سرور ماینکرفت",
    "ساخت پلاگین اختصاصی ماینکرفت",
    "بهینه‌سازی سرور ماینکرفت",
    "طراحی سایت اختصاصی",
    "طراحی سایت فروشگاهی",
    "برنامه‌نویسی اختصاصی",
    "ساخت ربات تلگرام",
    "راه‌اندازی سرور VPS",
    "پروکسی ولوسیتی",
    "پشتیبانی فنی سایت",
    "NexvorDEV",
  ],
  alternates: { canonical: "/services" },
  openGraph: {
    title: "فهرست خدمات NexvorDEV",
    description:
      "تمام خدمات توسعه نرم‌افزار، طراحی وب‌سایت، راه‌اندازی و پشتیبانی سرورهای بازی در یک صفحه.",
    url: "/services",
    type: "website",
  },
};

export default function ServicesPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "فهرست خدمات NexvorDEV",
    description: metadata.description,
    url: "https://nexvordev.ir/services",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: allServices.length,
      itemListElement: allServices.map((name, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: { "@type": "Service", name, provider: { "@type": "Organization", name: "NexvorDEV", url: "https://nexvordev.ir" } },
      })),
    },
  };

  return (
    <PageShell active="/services">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PageHero
        badge={<><span className="hx-live" /> خدمات NexvorDEV</>}
        title="از ایده تا اجرا؛"
        accent="خدمات فنی در یک مسیر."
        lead="خدمات توسعه نرم‌افزار، طراحی وب‌سایت و سرورهای بازی را بررسی کن. هر مورد بر اساس نیاز واقعی پروژه تعریف و پس از هماهنگی اجرا می‌شود."
      >
        <div className="hx-actions">
          <Link className="hx-cta" href="/request" data-magnetic>
            ثبت درخواست <ArrowLeft size={18} />
          </Link>
          <Link className="hx-ghost" href="/pricing">مشاهده تعرفه‌ها</Link>
        </div>
      </PageHero>

      <section className="hx-section hx-seo-services">
        <div className="hx-wrap">
          <div className="hx-head" data-reveal>
            <h2>تمام خدمات، دسته‌بندی‌شده</h2>
            <p>در حال حاضر {allServices.length.toLocaleString("fa-IR")} خدمت در پنج دسته ارائه می‌شود. برای هر پروژه، محدوده کار و هزینه پیش از شروع مشخص خواهد شد.</p>
          </div>
          <div className="hx-seo-groups">
            {groups.map((group, index) => (
              <section className="hx-seo-group" key={group.label} aria-labelledby={`service-group-${index}`} data-reveal>
                <div className="hx-seo-group-head">
                  <span className="hx-seo-index">{(index + 1).toLocaleString("fa-IR")}</span>
                  <div>
                    <h3 id={`service-group-${index}`}>{group.label}</h3>
                    <p>{descriptions[group.label]}</p>
                  </div>
                </div>
                <ul className="hx-seo-list">
                  {group.options.map((service) => (
                    <li key={service}>
                      <span aria-hidden="true" />
                      {service}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <div className="hx-seo-cta" data-reveal>
            <div>
              <h2>خدمت موردنظرت رو پیدا نکردی؟</h2>
              <p>جزئیات پروژه‌ات رو بفرست تا امکان اجرا و مسیر مناسب بررسی بشه.</p>
            </div>
            <Link className="hx-cta" href="/request">ثبت سفارش <ArrowUpLeft size={18} /></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
