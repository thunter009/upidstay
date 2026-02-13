import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Upidstay — Pig Latin Walkie-Talkie",
  description: "Chat with friends in Pig Latin!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
