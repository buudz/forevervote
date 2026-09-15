export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.forevervote.com").replace(/\/$/, "");
export const SITE_NAME = "ForeverVote";

export const HOME_TITLE = "World of Warcraft: Forever Community Polls & Voting";
export const HOME_DESCRIPTION = "Vote in verified community polls about World of Warcraft: Forever. See public results, submit poll ideas, and compare what WoW Forever players want.";

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function truncateText(value, maxLength = 160) {
  const text = cleanText(value);
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

export function buildPollMetaDescription(poll) {
  const rationale = cleanText(poll?.rationale);

  if (rationale) {
    return truncateText(
      `${rationale} Vote in this independent World of Warcraft: Forever community poll on ForeverVote.`,
      165
    );
  }

  const optionText = (poll?.options || [])
    .map((option) => cleanText(option.text))
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  const options = optionText ? ` Options include ${optionText}.` : "";

  return truncateText(
    `Vote on "${cleanText(poll?.title)}" in this World of Warcraft: Forever community poll.${options} Independent fan project.`,
    165
  );
}

export function jsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
