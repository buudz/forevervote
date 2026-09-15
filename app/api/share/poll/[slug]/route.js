import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { getPollShareData } from "../../../../lib/supabase/polls";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_URL = "www.forevervote.com";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function truncate(value, maxChars) {
  const text = normalizeText(value);
  return text.length > maxChars ? `${text.slice(0, maxChars - 1).trim()}…` : text;
}

function optionPercent(option, totalVoters) {
  if (!totalVoters) {
    return 0;
  }

  return Math.round((Number(option.voteCount || 0) / totalVoters) * 100);
}

function getOptionLabels(options, totalVoters) {
  const maxVisible = 4;
  const selectable = options.filter((option) => !option.isNeutral);
  const labels = selectable.length ? selectable : options;
  const visible = labels.slice(0, maxVisible);

  if (labels.length > maxVisible) {
    return [
      ...visible.slice(0, maxVisible - 1).map((option) => ({
        text: option.text,
        percent: optionPercent(option, totalVoters)
      })),
      {
        text: `+${labels.length - (maxVisible - 1)} more options`,
        percent: null
      }
    ];
  }

  return visible.map((option) => ({
    text: option.text,
    percent: optionPercent(option, totalVoters)
  }));
}

function OptionChip({ option, index }) {
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
    <span style={{
      display: "flex",
      flex: 1,
      minWidth: 0
    }}>
      {truncate(option.text, 26)}
    </span>
    {option.percent !== null && <span style={{
      display: "flex",
      marginLeft: 16,
      color: "#F2D99B",
      fontSize: 19,
      fontWeight: 800
    }}>
      {option.percent}%
    </span>}
  </div>;
}

export async function GET(_request, context) {
  const lockedLogoPath = path.join(process.cwd(), "public", "fv-scroll-mark-final.png");
  const lockedLogoSrc = `data:image/png;base64,${fs.readFileSync(lockedLogoPath).toString("base64")}`;
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
  const totalVoters = Number(poll.totalVoters ?? poll.totalVotes ?? 0);
  const optionLabels = getOptionLabels(poll.options, totalVoters);
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
          src={lockedLogoSrc}
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

      {optionLabels.map((option, index) => <OptionChip key={`${option.text}-${index}`} option={option} index={index} />)}

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
