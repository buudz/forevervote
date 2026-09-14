import "./globals.css";

export const metadata = {
  title: "ForeverVote — World of Warcraft: Forever Community Voting Hub",
  description: "ForeverVote is an independent community voting hub for World of Warcraft: Forever discussions, verified voting, and public poll results."
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
