import Image from "next/image";
import photo from "../../../public/images/staff-bg.jpg";

/**
 * The staff app's photo background (beach resort from above), fixed behind the
 * page. "dark" for sign-in (white text on top), "light" for the job screens
 * (dark text and white cards on top).
 */
export function StaffBackdrop({ tone }: { tone: "dark" | "light" }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <Image src={photo} alt="" fill priority sizes="100vw" placeholder="blur" className="object-cover object-center" />
      {tone === "dark" ? (
        // Lighter at the top so the beach shows; darker where the keypad and text sit.
        <div className="absolute inset-0 bg-gradient-to-b from-navy/35 via-navy/70 to-navy/90" />
      ) : (
        // Light wash everywhere so dark text on the background stays readable.
        <div className="absolute inset-0 bg-gradient-to-b from-[#eef1f5]/75 via-[#eef1f5]/80 to-[#eef1f5]/90" />
      )}
    </div>
  );
}
