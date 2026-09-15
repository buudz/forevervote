export function EmblemImage({ className = "", frameClassName = "", priority = false, alt = "" }) {
  return <span className={frameClassName} aria-hidden={alt ? undefined : "true"}>
    <img
      src="/forevervote-logo.webp"
      alt={alt}
      width="600"
      height="300"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
    />
  </span>;
}
