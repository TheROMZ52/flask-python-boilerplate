import { NextResponse } from "next/server";
import { supportDb } from "@/lib/support/server";
import { notifyAdminAboutNewServiceRequest } from "@/lib/support/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const priorities: Record<string, string> = { normal: "عادی", urgent: "فوری", critical: "اضطراری" };
const serviceOptions = ["ساخت پلاگین اختصاصی","نصب و کانفیگ پلاگین","راه‌اندازی سرور","تنظیم و مدیریت سرور","بهینه‌سازی و رفع مشکلات","طراحی و شخصی‌سازی","سایر خدمات"];
function clean(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0,max) : ""; }

export async function POST(request: Request) {
  try {
    const body=await request.json();
    const name=clean(body.name,100), telegram=clean(body.telegram,100), service=clean(body.service,100);
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
