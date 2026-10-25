import Image from "next/image";

/** The official Clinex Pro logo (from clinexpro.net), 1920×396; "light" has white lettering for dark backgrounds. */
export function Logo({
  className = "h-8 w-auto",
  priority = false,
  variant = "default",
}: {
  className?: string;
  priority?: boolean;
  variant?: "default" | "light";
}) {
  return (
    <Image
      src={variant === "light" ? "/brand/clinexpro-logo-light.png" : "/brand/clinexpro-logo.png"}
      alt="Clinex Pro"
      width={1920}
      height={396}
      priority={priority}
      sizes="200px"
      className={className}
    />
  );
}
