import type { MetadataRoute } from "next";

const siteUrl = "https://nexvordev-site.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/request`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/subdomains`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/support`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
