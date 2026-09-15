import { AuthStatus } from "./AuthStatus";

export function SiteHeader() {
  return <header className="site-header">
    <div className="wrap header-inner">
      <a className="brand" href="/" aria-label="ForeverVote home">
        <img
          className="brand-logo"
          src="/fv-scroll-mark-final.webp"
          width="58"
          height="58"
          alt=""
          aria-hidden="true"
          style={{ width: 58, height: 58, objectFit: "contain", flex: "0 0 auto" }}
        />
        <span className="brand-copy">
          <strong>ForeverVote</strong>
          <small>World of Warcraft: Forever · Community Voting Hub</small>
        </span>
      </a>
      <nav className="nav" aria-label="Primary navigation">
        <a href="/#polls">Polls</a>
        <a className="nav-submit" href="/submit">Submit</a>
        <a href="/#about">About</a>
        <AuthStatus />
      </nav>
    </div>
  </header>;
}
