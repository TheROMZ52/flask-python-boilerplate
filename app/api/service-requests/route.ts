import { after, NextResponse } from "next/server";
import { supportDb } from "@/lib/support/server";
import { clientKey, DAYS, HOURS, limited } from "@/lib/rate-limit";
import { sessionUser } from "@/lib/supabase/server";
import { serviceOptions } from "@/lib/services";
import { notifyAdminAboutNewServiceRequest } from "@/lib/support/telegram";
import { verifiedAccount } from "@/lib/auth/account";
import { createInvoiceForRequest, sendInvoiceOnce } from "@/lib/invoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const priorities: Record<string, string> = { normal: "عادی", urgent: "فوری", critical: "اضطراری" };
function clean(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0,max) : ""; }

export async function POST(request: Request) {
  try {
    const user = await sessionUser();
    if (await limited(`request:ip:${clientKey(request)}`, 5, HOURS) || (user && await limited(`request:user:${user.id}`, 8, HOURS))) return NextResponse.json({ ok: false, error: "درخواست‌های زیادی ثبت شد؛ کمی بعد دوباره تلاش کن." }, { status: 429 });
    const body=await request.json();
    const name=clean(body.name,100), telegram=clean(body.telegram,100), service=clean(body.service,160);
    const priority=clean(body.priority,20), details=clean(body.details,3000);
    if(!name||!telegram||!service||!details) return NextResponse.json({ok:false,error:"لطفاً همه فیلدها را کامل کن."},{status:400});
    if(!serviceOptions.includes(service)) return NextResponse.json({ok:false,error:"نوع خدمات معتبر نیست."},{status:400});
    if(!Object.hasOwn(priorities,priority)) return NextResponse.json({ok:false,error:"اولویت انتخاب‌شده معتبر نیست."},{status:400});
    if(details.length<10) return NextResponse.json({ok:false,error:"توضیحات پروژه باید حداقل ۱۰ کاراکتر باشد."},{status:400});
    if (await limited(`request:tg:${telegram.toLowerCase().replace(/^@/, "")}`, 8, DAYS)) return NextResponse.json({ ok: false, error: "تعداد درخواست‌های امروز برای این آیدی به سقف رسیده است." }, { status: 429 });
    const rows=await supportDb("nexvor_service_requests",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({
      customer_name:name,telegram_contact:telegram,service_type:service,priority,details,user_id:user?.id??null
    })}) as Array<{id:string}>;
    const item=rows?.[0];
    if(!item?.id) throw new Error("Request record was not created");
    await notifyAdminAboutNewServiceRequest(item.id).catch(()=>null);
    const account = user ? await verifiedAccount() : null;
    if (account) {
      after(async () => {
        try {
          const invoice = await createInvoiceForRequest({ requestId: item.id, userId: account.user.id, name, email: account.email, description: service });
          if (invoice) await sendInvoiceOnce(invoice, "issued");
        } catch {}
      });
    }
    return NextResponse.json({ok:true,requestId:item.id});
  } catch {
    return NextResponse.json({ok:false,error:"در ثبت درخواست مشکلی پیش آمد؛ لطفاً کمی بعد دوباره تلاش کن."},{status:503});
  }
}
