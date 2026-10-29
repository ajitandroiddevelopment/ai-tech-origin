import { getContent } from "@/lib/content";
import { Hub } from "@/components/hub";
export const dynamic = "force-dynamic";
export default async function Page() {
  return <Hub items={await getContent()} initialView="newsletter" />;
}
