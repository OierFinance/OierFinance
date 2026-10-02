"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatUnits, parseEther, parseUnits } from "viem";
import { CHAIN, USDG, shortAddress } from "@/config/brand";
import { ACCOUNT_SALT } from "@/config/contracts";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useRuleStore } from "@/components/studio/useRuleStore";
import { compileRuleSet, rule, KEYS } from "@/lib/compile";
import { accountCode, duration, encodeAccount, encodeFactory } from "@/lib/oier";
import { AccountShell, Copy, Note, Section, TxMessage } from "./Shell";
import { useAccount, useTx } from "./useAccount";

const DELAYS = [
  [3600, "1 hour"],
  [6 * 3600, "6 hours"],
  [86400, "24 hours"],
  [2 * 86400, "48 hours"],
  [7 * 86400, "7 days"],
] as const;

export function AccountOverview() {
  const acc = useAccount();
  return (
    <AccountShell acc={acc} title="Account" needsAccount={false}>
      {acc.exists === false && !acc.viewingOther ? <CreatePanel acc={acc} /> : acc.exists && acc.state ? <Summary acc={acc} /> : acc.exists === null ? <p className="text-[14.5px] text-ink-3">Reading the account…</p> : null}
    </AccountShell>
  );
}

function CreatePanel({ acc }: { acc: ReturnType<typeof useAccount> }) {
  const { address } = useWallet();
  const store = useRuleStore(address);
  const [guardDelay, setGuardDelay] = useState<number>(2 * 86400);
  const [useStudio, setUseStudio] = useState(true);
  const [finish, setFinish] = useState(true);
  const { run, busy, message } = useTx();

  const compiled = useMemo(() => compileRuleSet(store.set, -new Date().getTimezoneOffset() * 60), [store.set]);
  const config = [rule("setGuard", [KEYS.default, guardDelay, 0, false]), ...(useStudio ? compiled.calls.map((c) => c.data) : [])];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Section title="Create your account">
        <p className="copy !text-[16px]">Your account is a contract that holds funds and checks every transfer you propose against its rules. Its address is fixed by your wallet address, so you can see it before it exists.</p>
        <dl className="mt-5 grid gap-3 text-[14.5px]">
          <div className="grid gap-1 sm:grid-cols-[170px_1fr]">
            <dt className="text-ink-3">Address it will have</dt>
            <dd className="flex min-w-0 items-center gap-2"><span className="truncate font-mono text-[13px]" data-predicted>{acc.own}</span>{acc.own ? <Copy value={acc.own} /> : null}</dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[170px_1fr]">
            <dt className="text-ink-3">Owner</dt>
            <dd className="font-mono text-[13px]">{address ? shortAddress(address, 8, 6) : "…"}</dd>
          </div>
        </dl>
        <label className="mt-5 grid gap-1.5 text-[14px]">
          <span className="font-semibold">Default waiting time for loosening a rule</span>
          <select className="field max-w-[260px]" value={guardDelay} onChange={(e) => setGuardDelay(Number(e.target.value))} data-guard-delay>
            {DELAYS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <span className="text-[13px] text-ink-3">Tightening always applies at once. Loosening waits this long unless a rule has its own guard, which gives you or your guardians time to cancel it.</span>
        </label>
        <label className="mt-4 flex items-start gap-2 text-[14.5px]">
          <input type="checkbox" checked={finish} onChange={(e) => setFinish(e.target.checked)} className="mt-1 accent-[#0e7c6b]" />
          <span>Lock in the rules now. Unticked, rules can change instantly for the first 24 hours while you finish setting up.</span>
        </label>
        <button
          type="button"
          className="btn btn-acc mt-6"
          disabled={Boolean(busy) || !acc.factory}
          onClick={() => run("Account created", { to: acc.factory!, data: encodeFactory("createAccount", [accountCode, ACCOUNT_SALT, config, finish]) }, acc.refresh)}
          data-create-account
        >
          {busy ? "Confirm in wallet…" : "Create account"}
        </button>
        <TxMessage message={message} />
        <p className="mt-3 text-[13px] text-ink-3">One transaction on {CHAIN.name}. You pay the gas; the contract is about 20 KB, so it costs more than a plain transfer.</p>
      </Section>

      <Section title="Rules from your Rule Studio">
        <label className="flex items-center gap-2 text-[14.5px]">
          <input type="checkbox" checked={useStudio} onChange={(e) => setUseStudio(e.target.checked)} className="accent-[#0e7c6b]" data-use-studio />
          Apply them when the account is created
        </label>
        {compiled.calls.length ? (
          <ul className="mt-3 grid gap-1.5 text-[14px]" data-compiled>
            {compiled.calls.map((c) => <li key={c.data} className="rounded-[6px] bg-g3 px-3 py-2">{c.label}</li>)}
          </ul>
        ) : (
          <p className="mt-3 text-[14px] text-ink-3">No on-chain rules yet. <Link href="/studio" className="text-acc underline underline-offset-2">Write some in the studio</Link>; payees need an address in the studio&apos;s address book.</p>
        )}
        {compiled.skipped.length ? (
          <div className="mt-4">
            <p className="text-[13.5px] font-semibold text-ink-2">Not enforced on-chain yet</p>
            <ul className="mt-1.5 grid gap-1 text-[13.5px] text-ink-3">{compiled.skipped.map((s, i) => <li key={i}>{s.rule}: {s.reason}</li>)}</ul>
          </div>
        ) : null}
      </Section>
    </div>
  );
}

function Summary({ acc }: { acc: ReturnType<typeof useAccount> }) {
  const s = acc.state!;
  const { run, busy, message } = useTx();
  const [eth, setEth] = useState("0.01");
  const [usdg, setUsdg] = useState("10");
  const fmt = (v: bigint, d: number) => Number(formatUnits(v, d)).toLocaleString("en-US", { maximumFractionDigits: 6 });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Section title="Balances">
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-[8px] bg-g3 p-4"><dt className="text-[13px] text-ink-3">USDG</dt><dd className="num mt-1 text-[22px]" data-balance-usdg>{fmt(s.balances.usdg, USDG.decimals)}</dd></div>
          <div className="rounded-[8px] bg-g3 p-4"><dt className="text-[13px] text-ink-3">ETH</dt><dd className="num mt-1 text-[22px]" data-balance-eth>{fmt(s.balances.eth, 18)}</dd></div>
        </dl>
        <p className="mt-4 text-[14px] text-ink-2">To deposit from any wallet or exchange, send USDG or ETH on {CHAIN.name} to the account address above. Or deposit from the connected wallet:</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run("ETH deposited", { to: acc.account!, value: parseEther(eth || "0") }, acc.refresh); }}>
            <input className="field num" value={eth} onChange={(e) => setEth(e.target.value)} inputMode="decimal" aria-label="ETH amount" data-deposit-eth />
            <button className="btn btn-sm btn-ghost !h-10 shrink-0" disabled={Boolean(busy)}>Deposit ETH</button>
          </form>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const data = ("0xa9059cbb" + acc.account!.slice(2).toLowerCase().padStart(64, "0") + parseUnits(usdg || "0", USDG.decimals).toString(16).padStart(64, "0")) as `0x${string}`; run("USDG deposited", { to: USDG.address, data }, acc.refresh); }}>
            <input className="field num" value={usdg} onChange={(e) => setUsdg(e.target.value)} inputMode="decimal" aria-label="USDG amount" />
            <button className="btn btn-sm btn-ghost !h-10 shrink-0" disabled={Boolean(busy)}>Deposit USDG</button>
          </form>
        </div>
        <TxMessage message={message} />
      </Section>

      <Section title="At a glance">
        <dl className="grid gap-2.5 text-[14.5px]">
          {[
            ["Owner", <span key="o" className="font-mono text-[13px]">{shortAddress(s.owner, 8, 6)}{acc.role.owner ? " (you)" : ""}</span>],
            ["Setup mode", s.inSetup ? `on until ${new Date(s.setupEndsAt * 1000).toLocaleString("en-GB")}; rules change instantly` : "finished; loosening waits for guards"],
            ["Payee allowlist", s.allowlistOn ? "on" : "off"],
            ["Settlement delay", duration(s.settleDelay)],
            ["New payee cooldown", duration(s.payeeCooldown)],
            ["Co-signers", s.cosigners.length ? `${s.cosignRequired} of ${s.cosigners.length}` : "none"],
            ["Guardians", s.guardians.length ? `${s.recoveryThreshold} of ${s.guardians.length}, ${duration(s.recoveryDelay)} timelock` : "none"],
            ["Transfers / rule changes", `${s.transferCount} / ${s.changeCount}`],
          ].map(([k, v]) => (
            <div key={String(k)} className="grid gap-1 sm:grid-cols-[170px_1fr]">
              <dt className="text-ink-3">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {s.inSetup && acc.role.owner ? (
          <button type="button" className="btn btn-sm btn-ghost mt-4" disabled={Boolean(busy)} onClick={() => run("Setup finished", { to: acc.account!, data: encodeAccount("finishSetup") }, acc.refresh)} data-finish-setup>
            Finish setup
          </button>
        ) : null}
        {s.recoveryCandidate && s.recoveryCandidate !== "0x0000000000000000000000000000000000000000" ? (
          <div className="mt-4"><Note tone="warn">A recovery to {shortAddress(s.recoveryCandidate)} is in progress. <Link href="/account/recovery" className="underline">Review it</Link>.</Note></div>
        ) : null}
      </Section>
    </div>
  );
}
