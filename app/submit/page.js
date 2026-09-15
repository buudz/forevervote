import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { SubmitPollForm } from "../components/SubmitPollForm";
import { SITE_NAME } from "../lib/seo";

const title = "Submit a WoW Forever Community Poll";
const description = "Verified WoW players can submit a World of Warcraft: Forever poll for review on ForeverVote, an independent fan-run community voting hub.";

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/submit"
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: `${title} | ${SITE_NAME}`,
    description,
    url: "/submit",
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
    title: `${title} | ${SITE_NAME}`,
    description,
    images: ["/api/share/home"]
  }
};

export default function SubmitPollPage() {
  return <>
    <SiteHeader />
    <main id="main">
      <section className="submit-section" aria-labelledby="submit-page-title">
        <div className="wrap submit-layout">
          <div className="submit-intro">
            <p className="kicker">Community-created questions</p>
            <h1 id="submit-page-title">Submit a poll.</h1>
            <p>Verified Classic WoW players can propose questions for the ForeverVote board. Every submission goes through review before it is published.</p>
            <div className="submission-note">
              <strong>What makes a good poll?</strong>
              <span>One clear question, neutral wording, context only when useful, and answers that do not overlap.</span>
            </div>
          </div>
          <SubmitPollForm />
        </div>
      </section>
    </main>
    <SiteFooter />
  </>;
}
