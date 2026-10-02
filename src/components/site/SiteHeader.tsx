"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Lockup } from "@/components/Logo";
import { NavCaPill } from "@/components/CopyCa";
import { NavWallet } from "@/components/wallet/WalletButton";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { BRAND } from "@/config/brand";
import { SITE_NAV } from "@/config/nav";

export function SiteHeader() {
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-g2/95 backdrop-blur-sm">
      <div className="wrap flex h-[60px] items-center gap-3">
        <Lockup compact />
        <nav aria-label="Primary" className="ml-8 hidden items-center gap-5 xl:flex">
          {SITE_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap text-[14.5px] transition-colors hover:text-ink ${active ? "font-semibold text-ink" : "text-ink-2"}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <NavCaPill />
          <Link href="/waitlist" className="btn btn-sm btn-ghost hidden 2xl:inline-flex">
            Early access
          </Link>
          <span className="hidden sm:inline-flex">
            <NavWallet />
          </span>
          <span className="inline-flex sm:hidden">
            <NavWallet compact />
          </span>
          <button type="button" aria-label="Open menu" onClick={() => setMenu(true)} className="grid size-9 shrink-0 place-items-center rounded-[6px] border border-line text-ink xl:hidden">
            <MenuIcon />
          </button>
        </div>
      </div>

      {menu
        ? createPortal(
            <div className="fixed inset-0 z-[60] flex flex-col bg-g2 xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
              <div className="wrap flex h-[60px] items-center justify-between border-b border-line">
                <Lockup />
                <button type="button" aria-label="Close menu" onClick={() => setMenu(false)} className="grid size-9 place-items-center rounded-[6px] border border-line">
                  <CloseIcon />
                </button>
              </div>
              <nav className="wrap flex flex-1 flex-col overflow-y-auto pb-10 pt-2" aria-label="Mobile">
                {[...SITE_NAV, { href: "/waitlist", label: "Early access" }, { href: "/about", label: "About" }].map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMenu(false)} className="border-b border-line py-3.5 font-display text-[24px] font-bold tracking-[-0.02em] text-ink">
                    {item.label}
                  </Link>
                ))}
                <p className="mt-8 font-serif text-[16px] italic text-ink-3">{BRAND.slogan}</p>
              </nav>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
