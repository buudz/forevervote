import Image from "next/image";
import Link from "next/link";
import { AuthStatus } from "./AuthStatus";

export function SiteHeader() {
  return <header className="site-header">
    <div className="wrap header-inner">
      <Link className="brand" href="/" aria-label="ForeverVote home">
        <Image
          className="brand-logo"
          src="/fv-scroll-mark-final.webp"
          width={66}
          height={66}
          alt=""
          aria-hidden="true"
          priority
          style={{ width: 66, height: 66, objectFit: "contain", flex: "0 0 auto" }}
        />
        <span className="brand-copy">
          <strong>ForeverVote</strong>
          <small>World of Warcraft: Forever · Community Voting Hub</small>
        </span>
      </Link>
      <nav className="nav" aria-label="Primary navigation">
        <Link className="nav-submit" href="/submit">Submit</Link>
        <Link href="/#polls">Polls</Link>
        <Link href="/#about">About</Link>
        <AuthStatus />
      </nav>
    </div>
  </header>;
}
