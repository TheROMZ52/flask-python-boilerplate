import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET() {
  try {
    const response = await fetch("https://api.mcstatus.io/v2/status/java/mc.nexvordev.ir", {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json({ online: false }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch {
    return NextResponse.json({ online: false }, { status: 503 });
  }
}
