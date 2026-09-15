import "./globals.css";
import "./visual-correction.css";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
  SITE_URL
} from "./lib/seo";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${HOME_TITLE} | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`
  },
  description: HOME_DESCRIPTION,
  applicationName: SITE_NAME,
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "gaming",
  formatDetection: {
    telephone: false
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "192x192" }
    ]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: `${HOME_TITLE} | ${SITE_NAME}`,
    description: HOME_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: "/api/share/home",
        width: 1200,
        height: 630,
        alt: "ForeverVote — World of Warcraft: Forever Community Voting Hub"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `${HOME_TITLE} | ${SITE_NAME}`,
    description: HOME_DESCRIPTION,
    images: ["/api/share/home"]
  }
};

export const viewport = {
  themeColor: "#07131F",
  colorScheme: "dark"
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
