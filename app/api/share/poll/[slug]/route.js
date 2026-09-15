import { ImageResponse } from "next/og";
import { getPollShareData } from "../../../../lib/supabase/polls";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const SITE_URL = "www.forevervote.com";
const BRAND_MARK_DATA_URI = "data:image/webp;base64,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";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function truncate(value, maxChars) {
  const text = normalizeText(value);
  return text.length > maxChars ? `${text.slice(0, maxChars - 1).trim()}…` : text;
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
    top: 454 + row * 50,
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

  const cleanTitle = normalizeText(poll.title);
  const titleFontSize =
    cleanTitle.length > 74 ? 38 :
    cleanTitle.length > 52 ? 44 :
    cleanTitle.length > 34 ? 50 :
    58;
  const titleLineHeight = titleFontSize + 6;
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
        right: 88,
        top: 72,
        width: 112,
        height: 112,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 48%, rgba(47,149,200,.10), rgba(4,16,26,0) 70%)"
      }}>
        <img
          src={BRAND_MARK_DATA_URI}
          width="104"
          height="104"
          alt=""
          style={{
            width: 104,
            height: 104,
            objectFit: "contain"
          }}
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
        top: 224,
        width: 1010,
        height: 184,
        display: "flex",
        alignItems: "center",
        color: "#F8F2D9",
        fontFamily: "Georgia, serif",
        fontSize: titleFontSize,
        fontWeight: 700,
        lineHeight: `${titleLineHeight}px`,
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        textShadow: "0 5px 16px rgba(0,0,0,.34)"
      }}>
        {cleanTitle}
      </div>

      <div style={{
        position: "absolute",
        left: 88,
        top: 424,
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
