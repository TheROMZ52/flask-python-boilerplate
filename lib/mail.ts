import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { siteUrl } from "@/lib/site";

let transporter: Transporter | null = null;

function mailer() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error("SMTP is not configured");
  const port = Number(process.env.SMTP_PORT || 465);
  transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass }, connectionTimeout: 12000, greetingTimeout: 12000, socketTimeout: 20000 });
  return transporter;
}

export type MailAttachment = { filename: string; content: Buffer; contentType: string };

export async function sendMail(input: { to: string; subject: string; html: string; text: string; attachments?: MailAttachment[] }) {
  const info = await mailer().sendMail({
    from: process.env.SMTP_FROM || `NexvorDEV <${process.env.SMTP_USER}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    attachments: input.attachments,
    headers: { "X-Auto-Response-Suppress": "OOF, AutoReply" },
  });
  return info.messageId;
}

export const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] as string);

export function layout(options: { preheader: string; title: string; body: string; button?: { label: string; href: string }; footer?: string }) {
  const button = options.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 8px"><tr><td style="background:#5cd6ff;border-radius:12px"><a href="${esc(options.button.href)}" style="display:inline-block;padding:14px 30px;color:#05101f;font:bold 15px Tahoma,Arial,sans-serif;text-decoration:none">${esc(options.button.label)}</a></td></tr></table><p style="margin:14px 0 0;color:#6b7c93;font-size:12px;line-height:1.9">اگر دکمه کار نکرد، این آدرس را در مرورگر باز کنید:<br><a href="${esc(options.button.href)}" style="color:#1d6fa5;word-break:break-all" dir="ltr">${esc(options.button.href)}</a></p>`
    : "";
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(options.title)}</title></head>
<body style="margin:0;padding:0;background:#eef3f9;direction:rtl;font-family:Tahoma,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(options.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3f9;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dbe5f0">
<tr><td style="background:#061631;padding:22px 28px"><table role="presentation" width="100%"><tr><td align="right"><img src="${siteUrl}/nexvordev-logo.jpg" width="40" height="40" alt="NexvorDEV" style="border-radius:50%;vertical-align:middle"> <span style="color:#ffffff;font:bold 18px Arial,sans-serif;vertical-align:middle;margin-right:10px" dir="ltr">NexvorDEV</span></td></tr></table></td></tr>
<tr><td style="padding:32px 30px 26px;color:#1b2b40;font-size:15px;line-height:2.1;text-align:right"><h1 style="margin:0 0 14px;font-size:21px;color:#061631">${esc(options.title)}</h1>${options.body}${button}</td></tr>
<tr><td style="padding:18px 30px;background:#f6f9fc;border-top:1px solid #e3ebf4;color:#7a8aa0;font-size:12px;line-height:2;text-align:right">${options.footer || "این ایمیل به‌صورت خودکار از طرف NexvorDEV ارسال شده است."}<br><a href="${siteUrl}" style="color:#1d6fa5;text-decoration:none" dir="ltr">nexvordev.ir</a></td></tr>
</table></td></tr></table></body></html>`;
}

export function verifyEmailMessage(name: string, link: string) {
  return {
    subject: "تأیید ایمیل حساب NexvorDEV",
    html: layout({ preheader: "برای فعال‌سازی حساب، ایمیل خود را تأیید کنید.", title: "ایمیل خود را تأیید کنید", body: `<p style="margin:0">سلام ${esc(name)}،</p><p style="margin:12px 0 0">حساب شما در NexvorDEV ساخته شد. برای فعال‌سازی و ثبت سفارش و تیکت، لطفاً ایمیل خود را تأیید کنید. این لینک تا ۲۴ ساعت معتبر است.</p>`, button: { label: "تأیید ایمیل", href: link }, footer: "اگر شما این حساب را نساخته‌اید، این ایمیل را نادیده بگیرید." }),
    text: `سلام ${name}،\nبرای تأیید ایمیل و فعال‌سازی حساب NexvorDEV این لینک را باز کنید (۲۴ ساعت معتبر):\n${link}\n\nاگر شما این حساب را نساخته‌اید، این ایمیل را نادیده بگیرید.`,
  };
}

export function resetEmailMessage(name: string, link: string) {
  return {
    subject: "بازیابی رمز عبور NexvorDEV",
    html: layout({ preheader: "لینک تعیین رمز عبور جدید", title: "بازیابی رمز عبور", body: `<p style="margin:0">سلام ${esc(name)}،</p><p style="margin:12px 0 0">درخواست بازیابی رمز عبور حساب شما ثبت شد. برای تعیین رمز جدید از دکمه زیر استفاده کنید. این لینک تا یک ساعت معتبر است.</p>`, button: { label: "تعیین رمز جدید", href: link }, footer: "اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید؛ رمز فعلی شما تغییری نمی‌کند." }),
    text: `سلام ${name}،\nبرای تعیین رمز جدید این لینک را باز کنید (یک ساعت معتبر):\n${link}\n\nاگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.`,
  };
}

export function passwordChangedMessage(name: string) {
  return {
    subject: "رمز عبور حساب NexvorDEV تغییر کرد",
    html: layout({ preheader: "رمز عبور حساب شما تغییر کرد.", title: "رمز عبور تغییر کرد", body: `<p style="margin:0">سلام ${esc(name)}،</p><p style="margin:12px 0 0">رمز عبور حساب شما هم‌اکنون تغییر کرد. اگر این کار را شما انجام نداده‌اید، فوراً از بخش پشتیبانی یا تلگرام با ما تماس بگیرید.</p>` }),
    text: `سلام ${name}،\nرمز عبور حساب NexvorDEV شما تغییر کرد. اگر این کار را شما انجام نداده‌اید، فوراً با پشتیبانی تماس بگیرید.`,
  };
}

export function ticketReplyMessage(name: string, subject: string, snippet: string, link: string) {
  return {
    subject: `پاسخ جدید به تیکت: ${subject}`,
    html: layout({ preheader: "پشتیبانی NexvorDEV به تیکت شما پاسخ داد.", title: "پاسخ جدید از پشتیبانی", body: `<p style="margin:0">سلام ${esc(name)}،</p><p style="margin:12px 0 10px">به تیکت «${esc(subject)}» پاسخ جدیدی داده شد:</p><div style="padding:14px 18px;background:#f3f8fd;border-right:4px solid #5cd6ff;border-radius:8px;white-space:pre-wrap;color:#27384d">${esc(snippet)}</div>`, button: { label: "مشاهده و پاسخ", href: link } }),
    text: `سلام ${name}،\nبه تیکت «${subject}» پاسخ جدیدی داده شد:\n\n${snippet}\n\nمشاهده و پاسخ: ${link}`,
  };
}

export function telegramOtpMessage(name: string, code: string) {
  return {
    subject: "کد ورود به حساب NexvorDEV",
    html: layout({
      preheader: "کد یک‌بارمصرف ورود یا ثبت‌نام شما",
      title: "کد تأیید حساب",
      body: `<p style="margin:0">سلام ${esc(name)}،</p><p style="margin:12px 0 18px">برای تأیید هویت و اتصال حساب به تلگرام، کد زیر را در گفت‌وگوی بات وارد کنید. این کد فقط ۱۰ دقیقه اعتبار دارد و فقط یک‌بار قابل استفاده است.</p><div dir="ltr" style="padding:18px;background:#f3f8fd;border:1px solid #dbe5f0;border-radius:12px;text-align:center;font:bold 30px Arial,sans-serif;letter-spacing:8px;color:#061631">${esc(code)}</div>`,
      footer: "اگر این درخواست را شما نداده‌اید، این ایمیل را نادیده بگیرید. رمز عبور خود را در تلگرام ارسال نکنید.",
    }),
    text: `سلام ${name}،\nکد تأیید NexvorDEV: ${code}\nاین کد ۱۰ دقیقه اعتبار دارد و فقط یک‌بار استفاده می‌شود.\nاگر این درخواست را شما نداده‌اید، این ایمیل را نادیده بگیرید.`,
  };
}
