import type { MetadataRoute } from "next";
import { BRAND } from "@/config/brand";

const ROUTES = ["", "/studio", "/token", "/use-cases", "/technology", "/build", "/commerce", "/about", "/waitlist", "/privacy", "/terms", "/notices"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({ url: `${BRAND.url}${r}`, changeFrequency: "weekly", priority: r === "" ? 1 : 0.6 }));
}
