import net from "node:net";
import dns from "node:dns/promises";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function probe(host: string, port: number) {
  return new Promise<string>(resolve => {
    const started = Date.now();
    const socket = net.connect({ host, port, timeout: 7000 });
    socket.once("connect", () => { socket.destroy(); resolve(`open ${Date.now() - started}ms`); });
    socket.once("timeout", () => { socket.destroy(); resolve("timeout"); });
    socket.once("error", error => resolve(`error ${(error as NodeJS.ErrnoException).code || error.message}`));
  });
}

export async function GET(request: Request) {
  if (!process.env.TELEGRAM_SETUP_KEY || new URL(request.url).searchParams.get("key") !== process.env.TELEGRAM_SETUP_KEY) return NextResponse.json({ ok: false }, { status: 404 });
  const hosts = ["ircp1.my-servers.us", "mail.nexvordev.ir", "nexvordev.ir"];
  const ports = [465, 587, 25, 2525];
  const result: Record<string, unknown> = {};
  await Promise.all(hosts.map(async host => {
    const entry: Record<string, string> = {};
    try { entry.ips = (await dns.lookup(host, { all: true })).map(item => item.address).join(","); } catch (error) { entry.ips = `dns ${(error as NodeJS.ErrnoException).code}`; }
    await Promise.all(ports.map(async port => { entry[String(port)] = await probe(host, port); }));
    result[host] = entry;
  }));
  return NextResponse.json({ ok: true, result });
}
