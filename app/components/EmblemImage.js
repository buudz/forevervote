import Image from "next/image";

export function EmblemImage({ className = "", frameClassName = "", priority = false, alt = "" }) {
  return <span className={frameClassName} aria-hidden={alt ? undefined : "true"}>
    <Image
      src="/forevervote-emblem.webp"
      alt={alt}
      width={1024}
      height={1024}
      priority={priority}
      sizes="(max-width: 620px) 43px, (max-width: 860px) 330px, 440px"
      className={className}
    />
  </span>;
}
