import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers";
import "./globals.css";
import "./redesign.css";
import "./workspace.css";
export const metadata: Metadata = {
  title: {
    default: "AI Tech Origin — Ideas into action.",
    template: "%s · AI Tech Origin",
  },
  description:
    "A practical library of image prompts, creative workflows, research guides, and ideas worth keeping. Made for curious minds.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://ai-tech-origin.vercel.app",
  ),
  openGraph: {
    title: "AI Tech Origin",
    description: "Less searching. More creating.",
    images: ["/brand/wordmark.png"],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
