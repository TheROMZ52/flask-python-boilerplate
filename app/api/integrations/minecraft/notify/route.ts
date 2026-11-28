import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { cleanText } from "@/lib/support/server";
import { notifyAdminAboutMinecraftTicket } from "@/lib/support/telegram";

export const runtime = "nodejs";

function secretMatches(received: string | null) {
  const expected = process.env.MC_SITE_SECRET || "";
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Called by the Minecraft site when a ticket is created or a player replies.
export async function POST(request: Request) {
  if (!secretMatches(request.headers.get("x-integration-secret"))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    const event = body.event === "reply" ? "reply" : "created";
    const adminUrl = typeof body.adminUrl === "string" && /^https:\/\/[a-z0-9.-]+\.nexvordev\.ir\//i.test(body.adminUrl) ? body.adminUrl : "https://site.nexvordev.ir/admin";
    await notifyAdminAboutMinecraftTicket({
      event,
      ticketId: cleanText(String(body.ticketId ?? ""), 40),
      username: cleanText(body.username, 40),
      subject: cleanText(body.subject, 200),
      message: cleanText(body.message, 4000),
      adminUrl,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
