import { SITE_URL } from "./lib/seo";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/share/home", "/api/share/poll/"],
        disallow: [
          "/api/admin/",
          "/api/auth/",
          "/api/polls/"
        ]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
