import { ProfileDashboard } from "../components/ProfileDashboard";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata = {
  title: "Your Profile",
  description: "Your ForeverVote Battle.net profile, poll submissions, and voting history.",
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
};

export default function ProfilePage() {
  return <>
    <SiteHeader />
    <main id="main">
      <section className="profile-page">
        <div className="wrap">
          <ProfileDashboard />
        </div>
      </section>
    </main>
    <SiteFooter />
  </>;
}
