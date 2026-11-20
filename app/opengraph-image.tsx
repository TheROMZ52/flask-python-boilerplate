import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NexvorDEV — Development • Web • Minecraft";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          background: "radial-gradient(ellipse at 50% 38%, #211044 0%, #090713 55%, #03030a 100%)",
          color: "#fff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ position: "absolute", inset: 26, border: "1px solid rgba(155,39,255,.35)", borderRadius: 26, display: "flex" }} />
        <div style={{ display: "flex", fontSize: 112, fontWeight: 800, letterSpacing: -5 }}>
          <span>Nexvor</span><span style={{ color: "#9700ff" }}>DEV</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 24 }}>
          <div style={{ width: 180, height: 3, background: "#9700ff", borderRadius: 10 }} />
          <div style={{ display: "flex", fontSize: 38, letterSpacing: 1, color: "#f4efff" }}>
            Development <span style={{ color: "#a000ff", margin: "0 14px" }}>•</span> Web <span style={{ color: "#a000ff", margin: "0 14px" }}>•</span> Minecraft
          </div>
          <div style={{ width: 180, height: 3, background: "#9700ff", borderRadius: 10 }} />
        </div>
        <div style={{ position: "absolute", top: 65, left: 95, width: 18, height: 18, background: "#8d25ff", opacity: .6, transform: "rotate(45deg)" }} />
        <div style={{ position: "absolute", top: 120, right: 110, width: 12, height: 12, background: "#b13aff", opacity: .6, transform: "rotate(45deg)" }} />
      </div>
    ),
    { ...size }
  );
}
