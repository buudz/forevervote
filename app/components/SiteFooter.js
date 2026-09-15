export function SiteFooter() {
  return <footer className="footer">
    <div className="wrap footer-inner">
      <div className="footer-brand">
        <img
          className="footer-logo"
          src="/fv-scroll-mark.svg"
          width="38"
          height="38"
          alt=""
          aria-hidden="true"
          style={{ width: 38, height: 38, objectFit: "contain", flex: "0 0 auto" }}
        />
        <span>ForeverVote</span>
      </div>
      <p>Privacy/contact: <a href="mailto:WowForeverVote@gmail.com">WowForeverVote@gmail.com</a></p>
      <a href="#main">Back to top ↑</a>
    </div>
  </footer>;
}
