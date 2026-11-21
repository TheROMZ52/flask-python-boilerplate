import Image from "next/image";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpLeft, Blocks, Cpu, Gamepad2, Gauge, Puzzle, Server, Settings2 } from "lucide-react";
import HomeFx from "@/components/home-fx";
import HeroCanvas from "@/components/hero-canvas";
import HeroTerminal from "@/components/hero-terminal";
import ScratchReveal from "@/components/scratch-reveal";
import HelpedBar from "@/components/helped-bar";
import { SiteFooter, SiteHeader, Words } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "خدمات ماینکرفت و سرور بازی | ساخت پلاگین و راه‌اندازی",
  description: "خدمات تخصصی سرور بازی در NexvorDEV؛ ساخت پلاگین اختصاصی، راه‌اندازی، نصب و کانفیگ و بهینه‌سازی سرورهای ماینکرفت جاوا، بدراک و کانتر استرایک ۱.۶.",
  alternates: { canonical: "/" },
};

const platforms = [
  { mark: "JAVA", name: "Minecraft Java", title: "ماینکرفت جاوا", description: "توسعه قابلیت‌های اختصاصی، راه‌اندازی و تنظیم سرورهای جاوا؛ از پلاگین سفارشی تا بهینه‌سازی کامل.", icon: Blocks, tags: ["Plugin Development", "Setup", "Optimization"] },
  { mark: "BEDROCK", name: "Minecraft Bedrock", title: "ماینکرفت بدراک", description: "پیاده‌سازی قابلیت‌ها و آماده‌سازی سرور بدراک متناسب با نیاز پروژه.", icon: Gamepad2, tags: ["Add-ons", "Configuration", "Server Setup"] },
  { mark: "CS 1.6", name: "Counter-Strike 1.6", title: "کانتر استرایک ۱.۶", description: "ساخت و تنظیم سرور کانتر، توسعه پلاگین و بهینه‌سازی تجربه بازی.", icon: Cpu, tags: ["AMX Mod X", "Plugins", "Server Setup"] },
];
const services = [
  { icon: Puzzle, title: "ساخت پلاگین اختصاصی", description: "ایده و نیاز سرورت رو به یک قابلیت واقعی و اختصاصی تبدیل می‌کنیم." },
  { icon: Server, title: "راه‌اندازی سرور", description: "نصب، آماده‌سازی و پیکربندی کامل سرور بازی، آماده‌ی ورود بازیکن‌ها." },
  { icon: Settings2, title: "نصب و کانفیگ", description: "تنظیم پلاگین‌ها، مودها و همه‌ی اجزای موردنیاز سرور." },
  { icon: Gauge, title: "بهینه‌سازی", description: "بررسی تنظیمات و بهبود عملکرد و پایداری سرور." },
];
const steps = [
  ["ثبت درخواست", "پلتفرم و چیزی که لازم داری رو از طریق تلگرام توضیح می‌دی."],
  ["بررسی و اعلام هزینه", "جزئیات سفارش بررسی می‌شه و هزینه و محدوده کار مشخص می‌شه."],
  ["اجرا و بررسی", "کار انجام می‌شه و موارد توافق‌شده بررسی می‌شن."],
  ["تحویل سفارش", "خروجی نهایی طبق توافق بهت تحویل داده می‌شه."],
];
const marquee = ["Minecraft Java", "Minecraft Bedrock", "Counter-Strike 1.6", "Plugin Development", "AMX Mod X", "Server Setup", "Optimization", "Configuration", "Paper", "Velocity"];

type Cube = { x: number; y: number; z: number; s: number; tone?: string; d: number };
const cubes: Cube[] = [];
[-1, 0, 1].forEach(i => [-1, 0, 1].forEach(j => cubes.push({ x: i * 98, y: j * 98, z: 0, s: 92, d: (i + j + 2) * 0.35 })));
[[0, 0], [1, 0], [0, 1]].forEach(([i, j]) => cubes.push({ x: i * 98, y: j * 98, z: 92, s: 92, d: 1.2 + i * 0.3 + j * 0.2 }));
cubes.push({ x: 0, y: 0, z: 184, s: 92, tone: "core", d: 2 });
cubes.push({ x: -170, y: 130, z: 60, s: 34, tone: "ember", d: 0.6 }, { x: 160, y: -150, z: 120, s: 28, d: 1.4 }, { x: 190, y: 120, z: 30, s: 22, tone: "violet", d: 2.2 }, { x: -150, y: -140, z: 150, s: 24, tone: "violet", d: 1.1 });

export default function Home() {
  return (
    <main className="hx">
      <HomeFx />
      <div className="hx-progress" aria-hidden="true" />

      <SiteHeader />

      <section className="hx-hero" id="top">
        <ScratchReveal />
        <div className="hx-aurora" aria-hidden="true"><i /><i /><i /></div>
        <HeroCanvas />
        <div className="hx-floor" aria-hidden="true" />
        <div className="hx-veil" aria-hidden="true" />
        <div className="hx-wrap hx-hero-in">
          <div className="hx-hero-copy">
            <div className="hx-badge"><span className="hx-live" /> استودیوی توسعه و سرورهای بازی</div>
            <h1>
              <span className="hx-line"><Words text="ایده‌ات رو به" /></span>
              <span className="hx-line hx-grad">دنیای بازی بیار.</span>
            </h1>
            <p className="hx-lead">از ساخت پلاگین اختصاصی تا راه‌اندازی، کانفیگ و بهینه‌سازی سرور؛ خدمات فنی سرورهای بازی در یک مسیر ساده و شفاف.</p>
            <div className="hx-actions">
              <a className="hx-cta" href="/request" data-magnetic>ثبت سفارش <ArrowLeft size={18} /></a>
              <a className="hx-ghost" href="#platforms" data-magnetic>دیدن پلتفرم‌ها</a>
            </div>
            <dl className="hx-stats" data-reveal>
              <div><dt>پلتفرم تخصصی</dt><dd data-count="3">۳</dd></div>
              <div><dt>خدمت اصلی</dt><dd data-count="4">۴</dd></div>
              <div><dt>مرحله تا تحویل</dt><dd data-count="4">۴</dd></div>
            </dl>
          </div>
          <div className="hx-stage" aria-hidden="true">
            <div className="hx-world"><div className="hx-spin">
              {cubes.map((cube, index) => (
                <div className={`vx ${cube.tone ?? ""}`} key={index} style={{ "--x": cube.x, "--y": cube.y, "--z": cube.z, "--s": `${cube.s}px`, "--d": `${cube.d}s` } as CSSProperties}>
                  <i className="f-t" /><i className="f-b" /><i className="f-1" /><i className="f-2" /><i className="f-3" /><i className="f-4" />
                </div>
              ))}
            </div></div>
            <div className="hx-ground" />
            <div className="hx-float-term"><HeroTerminal /></div>
          </div>
        </div>
      </section>

      <div className="hx-marquee" aria-hidden="true">
        {[false, true].map(reverse => (
          <div className={`hx-track ${reverse ? "rev" : ""}`} key={String(reverse)}>
            {[...marquee, ...marquee].map((item, index) => <span key={index}>{item}<svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0l5 5-5 5-5-5z" fill="currentColor" /></svg></span>)}
          </div>
        ))}
      </div>

      <section className="hx-section" id="platforms">
        <div className="hx-wrap">
          <div className="hx-head" data-reveal>
            <h2><Words text="برای دنیای بازی تو." /></h2>
            <p>خدمات NexvorDEV برای سه پلتفرم؛ با یک بازه تعرفه مشخص و خدمات کامل.</p>
          </div>
          <div className="hx-bento">
            {platforms.map((platform, index) => { const Icon = platform.icon; return (
              <article className={`hx-card ${index === 0 ? "big" : ""}`} key={platform.mark} data-tilt data-reveal data-delay={index * 110}>
                <span className="hx-mark" aria-hidden="true">{platform.mark}</span>
                <div className="hx-icon"><Icon size={index === 0 ? 30 : 24} /></div>
                <h3>{platform.title}</h3>
                <div className="hx-latin">{platform.name}</div>
                <p>{platform.description}</p>
                <div className="hx-tags">{platform.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
                <a className="hx-go" href="/request" aria-label={"سفارش برای " + platform.title}><ArrowUpLeft size={18} /></a>
              </article>
            ); })}
          </div>
        </div>
      </section>

      <section className="hx-section hx-services" id="services">
        <div className="hx-wrap">
          <div className="hx-head" data-reveal>
            <h2><Words text="از کدنویسی تا اجرای سرور." /></h2>
            <p>هر چیزی که برای آماده‌سازی و توسعه سرور بازی لازم داری، از همین‌جا شروع می‌شه.</p>
          </div>
          <div className="hx-rows">
            {services.map((service, index) => { const Icon = service.icon; return (
              <a className="hx-row" href="/request" key={service.title} data-tilt="flat" data-reveal data-delay={index * 90}>
                <span className="hx-row-icon"><Icon size={26} /></span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <span className="hx-row-go"><ArrowUpLeft size={20} /></span>
              </a>
            ); })}
          </div>
        </div>
      </section>

      <section className="hx-section hx-process" id="process">
        <div className="hx-wrap">
          <div className="hx-head" data-reveal>
            <h2><Words text="طرز کار ما، قدم‌به‌قدم." /></h2>
            <p>از پیام اول تا تحویل نهایی، مسیر سفارش روشن و قابل پیگیریه.</p>
          </div>
          <div className="hx-timeline">
            {steps.map(([title, description], index) => (
              <article className="hx-step" key={title} data-reveal>
                <span className="hx-node" />
                <div className="hx-step-card"><span className="hx-step-no">{(index + 1).toLocaleString("fa-IR")}</span><h3>{title}</h3><p>{description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <HelpedBar />

      <section className="hx-section hx-contact" id="contact">
        <div className="hx-wrap">
          <div className="hx-panel" data-reveal>
            <span className="hx-watermark" aria-hidden="true" data-depth="0.08">NX</span>
            <h2>آماده‌ای شروع کنیم؟<br /><span className="hx-grad">با ما در ارتباط باش.</span></h2>
            <p>پلتفرم و توضیح کوتاهی از چیزی که لازم داری بفرست تا درباره جزئیات سفارش صحبت کنیم.</p>
            <a className="hx-cta hx-cta-lg" href="/request" data-magnetic>ثبت سفارش <ArrowLeft size={19} /></a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
