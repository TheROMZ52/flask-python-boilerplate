import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const original = await fetch(new URL("/og-image.jpg", request.url), {
    cache: "force-cache",
  });

  if (!original.ok) {
    return new Response("Original preview image could not be loaded.", {
      status: 502,
    });
  }

  const bytes = new Uint8Array(await original.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const imageSrc = `data:image/jpeg;base64,${btoa(binary)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 50% 50%, #21133b 0%, #090711 72%)",
        }}
      >
        <img
          src={imageSrc}
          width="1200"
          height="423"
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    },
  );
}
