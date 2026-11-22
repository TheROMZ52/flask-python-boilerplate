import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Blocks, Check, Code2, Database, Globe, KeyRound, LifeBuoy, ListChecks, Lock, MessagesSquare, Receipt, Server, ShieldCheck, UserCheck } from "lucide-react";
import HomeFx from "@/components/home-fx";
import ScratchReveal from "@/components/scratch-reveal";
import HelpedBar from "@/components/helped-bar";
import { SiteFooter, SiteHeader, Words } from "@/components/site-chrome";
import { serviceGroups } from "@/lib/services";

export const metadata: Metadata = {
  title: "توسعه، وب و زیرساخت سرورهای بازی",
  description: "NexvorDEV؛ راه‌اندازی و کانفیگ سرور ماینکرفت، پلاگین و بات اختصاصی، طراحی وب‌سایت و زیرساخت سرور؛ با هزینه‌ی روشن قبل از شروع و پیگیری کامل سفارش.",
  alternates: { canonical: "/" },
};

const total = serviceGroups.filter(group => group.label !== "سایر").reduce((sum, group) => sum + group.options.length, 0);
const groupMeta = [
  { icon: Blocks, text: "نصب، کانفیگ و راه‌اندازی کامل سرور و گیم‌مودها." },
  { icon: Code2, text: "پلاگین، ربات و ابزارهای اختصاصی متناسب با نیاز پروژه." },
  { icon: Globe, text: "سایت، فروشگاه و پنل مدیریت؛ از طراحی تا انتشار." },
  { icon: Server, text: "راه‌اندازی VPS، پروکسی، شبکه‌ی سرورها و تنظیمات امنیتی." },
  { icon: LifeBuoy, text: "عیب‌یابی، نگهداری و مشاوره‌ی فنی برای پروژه‌های فعال." },
];
const commitments = [
  { icon: Receipt, title: "هزینه قبل از شروع", text: "محدوده‌ی کار و مبلغ، قبل از اجرا اعلام می‌شه." },
  { icon: ListChecks, title: "پیگیری کامل", text: "وضعیت سفارش در سایت و بات تلگرام قابل مشاهده‌ست." },
  { icon: MessagesSquare, title: "پشتیبانی با تیکت", text: "هر درخواست یک گفت‌وگوی اختصاصی و قابل پیگیری داره." },
  { icon: UserCheck, title: "ارتباط مستقیم", text: "با خود تیم فنی صحبت می‌کنی، نه واسطه." },
];
const security = [
  { icon: KeyRound, title: "رمزها و کلیدها سمت سرور", text: "هیچ رمز یا کلیدی داخل کد سمت کاربر قرار ندارد و بررسی دسترسی‌ها فقط روی سرور انجام می‌شود." },
  { icon: Lock, title: "دسترسی اختصاصی به هر تیکت", text: "لینک هر گفت‌وگو توکن یکتا دارد و توکن‌ها به‌صورت هش‌شده ذخیره می‌شوند." },
  { icon: Database, title: "پایگاه‌داده بسته به‌صورت پیش‌فرض", text: "جدول‌ها بدون دسترسی عمومی هستند و فقط سرور اجازه‌ی خواندن و نوشتن دارد." },
  { icon: ShieldCheck, title: "ورود بدون ذخیره‌ی رمز شما", text: "ورود با گوگل، گیت‌هاب یا دیسکورد انجام می‌شود و رمز حساب‌های شما نزد ما نیست." },
  { icon: Check, title: "کنترل تعداد درخواست", text: "ثبت سفارش، تیکت، پیام و ورود مدیر محدودیت تعداد دارند تا اسپم و حمله‌ی حدس رمز بی‌اثر شود." },
  { icon: Lock, title: "اتصال امن و هدرهای امنیتی", text: "کل سایت روی HTTPS است و سیاست‌های امنیتی مرورگر (CSP، HSTS و غیره) فعال شده‌اند." },
];
const steps = [
  ["ثبت درخواست", "پلتفرم و نیازت رو از سایت یا بات تلگرام ثبت می‌کنی."],
  ["بررسی و برآورد", "جزئیات بررسی می‌شود و هزینه و محدوده‌ی کار اعلام می‌شود."],
  ["اجرا و بررسی", "کار انجام می‌شود و موارد توافق‌شده تست می‌شوند."],
  ["تحویل", "خروجی نهایی طبق توافق تحویل داده می‌شود."],
];

export default function Home() {
  return (
    <main className="hx">
      <HomeFx />
      <div className="hx-progress" aria-hidden="true" />
      <SiteHeader />

      <section className="hx-hero" id="top">
        <ScratchReveal />
        <div className="hx-veil" aria-hidden="true" />
        <div className="hx-wrap hx-hero-in">
          <div className="hx-hero-copy">
            <div className="hx-badge">توسعه، وب و زیرساخت سرورهای بازی</div>
            <h1>
              <span className="hx-line"><Words text="سرور و نرم‌افزاری که" /></span>
              <span className="hx-line hx-grad">می‌شه بهش تکیه کرد.</span>
            </h1>
            <p className="hx-lead">راه‌اندازی و کانفیگ سرور ماینکرفت، پلاگین و بات اختصاصی، طراحی وب‌سایت و زیرساخت. قبل از شروع، محدوده‌ی کار و هزینه رو روشن می‌کنیم و تا تحویل، مسیر سفارش قابل پیگیریه.</p>
            <div className="hx-actions">
              <Link className="hx-cta" href="/request">ثبت سفارش <ArrowLeft size={18} /></Link>
              <Link className="hx-ghost" href="/pricing">دیدن تعرفه</Link>
            </div>
            <dl className="hx-facts">
              <div><dt>دسته‌ی خدمت</dt><dd>{(groupMeta.length).toLocaleString("fa-IR")}</dd></div>
              <div><dt>خدمت مشخص</dt><dd>{total.toLocaleString("fa-IR")}</dd></div>
              <div><dt>شروع تعرفه</dt><dd>{(65000).toLocaleString("fa-IR")}<small>تومان</small></dd></div>
            </dl>
          </div>
          <div className="hx-hero-side" aria-hidden="true">
            <div className="hx-tracker">
              <div className="hx-tracker-head"><span>پیگیری سفارش</span><em>نمونه</em></div>
              <h3>راه‌اندازی سرور و نصب پلاگین‌ها</h3>
              <ol>
                <li className="done"><i />ثبت شد</li>
                <li className="done"><i />در حال بررسی</li>
                <li className="active"><i />در حال انجام</li>
                <li><i />تکمیل شد</li>
              </ol>
              <p>هر تغییر وضعیت در سایت و بات تلگرام به شما اطلاع داده می‌شود.</p>
            </div>
            <div className="hx-notice"><b>🔔 وضعیت سفارش شما تغییر کرد</b><span>وضعیت جدید: در حال انجام</span><em>نمونه‌ی پیام بات</em></div>
          </div>
        </div>
      </section>

      <section className="hx-trust">
        <div className="hx-wrap hx-trust-grid">
          {commitments.map((item, index) => { const Icon = item.icon; return (
            <article key={item.title} data-reveal data-delay={index * 70}><Icon size={20} /><div><h3>{item.title}</h3><p>{item.text}</p></div></article>
          ); })}
        </div>
      </section>

      <section className="hx-section" id="services">
        <div className="hx-wrap">
          <div className="hx-head" data-reveal>
            <h2><Words text="خدماتی که ارائه می‌دیم" /></h2>
            <p>پنج دسته‌ی خدمت با {total.toLocaleString("fa-IR")} خدمت مشخص. اگه چیزی دقیقاً در فهرست نبود، توی فرم سفارش می‌تونی توضیح بدی.</p>
          </div>
          <div className="hx-svc-grid">
            {serviceGroups.filter(group => group.label !== "سایر").map((group, index) => { const meta = groupMeta[index]; const Icon = meta.icon; return (
              <article className="hx-svc" key={group.label} data-reveal data-delay={index * 70}>
                <div className="hx-svc-top"><span className="hx-icon"><Icon size={22} /></span><span className="hx-svc-count">{group.options.length.toLocaleString("fa-IR")} خدمت</span></div>
                <h3>{group.label}</h3>
                <p>{meta.text}</p>
                <ul>{group.options.slice(0, 4).map(option => <li key={option}><Check size={14} />{option}</li>)}</ul>
                <Link className="hx-textlink" href="/request">ثبت سفارش <ArrowUpLeft size={15} /></Link>
              </article>
            ); })}
            <article className="hx-svc hx-svc-other" data-reveal data-delay="350">
              <h3>چیزی که دنبالشی توی فهرست نبود؟</h3>
              <p>پروژه‌ات رو توضیح بده؛ اگه توی حوزه‌ی کار ما باشه، برآورد و مسیر اجرا رو بررسی می‌کنیم.</p>
              <Link className="hx-cta hx-cta-sm" href="/request">ثبت درخواست <ArrowUpLeft size={15} /></Link>
            </article>
          </div>
        </div>
      </section>

      <section className="hx-section hx-alt" id="security">
        <div className="hx-wrap">
          <div className="hx-head" data-reveal>
            <h2><Words text="امنیت و شفافیت" /></h2>
            <p>این موارد درباره‌ی خود سایت و سیستم سفارش NexvorDEV است؛ چیزی که بدون ادعا، قابل بررسی است.</p>
          </div>
          <div className="hx-sec-grid">
            {security.map((item, index) => { const Icon = item.icon; return (
              <article className="hx-sec" key={item.title} data-reveal data-delay={(index % 3) * 70}><Icon size={20} /><h3>{item.title}</h3><p>{item.text}</p></article>
            ); })}
          </div>
        </div>
      </section>

      <section className="hx-section" id="process">
        <div className="hx-wrap">
          <div className="hx-head" data-reveal>
            <h2><Words text="مسیر یک سفارش" /></h2>
            <p>چهار مرحله‌ی مشخص، از اولین پیام تا تحویل نهایی.</p>
          </div>
          <ol className="hx-steps">
            {steps.map(([title, text], index) => (
              <li key={title} data-reveal data-delay={index * 80}><span>{(index + 1).toLocaleString("fa-IR")}</span><h3>{title}</h3><p>{text}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <HelpedBar />

      <section className="hx-section hx-contact" id="contact">
        <div className="hx-wrap">
          <div className="hx-cta-band" data-reveal>
            <div><h2>پروژه‌ات رو توضیح بده.</h2><p>هزینه و محدوده‌ی کار رو قبل از شروع، شفاف اعلام می‌کنیم.</p></div>
            <div className="hx-actions"><Link className="hx-cta hx-cta-lg" href="/request">ثبت سفارش <ArrowLeft size={19} /></Link><Link className="hx-ghost" href="/support">پشتیبانی</Link></div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
