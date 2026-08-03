import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TruthGuard — On-chain Fact Verification",
  description: "Verify factual claims on GenLayer using AI consensus and on-chain evidence fetching.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
