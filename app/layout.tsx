import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ArchVision AI — Automatic UML Diagram Generator",
    template: "%s · ArchVision AI",
  },
  description:
    "Transform natural language, code repositories and database schemas into production-ready UML diagrams with AI. Class, sequence, ER and state diagrams — generated, edited and exported beautifully.",
  keywords: [
    "UML diagram generator",
    "AI diagram",
    "Mermaid",
    "class diagram",
    "sequence diagram",
    "ER diagram",
    "architecture",
  ],
  openGraph: {
    title: "ArchVision AI — Automatic UML Diagram Generator",
    description:
      "Turn words, code and schemas into production-ready UML diagrams. AI-powered editing, validation and code generation.",
    type: "website",
    url: SITE_URL,
    siteName: "ArchVision AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ArchVision AI — Turn words into production-ready UML diagrams",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArchVision AI — Automatic UML Diagram Generator",
    description:
      "Turn words, code and schemas into production-ready UML diagrams. AI-powered editing, validation and code generation.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}