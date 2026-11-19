import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: "https://nexvordev-site.vercel.app/sitemap.xml",
    host: "https://nexvordev-site.vercel.app",
  };
}
