const SOURCE_REPO = "https://github.com/buudz/forevervote";

export function SiteFooter() {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || "";
  const shortCommit = commitSha ? commitSha.slice(0, 7) : "";

  return <footer className="footer">
    <div className="wrap footer-inner">
      <div className="footer-brand">
        <img
          className="footer-logo"
          src="/fv-scroll-mark-final.webp"
          width="38"
          height="38"
          alt=""
          aria-hidden="true"
          style={{ width: 38, height: 38, objectFit: "contain", flex: "0 0 auto" }}
        />
        <span>ForeverVote</span>
      </div>
      <p>
        Privacy/contact: <a href="mailto:WowForeverVote@gmail.com">WowForeverVote@gmail.com</a>
        {" · "}
        <a href={SOURCE_REPO}>View source</a>
        {shortCommit ? <>
          {" · "}
          <a href={`${SOURCE_REPO}/commit/${commitSha}`}>Live build {shortCommit}</a>
        </> : null}
      </p>
      <a href="#main">Back to top ↑</a>
    </div>
  </footer>;
}
