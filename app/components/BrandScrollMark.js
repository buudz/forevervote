export function BrandScrollMark({
  size = 58,
  className = "",
  style = {},
  title = "ForeverVote scroll mark"
}) {
  return <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={className}
    role={title ? "img" : undefined}
    aria-label={title || undefined}
    aria-hidden={title ? undefined : "true"}
    style={{ width: size, height: size, display: "block", ...style }}
  >
    <defs>
      <linearGradient id="fvPaper" x1="28" y1="20" x2="73" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#fff4c7" />
        <stop offset=".34" stopColor="#ead39c" />
        <stop offset=".7" stopColor="#c7954e" />
        <stop offset="1" stopColor="#f8df9d" />
      </linearGradient>
      <linearGradient id="fvRoll" x1="20" y1="16" x2="80" y2="84" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#f7d98d" />
        <stop offset=".45" stopColor="#b87828" />
        <stop offset=".72" stopColor="#75400e" />
        <stop offset="1" stopColor="#e4b65e" />
      </linearGradient>
      <linearGradient id="fvCheck" x1="36" y1="58" x2="72" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#0c4f7e" />
        <stop offset=".55" stopColor="#117fb4" />
        <stop offset="1" stopColor="#63cbed" />
      </linearGradient>
    </defs>

    <path
      d="M29 22C37 24 62 24 71 22c-2 14-2 42 0 56-10-2-32-2-42 0 2-14 2-42 0-56Z"
      fill="url(#fvPaper)"
      stroke="#3a2209"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />

    <path
      d="M28 19c-7-1-11 4-9 9 2 4 8 4 10 0 1-3-2-6-5-5 4-5 10-5 16-2h29c6-3 12-3 16 2-3-1-6 2-5 5 2 4 8 4 10 0 2-5-2-10-9-9-5 0-8 2-11 4H39c-3-2-6-4-11-4Z"
      fill="url(#fvRoll)"
      stroke="#3a2209"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />

    <path
      d="M28 81c-7 1-11-4-9-9 2-4 8-4 10 0 1 3-2 6-5 5 4 5 10 5 16 2h29c6 3 12 3 16-2-3 1-6-2-5-5 2-4 8-4 10 0 2 5-2 10-9 9-5 0-8-2-11-4H39c-3 2-6 4-11 4Z"
      fill="url(#fvRoll)"
      stroke="#3a2209"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />

    <path
      d="M23 25c2-2 5-1 5 1 0 2-3 3-4 1"
      fill="none"
      stroke="#73410f"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M77 25c-2-2-5-1-5 1 0 2 3 3 4 1"
      fill="none"
      stroke="#73410f"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M23 75c2 2 5 1 5-1 0-2-3-3-4-1"
      fill="none"
      stroke="#73410f"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M77 75c-2 2-5 1-5-1 0-2 3-3 4-1"
      fill="none"
      stroke="#73410f"
      strokeWidth="1.7"
      strokeLinecap="round"
    />

    <path
      d="M31 35c10-2 27-2 38 0M31 67c11 2 27 2 38 0"
      fill="none"
      stroke="#fff0bd"
      strokeWidth="2.2"
      strokeLinecap="round"
      opacity=".7"
    />
    <path
      d="M35 41c9-2 20-2 29 0M35 61c9 2 20 2 29 0"
      fill="none"
      stroke="#93672a"
      strokeWidth="1.2"
      opacity=".35"
    />

    <path
      d="M34 52l11 11 25-29 7 6-31 35-19-18 7-5Z"
      fill="url(#fvCheck)"
      stroke="#241606"
      strokeWidth="3.8"
      strokeLinejoin="round"
    />
    <path
      d="M36 52l9 8 21-24"
      fill="none"
      stroke="#9deaff"
      strokeWidth="2"
      strokeLinecap="round"
      opacity=".58"
    />
  </svg>;
}
