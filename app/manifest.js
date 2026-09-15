import { SITE_NAME } from "./lib/seo";

export default function manifest() {
  return {
    name: `${SITE_NAME} — WoW Forever Community Voting Hub`,
    short_name: SITE_NAME,
    description: "Independent World of Warcraft: Forever community polls and verified player voting.",
    start_url: "/",
    display: "standalone",
    background_color: "#07131F",
    theme_color: "#07131F",
    icons: [
      {
        src: "/favicon.png",
        sizes: "192x192",
        type: "image/png"
      }
    ]
  };
}
