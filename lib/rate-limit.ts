const hits = new Map<string, number[]>();

export function clientKey(request: Request) {
  return (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
}

export function limited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter(time => now - time < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [name, times] of hits) if (!times.some(time => now - time < windowMs)) hits.delete(name);
  return recent.length > max;
}
