import { getPollShareData } from "../../../../lib/supabase/polls";

export const dynamic = "force-dynamic";

const BRAND_MARK_URL = "https://www.forevervote.com/fv-scroll-mark-final.webp";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeXml(value) {
  return normalizeText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(value, maxChars) {
  const text = normalizeText(value);
  return text.length > maxChars ? `${text.slice(0, maxChars - 1).trim()}…` : text;
}

function splitLines(value, maxChars, maxLines) {
  const words = normalizeText(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const rawWord of words) {
    const word = rawWord.length > maxChars ? truncate(rawWord, maxChars) : rawWord;
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }

    if (lines.length === maxLines) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines;
}

function getOptionLabels(options) {
  const maxVisible = 4;
  const selectable = options.filter((option) => !option.isNeutral);
  const labels = selectable.length ? selectable : options;

  if (labels.length > maxVisible) {
    return [
      ...labels.slice(0, maxVisible - 1).map((option) => option.text),
      `+${labels.length - (maxVisible - 1)} more options`
    ];
  }

  return labels.map((option) => option.text);
}

function renderOptionChips(optionLabels, startY) {
  return optionLabels.map((label, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 88 + column * 492;
    const y = startY + row * 50;
    const text = escapeXml(truncate(label, 28));

    return `<rect x='${x}' y='${y}' width='456' height='40' rx='9' fill='#071B2C' stroke='#876733' stroke-opacity='.74'/>
      <text x='${x + 20}' y='${y + 27}' font-family='Arial, sans-serif' font-size='20' font-weight='700' fill='#E4C98E'>${text}</text>`;
  }).join("");
}

export async function GET(_request, context) {
  const { slug } = await context.params;
  const poll = await getPollShareData(slug).catch(() => null);

  if (!poll) {
    return new Response("Poll not found", { status: 404 });
  }

  const titleLines = splitLines(poll.title, 30, 3);
  const titleFontSize = titleLines.length >= 3 ? 52 : 60;
  const titleLineHeight = titleLines.length >= 3 ? 58 : 66;
  const optionsLabelY = 408;
  const optionLabels = getOptionLabels(poll.options);
  const categoryWidth = Math.min(312, 122 + escapeXml(poll.category).length * 13);

  const svg = `<svg width='1200' height='630' viewBox='0 0 1200 630' fill='none' xmlns='http://www.w3.org/2000/svg'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1200' y2='630' gradientUnits='userSpaceOnUse'>
      <stop offset='0' stop-color='#07131F'/>
      <stop offset='.55' stop-color='#061522'/>
      <stop offset='1' stop-color='#04101A'/>
    </linearGradient>
    <linearGradient id='panel' x1='44' y1='46' x2='1154' y2='596' gradientUnits='userSpaceOnUse'>
      <stop offset='0' stop-color='#08243B'/>
      <stop offset='.55' stop-color='#071B2C'/>
      <stop offset='1' stop-color='#061522'/>
    </linearGradient>
    <linearGradient id='goldLine' x1='54' y1='42' x2='1148' y2='594' gradientUnits='userSpaceOnUse'>
      <stop offset='0' stop-color='#E4C98E'/>
      <stop offset='.42' stop-color='#876733'/>
      <stop offset='1' stop-color='#BC9854'/>
    </linearGradient>
    <radialGradient id='glow' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='translate(992 176) rotate(90) scale(250)'>
      <stop stop-color='#2F95C8' stop-opacity='.18'/>
      <stop offset='1' stop-color='#2F95C8' stop-opacity='0'/>
    </radialGradient>
    <pattern id='grain' width='6' height='6' patternUnits='userSpaceOnUse'>
      <path d='M0 0h1v1H0zM4 3h1v1H4z' fill='#ffffff' opacity='.12'/>
    </pattern>
    <filter id='logoShadow' x='-20%' y='-20%' width='140%' height='150%'>
      <feDropShadow dx='0' dy='8' stdDeviation='8' flood-color='#000000' flood-opacity='.42'/>
    </filter>
  </defs>
  <rect width='1200' height='630' fill='url(#bg)'/>
  <rect width='1200' height='630' fill='url(#grain)' opacity='.06'/>
  <circle cx='992' cy='176' r='250' fill='url(#glow)'/>
  <rect x='34' y='34' width='1132' height='562' rx='28' fill='url(#panel)' stroke='url(#goldLine)' stroke-width='3'/>
  <rect x='56' y='56' width='1088' height='518' rx='18' fill='none' stroke='#876733' stroke-opacity='.22'/>
  <text x='88' y='106' font-family='Arial, sans-serif' font-size='24' font-weight='800' letter-spacing='5' fill='#E4C98E'>FOREVERVOTE</text>
  <text x='88' y='137' font-family='Arial, sans-serif' font-size='18' font-weight='700' letter-spacing='2.2' fill='#8F969B'>WORLD OF WARCRAFT: FOREVER · COMMUNITY VOTING HUB</text>
  <path d='M82 154h760' stroke='#876733' stroke-opacity='.34'/>
  <rect x='88' y='174' width='${categoryWidth}' height='36' rx='8' fill='#061522' stroke='#876733' stroke-opacity='.62'/>
  <text x='108' y='198' font-family='Arial, sans-serif' font-size='17' font-weight='800' letter-spacing='2.4' fill='#BC9854'>${escapeXml(poll.category).toUpperCase()}</text>
  <image href='${BRAND_MARK_URL}' x='926' y='82' width='156' height='156' preserveAspectRatio='xMidYMid meet' filter='url(#logoShadow)'/>
  ${titleLines.map((line, index) => `<text x='88' y='${272 + index * titleLineHeight}' font-family='Georgia, serif' font-weight='700' font-size='${titleFontSize}' fill='#F8F2D9'>${escapeXml(line)}</text>`).join("")}
  <text x='88' y='${optionsLabelY}' font-family='Arial, sans-serif' font-size='16' font-weight='800' letter-spacing='2.8' fill='#8F969B'>POLL OPTIONS</text>
  ${renderOptionChips(optionLabels, optionsLabelY + 20)}
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300"
    }
  });
}
