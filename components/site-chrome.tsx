import Image from "next/image";
import Link from "next/link";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { ArrowUpLeft } from "lucide-react";
import HomeFx from "@/components/home-fx";

const links = [
  { href: "/#services", label: "خدمات" },
  { href: "/pricing", label: "تعرفه" },
  { href: "/subdomains", label: "ساب‌دامنه" },
  { href: "/#process", label: "طرز کار" },
  { href: "/support", label: "پشتیبانی" },
  { href: "/account", label: "حساب کاربری" },
];

export function Words({ text }: { text: string }) {
  return <>{text.split(" ").map((word, index) => <Fragment key={index}><span className="hx-w"><span style={{ "--i": index } as CSSProperties}>{word}</span></span>{" "}</Fragment>)}</>;
}

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="hx-header">
      <div className="hx-bar">
        <Link className="hx-brand" href="/" aria-label="NexvorDEV صفحه اصلی"><Image src="/nexvordev-logo.jpg" alt="لوگوی NexvorDEV" width={38} height={38} /><span>NexvorDEV</span></Link>
        <nav className="hx-nav" aria-label="منوی اصلی">
          {links.map(link => <Link key={link.href} href={link.href} aria-current={active === link.href ? "page" : undefined}>{link.label}</Link>)}
        </nav>
        <Link className="hx-cta hx-cta-sm" href="/request" data-magnetic>ثبت سفارش <ArrowUpLeft size={15} /></Link>
        <button className="hx-burger" type="button" data-menu-toggle aria-label="منو"><i /><i /></button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="hx-footer">
      <div className="hx-wrap hx-foot">
        <Link className="hx-brand" href="/"><Image src="/nexvordev-logo.jpg" alt="لوگوی NexvorDEV" width={36} height={36} /><span>NexvorDEV</span></Link>
        <nav>
          <Link href="/#services">خدمات</Link><Link href="/pricing">تعرفه</Link><Link href="/subdomains">ساب‌دامنه</Link><Link href="/#process">طرز کار</Link><Link href="/support">پشتیبانی</Link><Link href="/privacy">حریم خصوصی</Link><Link href="/terms">شرایط استفاده</Link>
        </nav>
        <span className="hx-copy">© {new Date().getFullYear()} NexvorDEV</span>
      </div>
    </footer>
  );
}

export function PageShell({ active, children, bare }: { active?: string; children: ReactNode; bare?: boolean }) {
  return (
    <main className="hx hx-page">
      <HomeFx />
      <div className="hx-progress" aria-hidden="true" />
      <SiteHeader active={active} />
      <div className="hx-page-bg" aria-hidden="true"><i /><i /><i /></div>
      {children}
      {!bare && <SiteFooter />}
    </main>
  );
}

export function PageHero({ badge, title, accent, lead, children }: { badge?: ReactNode; title: string; accent?: string; lead?: string; children?: ReactNode }) {
  return (
    <section className="hx-phero">
      <div className="hx-wrap">
        {badge && <div className="hx-badge">{badge}</div>}
        <h1><span className="hx-line"><Words text={title} /></span>{accent && <span className="hx-line hx-grad">{accent}</span>}</h1>
        {lead && <p className="hx-lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
