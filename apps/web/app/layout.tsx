import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "BugBounty Hunter — Open-Source AI Bug Reproduction & Evidence Platform",
  description:
    "Turn vague bug reports into reproducible pytest tests, isolated container execution evidence, and verifiable Proof Packs.",
  keywords: ["AI developer tools", "bug reproduction", "pytest", "autonomous agents", "proof pack", "forensic engineering"],
  openGraph: {
    title: "BugBounty Hunter — Every bug has a story. Every claim needs proof.",
    description: "Autonomous open-weight AI agent that reproduces software defects with verifiable execution evidence.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen flex flex-col antialiased selection:bg-accent selection:text-background">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
