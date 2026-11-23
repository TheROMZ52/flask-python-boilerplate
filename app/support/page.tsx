import Link from "next/link";
import { LifeBuoy, LogIn, Ticket } from "lucide-react";
import SupportForm from "@/components/support-form";
import { PageHero, PageShell } from "@/components/site-chrome";
import { verifiedAccount } from "@/lib/auth/account";

export const metadata = { title: "پشتیبانی", description: "ثبت درخواست و گفت‌وگو با تیم پشتیبانی NexvorDEV.", alternates: { canonical: "/support" } };
export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const account = await verifiedAccount();
  return (
    <PageShell active="/support">
      <PageHero badge={<><LifeBuoy size={15} /> مرکز پشتیبانی</>} title="پشتیبانی" accent="در کنارته." lead="درخواستت رو توضیح بده تا یک گفت‌وگوی اختصاصی برای پیگیری همین درخواست باز بشه." />
      <section className="hx-section hx-tight">
        <div className="hx-wrap hx-narrow">
          {account ? (
            <>
              <div className="hx-glass hx-form-card" data-reveal><SupportForm /></div>
              <Link className="hx-glass support-mine" href="/account?tab=tickets"><Ticket size={20} /><span><strong>تیکت‌های من</strong><small>مشاهده پاسخ‌ها و وضعیت درخواست‌های قبلی</small></span></Link>
            </>
          ) : (
            <div className="hx-glass hx-form-card support-gate" data-reveal>
              <LogIn size={30} />
              <h2>برای ثبت تیکت وارد شو</h2>
              <p>ثبت تیکت فقط برای کاربران دارای حساب با ایمیل تأییدشده ممکن است تا پاسخ‌ها و تاریخچه‌ی درخواست‌هات همیشه در دسترس خودت بماند.</p>
              <div className="hx-actions hx-center"><Link className="hx-cta" href="/account?next=/support">ورود یا ثبت‌نام</Link></div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
