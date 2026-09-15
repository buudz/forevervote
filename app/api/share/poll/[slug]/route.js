import { getPollShareData } from "../../../../lib/supabase/polls";

export const dynamic = "force-dynamic";

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

function renderScrollMark() {
  return `<g transform='translate(938 66) scale(.58)' filter='url(#logoShadow)'>
    <path fill='url(#markPaper)' stroke='#2b1804' stroke-width='5' d='M46 66c26-13 166-12 193 0 8 4 11 17 2 23-20 15-13 123 1 139 6 7 4 19-6 23-32 12-160 12-190-1-11-5-12-18-4-25 15-14 14-121 1-136-8-9-6-19 3-23Z'/>
    <path fill='url(#markEdge)' stroke='#2b1804' stroke-width='5' d='M38 51c-26 0-37 30-17 43 12 8 30 2 31-12 1-10-8-18-18-14 6-10 19-13 31-9 15 5 22 22 13 36-10 16-38 22-57 9-28-19-12-68 22-70 13-1 22 4 26 10-8-5-18-3-31 7Z'/>
    <path fill='url(#markEdge)' stroke='#2b1804' stroke-width='5' d='M234 51c26 0 37 30 17 43-12 8-30 2-31-12-1-10 8-18 18-14-6-10-19-13-31-9-15 5-22 22-13 36 10 16 38 22 57 9 28-19 12-68-22-70-13-1-22 4-26 10 8-5 18-3 31 7Z'/>
    <path fill='url(#markEdge)' stroke='#2b1804' stroke-width='5' d='M38 217c-26 0-37-30-17-43 12-8 30-2 31 12 1 10-8 18-18 14 6 10 19 13 31 9 15-5 22-22 13-36-10-16-38-22-57-9-28 19-12 68 22 70 13 1 22-4 26-10-8 5-18 3-31-7Z'/>
    <path fill='url(#markEdge)' stroke='#2b1804' stroke-width='5' d='M234 217c26 0 37-30 17-43-12-8-30-2-31 12-1 10 8 18 18 14-6 10-19 13-31 9-15-5-22-22-13-36 10-16 38-22 57-9 28 19 12 68-22 70-13 1-22-4-26-10 8 5 18 3 31-7Z'/>
    <path fill='none' stroke='#fff4c4' stroke-width='5' stroke-linecap='round' opacity='.66' d='M66 70c45-9 129-9 172 0M67 224c46 8 126 8 169 0'/>
    <path fill='none' stroke='#7a4b10' stroke-width='2' opacity='.42' d='M69 101c32-6 99-5 133 0M62 184c37 7 104 7 149 0'/>
    <path fill='none' stroke='#8c6224' stroke-width='2' opacity='.35' d='M104 72l-9 31 31-30 19 31 26-29 34 32 9-31M71 218l25-30 22 30 29-31 21 31 31-29 21 28'/>
    <path filter='url(#markInner)' fill='url(#markBlue)' stroke='#241303' stroke-width='8' stroke-linejoin='round' d='M75 138l42 44 93-102 23 23-115 124-67-67 24-22Z'/>
    <path fill='none' stroke='#9cecff' stroke-width='4' stroke-linecap='round' opacity='.58' d='M83 139l35 36 77-84'/>
  </g>`;
}

function getOptionLabels(options) {
  const maxVisible = 6;

  if (options.length > maxVisible) {
    return [
      ...options.slice(0, maxVisible - 1).map((option) => option.text),
      `+${options.length - (maxVisible - 1)} more options`
    ];
  }

  return options.map((option) => option.text);
}

function renderOptionChips(optionLabels, startY) {
  return optionLabels.map((label, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 88 + column * 512;
    const y = startY + row * 56;
    const text = escapeXml(truncate(label, 32));

    return `<rect x='${x}' y='${y}' width='474' height='44' rx='10' fill='#071B2C' stroke='#876733' stroke-opacity='.74'/>
      <text x='${x + 22}' y='${y + 29}' font-family='Arial, sans-serif' font-size='22' font-weight='700' fill='#E4C98E'>${text}</text>`;
  }).join("");
}

export async function GET(_request, context) {
  const { slug } = await context.params;
  const poll = await getPollShareData(slug).catch(() => null);

  if (!poll) {
    return new Response("Poll not found", { status: 404 });
  }

  const titleLines = splitLines(poll.title, 31, 3);
  const titleFontSize = titleLines.length >= 3 ? 56 : 64;
  const titleLineHeight = titleLines.length >= 3 ? 62 : 70;
  const rationaleLineCount = titleLines.length === 1 ? 2 : titleLines.length === 2 ? 1 : 0;
  const rationaleLines = rationaleLineCount ? splitLines(poll.rationale, 67, rationaleLineCount) : [];
  const rationaleStartY = 214 + titleLines.length * titleLineHeight + 16;
  const optionsLabelY = rationaleLines.length ? Math.min(430, rationaleStartY + rationaleLines.length * 34 + 34) : 412;
  const optionLabels = getOptionLabels(poll.options);

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
    <radialGradient id='glow' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='translate(945 112) rotate(90) scale(285)'>
      <stop stop-color='#2F95C8' stop-opacity='.26'/>
      <stop offset='1' stop-color='#2F95C8' stop-opacity='0'/>
    </radialGradient>
    <pattern id='grain' width='6' height='6' patternUnits='userSpaceOnUse'>
      <path d='M0 0h1v1H0zM4 3h1v1H4z' fill='#ffffff' opacity='.12'/>
    </pattern>
    <linearGradient id='markPaper' x1='28' y1='32' x2='236' y2='229' gradientUnits='userSpaceOnUse'>
      <stop offset='0' stop-color='#fff3c7'/>
      <stop offset='.34' stop-color='#e6c789'/>
      <stop offset='.68' stop-color='#b9873f'/>
      <stop offset='1' stop-color='#fff0bd'/>
    </linearGradient>
    <linearGradient id='markEdge' x1='18' y1='18' x2='258' y2='250' gradientUnits='userSpaceOnUse'>
      <stop offset='0' stop-color='#fff7cb'/>
      <stop offset='.5' stop-color='#986016'/>
      <stop offset='1' stop-color='#f7dc8a'/>
    </linearGradient>
    <linearGradient id='markBlue' x1='83' y1='134' x2='203' y2='134' gradientUnits='userSpaceOnUse'>
      <stop offset='0' stop-color='#0a4d7e'/>
      <stop offset='.48' stop-color='#0c80b7'/>
      <stop offset='1' stop-color='#6ed7ff'/>
    </linearGradient>
    <filter id='logoShadow' x='-20%' y='-20%' width='140%' height='150%'>
      <feDropShadow dx='0' dy='7' stdDeviation='5' flood-color='#000000' flood-opacity='.45'/>
    </filter>
    <filter id='markInner' x='-20%' y='-20%' width='140%' height='140%'>
      <feDropShadow dx='0' dy='2' stdDeviation='1.5' flood-color='#271604' flood-opacity='.35'/>
    </filter>
  </defs>
  <rect width='1200' height='630' fill='url(#bg)'/>
  <rect width='1200' height='630' fill='url(#grain)' opacity='.06'/>
  <circle cx='955' cy='126' r='285' fill='url(#glow)'/>
  <rect x='34' y='34' width='1132' height='562' rx='28' fill='url(#panel)' stroke='url(#goldLine)' stroke-width='3'/>
  <rect x='56' y='56' width='1088' height='518' rx='18' fill='none' stroke='#876733' stroke-opacity='.22'/>
  <path d='M82 152h650' stroke='#876733' stroke-opacity='.34'/>
  <text x='88' y='106' font-family='Arial, sans-serif' font-size='24' font-weight='800' letter-spacing='5' fill='#E4C98E'>FOREVERVOTE</text>
  <text x='88' y='137' font-family='Arial, sans-serif' font-size='18' font-weight='700' letter-spacing='2.2' fill='#8F969B'>WORLD OF WARCRAFT: FOREVER · COMMUNITY VOTING HUB</text>
  <rect x='88' y='166' width='${Math.min(360, 174 + escapeXml(poll.category).length * 13)}' height='36' rx='8' fill='#061522' stroke='#876733' stroke-opacity='.62'/>
  <text x='108' y='190' font-family='Arial, sans-serif' font-size='17' font-weight='800' letter-spacing='2.4' fill='#BC9854'>${escapeXml(poll.category).toUpperCase()}</text>
  ${renderScrollMark()}
  ${titleLines.map((line, index) => `<text x='88' y='${255 + index * titleLineHeight}' font-family='Georgia, serif' font-weight='700' font-size='${titleFontSize}' fill='#F8F2D9'>${escapeXml(line)}</text>`).join("")}
  ${rationaleLines.map((line, index) => `<text x='90' y='${rationaleStartY + index * 34}' font-family='Arial, sans-serif' font-size='25' fill='#D8D2C3'>${escapeXml(line)}</text>`).join("")}
  <text x='88' y='${optionsLabelY}' font-family='Arial, sans-serif' font-size='16' font-weight='800' letter-spacing='2.8' fill='#8F969B'>POLL OPTIONS</text>
  ${renderOptionChips(optionLabels, optionsLabelY + 20)}
  <text x='88' y='606' font-family='Arial, sans-serif' font-size='18' fill='#718398'>www.forevervote.com</text>
  <text x='1026' y='606' text-anchor='end' font-family='Arial, sans-serif' font-size='18' font-weight='800' letter-spacing='1.4' fill='#E4C98E'>VOTE NOW</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300"
    }
  });
}
