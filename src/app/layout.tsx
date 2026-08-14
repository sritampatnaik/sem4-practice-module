import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Fraunces } from "next/font/google";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "METS · Multi-Agent Educational & Testing System",
  description:
    "Singapore-aligned multi-agent tutor for Mathematics, Physics, Chemistry, and testing.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${atkinson.variable} ${fraunces.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
