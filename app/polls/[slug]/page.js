import { notFound } from "next/navigation";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { getPollShareData } from "../../lib/supabase/polls";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.forevervote.com";

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
  const imageUrl = `${SITE_URL}/api/share/poll/${poll.slug}`;
  const description = poll.rationale || "Vote on this ForeverVote community poll.";

  return {
    title: `${poll.title} · ForeverVote`,
    description,
    openGraph: {
      title: poll.title,
      description,
      url: pollUrl,
      siteName: "ForeverVote",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: poll.title }],
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
        </div>
      </section>
    </main>
    <SiteFooter />
  </>;
}
