import { getContent } from "@/lib/content";
import { Detail } from "@/components/detail";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = (await getContent()).find((x) => x.slug === slug);
  return { title: item?.title || "Resource" };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const items = await getContent();
  const item = items.find((x) => x.slug === slug);
  if (!item) notFound();
  return (
    <Detail
      item={item}
      related={items
        .filter((x) => x.category === item.category && x.slug !== item.slug)
        .slice(0, 3)}
    />
  );
}
