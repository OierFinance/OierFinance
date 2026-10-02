import Link from "next/link";
import { BRAND } from "@/config/brand";

/**
 * The owner's Oier mark: two tilted rings forming an "O". The source art is
 * single-colour white, so it is drawn as a CSS mask over `currentColor` and
 * follows the text colour of wherever it sits (ink on paper, white on navy).
 * File: public/brand/mark.webp (512 square, transparent). To swap the logo,
 * replace that file (and regenerate the icons in src/app from the same art).
 */
export function Mark({ size = 26, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: "url(/brand/mark.webp)",
        maskImage: "url(/brand/mark.webp)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

export function Lockup({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 text-ink" aria-label={`${BRAND.name} home`}>
      <Mark size={30} />
      <span className={`whitespace-nowrap font-display text-[18px] font-bold tracking-[-0.02em] ${compact ? "hidden sm:inline" : ""}`}>
        {BRAND.word} <span className="font-medium text-ink-3">Finance</span>
      </span>
    </Link>
  );
}
