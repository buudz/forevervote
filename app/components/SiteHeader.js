import { EmblemImage } from "./EmblemImage";

export function SiteHeader() {
  return <header className="site-header">
    <div className="wrap header-inner">
      <a className="brand" href="/" aria-label="ForeverVote home">
        <EmblemImage frameClassName="brand-crest-frame" className="brand-crest" />
        <span className="brand-copy"><strong>ForeverVote</strong><small>Community Council</small></span>
      </a>
      <nav className="nav" aria-label="Primary navigation">
        <a href="#polls">Polls</a>
        <a href="#about">About</a>
        <span className="login-placeholder" aria-label="Battle.net login coming soon">Battle.net login soon</span>
      </nav>
    </div>
  </header>;
}
