import Image from "next/image";
export function SiteImage({
  src,
  alt,
  className,
  style,
  priority = false,
  sizes = "(max-width: 760px) 50vw, 33vw",
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  sizes?: string;
}) {
  const canOptimize = src.startsWith("/") && !src.endsWith(".svg");
  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={1350}
      className={className}
      style={style}
      sizes={sizes}
      priority={priority}
      unoptimized={!canOptimize}
    />
  );
}
