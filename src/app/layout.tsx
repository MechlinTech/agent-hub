import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Hub",
  description: "JMeter Script Review Agent — Rules + Templates v1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
