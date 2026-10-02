"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CHAIN, explorerAddress, shortAddress } from "@/config/brand";
import { UNAUDITED_NOTE } from "@/config/contracts";
import { useWalletModal } from "@/components/wallet/WalletButton";
import { CheckIcon, CopyIcon } from "@/components/icons";
import type { useAccount } from "./useAccount";

const TABS = [
  ["/account", "Overview"],
  ["/account/send", "Send"],
  ["/account/queue", "Queue"],
  ["/account/rules", "Rules"],
  ["/account/recovery", "Recovery"],
] as const;

export function Copy({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy"
      className="inline-grid size-7 shrink-0 place-items-center rounded-[5px] border border-line text-ink-2 hover:border-ink-3"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {}
      }}
    >
      {done ? <CheckIcon className="size-3.5 text-ok" /> : <CopyIcon className="size-3.5" />}
    </button>
  );
}

export function Note({ tone = "info", children }: { tone?: "info" | "warn" | "bad" | "ok"; children: React.ReactNode }) {
  const cls = tone === "warn" ? "verdict-hold" : tone === "bad" ? "verdict-deny" : tone === "ok" ? "verdict-allow" : "border-line bg-g1 text-ink-2";
  return <div className={`rounded-[8px] border px-4 py-3 text-[14.5px] leading-[1.5] ${cls}`}>{children}</div>;
}

export function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="rounded-[10px] border border-line bg-g2 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[17px] font-bold tracking-[-0.01em]">{title}</h2>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function TxMessage({ message }: { message: { tone: "ok" | "bad"; text: string } | null }) {
  if (!message) return null;
  return <p className={`mt-3 rounded-[6px] border px-3 py-2 text-[14px] ${message.tone === "ok" ? "verdict-allow" : "verdict-deny"}`} data-tx-message={message.tone}>{message.text}</p>;
}

/** Frame for every account page: title, tabs, and the calm states before an account exists. */
export function AccountShell({ acc, title, children, needsAccount = true }: { acc: ReturnType<typeof useAccount>; title: string; children: React.ReactNode; needsAccount?: boolean }) {
  const pathname = usePathname();
  const { open } = useWalletModal();
  const query = acc.viewingOther && acc.account ? `?account=${acc.account}` : "";
  return (
    <div className="wrap pb-24 pt-12 font-sans sm:pt-16">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="h1">{title}</h1>
          {acc.account && acc.exists ? (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-[14.5px] text-ink-2">
              <span>{acc.viewingOther ? "Viewing account" : "Your account"}</span>
              <a href={explorerAddress(acc.account)} target="_blank" rel="noreferrer" className="font-mono text-[13px] text-ink underline-offset-2 hover:underline" data-account-address>{shortAddress(acc.account, 8, 6)}</a>
              <Copy value={acc.account} />
              <span className="text-ink-3">on {CHAIN.name}</span>
            </p>
          ) : null}
        </div>
        <nav aria-label="Account sections" className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {TABS.map(([href, label]) => (
            <Link key={href} href={`${href}${query}`} aria-current={pathname === href ? "page" : undefined} className={`shrink-0 rounded-[6px] px-3 py-1.5 text-[14px] ${pathname === href ? "bg-ink text-g2" : "text-ink-2 hover:bg-g4"}`}>
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6"><Note tone="warn">{UNAUDITED_NOTE}</Note></div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        {!acc.factory ? (
          <Section title="Not deployed yet">
            <p className="copy !text-[16px]">The account contracts have not been deployed on {CHAIN.name} yet, so there is nothing to connect to. The Rule Studio works in the meantime. Project owner: the factory is deployed from <Link href="/deploy" className="text-acc underline underline-offset-2">/deploy</Link>.</p>
          </Section>
        ) : !acc.connected && !acc.viewingOther ? (
          <Section title="Connect a wallet">
            <p className="copy !text-[16px]">Your account address is derived from your wallet address, so connect first.</p>
            <button type="button" className="btn btn-acc mt-4" onClick={open}>Connect wallet</button>
          </Section>
        ) : needsAccount && acc.exists === false ? (
          <Section title="No account here yet">
            <p className="copy !text-[16px]">{acc.viewingOther ? "Nothing is deployed at that address." : "You have not created your account yet."} {acc.viewingOther ? null : <Link href="/account" className="text-acc underline underline-offset-2">Create it on the overview page.</Link>}</p>
          </Section>
        ) : needsAccount && acc.exists === null ? (
          <p className="text-[14.5px] text-ink-3">Reading the account…</p>
        ) : (
          children
        )}
        {acc.error ? <Note tone="bad">{acc.error}</Note> : null}
      </div>
    </div>
  );
}
