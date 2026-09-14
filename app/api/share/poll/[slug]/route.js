import { getPollShareData } from "../../../../lib/supabase/polls";

export const dynamic = "force-dynamic";

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function splitLines(value, maxChars, maxLines) {
  const words = String(value || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
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

export async function GET(_request, context) {
  const { slug } = await context.params;
  const poll = await getPollShareData(slug).catch(() => null);

  if (!poll) {
    return new Response("Poll not found", { status: 404 });
  }

  const titleLines = splitLines(poll.title, 31, 3);
  const rationaleLines = splitLines(poll.rationale, 58, 2);
  const options = poll.options.slice(0, 8).map((option) => option.text);
  const optionSummary = options.join(" · ") + (poll.options.length > options.length ? " · …" : "");

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#071018"/>
  <rect x="34" y="34" width="1132" height="562" rx="28" fill="#0b1722" stroke="#c7953a" stroke-width="3"/>
  <circle cx="998" cy="128" r="190" fill="#173149" opacity="0.52"/>
  <circle cx="998" cy="128" r="116" fill="#0a131d" stroke="#d7ad54" stroke-width="9"/>
  <text x="998" y="162" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="96" fill="#d7ad54">FV</text>
  <text x="88" y="112" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="4" fill="#d7ad54">FOREVERVOTE · ${escapeXml(poll.category)}</text>
  ${titleLines.map((line, index) => `<text x="88" y="${206 + index * 72}" font-family="Georgia, serif" font-weight="700" font-size="62" fill="#f4ead0">${escapeXml(line)}</text>`).join("")}
  ${rationaleLines.map((line, index) => `<text x="90" y="${442 + index * 36}" font-family="Arial, sans-serif" font-size="27" fill="#b8c0c8">${escapeXml(line)}</text>`).join("")}
  <rect x="88" y="522" width="1024" height="54" rx="10" fill="#121f2c" stroke="#3c5570"/>
  <text x="116" y="557" font-family="Arial, sans-serif" font-size="24" fill="#f4d280">${escapeXml(optionSummary)}</text>
  <text x="88" y="606" font-family="Arial, sans-serif" font-size="18" fill="#718398">www.forevervote.com</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
}
