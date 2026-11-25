export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.mcstatus.io/v2/status/java/mc.nexvordev.ir",
      {
        cache: "no-store",
        signal: AbortSignal.timeout(9000),
      },
    );

    if (!response.ok) {
      return Response.json(
        { error: "Minecraft status provider returned an error" },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const data = await response.json();
    return Response.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Minecraft status provider is unreachable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
