import { NextResponse } from "next/server";
import { supportDb } from "@/lib/support/server";
import { notifyAdminAboutNewServiceRequest } from "@/lib/support/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const priorities: Record<string, string> = { normal: "عادی", urgent: "فوری", critical: "اضطراری" };
const serviceOptions = [
  "نصب و کانفیگ انواع پلاگین ماینکرفت",
  "کانفیگ کامل سرور ماینکرفت",
  "راه‌اندازی سرور اختصاصی ماینکرفت",
  "راه‌اندازی سرور Survival، SMP، SkyBlock و سایر گیم‌مودها",
  "نصب و تنظیم پلاگین‌های اقتصادی",
  "راه‌اندازی سیستم فروشگاه و اقتصاد",
  "تنظیم سیستم رنک و پرمیشن",
  "راه‌اندازی سیستم کلیم (Claim)",
  "کانفیگ سیستم کیت (Kit)",
  "راه‌اندازی سیستم Auto Mine",
  "تنظیم سیستم‌های Mining و Regeneration",
  "کانفیگ TAB، Scoreboard و Chat",
  "راه‌اندازی سیستم‌های ضدتقلب و امنیتی",
  "بهینه‌سازی سرور و کاهش لگ",
  "رفع مشکلات و خطاهای پلاگین‌ها",
  "سازگاری و هماهنگ‌سازی پلاگین‌ها",
  "کانفیگ اختصاصی متناسب با نیاز مشتری",
  "ساخت پلاگین اختصاصی ماینکرفت",
  "توسعه قابلیت‌های جدید برای پلاگین‌ها",
  "برنامه‌نویسی سیستم‌های اختصاصی",
  "توسعه بات تلگرام",
  "ساخت ابزارهای مدیریتی",
  "اتصال سرویس‌ها به API",
  "طراحی و پیاده‌سازی سیستم‌های اتوماسیون",
  "رفع باگ و توسعه پروژه‌های موجود",
  "طراحی سایت اختصاصی",
  "طراحی سایت شرکتی و خدماتی",
  "طراحی سایت فروشگاهی",
  "طراحی سایت معرفی سرور ماینکرفت",
  "طراحی سایت پورتفولیو و شخصی",
  "طراحی پنل مدیریت اختصاصی",
  "طراحی سیستم ثبت‌نام و ورود",
  "توسعه سیستم پشتیبانی و تیکت",
  "اتصال سایت به پایگاه داده",
  "طراحی رابط کاربری مدرن و واکنش‌گرا",
  "توسعه فرانت‌اند و بک‌اند",
  "پیاده‌سازی انیمیشن‌ها و جلوه‌های تعاملی",
  "استقرار و انتشار سایت روی هاست و سرویس‌های میزبانی",
  "رفع باگ و پشتیبانی فنی وب‌سایت",
  "راه‌اندازی سرور روی VPS",
  "نصب و تنظیم محیط اجرای سرور",
  "راه‌اندازی پروکسی Velocity",
  "اتصال چند سرور به یکدیگر",
  "تنظیم شبکه سرورها",
  "مدیریت منابع و بهینه‌سازی عملکرد",
  "تنظیمات امنیتی و دسترسی‌ها",
  "بررسی مشکلات زیرساختی",
  "بررسی و عیب‌یابی مشکلات",
  "رفع خطاهای سرور",
  "بررسی مشکلات پلاگین‌ها",
  "به‌روزرسانی و نگهداری پروژه‌ها",
  "اعمال تغییرات در پروژه‌های قبلی",
  "مشاوره فنی برای راه‌اندازی مجموعه",
  "پشتیبانی پس از تحویل طبق توافق پروژه",
  "سایر خدمات",
  "درخواست خرید ساب‌دامنه",
];
function clean(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0,max) : ""; }

export async function POST(request: Request) {
  try {
    const body=await request.json();
    const name=clean(body.name,100), telegram=clean(body.telegram,100), service=clean(body.service,160);
    const priority=clean(body.priority,20), details=clean(body.details,3000);
    if(!name||!telegram||!service||!details) return NextResponse.json({ok:false,error:"لطفاً همه فیلدها را کامل کن."},{status:400});
    if(!serviceOptions.includes(service)) return NextResponse.json({ok:false,error:"نوع خدمات معتبر نیست."},{status:400});
    if(!Object.hasOwn(priorities,priority)) return NextResponse.json({ok:false,error:"اولویت انتخاب‌شده معتبر نیست."},{status:400});
    if(details.length<10) return NextResponse.json({ok:false,error:"توضیحات پروژه باید حداقل ۱۰ کاراکتر باشد."},{status:400});
    const rows=await supportDb("nexvor_service_requests",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({
      customer_name:name,telegram_contact:telegram,service_type:service,priority,details
    })}) as Array<{id:string}>;
    const item=rows?.[0];
    if(!item?.id) throw new Error("Request record was not created");
    await notifyAdminAboutNewServiceRequest(item.id).catch(()=>null);
    return NextResponse.json({ok:true,requestId:item.id});
  } catch {
    return NextResponse.json({ok:false,error:"در ثبت درخواست مشکلی پیش آمد؛ لطفاً کمی بعد دوباره تلاش کن."},{status:503});
  }
}
