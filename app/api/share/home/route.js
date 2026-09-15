import { ImageResponse } from "next/og";
import { BrandScrollMark } from "../../../components/BrandScrollMark";

export const runtime = "edge";


export async function GET() {
  return new ImageResponse(
    <div style={{
      width: 1200,
      height: 630,
      display: "flex",
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg,#07131F 0%,#061522 58%,#04101A 100%)",
      color: "#F8F2D9"
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        background: "radial-gradient(circle at 83% 28%, rgba(47,149,200,.17), transparent 31%)"
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
        left: 82,
        top: 72,
        display: "flex",
        flexDirection: "column",
        gap: 10
      }}>
        <div style={{
          color: "#E4C98E",
          fontFamily: "Georgia, serif",
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: 3
        }}>FOREVERVOTE</div>
        <div style={{
          color: "#AEB5BA",
          fontFamily: "Arial, sans-serif",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 2
        }}>WORLD OF WARCRAFT: FOREVER · COMMUNITY VOTING HUB</div>
      </div>

      <div style={{
        position: "absolute",
        left: 82,
        top: 220,
        width: 780,
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}>
        <div style={{
          color: "#F8F2D9",
          fontFamily: "Georgia, serif",
          fontSize: 68,
          fontWeight: 700,
          lineHeight: "76px"
        }}>A place for WoW Forever players to be heard.</div>
        <div style={{
          color: "#B7BBC0",
          fontFamily: "Arial, sans-serif",
          fontSize: 24,
          lineHeight: "34px",
          maxWidth: 760
        }}>Verified community polls, public results, and player discussion.</div>
      </div>

      <div style={{
        position: "absolute",
        right: 86,
        top: 178,
        width: 220,
        height: 220,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <BrandScrollMark size={220} title="" />
      </div>

      <div style={{
        position: "absolute",
        left: 82,
        bottom: 64,
        color: "#718398",
        fontFamily: "Arial, sans-serif",
        fontSize: 20
      }}>www.forevervote.com</div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
      }
    }
  );
}
