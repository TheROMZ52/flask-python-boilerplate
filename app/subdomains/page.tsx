import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Globe2, ShieldCheck, Zap } from "lucide-react";
import SubdomainOrderForm from "@/components/subdomain-order-form";
import styles from "./subdomains.module.css";
import "./subdomain-form.css";

export const metadata: Metadata = {
  title: "خرید ساب‌دامنه",
  description: "درخواست ساب‌دامنه اختصاصی روی nexvordev.ir با دوره‌های اشتراک متنوع.",
  alternates: { canonical: "/subdomains" },
};

export default function SubdomainsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.back}><ArrowRight size={16} /> بازگشت به سایت</Link>
        <header className={styles.hero}>
          <span className={styles.kicker}><Globe2 size={15} /> NEXVORDEV / SUBDOMAINS</span>
          <h1>آدرس اختصاصی خودت رو داشته باش.</h1>
          <p>برای سایت، فروشگاه، سرور بازی یا پروژه‌ات یک نام دلخواه روی دامنه NexvorDEV درخواست کن.</p>
          <div className={styles.preview} dir="ltr"><span>yourname</span>.nexvordev.ir</div>
          <div className={styles.features}>
            <span><Zap size={16} /> ثبت درخواست ساده</span>
            <span><ShieldCheck size={16} /> بررسی نام پیش از فعال‌سازی</span>
            <span><Globe2 size={16} /> مناسب سایت و سرور</span>
          </div>
        </header>
        <section className={styles.card}>
          <div className={styles.cardHead}><span>SUBDOMAIN ORDER</span><h2>درخواست خرید ساب‌دامنه</h2><p>مدت اشتراک و نام موردنظرت رو انتخاب کن.</p></div>
          <SubdomainOrderForm />
        </section>
        <footer className={styles.foot}><Link href="/">NexvorDEV</Link><span>© {new Date().getFullYear()} · همه حقوق محفوظ است.</span><Link href="/terms">شرایط استفاده</Link></footer>
      </div>
    </main>
  );
}
