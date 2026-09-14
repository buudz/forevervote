import "./globals.css";

export const metadata = {
  title: "ForeverVote — Your voice. Azeroth's future.",
  description: "An independent World of Warcraft community polling project for WoW Forever discussions, verified voting, and public results."
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
