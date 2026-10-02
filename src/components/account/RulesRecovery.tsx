"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits, type Hex } from "viem";
import { isAddress, shortAddress, USDG } from "@/config/brand";
import { NATIVE } from "@/config/contracts";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useRuleStore } from "@/components/studio/useRuleStore";
import { KEYS, compileRuleSet, guardKey, keyName, limitsKey, rule } from "@/lib/compile";
import { accountAbi, duration, encodeAccount, readMany, type Guard, type Limits } from "@/lib/oier";
import { AccountShell, Section, TxMessage } from "./Shell";
import { useAccount, useTx } from "./useAccount";

const GUARDED: [string, Hex][] = [
  ["Payee allowlist", KEYS.allow],
  ["Blocklist", KEYS.block],
  ["USDG limits", limitsKey(USDG.address)],
  ["ETH limits", limitsKey(NATIVE)],
  ["Co-signers", KEYS.cosigners],
  ["Delay and cooldown", KEYS.timing],
  ["Quiet hours", KEYS.quiet],
  ["Lock date", KEYS.lock],
  ["Guardians", KEYS.recovery],
  ["Default guard", KEYS.default],
];

const fmtCap = (v: bigint, d: number, sym: string) => (v === 0n ? "no limit" : `${Number(formatUnits(v, d)).toLocaleString("en-US")} ${sym}`);

export function RulesPage() {
  const acc = useAccount();
  const { address } = useWallet();
  const store = useRuleStore(address);
  const { run, busy, message } = useTx();
  const [plan, setPlan] = useState<{ label: string; data: Hex; loosens: boolean; wait: number; approvals: number; frozen: boolean }[]>([]);
  const [guards, setGuards] = useState<{ name: string; key: Hex; g: Guard; gg: Guard }[]>([]);
  const [payee, setPayee] = useState("");
  const [payeeState, setPayeeState] = useState<{ allowed: boolean; blocked: boolean } | null>(null);

  const compiled = useMemo(() => compileRuleSet(store.set, -new Date().getTimezoneOffset() * 60), [store.set]);

  useEffect(() => {
    if (!acc.account || !acc.exists) return;
    let live = true;
    (async () => {
      const r = await readMany(compiled.calls.map((c) => ({ abi: accountAbi, to: acc.account!, fn: "classify", args: [c.data] })));
      const keys = r.map((x) => (x as readonly [Hex, boolean] | null)?.[0] ?? ("0x" as Hex));
      const gr = await readMany(keys.map((k) => ({ abi: accountAbi, to: acc.account!, fn: "guardOf", args: [k] })));
      if (!live) return;
      setPlan(
        compiled.calls.map((c, i) => {
          const cls = r[i] as readonly [Hex, boolean] | null;
          const g = gr[i] as Guard | null;
          return { ...c, loosens: Boolean(cls?.[1]) && !acc.state?.inSetup, wait: g?.delay ?? 0, approvals: g?.approvals ?? 0, frozen: Boolean(g?.frozen) };
        }),
      );
      const g2 = await readMany(GUARDED.flatMap(([, k]) => [{ abi: accountAbi, to: acc.account!, fn: "guardOf", args: [k] }, { abi: accountAbi, to: acc.account!, fn: "guardOf", args: [guardKey(k)] }]));
      if (live) setGuards(GUARDED.map(([name, key], i) => ({ name, key, g: g2[2 * i] as Guard, gg: g2[2 * i + 1] as Guard })));
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, [acc.account, acc.exists, compiled, acc.state]);

  useEffect(() => {
    if (!acc.account || !isAddress(payee)) {
      setPayeeState(null);
      return;
    }
    readMany([{ abi: accountAbi, to: acc.account, fn: "allowed", args: [payee] }, { abi: accountAbi, to: acc.account, fn: "blocked", args: [payee] }])
      .then(([a, b]) => setPayeeState({ allowed: Boolean(a), blocked: Boolean(b) }))
      .catch(() => setPayeeState(null));
  }, [acc.account, payee, acc.state]);

  const s = acc.state;
  return (
    <AccountShell acc={acc} title="Rules">
      {s ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Section title="Enforced on-chain now">
            <dl className="grid gap-2.5 text-[14.5px]">
              {[
                ["Payee allowlist", s.allowlistOn ? "on: only listed payees" : "off: any payee not blocked"],
                ["USDG", `${fmtCap(s.usdgLimits.txCap, 6, "per transfer")}; ${fmtCap(s.usdgLimits.dayCap, 6, "per 24h")}; ${fmtCap(s.usdgLimits.weekCap, 6, "per 7 days")}; co-sign ${s.usdgLimits.cosignAbove ? `above ${formatUnits(s.usdgLimits.cosignAbove, 6)}` : "never"}`],
                ["ETH", `${fmtCap(s.ethLimits.txCap, 18, "per transfer")}; ${fmtCap(s.ethLimits.dayCap, 18, "per 24h")}; ${fmtCap(s.ethLimits.weekCap, 18, "per 7 days")}; co-sign ${s.ethLimits.cosignAbove ? `above ${formatUnits(s.ethLimits.cosignAbove, 18)}` : "never"}`],
                ["Settlement delay", duration(s.settleDelay)],
                ["New payee cooldown", duration(s.payeeCooldown)],
                ["Quiet hours", s.quietOn ? `${s.quietFrom}:00 to ${s.quietTo}:00 (UTC${s.tzOffset >= 0 ? "+" : ""}${s.tzOffset / 3600})` : "off"],
                ["Lock date", s.lockUntil ? new Date(s.lockUntil * 1000).toISOString().slice(0, 10) : "none"],
                ["Co-signers", s.cosigners.length ? `${s.cosignRequired} of ${s.cosigners.map((c) => shortAddress(c)).join(", ")}` : "none"],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-1 sm:grid-cols-[150px_1fr]"><dt className="text-ink-3">{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <div className="mt-5 border-t border-line pt-4">
              <label className="grid gap-1 text-[13.5px] text-ink-3">
                Look up a payee
                <input className="field font-mono !text-[13px]" value={payee} onChange={(e) => setPayee(e.target.value)} placeholder="0x…" />
              </label>
              {payeeState ? <p className="mt-2 text-[14px]">{payeeState.blocked ? "Blocked." : payeeState.allowed ? "On the allowlist." : s.allowlistOn ? "Not on the allowlist: transfers to it are refused." : "Not listed; allowed while the allowlist is off."}</p> : null}
              {acc.role.owner && isAddress(payee) ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn btn-sm btn-ghost" disabled={Boolean(busy)} onClick={() => run("Payee change sent", { to: acc.account!, data: encodeAccount("configure", [rule("setAllowed", [payee, true])]) }, acc.refresh)} data-allow-payee>Allow (waits for guard)</button>
                  <button className="btn btn-sm btn-ghost" disabled={Boolean(busy)} onClick={() => run("Payee removed", { to: acc.account!, data: encodeAccount("configure", [rule("setAllowed", [payee, false])]) }, acc.refresh)}>Remove (instant)</button>
                  <button className="btn btn-sm btn-ghost !text-bad" disabled={Boolean(busy)} onClick={() => run("Payee blocked", { to: acc.account!, data: encodeAccount("configure", [rule("setBlocked", [payee, true])]) }, acc.refresh)} data-block-payee>Block (instant)</button>
                </div>
              ) : null}
            </div>
          </Section>

          <Section title="Guards (rule chains)">
            <p className="text-[14px] text-ink-2">Loosening a rule waits for its guard. Loosening a guard waits for the guard above it.</p>
            <ul className="mt-3 grid gap-1.5 text-[14px]">
              {guards.map(({ name, key, g, gg }) => (
                <li key={key} className="grid gap-1 rounded-[6px] bg-g3 px-3 py-2 sm:grid-cols-[150px_1fr]">
                  <span className="font-semibold">{name}</span>
                  <span className="text-ink-2">
                    {g?.frozen ? "frozen" : `${duration(g?.delay ?? 0)} wait${g?.approvals ? `, ${g.approvals} approval(s)` : ""}`}
                    {gg?.frozen ? " · guard frozen" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <div className="lg:col-span-2">
            <Section title="Push your Rule Studio rules to the account">
              {plan.length === 0 ? (
                <p className="text-[14.5px] text-ink-3">Nothing to push. <Link href="/studio" className="text-acc underline underline-offset-2">Write rules in the studio</Link>, giving payees an address in its address book.</p>
              ) : (
                <ul className="grid gap-2" data-plan>
                  {plan.map((p) => (
                    <li key={p.data} className="grid gap-1 rounded-[8px] border border-line px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <span className="text-[14.5px]">{p.label}</span>
                      <span className={`text-[13.5px] ${p.frozen && p.loosens ? "text-bad" : p.loosens ? "text-hold" : "text-ok"}`}>{p.frozen && p.loosens ? "refused: frozen" : p.loosens ? `queues: ${duration(p.wait)}${p.approvals ? ` + ${p.approvals} approval(s)` : ""}` : "applies now"}</span>
                    </li>
                  ))}
                </ul>
              )}
              {compiled.skipped.length ? <ul className="mt-3 grid gap-1 text-[13.5px] text-ink-3">{compiled.skipped.map((x, i) => <li key={i}>{x.rule}: {x.reason}</li>)}</ul> : null}
              <button
                className="btn btn-acc mt-4"
                disabled={Boolean(busy) || !acc.role.owner || plan.filter((p) => !(p.frozen && p.loosens)).length === 0}
                onClick={() => run("Rules pushed", { to: acc.account!, data: encodeAccount("configureMany", [plan.filter((p) => !(p.frozen && p.loosens)).map((p) => p.data)]) }, acc.refresh)}
                data-push-rules
              >
                {busy ? "Confirm in wallet…" : "Push to account"}
              </button>
              <TxMessage message={message} />
            </Section>
          </div>
          <div className="lg:col-span-2">
            <LimitsForm acc={acc} limits={s.usdgLimits} />
          </div>
        </div>
      ) : null}
    </AccountShell>
  );
}

function LimitsForm({ acc, limits }: { acc: ReturnType<typeof useAccount>; limits: Limits }) {
  const { run, busy, message } = useTx();
  const [asset, setAsset] = useState<"USDG" | "ETH">("USDG");
  const d = asset === "USDG" ? 6 : 18;
  const [v, setV] = useState({ tx: "", day: "", week: "", cos: "" });
  const [cos, setCos] = useState("");
  const [req, setReq] = useState("1");
  const [timing, setTiming] = useState({ delay: "6", cooldown: "48" });
  const p = (x: string) => (x ? parseUnits(x, d) : 0n);
  void limits;
  return (
    <Section title="Edit rules directly">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); run("Limits sent", { to: acc.account!, data: encodeAccount("configure", [rule("setLimits", [asset === "USDG" ? USDG.address : NATIVE, p(v.tx), p(v.day), p(v.week), p(v.cos)])]) }, acc.refresh); }}>
          <p className="text-[14.5px] font-semibold">Limits</p>
          <select className="field" value={asset} onChange={(e) => setAsset(e.target.value as "USDG" | "ETH")}><option>USDG</option><option>ETH</option></select>
          {(["tx", "day", "week", "cos"] as const).map((f) => (
            <label key={f} className="grid gap-1 text-[13px] text-ink-3">{{ tx: "Per transfer", day: "Per 24 hours", week: "Per 7 days", cos: "Co-sign above" }[f]} (empty = none)<input className="field num" value={v[f]} onChange={(e) => setV({ ...v, [f]: e.target.value })} inputMode="decimal" /></label>
          ))}
          <button className="btn btn-sm btn-ghost" disabled={Boolean(busy) || !acc.role.owner}>Save limits</button>
        </form>
        <form className="grid content-start gap-2" onSubmit={(e) => { e.preventDefault(); const list = cos.split(/[\s,]+/).filter(isAddress); run("Co-signers sent", { to: acc.account!, data: encodeAccount("configure", [rule("setCosigners", [list, Number(req)])]) }, acc.refresh); }}>
          <p className="text-[14.5px] font-semibold">Co-signers</p>
          <textarea className="field font-mono !text-[12.5px]" rows={3} value={cos} onChange={(e) => setCos(e.target.value)} placeholder="0x… one or more addresses" data-cosigners />
          <label className="grid gap-1 text-[13px] text-ink-3">Approvals required<input className="field num" value={req} onChange={(e) => setReq(e.target.value)} inputMode="numeric" /></label>
          <button className="btn btn-sm btn-ghost" disabled={Boolean(busy) || !acc.role.owner}>Save co-signers</button>
          <p className="text-[12.5px] text-ink-3">Always waits for its guard after setup.</p>
        </form>
        <form className="grid content-start gap-2" onSubmit={(e) => { e.preventDefault(); run("Timing sent", { to: acc.account!, data: encodeAccount("configure", [rule("setTiming", [Math.round(Number(timing.delay) * 3600), Math.round(Number(timing.cooldown) * 3600)])]) }, acc.refresh); }}>
          <p className="text-[14.5px] font-semibold">Timing</p>
          <label className="grid gap-1 text-[13px] text-ink-3">Settlement delay (hours)<input className="field num" value={timing.delay} onChange={(e) => setTiming({ ...timing, delay: e.target.value })} inputMode="decimal" /></label>
          <label className="grid gap-1 text-[13px] text-ink-3">New payee cooldown (hours)<input className="field num" value={timing.cooldown} onChange={(e) => setTiming({ ...timing, cooldown: e.target.value })} inputMode="decimal" /></label>
          <button className="btn btn-sm btn-ghost" disabled={Boolean(busy) || !acc.role.owner}>Save timing</button>
        </form>
      </div>
      <TxMessage message={message} />
    </Section>
  );
}

export function RecoveryPage() {
  const acc = useAccount();
  const { run, busy, message } = useTx();
  const [list, setList] = useState("");
  const [threshold, setThreshold] = useState("2");
  const [days, setDays] = useState("3");
  const [candidate, setCandidate] = useState("");
  const s = acc.state;
  const active = s && s.recoveryCandidate && s.recoveryCandidate !== "0x0000000000000000000000000000000000000000";
  const readyAt = s ? s.recoveryStartedAt + s.recoveryDelay : 0;
  return (
    <AccountShell acc={acc} title="Recovery">
      {s ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Section title="Guardians">
            <p className="text-[14.5px] text-ink-2">{s.guardians.length ? `${s.recoveryThreshold} of ${s.guardians.length} guardians can move the account to a new owner key after a ${duration(s.recoveryDelay)} timelock. The owner can veto unless every guardian agrees.` : "No guardians yet. Without them, a lost key cannot be replaced."}</p>
            <ul className="mt-3 grid gap-1 font-mono text-[13px]">{s.guardians.map((g) => <li key={g}>{g}</li>)}</ul>
            {acc.role.owner ? (
              <form className="mt-4 grid gap-2" onSubmit={(e) => { e.preventDefault(); run("Guardians sent", { to: acc.account!, data: encodeAccount("configure", [rule("setRecovery", [list.split(/[\s,]+/).filter(isAddress), Number(threshold), Math.round(Number(days) * 86400)])]) }, acc.refresh); }}>
                <textarea className="field font-mono !text-[12.5px]" rows={3} value={list} onChange={(e) => setList(e.target.value)} placeholder="Guardian addresses" data-guardians />
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1 text-[13px] text-ink-3">Needed<input className="field num" value={threshold} onChange={(e) => setThreshold(e.target.value)} /></label>
                  <label className="grid gap-1 text-[13px] text-ink-3">Timelock (days, 1 to 90)<input className="field num" value={days} onChange={(e) => setDays(e.target.value)} /></label>
                </div>
                <button className="btn btn-sm btn-ghost" disabled={Boolean(busy)}>Save guardians</button>
                <p className="text-[12.5px] text-ink-3">Changing guardians always waits for its guard after setup, so a stolen key cannot replace them quietly.</p>
              </form>
            ) : null}
          </Section>
          <Section title="Recovery in progress">
            {active ? (
              <div className="grid gap-2 text-[14.5px]" data-recovery-active>
                <p>New owner proposed: <span className="font-mono text-[13px]">{s.recoveryCandidate}</span></p>
                <p>Support: {s.recoverySupport} of {s.recoveryThreshold} needed ({s.guardians.length} guardians)</p>
                <p>Can finish after {new Date(readyAt * 1000).toLocaleString("en-GB")}</p>
              </div>
            ) : (
              <p className="text-[14.5px] text-ink-3">None.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {acc.role.guardian && !active ? (
                <form className="flex w-full gap-2" onSubmit={(e) => { e.preventDefault(); if (isAddress(candidate)) run("Recovery started", { to: acc.account!, data: encodeAccount("startRecovery", [candidate]) }, acc.refresh); }}>
                  <input className="field font-mono !text-[12.5px]" value={candidate} onChange={(e) => setCandidate(e.target.value)} placeholder="New owner address" />
                  <button className="btn btn-sm btn-acc !h-10 shrink-0" disabled={Boolean(busy)}>Start</button>
                </form>
              ) : null}
              {acc.role.guardian && active ? <button className="btn btn-sm btn-ghost" disabled={Boolean(busy)} onClick={() => run("Support recorded", { to: acc.account!, data: encodeAccount("supportRecovery") }, acc.refresh)}>Support</button> : null}
              {active ? <button className="btn btn-sm btn-acc" disabled={Boolean(busy) || acc.now < readyAt || s.recoverySupport < s.recoveryThreshold} onClick={() => run("Owner replaced", { to: acc.account!, data: encodeAccount("finalizeRecovery") }, acc.refresh)}>Finish recovery</button> : null}
              {active && (acc.role.owner || acc.role.guardian) ? <button className="btn btn-sm btn-ghost !text-bad" disabled={Boolean(busy)} onClick={() => run("Recovery cancelled", { to: acc.account!, data: encodeAccount("cancelRecovery") }, acc.refresh)}>{acc.role.owner ? "Veto" : "Cancel"}</button> : null}
            </div>
            <TxMessage message={message} />
          </Section>
        </div>
      ) : null}
    </AccountShell>
  );
}
