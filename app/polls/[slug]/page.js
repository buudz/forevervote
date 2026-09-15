import { notFound } from "next/navigation";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { getPollShareData, getPublicPollEditHistory } from "../../lib/supabase/polls";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.forevervote.com";

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

async function loadPoll(slug) {
  return getPollShareData(slug).catch(() => null);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const poll = await loadPoll(slug);

  if (!poll) {
    return {
      title: "Poll not found · ForeverVote"
    };
  }

  const pollUrl = `${SITE_URL}/polls/${poll.slug}`;
  const imageUrl = `${SITE_URL}/api/share/poll/${poll.slug}.png?v=5`;
  const description = poll.rationale || "Vote on this ForeverVote community poll.";

  return {
    title: `${poll.title} · ForeverVote`,
    description,
    openGraph: {
      title: poll.title,
      description,
      url: pollUrl,
      siteName: "ForeverVote",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: poll.title, type: "image/png" }],
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title: poll.title,
      description,
      images: [imageUrl]
    }
  };
}

export default async function PollSharePage({ params }) {
  const { slug } = await params;
  const poll = await loadPoll(slug);

  if (!poll) {
    notFound();
  }

  const editHistory = await getPublicPollEditHistory(slug).catch(() => []);

  return <>
    <SiteHeader />
    <main id="main">
      <section className="polls-section" aria-labelledby="shared-poll-title">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <p className="kicker">Shared poll · {poll.category}</p>
              <h1 id="shared-poll-title">{poll.title}</h1>
              {poll.rationale && <p>{poll.rationale}</p>}
            </div>
            <span className="count-badge">{poll.options.length} options</span>
          </div>

          <article className="poll-card">
            <div className="card-top">
              <span className="category">{poll.category}</span>
              <span className="draft">Community poll</span>
            </div>
            <h3>{poll.title}</h3>
            {poll.rationale && <p className="context">{poll.rationale}</p>}
            <div className="option-preview" aria-label="Poll options">
              {poll.options.map((option) => <span className="vote-option" key={`${option.position}-${option.text}`}>
                <span>{option.text}</span>
              </span>)}
            </div>
            <div className="card-footer">
              <span>Login with Battle.net on ForeverVote to vote.</span>
              <a href={`/#${poll.slug}`}>Vote on this poll ↗</a>
            </div>
          </article>

          {editHistory.length > 0 && <section id="edit-history" className="public-edit-history" aria-labelledby="edit-history-title">
            <div className="public-edit-history-heading">
              <div>
                <p className="kicker">Transparency log</p>
                <h2 id="edit-history-title">Edit history</h2>
              </div>
              <span className="count-badge">{editHistory.length} edit{editHistory.length === 1 ? "" : "s"}</span>
            </div>

            <p className="public-edit-history-intro">
              ForeverVote records every admin change to a poll title or rationale so wording cannot be changed silently after publication.
            </p>

            <div className="public-edit-history-list">
              {editHistory.map((entry, index) => <details key={entry.id} className="public-edit-history-entry" open={index === 0}>
                <summary>
                  <span>{formatDate(entry.editedAt)}</span>
                  <strong>{(entry.changedFields || []).join(" + ") || "Poll wording"} changed</strong>
                </summary>

                <div className="public-edit-history-body">
                  {entry.changedFields?.includes("title") && <div className="public-edit-diff">
                    <small>Title</small>
                    <div><span>Before</span><p>{entry.oldTitle}</p></div>
                    <div><span>After</span><p>{entry.newTitle}</p></div>
                  </div>}

                  {entry.changedFields?.includes("rationale") && <div className="public-edit-diff">
                    <small>Rationale</small>
                    <div><span>Before</span><p>{entry.oldRationale || "No rationale"}</p></div>
                    <div><span>After</span><p>{entry.newRationale || "No rationale"}</p></div>
                  </div>}
                </div>
              </details>)}
            </div>
          </section>}
        </div>
      </section>
    </main>
    <SiteFooter />
  </>;
}
