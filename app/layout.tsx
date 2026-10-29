import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers";
import "./globals.css";
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
    images: ["/brand/space-editorial.png"],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
