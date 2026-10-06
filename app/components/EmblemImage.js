import Image from "next/image";

export function EmblemImage({ className = "", frameClassName = "", priority = false, alt = "" }) {
  return <span className={frameClassName} aria-hidden={alt ? undefined : "true"}>
    <Image
      src="/forevervote-logo.webp"
      alt={alt}
      width={600}
      height={300}
      priority={priority}
      className={className}
    />
  </span>;
}
