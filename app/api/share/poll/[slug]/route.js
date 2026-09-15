import { ImageResponse } from "next/og";
import { getPollShareData } from "../../../../lib/supabase/polls";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const BRAND_MARK_URL = "https://www.forevervote.com/fv-scroll-mark-final.webp";
const SITE_URL = "www.forevervote.com";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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

function OptionChip({ label, index }) {
  const column = index % 2;
  const row = Math.floor(index / 2);

  return <div style={{
    position: "absolute",
    left: 88 + column * 492,
    top: 426 + row * 50,
    width: 456,
    height: 40,
    display: "flex",
    alignItems: "center",
    border: "1px solid rgba(135,103,51,.74)",
    borderRadius: 9,
    background: "#071B2C",
    color: "#E4C98E",
    fontFamily: "Arial, sans-serif",
    fontSize: 20,
    fontWeight: 700,
    padding: "0 20px"
  }}>
    {truncate(label, 28)}
  </div>;
}

export async function GET(_request, context) {
  const { slug: rawSlug } = await context.params;
  const slug = String(rawSlug || "").replace(/\.png$/i, "");
  const poll = await getPollShareData(slug).catch(() => null);

  if (!poll) {
    return new Response("Poll not found", { status: 404 });
  }

  const shareTitle = truncate(poll.title, 90);
  const titleLines = splitLines(shareTitle, 34, 3);
  const titleFontSize = titleLines.length >= 3 ? 48 : titleLines.length === 2 ? 54 : 60;
  const titleLineHeight = titleLines.length >= 3 ? 54 : titleLines.length === 2 ? 61 : 66;
  const optionLabels = getOptionLabels(poll.options);
  const categoryWidth = Math.min(312, 122 + normalizeText(poll.category).length * 13);

  return new ImageResponse(
    <div style={{
      width: 1200,
      height: 630,
      display: "flex",
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg,#07131F 0%,#061522 56%,#04101A 100%)",
      color: "#F8F2D9"
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        background: "radial-gradient(circle at 83% 26%, rgba(47,149,200,.16), transparent 28%)"
      }} />
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        opacity: .05,
        background: "repeating-linear-gradient(0deg, rgba(255,255,255,.18) 0 1px, transparent 1px 6px)"
      }} />
      <div style={{
        position: "absolute",
        left: 34,
        top: 34,
        width: 1132,
        height: 562,
        display: "flex",
        border: "3px solid #BC9854",
        borderRadius: 28,
        background: "linear-gradient(135deg,#08243B 0%,#071B2C 58%,#061522 100%)"
      }} />
      <div style={{
        position: "absolute",
        left: 56,
        top: 56,
        width: 1088,
        height: 518,
        display: "flex",
        border: "1px solid rgba(135,103,51,.22)",
        borderRadius: 18
      }} />

      <div style={{
        position: "absolute",
        left: 88,
        top: 82,
        display: "flex",
        flexDirection: "column",
        gap: 8
      }}>
        <div style={{
          color: "#E4C98E",
          fontFamily: "Arial, sans-serif",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: 5
        }}>FOREVERVOTE</div>
        <div style={{
          color: "#AEB5BA",
          fontFamily: "Arial, sans-serif",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 2.2
        }}>WORLD OF WARCRAFT: FOREVER · COMMUNITY VOTING HUB</div>
        <div style={{ width: 760, height: 1, background: "rgba(135,103,51,.34)" }} />
      </div>

      <div style={{
        position: "absolute",
        right: 86,
        top: 68,
        width: 132,
        height: 132,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(188,152,84,.48)",
        borderRadius: 22,
        background: "radial-gradient(circle at 50% 40%, rgba(47,149,200,.12), rgba(4,16,26,.72) 72%)",
        boxShadow: "0 12px 34px rgba(0,0,0,.28), inset 0 1px 0 rgba(228,201,142,.10)"
      }}>
        <img
          src={BRAND_MARK_URL}
          width="108"
          height="108"
          style={{
            width: 108,
            height: 108,
            objectFit: "contain"
          }}
          alt=""
        />
      </div>

      <div style={{
        position: "absolute",
        left: 88,
        top: 174,
        width: categoryWidth,
        height: 36,
        display: "flex",
        alignItems: "center",
        paddingLeft: 20,
        border: "1px solid rgba(135,103,51,.62)",
        borderRadius: 8,
        background: "#061522",
        color: "#BC9854",
        fontFamily: "Arial, sans-serif",
        fontSize: 17,
        fontWeight: 800,
        letterSpacing: 2.4
      }}>
        {normalizeText(poll.category).toUpperCase()}
      </div>

      <div style={{
        position: "absolute",
        left: 88,
        top: 240,
        display: "flex",
        flexDirection: "column"
      }}>
        {titleLines.map((line, index) => <div key={`${line}-${index}`} style={{
          color: "#F8F2D9",
          fontFamily: "Georgia, serif",
          fontSize: titleFontSize,
          fontWeight: 700,
          lineHeight: `${titleLineHeight}px`,
          textShadow: "0 5px 16px rgba(0,0,0,.34)"
        }}>
          {line}
        </div>)}
      </div>

      <div style={{
        position: "absolute",
        left: 88,
        top: 398,
        color: "#8F969B",
        fontFamily: "Arial, sans-serif",
        fontSize: 16,
        fontWeight: 800,
        letterSpacing: 2.8
      }}>POLL OPTIONS</div>

      {optionLabels.map((label, index) => <OptionChip key={`${label}-${index}`} label={label} index={index} />)}

      <div style={{
        position: "absolute",
        left: 88,
        bottom: 52,
        color: "#718398",
        fontFamily: "Arial, sans-serif",
        fontSize: 19,
        fontWeight: 500
      }}>{SITE_URL}</div>
    </div>,
    {
      width: 1200,
      height: 630
    }
  );
}
