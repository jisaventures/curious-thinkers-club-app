import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { PlayBackdrop } from "@/components/brand/play-backdrop";
import { ScrollToTop } from "@/components/scroll-to-top";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: "Curious Thinkers Club",
  description: "The members' club for Curious Thinkers printable learning quests.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preload" href="/brand/bulb.png" as="image" fetchPriority="high" />
        <link rel="preload" href="/brand/mascot-spy.webp" as="image" type="image/webp" fetchPriority="high" />
        <link rel="preload" href="/brand/merch-banner.webp" as="image" type="image/webp" fetchPriority="high" />
      </head>
      <body className={`${nunito.variable} ${fredoka.variable} isolate font-sans antialiased`}>
        <ScrollToTop />
        <PlayBackdrop />
        {children}
      </body>
    </html>
  );
}
