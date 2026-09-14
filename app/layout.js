import "./globals.css";

export const metadata = {
  title: "ForeverVote — Your voice. Azeroth's future.",
  description: "An independent World of Warcraft community polling project. Explore proposed launch polls while verified voting is being built."
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
