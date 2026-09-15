import { AuthStatus } from "./AuthStatus";
import { BrandScrollMark } from "./BrandScrollMark";

export function SiteHeader() {
  return <header className="site-header">
    <div className="wrap header-inner">
      <a className="brand" href="/" aria-label="ForeverVote home">
        <BrandScrollMark
          className="brand-logo"
          size={58}
          title=""
          style={{ flex: "0 0 auto" }}
        />
        <span className="brand-copy">
          <strong>ForeverVote</strong>
          <small>World of Warcraft: Forever · Community Voting Hub</small>
        </span>
      </a>
      <nav className="nav" aria-label="Primary navigation">
        <a className="nav-submit" href="/submit">Submit</a>
        <a href="/#polls">Polls</a>
        <a href="/#about">About</a>
        <AuthStatus />
      </nav>
    </div>
  </header>;
}
