import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GEMCLAW — Cross-Model Intelligence Extraction",
  description: "Cross-model Mixture of Experts research engine — Claude x Gemini",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
