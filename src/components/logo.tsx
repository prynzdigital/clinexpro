import Image from "next/image";

/** The official Clinex Pro logo (from clinexpro.net), 1920×396. */
export function Logo({ className = "h-8 w-auto", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/clinexpro-logo.png"
      alt="Clinex Pro"
      width={1920}
      height={396}
      priority={priority}
      sizes="200px"
      className={className}
    />
  );
}
