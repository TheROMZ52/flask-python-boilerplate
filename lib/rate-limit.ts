import { supportDb } from "@/lib/support/server";

const memory = new Map<string, number[]>();

export function clientKey(request: Request) {
  return (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "").split(",")[0].trim() || "unknown";
}

function memoryLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (memory.get(key) || []).filter(time => now - time < windowMs);
  recent.push(now);
  memory.set(key, recent);
  if (memory.size > 5000) for (const [name, times] of memory) if (!times.some(time => now - time < windowMs)) memory.delete(name);
  return recent.length > max;
}

export async function limited(key: string, max: number, windowMs: number) {
  try {
    const result = await supportDb("rpc/nexvor_rate_hit", {
      method: "POST",
      body: JSON.stringify({ p_key: key.slice(0, 200), p_max: max, p_window_seconds: Math.ceil(windowMs / 1000) }),
    });
    return result === true;
  } catch {
    return memoryLimited(key, max, windowMs);
  }
}

export const MINUTES = 60 * 1000;
export const HOURS = 60 * MINUTES;
export const DAYS = 24 * HOURS;
