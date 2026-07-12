import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Pantry — Waste less. Cook more.",
  description:
    "Keep your kitchen inventory fresh and turn what you have into dinner.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
