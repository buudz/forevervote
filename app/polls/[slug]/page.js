import { notFound, permanentRedirect } from "next/navigation";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { StandalonePollCard } from "../../components/StandalonePollCard";
import { getPollShareData, getPublicPollEditHistory } from "../../lib/supabase/polls";
import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  buildPollMetaDescription,
  jsonLd
} from "../../lib/seo";

export const dynamic = "force-dynamic";

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
  return getPollShareData(slug).catch((error) => {
    console.error("Failed to load shared poll", {
      identifier: String(slug || ""),
      message: error?.message,
      code: error?.code,
      status: error?.status
    });
    return null;
  });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const poll = await loadPoll(slug);

  if (!poll) {
    return {
      title: "Poll not found",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const pollPath = `/polls/${poll.slug}`;
  const pollUrl = absoluteUrl(pollPath);
  const imageUrl = absoluteUrl(`/api/share/poll/${poll.slug}.png?v=10`);
  const description = buildPollMetaDescription(poll);

  return {
    title: `${poll.title} — WoW Forever Poll`,
    description,
    alternates: {
      canonical: pollPath
    },
    openGraph: {
      title: `${poll.title} | ${SITE_NAME}`,
      description,
      url: pollUrl,
      siteName: SITE_NAME,
      locale: "en_US",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: poll.title, type: "image/png" }],
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: `${poll.title} | ${SITE_NAME}`,
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

  if (String(slug) !== String(poll.slug)) {
    permanentRedirect(`/polls/${poll.slug}`);
  }

  const editHistory = await getPublicPollEditHistory(slug).catch(() => []);
  const pollUrl = absoluteUrl(`/polls/${poll.slug}`);
  const description = buildPollMetaDescription(poll);

  const pollStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pollUrl}#webpage`,
        url: pollUrl,
        name: poll.title,
        description,
        isPartOf: {
          "@id": `${SITE_URL}/#website`
        },
        about: {
          "@type": "Thing",
          name: "World of Warcraft: Forever"
        },
        breadcrumb: {
          "@id": `${pollUrl}#breadcrumb`
        },
        ...(poll.publishedAt ? { datePublished: poll.publishedAt } : {}),
        ...(poll.updatedAt ? { dateModified: poll.updatedAt } : {})
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pollUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE_NAME,
            item: `${SITE_URL}/`
          },
          {
            "@type": "ListItem",
            position: 2,
            name: poll.title,
            item: pollUrl
          }
        ]
      }
    ]
  };

  return <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd(pollStructuredData) }}
    />
    <SiteHeader />
    <main id="main">
      <section className="polls-section" aria-labelledby="shared-poll-title">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <p className="kicker">WoW Forever community poll · {poll.category}</p>
              <h1 id="shared-poll-title">{poll.title}</h1>
              {poll.rationale
                ? <p>{poll.rationale}</p>
                : <p>Vote in this independent World of Warcraft: Forever community poll and compare the public response.</p>}
            </div>
            <span className="count-badge">{poll.options.length} options</span>
          </div>

          <StandalonePollCard initialPoll={poll} />

          {editHistory.length > 0 && <section id="edit-history" className="public-edit-history" aria-labelledby="edit-history-title">
            <div className="public-edit-history-heading">
              <div>
                <p className="kicker">Transparency log</p>
                <h2 id="edit-history-title">Edit history</h2>
              </div>
              <span className="count-badge">{editHistory.length} edit{editHistory.length === 1 ? "" : "s"}</span>
            </div>

            <p className="public-edit-history-intro">
              ForeverVote records admin and creator changes to poll wording, options, category, or voting mode so poll rules cannot be changed silently.
            </p>

            <div className="public-edit-history-list">
              {editHistory.map((entry, index) => <details key={entry.id} className="public-edit-history-entry" open={index === 0}>
                <summary>
                  <span>{formatDate(entry.editedAt)} · {entry.editorRole === "creator" ? "Poll creator" : "Admin"}</span>
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

                  {entry.changedFields?.includes("voting_mode") && <div className="public-edit-diff">
                    <small>Voting mode</small>
                    <div><span>Before</span><p>{entry.oldAllowMultipleAnswers ? "Multiple answers" : "Single answer"}</p></div>
                    <div><span>After</span><p>{entry.newAllowMultipleAnswers ? "Multiple answers" : "Single answer"}</p></div>
                  </div>}

                  {entry.changedFields?.includes("category") && <div className="public-edit-diff">
                    <small>Category</small>
                    <div><span>Before</span><p>{entry.oldCategory || "—"}</p></div>
                    <div><span>After</span><p>{entry.newCategory || "—"}</p></div>
                  </div>}

                  {entry.changedFields?.includes("options") && <div className="public-edit-diff">
                    <small>Options</small>
                    <div><span>Before</span><p>{(entry.oldOptions || []).map((option) => option.text).join(" · ") || "—"}</p></div>
                    <div><span>After</span><p>{(entry.newOptions || []).map((option) => option.text).join(" · ") || "—"}</p></div>
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
