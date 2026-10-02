import Link from "next/link";
import { BRAND, CHAIN } from "@/config/brand";
import { FOOTER_NAV } from "@/config/nav";
import { CaBlock } from "@/components/CopyCa";
import { Lockup } from "@/components/Logo";
import { GithubIcon, XIcon } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-white/[0.07] bg-g1">
      <div className="wrap grid gap-12 py-16 lg:grid-cols-[1.2fr_2fr]">
        <div className="min-w-0">
          <Lockup />
          <p className="mt-4 max-w-[360px] text-[14.5px] leading-[1.6] text-ink-2">{BRAND.tagline}</p>
          <div className="mt-8">
            <CaBlock />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-5 text-[14px] text-ink-2">
            <a href={BRAND.x} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-ink">
              <XIcon className="size-4" /> {BRAND.xHandle}
            </a>
            {BRAND.github ? (
              <a href={BRAND.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-ink">
                <GithubIcon className="size-4" /> GitHub
              </a>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {FOOTER_NAV.map((col) => (
            <div key={col.title}>
              <p className="label">{col.title}</p>
              <ul className="mt-4 grid gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[14.5px] text-ink-2 transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="wrap flex flex-col gap-2 py-6 text-[12.5px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. Pre-launch preview; no live accounts or funds.
          </p>
          <p className="font-mono">
            {BRAND.acronym.map((a) => (
              <span key={a.letter}>
                <span className="text-acc">{a.letter}</span>
                {a.word.slice(1)}{" "}
              </span>
            ))}
            · {CHAIN.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
