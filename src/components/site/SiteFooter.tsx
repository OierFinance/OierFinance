import Link from "next/link";
import { BRAND } from "@/config/brand";
import { FOOTER_NAV } from "@/config/nav";
import { CaBlock } from "@/components/CopyCa";
import { Mark } from "@/components/Logo";
import { GithubIcon, XIcon } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer className="night night-bg font-sans">
      <div className="wrap grid grid-cols-1 gap-12 pb-12 pt-16 lg:grid-cols-[1.3fr_2fr]">
        <div className="min-w-0">
          <Link href="/" className="flex items-center gap-2.5" aria-label={`${BRAND.name} home`}>
            <Mark size={26} />
            <span className="font-display text-[18px] font-bold tracking-[-0.02em]">{BRAND.word} <span className="font-medium text-ink-3">Finance</span></span>
          </Link>
          <p className="mt-4 max-w-[340px] font-serif text-[16px] leading-[1.55] text-ink-2">Your instructions, kept by the account.</p>
          <div className="mt-8">
            <CaBlock />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FOOTER_NAV.map((col) => (
            <div key={col.title}>
              <p className="text-[14px] font-semibold text-ink">{col.title}</p>
              <ul className="mt-3 grid gap-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[14.5px] text-ink-2 transition-colors hover:text-ink">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="text-[14px] font-semibold text-ink">Follow</p>
            <ul className="mt-3 grid gap-2 text-[14.5px] text-ink-2">
              <li><a href={BRAND.x} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-ink"><XIcon className="size-3.5" /> {BRAND.xHandle}</a></li>
              {BRAND.github ? <li><a href={BRAND.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-ink"><GithubIcon className="size-3.5" /> GitHub</a></li> : null}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="wrap flex flex-col gap-2 py-6 text-[13px] text-ink-3 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {BRAND.name}. Account contracts are unaudited; use small amounts.</p>
          <p>{BRAND.slogan}</p>
        </div>
      </div>
    </footer>
  );
}
