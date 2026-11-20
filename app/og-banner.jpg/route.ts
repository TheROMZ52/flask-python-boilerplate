export async function GET(request: Request) {
  const original = await fetch(new URL("/og-image.jpg?v=4", request.url), {
    cache: "no-store",
  });

  if (!original.ok || !original.body) {
    return new Response("Preview image unavailable.", { status: 502 });
  }

  return new Response(original.body, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      ...(original.headers.get("content-length")
        ? { "Content-Length": original.headers.get("content-length")! }
        : {}),
    },
  });
}
