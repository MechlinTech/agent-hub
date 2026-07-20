import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Hub",
  description:
    "AI agents for performance engineering—JMeter script review, BlazeMeter results analysis, and Dev Scaffold.",
  applicationName: "Agent Hub",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Agent Hub",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7c3aed",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
