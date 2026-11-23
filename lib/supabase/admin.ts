import "server-only";

const apiUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

async function adminAuth(path: string, init: RequestInit = {}) {
  if (!apiUrl || !secretKey) throw new Error("Auth service is not configured");
  const headers = new Headers(init.headers);
  headers.set("apikey", secretKey);
  headers.set("Authorization", `Bearer ${secretKey}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiUrl}/auth/v1/${path}`, { ...init, headers, cache: "no-store" });
  const text = await response.text();
  let data: Record<string, unknown> = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}
  return { ok: response.ok, status: response.status, data };
}

export async function createAuthUser(input: { email: string; password: string; firstName: string; lastName: string }) {
  return adminAuth("admin/users", {
    method: "POST",
    body: JSON.stringify({ email: input.email, password: input.password, email_confirm: false, user_metadata: { first_name: input.firstName, last_name: input.lastName, full_name: `${input.firstName} ${input.lastName}`.trim() } }),
  });
}

export const updateAuthUser = (id: string, body: Record<string, unknown>) =>
  adminAuth(`admin/users/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) });

export const getAuthUser = (id: string) => adminAuth(`admin/users/${encodeURIComponent(id)}`);

export const deleteAuthUser = (id: string) => adminAuth(`admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });

export async function checkPassword(email: string, password: string) {
  if (!apiUrl) return false;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }), cache: "no-store",
  });
  return response.ok;
}
