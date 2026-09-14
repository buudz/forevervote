import { EmblemImage } from "./EmblemImage";

export function SiteFooter() {
  return <footer className="footer">
    <div className="wrap footer-inner">
      <div className="footer-brand">
        <EmblemImage frameClassName="footer-crest-frame" className="footer-crest" />
        <span>ForeverVote</span>
      </div>
      <p>Independent community fan project · Not affiliated with or endorsed by Blizzard Entertainment.</p>
      <a href="#main">Back to top ↑</a>
    </div>
  </footer>;
}
