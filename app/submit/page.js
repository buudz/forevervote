import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { SubmitPollForm } from "../components/SubmitPollForm";

export const metadata = {
  title: "Submit a Poll · ForeverVote",
  description: "Submit a World of Warcraft: Forever community poll for review on ForeverVote."
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
