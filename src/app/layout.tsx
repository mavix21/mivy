import type { Metadata } from "next";
import { DM_Mono, Rethink_Sans } from "next/font/google";
import "./globals.css";
import { CDPProvider } from "@/providers/cdp.provider";

const dmMono = DM_Mono({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500"],
});

const rethinkSans = Rethink_Sans({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "x402 AI Starter Kit",
  description:
    "A demo of agentic payments powered by x402 using Next.js, AI SDK, AI Elements, AI Gateway, and the Coinbase CDP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${dmMono.className} ${rethinkSans.className} antialiased h-full`}
      >
        <CDPProvider>{children}</CDPProvider>
      </body>
    </html>
  );
}
