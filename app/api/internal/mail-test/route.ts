import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Attempt = { name: string; options: Record<string, unknown> };

export async function GET(request: Request) {
  if (!process.env.TELEGRAM_SETUP_KEY || new URL(request.url).searchParams.get("key") !== process.env.TELEGRAM_SETUP_KEY) return NextResponse.json({ ok: false }, { status: 404 });
  const host = process.env.SMTP_HOST as string;
  const auth = { user: process.env.SMTP_USER as string, pass: process.env.SMTP_PASS as string };
  const attempts: Attempt[] = [
    { name: "465-ssl-long", options: { host, port: 465, secure: true, auth, connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 15000 } },
    { name: "587-starttls", options: { host, port: 587, secure: false, requireTLS: true, auth, connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 15000 } },
    { name: "465-ip-sni", options: { host: "94.184.4.240", port: 465, secure: true, auth, tls: { servername: host }, connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 15000 } },
  ];
  const report: Record<string, unknown> = {};
  for (const attempt of attempts) {
    const started = Date.now();
    try {
      const transport = nodemailer.createTransport(attempt.options);
      await transport.verify();
      report[attempt.name] = `verify ok ${Date.now() - started}ms`;
      await transport.sendMail({ from: process.env.SMTP_FROM, to: "info@nexvordev.ir", subject: `[تست] اتصال SMTP ${attempt.name}`, text: "تست اتصال SMTP از ورسل." });
      report[attempt.name] = `sent ok ${Date.now() - started}ms`;
      break;
    } catch (error) {
      const e = error as NodeJS.ErrnoException & { command?: string; responseCode?: number };
      report[attempt.name] = `fail ${Date.now() - started}ms code=${e.code || ""} cmd=${e.command || ""} resp=${e.responseCode || ""} msg=${String(e.message).slice(0, 120)}`;
    }
  }
  return NextResponse.json({ ok: true, report });
}
