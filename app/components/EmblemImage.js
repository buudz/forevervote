export function EmblemImage({ className = "", frameClassName = "", priority = false, alt = "" }) {
  return <span className={frameClassName} aria-hidden={alt ? undefined : "true"}>
    <img
      src="/forevervote-logo-final.webp"
      alt={alt}
      width="520"
      height="260"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
    />
  </span>;
}
