import { AdminPollsPanel } from "../components/AdminPollsPanel";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata = {
  title: "Admin · ForeverVote",
  description: "ForeverVote poll moderation."
};

export default function AdminPage() {
  return <>
    <SiteHeader />
    <main id="main">
      <section className="admin-section" aria-labelledby="admin-title">
        <div className="wrap admin-layout">
          <div className="admin-intro">
            <p className="kicker">ForeverVote administration</p>
            <h1 id="admin-title">Poll moderation.</h1>
            <p>Review community submissions before they appear on the public voting board.</p>
          </div>
          <AdminPollsPanel />
        </div>
      </section>
    </main>
    <SiteFooter />
  </>;
}
