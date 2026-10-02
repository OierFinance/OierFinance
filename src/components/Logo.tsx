import Link from "next/link";
import { BRAND } from "@/config/brand";

/**
 * The Oier mark: a key whose bow is the O of Oier (own it). Temporary art drawn for the site; to swap in the
 * owner's logo, replace the SVG below (or render public/brand/mark.webp)
 * and regenerate src/app/favicon.ico, icon.png, apple-icon.png and the
 * opengraph/twitter images.
 */
export function Mark({ size = 26, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={`shrink-0 ${className}`}>
      <rect width="64" height="64" rx="16" fill="#4fe3b8" />
      <circle cx="23" cy="32" r="11" fill="none" stroke="#06150f" strokeWidth="6.5" />
      <path d="M34 32h20M47 32v8M54 32v6" fill="none" stroke="#06150f" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`whitespace-nowrap font-display text-[18px] font-semibold tracking-[-0.02em] ${className}`}>
      {BRAND.word}
      <span className="ml-1 font-sans text-[13px] font-medium tracking-normal text-ink-3">Finance</span>
    </span>
  );
}

export function Lockup({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5 text-ink" aria-label={`${BRAND.name} home`}>
      <Mark size={28} />
      <span className={compact ? "hidden sm:inline" : ""}>
        <Wordmark />
      </span>
    </Link>
  );
}
