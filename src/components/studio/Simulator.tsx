"use client";

import { useEffect, useMemo, useState } from "react";
import { clauseFormula, evaluate, label, money } from "@/lib/rules/logic";
import { KNOWN_ASSETS, normalizeParty } from "@/lib/rules/parse";
import type { RuleSet, Tx, TxRule } from "@/lib/rules/types";
import { CheckIcon, CloseIcon } from "@/components/icons";
import { useLedgerFacts, type LedgerEntry } from "./useRuleStore";

const VERDICT_TEXT = { allow: "Allowed", hold: "Held", deny: "Denied" } as const;

/** Tries one transfer against the rule set and shows which rule decided it. */
export function Simulator({
  set,
  parties,
  ledger,
  record,
  clearLedger,
}: {
  set: RuleSet;
  parties: string[];
  ledger: LedgerEntry[];
  record: (e: LedgerEntry) => void;
  clearLedger: () => void;
}) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("250");
  const [asset, setAsset] = useState("USDG");
  const [category, setCategory] = useState("general");
  const [actor, setActor] = useState<"owner" | "agent">("owner");
  const [cosigned, setCosigned] = useState(false);
  const [paidBefore, setPaidBefore] = useState(false);
  const [balance, setBalance] = useState("10000");
  const [hour, setHour] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [now, setNow] = useState(0);

  // Clock-dependent defaults are read after mount so server and client agree.
  useEffect(() => {
    const d = new Date();
    setNow(d.getTime());
    setHour(d.getHours());
    setDate(d.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!to && parties.length) setTo(label(parties[0]));
  }, [parties, to]);

  const txRules = useMemo(() => set.rules.filter((r): r is TxRule => r.type === "tx"), [set]);
  const hasAgent = txRules.some((r) => r.scope === "agent");
  const categories = useMemo(() => [...new Set(txRules.flatMap((r) => r.clauses.flatMap((c) => (c.k === "allowCategory" || c.k === "blockCategory" ? c.categories : []))))], [txRules]);

  // The day picked in the form, at the hour picked, as "now" for the rules.
  const at = useMemo(() => {
    if (!date || hour === null) return now;
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d, hour, 30).getTime();
  }, [date, hour, now]);

  const facts = useLedgerFacts(ledger, at, actor);

  // Resolve the recipient: a pasted address becomes its contact name.
  const resolved = useMemo(() => {
    const raw = to.trim();
    if (!raw) return "";
    const n = normalizeParty(raw);
    const byAddr = Object.entries(set.contacts).find(([, a]) => a && a === n);
    return byAddr ? byAddr[0] : n;
  }, [to, set.contacts]);

  const amt = Number(amount.replace(/,/g, ""));
  const valid = resolved && Number.isFinite(amt) && amt > 0 && hour !== null;

  const tx: Tx | null = valid
    ? {
        to: resolved,
        amount: amt,
        asset,
        category: category.trim().toLowerCase() || "general",
        hour: hour ?? 12,
        actor,
        cosigned,
        now: at,
        knownFor: paidBefore ? 1e6 : facts.firstPaid(resolved),
        spent: facts.spent,
        balance: Number(balance.replace(/,/g, "")) || 0,
      }
    : null;
  const result = tx ? evaluate(txRules, tx, set.contacts) : null;
  const [sent, setSent] = useState<string | null>(null);

  return (
    <div className="card mt-4 p-4 sm:p-5" data-simulator>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="label">4 · Simulate a transfer</h2>
        <span className="text-[12px] text-ink-3">No funds move</span>
      </div>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <label className="grid gap-1 text-[12.5px] text-ink-3 sm:col-span-2">
          Recipient (name or 0x address)
          <input className="field" list="sim-parties" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Jack" data-sim-to />
          <datalist id="sim-parties">
            {parties.map((p) => <option key={p} value={label(p)} />)}
          </datalist>
        </label>
        <label className="grid gap-1 text-[12.5px] text-ink-3">
          Amount (USD)
          <input className="field num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} data-sim-amount />
        </label>
        <label className="grid gap-1 text-[12.5px] text-ink-3">
          Asset
          <select className="field" value={asset} onChange={(e) => setAsset(e.target.value)}>
            {KNOWN_ASSETS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-[12.5px] text-ink-3">
          Spending category
          <input className="field" list="sim-cats" value={category} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="sim-cats">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </label>
        <label className="grid gap-1 text-[12.5px] text-ink-3">
          Balance before (USD)
          <input className="field num" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} />
        </label>
        <label className="grid gap-1 text-[12.5px] text-ink-3">
          Date
          <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="grid gap-1 text-[12.5px] text-ink-3">
          Hour
          <select className="field" value={hour ?? 12} onChange={(e) => setHour(Number(e.target.value))} data-sim-hour>
            {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-[13.5px] text-ink-2 sm:col-span-2">
          <label className="flex items-center gap-2"><input type="checkbox" checked={cosigned} onChange={(e) => setCosigned(e.target.checked)} className="accent-[#4fe3b8]" /> Second approval attached</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={paidBefore} onChange={(e) => setPaidBefore(e.target.checked)} className="accent-[#4fe3b8]" /> Paid this recipient before</label>
          {hasAgent ? (
            <label className="flex items-center gap-2">
              Sent by
              <select className="field !h-8 !w-auto !py-0 !text-[13px]" value={actor} onChange={(e) => setActor(e.target.value as "owner" | "agent")} data-sim-actor>
                <option value="owner">me</option>
                <option value="agent">my agent</option>
              </select>
            </label>
          ) : null}
        </div>
      </div>

      {result && tx ? (
        <div className="mt-4" aria-live="polite">
          <div className={`flex flex-wrap items-center justify-between gap-2 rounded-[12px] border px-3.5 py-3 verdict-${result.verdict}`} data-verdict={result.verdict}>
            <p className="font-display text-[22px] font-semibold tracking-[-0.02em]">{VERDICT_TEXT[result.verdict]}</p>
            <p className="text-[13px]">
              {txRules.length === 0
                ? "No rules: everything passes"
                : result.verdict === "allow"
                  ? `${money(tx.amount)} to ${label(tx.to)} passes ${[...new Set(result.checks.map((c) => c.ruleId))].join(", ") || "every rule"}`
                  : `decided by ${result.decidedBy.join(", ")}`}
            </p>
          </div>
          {result.checks.length ? (
            <ul className="mt-2.5 grid gap-1.5">
              {result.checks.map((c, i) => (
                <li key={i} className="grid grid-cols-[18px_42px_minmax(0,1fr)] items-start gap-2 text-[13px]">
                  {c.pass ? <CheckIcon className="mt-0.5 size-4 text-ok" /> : <CloseIcon className={`mt-0.5 size-4 ${c.verdict === "hold" ? "text-hold" : "text-bad"}`} />}
                  <span className="font-mono text-[12px] text-ink-3">{c.ruleId}</span>
                  <span className="min-w-0">
                    <span className="block text-ink-2">{c.reason}</span>
                    <span className="formula block !text-[11.5px] opacity-80">{clauseFormula(c.clause)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {result.effects.length ? <p className="mt-2 text-[12.5px] text-ink-3">{result.effects.join(" · ")}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              disabled={result.verdict !== "allow"}
              onClick={() => {
                record({ to: tx.to, amount: tx.amount, asset: tx.asset, category: tx.category, actor: tx.actor, at: tx.now });
                setSent(`${money(tx.amount)} to ${label(tx.to)} recorded`);
                window.setTimeout(() => setSent(null), 1800);
              }}
              data-sim-record
            >
              Record as sent (preview)
            </button>
            <span className="text-[12.5px] text-ink-3">{sent ?? "Recorded transfers count toward daily and weekly caps."}</span>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-[13px] text-ink-3">Enter a recipient and an amount.</p>
      )}

      {ledger.length ? (
        <div className="mt-4 border-t border-white/[0.07] pt-3">
          <div className="flex items-center justify-between">
            <p className="label">Preview activity</p>
            <button type="button" onClick={clearLedger} className="text-[12px] text-ink-3 hover:text-ink">Clear</button>
          </div>
          <ul className="mt-2 grid gap-1 text-[12.5px] text-ink-2">
            {ledger.slice(0, 6).map((e, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="truncate">{label(e.to)}{e.actor === "agent" ? " · agent" : ""}</span>
                <span className="num shrink-0">{money(e.amount)} · {new Date(e.at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
