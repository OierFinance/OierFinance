"use client";

import { useState } from "react";
import { BRAND, CHAIN, TOKEN, explorerToken, shortAddress } from "@/config/brand";
import { CheckIcon, CopyIcon } from "@/components/icons";

function useCopyCa() {
  const [copied, setCopied] = useState(false);
  const live = TOKEN.isLive;
  const copy = async () => {
    if (!live) return;
    try {
      await navigator.clipboard.writeText(BRAND.ca);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; the address stays visible to select by hand.
    }
  };
  return { live, copied, copy };
}

/** Compact navbar pill. Calm until the contract is published. */
export function NavCaPill() {
  const { live, copied, copy } = useCopyCa();
  return (
    <button
      type="button"
      onClick={copy}
      data-copy-ca="nav"
      title={live ? `Copy ${BRAND.symbol} contract address` : `${BRAND.symbol} contract is published at launch`}
      aria-label={live ? `Copy ${BRAND.symbol} contract address` : `${BRAND.symbol} contract address, published at launch`}
      className={`hidden h-9 shrink-0 items-center gap-2 rounded-full border border-white/[0.12] px-3 text-ink transition-colors hover:border-acc/50 md:flex ${live ? "" : "cursor-default"}`}
    >
      <span className="font-mono text-[11.5px] font-medium text-acc">{BRAND.symbol}</span>
      <span className="hidden font-mono text-[11px] text-ink-3 xl:inline">{copied ? "Copied" : live ? shortAddress(BRAND.ca, 4, 4) : "CA at launch"}</span>
      {copied ? <CheckIcon className="size-3.5 text-ok" /> : <CopyIcon className={`size-3.5 ${live ? "text-ink-2" : "text-ink-3 opacity-60"}`} />}
    </button>
  );
}

/** Full address with a copy button, used on the token page and the home page. */
export function CaStrip() {
  const { live, copied, copy } = useCopyCa();
  return (
    <div className="flex max-w-full items-center gap-3 rounded-[12px] border border-white/[0.1] bg-g1 py-2 pl-3.5 pr-2">
      <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.08em] text-acc">{BRAND.symbol} CA</span>
      <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-ink">{live ? BRAND.ca : "Published at launch"}</span>
      <button
        type="button"
        onClick={copy}
        disabled={!live}
        data-copy-ca="strip"
        className="shrink-0 rounded-full border border-white/[0.14] px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-2 transition-colors hover:text-ink disabled:opacity-40"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/** Token contract block for the footer, visible on every screen size. */
export function CaBlock() {
  const { live, copied, copy } = useCopyCa();
  return (
    <div className="w-full max-w-[420px]">
      <p className="label">{BRAND.symbol} contract · {CHAIN.name}</p>
      <div className="mt-3 flex items-center gap-2 rounded-[12px] border border-white/[0.1] bg-g2 p-1.5 pl-3.5">
        <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-ink" data-ca-text>
          {live ? shortAddress(BRAND.ca, 10, 8) : "Published at launch"}
        </span>
        <button
          type="button"
          onClick={copy}
          disabled={!live}
          data-copy-ca="footer"
          aria-label="Copy contract address"
          className="flex h-9 items-center gap-1.5 rounded-[9px] border border-white/[0.1] px-3 text-[13px] text-ink transition-colors hover:border-acc/60 disabled:opacity-40"
        >
          {copied ? <CheckIcon className="size-4 text-ok" /> : <CopyIcon className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {live ? (
        <a href={explorerToken(BRAND.ca)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[13px] text-ink-3 hover:text-ink">
          View on {CHAIN.explorerName}
        </a>
      ) : (
        <p className="mt-2 text-[12.5px] text-ink-3">The address appears here, copyable, once the token is deployed.</p>
      )}
    </div>
  );
}
