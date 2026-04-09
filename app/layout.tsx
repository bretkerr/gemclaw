import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://gemclaw.click"),
  title: "GEMCLAW — Cross-Model Intelligence Extraction",
  description: "Cross-model Mixture of Experts research engine — Claude x Gemini",
  openGraph: {
    title: "GEMCLAW — Cross-Model Intelligence Extraction",
    description: "The apex predator of cross-model research synthesis. Claude x Gemini MoE engine.",
    images: [{ url: "/hero.jpg", width: 1200, height: 630, alt: "GEMCLAW" }],
  },
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
