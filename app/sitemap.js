import { getOpenPollSeoData } from "./lib/supabase/polls";
import { SITE_URL, absoluteUrl } from "./lib/seo";

export const dynamic = "force-dynamic";

function validDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default async function sitemap() {
  const polls = await getOpenPollSeoData().catch(() => []);

  const pollEntries = polls.map((poll) => {
    const lastModified = validDate(poll.updatedAt || poll.publishedAt || poll.createdAt);

    return {
      url: absoluteUrl(`/polls/${poll.slug}`),
      ...(lastModified ? { lastModified } : {})
    };
  });

  const latestPollUpdate = polls
    .map((poll) => validDate(poll.updatedAt || poll.publishedAt || poll.createdAt))
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return [
    {
      url: `${SITE_URL}/`,
      ...(latestPollUpdate ? { lastModified: latestPollUpdate } : {})
    },
    {
      url: absoluteUrl("/submit")
    },
    ...pollEntries
  ];
}
