import { AboutSection } from "./components/AboutSection";
import { Hero } from "./components/Hero";
import { PollsSection } from "./components/PollsSection";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { StatusStrip } from "./components/StatusStrip";
import { getOpenPollsForSession } from "./lib/supabase/polls";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  jsonLd
} from "./lib/seo";

export const dynamic = "force-dynamic";

export const metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: `${HOME_TITLE} | ${SITE_NAME}`,
    description: HOME_DESCRIPTION,
    url: "/",
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

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      alternateName: ["Forever Vote", "forevervote.com"],
      description: HOME_DESCRIPTION,
      publisher: {
        "@id": `${SITE_URL}/#organization`
      }
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: "Independent community-run fan project for World of Warcraft: Forever polling and public player feedback.",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/favicon.png"),
        contentUrl: absoluteUrl("/favicon.png"),
        width: 192,
        height: 192
      }
    }
  ]
};

export default async function Home() {
  const initialPollState = await getOpenPollsForSession(null, {
    sort: "explore",
    voteFilter: "all"
  }).catch(() => ({
    databaseReady: false,
    polls: []
  }));

  return <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd(websiteStructuredData) }}
    />
    <a className="skip" href="#main">Skip to content</a>
    <SiteHeader />
    <main id="main">
      <Hero />
      <PollsSection
        initialPolls={initialPollState.polls}
        initialDatabaseReady={initialPollState.databaseReady}
      />
      <StatusStrip />
      <AboutSection />
    </main>
    <SiteFooter />
  </>;
}
