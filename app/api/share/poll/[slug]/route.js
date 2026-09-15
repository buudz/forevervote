import { ImageResponse } from "next/og";
import { getPollShareData } from "../../../../lib/supabase/polls";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const SITE_URL = "www.forevervote.com";

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

function ScrollMark() {
  return <svg width="104" height="104" viewBox="0 0 272 269">
    <defs>
      <linearGradient id="paper" x1="28" y1="32" x2="236" y2="229" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#fff3c7" />
        <stop offset=".34" stopColor="#e6c789" />
        <stop offset=".68" stopColor="#b9873f" />
        <stop offset="1" stopColor="#fff0bd" />
      </linearGradient>
      <linearGradient id="edge" x1="18" y1="18" x2="258" y2="250" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#fff7cb" />
        <stop offset=".5" stopColor="#986016" />
        <stop offset="1" stopColor="#f7dc8a" />
      </linearGradient>
      <linearGradient id="blue" x1="83" y1="134" x2="203" y2="134" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#0a4d7e" />
        <stop offset=".48" stopColor="#0c80b7" />
        <stop offset="1" stopColor="#6ed7ff" />
      </linearGradient>
    </defs>
    <path fill="url(#paper)" stroke="#2b1804" strokeWidth="5" d="M46 66c26-13 166-12 193 0 8 4 11 17 2 23-20 15-13 123 1 139 6 7 4 19-6 23-32 12-160 12-190-1-11-5-12-18-4-25 15-14 14-121 1-136-8-9-6-19 3-23Z" />
    <path fill="url(#edge)" stroke="#2b1804" strokeWidth="5" d="M38 51c-26 0-37 30-17 43 12 8 30 2 31-12 1-10-8-18-18-14 6-10 19-13 31-9 15 5 22 22 13 36-10 16-38 22-57 9-28-19-12-68 22-70 13-1 22 4 26 10-8-5-18-3-31 7Z" />
    <path fill="url(#edge)" stroke="#2b1804" strokeWidth="5" d="M234 51c26 0 37 30 17 43-12 8-30 2-31-12-1-10 8-18 18-14-6-10-19-13-31-9-15 5-22 22-13 36 10 16 38 22 57 9 28-19 12-68-22-70-13-1-22 4-26 10 8-5 18-3 31 7Z" />
    <path fill="url(#edge)" stroke="#2b1804" strokeWidth="5" d="M38 217c-26 0-37-30-17-43 12-8 30-2 31 12 1 10-8 18-18 14 6 10 19 13 31 9 15-5 22-22 13-36-10-16-38-22-57-9-28 19-12 68 22 70 13 1 22-4 26-10-8 5-18 3-31-7Z" />
    <path fill="url(#edge)" stroke="#2b1804" strokeWidth="5" d="M234 217c26 0 37-30 17-43-12-8-30-2-31 12-1 10 8 18 18 14-6 10-19 13-31 9-15-5-22-22-13-36 10-16 38-22 57-9 28 19 12 68-22 70-13 1-22-4-26-10 8 5 18 3 31 7Z" />
    <path fill="none" stroke="#fff4c4" strokeWidth="5" strokeLinecap="round" opacity=".66" d="M66 70c45-9 129-9 172 0M67 224c46 8 126 8 169 0" />
    <path fill="none" stroke="#7a4b10" strokeWidth="2" opacity=".42" d="M69 101c32-6 99-5 133 0M62 184c37 7 104 7 149 0" />
    <path fill="url(#blue)" stroke="#241303" strokeWidth="8" strokeLinejoin="round" d="M75 138l42 44 93-102 23 23-115 124-67-67 24-22Z" />
    <path fill="none" stroke="#9cecff" strokeWidth="4" strokeLinecap="round" opacity=".58" d="M83 139l35 36 77-84" />
  </svg>;
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
        <ScrollMark />
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
