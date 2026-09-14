import { AboutSection } from "./components/AboutSection";
import { Hero } from "./components/Hero";
import { PollsSection } from "./components/PollsSection";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { StatusStrip } from "./components/StatusStrip";

export default function Home() {
  return <>
    <a className="skip" href="#main">Skip to content</a>
    <SiteHeader />
    <main id="main">
      <Hero />
      <StatusStrip />
      <PollsSection />
      <AboutSection />
    </main>
    <SiteFooter />
  </>;
}
