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
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  return (
    <header className="sticky top-0 z-40 h-16">
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 -z-10 border-b transition-colors duration-300 ${
          scrolled ? "border-white/[0.08] bg-[rgba(10,12,15,0.82)] backdrop-blur-xl" : "border-transparent bg-transparent"
        }`}
      />
      <div className="wrap flex h-16 items-center gap-3">
        <Lockup compact />
        <nav aria-label="Primary" className="ml-5 hidden items-center gap-1 lg:flex xl:ml-8">
          {SITE_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-[14px] transition-colors hover:text-ink ${active ? "bg-white/[0.06] text-ink" : "text-ink-2"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <NavCaPill />
          <Link href="/waitlist" className="btn btn-sm btn-ghost hidden xl:inline-flex">
            Early access
          </Link>
          <span className="hidden sm:inline-flex">
            <NavWallet />
          </span>
          <span className="inline-flex sm:hidden">
            <NavWallet compact />
          </span>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenu(true)}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/[0.12] text-ink lg:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {menu
        ? createPortal(
            <div className="fixed inset-0 z-[60] flex flex-col bg-g0/95 backdrop-blur-xl lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
              <div className="wrap flex h-16 items-center justify-between">
                <Lockup />
                <button type="button" aria-label="Close menu" onClick={() => setMenu(false)} className="grid size-9 place-items-center rounded-full border border-white/[0.12]">
                  <CloseIcon />
                </button>
              </div>
              <nav className="wrap flex flex-1 flex-col overflow-y-auto pb-10 pt-4" aria-label="Mobile">
                {[...SITE_NAV, { href: "/waitlist", label: "Early access" }, { href: "/about", label: "About" }].map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMenu(false)} className="border-b border-white/[0.06] py-3.5 font-display text-[26px] font-semibold tracking-[-0.02em] text-ink">
                    {item.label}
                  </Link>
                ))}
                <p className="label mt-8">{BRAND.slogan}</p>
              </nav>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
