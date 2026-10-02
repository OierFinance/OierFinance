"use client";

import { useState } from "react";
import { BRAND, CHAIN, shortAddress } from "@/config/brand";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useWalletModal } from "@/components/wallet/WalletButton";
import { useLocalStore } from "@/components/wallet/useLocalStore";
import { CheckIcon, CopyIcon } from "@/components/icons";

/*
 * Early-access entry. There is no list server yet, so the entry is kept on
 * this device and, when a wallet is connected, signed with it (no gas). The
 * signed entry can be downloaded and submitted once the list opens.
 */

type Entry = { email: string; uses: string[]; referrer: string; handle: string; address: string | null; signature: string | null; at: number };

const USES = ["Protecting my own account", "An allowance for family", "Paying an AI agent", "Running a business account", "Building on it"];

export function Waitlist() {
  const { address, signMessage } = useWallet();
  const { open } = useWalletModal();
  const [entry, setEntry] = useLocalStore<Entry | null>("oier.waitlist", null);
  const [email, setEmail] = useState("");
  const [uses, setUses] = useState<string[]>([]);
  const [referrer, setReferrer] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const emailOk = email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const canSubmit = (email !== "" || address) && emailOk && uses.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    const at = Date.now();
    const handle = address ? `oier-${address.slice(2, 8).toLowerCase()}` : `oier-${Math.abs(hash(email)).toString(36).slice(0, 6)}`;
    let signature: string | null = null;
    if (address) {
      try {
        signature = await signMessage(
          [`${BRAND.name} early access`, `Account: ${address}`, `Network: ${CHAIN.name}`, `Interests: ${uses.join("; ")}`, referrer ? `Sent by: ${referrer}` : "", `Date: ${new Date(at).toISOString()}`, "Signing costs no gas and sends no transaction."].filter(Boolean).join("\n"),
        );
      } catch (cause) {
        setErr(cause instanceof Error ? cause.message : "The wallet did not sign.");
        setBusy(false);
        return;
      }
    }
    setEntry({ email, uses, referrer: referrer.trim(), handle, address: address ?? null, signature, at });
    setBusy(false);
  }

  if (entry) {
    const blob = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(entry, null, 2))}`;
    return (
      <div className="card-hi p-6 sm:p-8" data-waitlist-done>
        <span className="grid size-10 place-items-center rounded-full bg-acc/15 text-acc"><CheckIcon className="size-5" /></span>
        <h2 className="h3 mt-4">You are on the list, on this device.</h2>
        <p className="mt-2 text-[15px] leading-[1.6] text-ink-2">
          {entry.signature ? `Signed by ${shortAddress(entry.address ?? "")}.` : "Saved without a wallet signature."} The list server is not open yet, so your entry is kept in this browser. Download it to keep a copy; when the list opens you can submit it as is.
        </p>
        <dl className="mt-5 grid gap-2 text-[14px] sm:grid-cols-2">
          <div><dt className="label">Interests</dt><dd className="mt-1 text-ink-2">{entry.uses.join(", ")}</dd></div>
          {entry.referrer ? <div><dt className="label">Sent by</dt><dd className="mt-1 text-ink-2">{entry.referrer}</dd></div> : null}
        </dl>
        <div className="mt-6 rounded-[12px] border border-white/[0.1] bg-g1 p-4">
          <p className="label">Your share name</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[15px] text-ink">{entry.handle}</span>
            <button type="button" className="chip" onClick={async () => { try { await navigator.clipboard.writeText(entry.handle); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {} }}>
              {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />} {copied ? "Copied" : "Copy"}
            </button>
            <a className="chip" target="_blank" rel="noreferrer" href={`https://x.com/intent/post?text=${encodeURIComponent(`Writing my own money rules with ${BRAND.xHandle}. Early access: ${BRAND.url}/waitlist (sent by ${entry.handle})`)}`}>Share on X</a>
          </div>
          <p className="mt-2 text-[12.5px] text-ink-3">Anyone who enters it as “Who sent you?” credits you.</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={blob} download="oier-early-access.json" className="btn btn-sm btn-acc">Download entry</a>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEntry(null)}>Start over</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8" data-waitlist-form>
      <p className="tag">Request an invite</p>
      <p className="mt-3 text-[15px] leading-[1.6] text-ink-2">Accounts open in small groups. Sign with your wallet (no gas), leave an email, or both.</p>

      <div className="mt-6 grid gap-2">
        <span className="label">Wallet</span>
        {address ? (
          <p className="flex items-center gap-2 rounded-[10px] border border-acc/30 bg-acc/[0.05] px-3 py-2.5 font-mono text-[13px]"><span className="size-2 rounded-full bg-ok" />{shortAddress(address, 8, 6)}</p>
        ) : (
          <button type="button" onClick={open} className="btn btn-ghost justify-start">Connect a wallet to sign your entry</button>
        )}
      </div>

      <label className="mt-5 grid gap-2">
        <span className="label">Email {address ? "(optional)" : ""}</span>
        <input type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        {!emailOk ? <span className="text-[12.5px] text-bad">That email does not look complete.</span> : null}
      </label>

      <fieldset className="mt-5">
        <legend className="label">What would you use it for?</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {USES.map((u) => {
            const on = uses.includes(u);
            return (
              <button key={u} type="button" aria-pressed={on} onClick={() => setUses(on ? uses.filter((x) => x !== u) : [...uses, u])} className={`chip ${on ? "!border-acc/60 !bg-acc/10 !text-ink" : ""}`}>
                {on ? <CheckIcon className="size-3.5 text-acc" /> : null}
                {u}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-5 grid gap-2">
        <span className="label">Who sent you? (optional)</span>
        <input className="field" value={referrer} onChange={(e) => setReferrer(e.target.value)} placeholder="their share name" maxLength={40} />
      </label>

      <button type="submit" disabled={!canSubmit || busy} className="btn btn-acc mt-7 w-full" data-waitlist-submit>
        {busy ? "Confirm in wallet…" : address ? "Sign and join" : "Join early access"}
      </button>
      <p className="mt-3 text-[12.5px] text-ink-3">{!canSubmit ? "Pick at least one use, and connect a wallet or add an email." : "Stored on this device only. Nothing is sent to a server."}</p>
      {err ? <p className="mt-2 text-[12.5px] text-bad">{err}</p> : null}
    </form>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
