"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { shortAddress } from "@/config/brand";
import { useWallet } from "@/components/wallet/WalletProvider";
import { parseRule } from "@/lib/rules/parse";
import { applyDraft, checkDraft, evaluate, label, money, ruleEnglish, ruleFormula } from "@/lib/rules/logic";
import { normalizeParty } from "@/lib/rules/parse";
import type { Draft, Finding, TxRule } from "@/lib/rules/types";
import { useRuleStore } from "@/components/studio/useRuleStore";

/*
 * The account panel that sits beside the long pages. Sample sentences in the
 * text are sent here; the real drafter and checker run on them, and applied
 * rules land in the same per-wallet set the Rule Studio uses.
 */

type Incoming = { text: string; n: number } | null;
const DemoCtx = createContext<{ incoming: Incoming; run: (text: string) => void } | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [incoming, setIncoming] = useState<Incoming>(null);
  const run = useCallback((text: string) => {
    setIncoming((prev) => ({ text, n: (prev?.n ?? 0) + 1 }));
    if (window.innerWidth < 1024) document.getElementById("account-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  return <DemoCtx.Provider value={{ incoming, run }}>{children}</DemoCtx.Provider>;
}

/** A sample sentence. Runs in the panel when there is one, else opens the studio. */
export function TryPrompt({ text }: { text: string }) {
  const ctx = useContext(DemoCtx);
  const readable = useMemo(() => parseRule(text).ok, [text]);
  const inner = (
    <>
      <span aria-hidden className={`mt-[7px] size-1.5 shrink-0 rounded-full ${readable ? "bg-acc" : "bg-ink-3/50"}`} />
      <span>
        {text}
        {readable ? null : <span className="ml-1.5 text-[12.5px] text-ink-3">(planned)</span>}
      </span>
    </>
  );
  if (ctx) return <button type="button" className="chip" onClick={() => ctx.run(text)} data-prompt>{inner}</button>;
  return <Link href={`/studio?rule=${encodeURIComponent(text)}`} className="chip">{inner}</Link>;
}

function FindingLine({ f }: { f: Finding }) {
  const tone = f.level === "error" ? "text-bad" : f.level === "warn" ? "text-hold" : "text-ink";
  return (
    <li className="text-[13.5px] leading-[1.45]" data-finding={f.level}>
      <span className={`font-semibold ${tone}`}>{f.title}.</span> <span className="text-ink-2">{f.detail}</span>
    </li>
  );
}

export function AccountPanel({ heading = "Your account", sticky = true }: { heading?: string; sticky?: boolean }) {
  const ctx = useContext(DemoCtx);
  const { address } = useWallet();
  const store = useRuleStore(address);
  const { set, save } = store;
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("250");

  const run = useCallback(
    (sentence: string) => {
      setText(sentence);
      setOutcome(null);
      const res = parseRule(sentence);
      if (!res.ok) {
        setDraft(null);
        setFindings([]);
        setError(res.error.startsWith("This sentence") ? "Planned. The preview grammar does not understand this instruction yet, so nothing was drafted." : res.error);
        return;
      }
      setError(null);
      setDraft(res.draft);
      setFindings(checkDraft(set, res.draft));
    },
    [set],
  );

  const n = ctx?.incoming?.n;
  useEffect(() => {
    if (ctx?.incoming) run(ctx.incoming.text);
    // Only a new prompt should trigger a run, not a changed rule set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const blocked = findings.some((f) => f.level === "error");
  const txRules = set.rules.filter((r): r is TxRule => r.type === "tx");
  const firstParty = txRules.flatMap((r) => r.clauses.flatMap((c) => (c.k === "allowTo" ? c.parties : []))).find((p) => p !== "@contacts");
  const testTo = to || (firstParty ? label(firstParty) : "Priya");
  const amt = Number(amount.replace(/,/g, ""));
  const verdict =
    amt > 0
      ? evaluate(
          txRules,
          { to: normalizeParty(testTo), amount: amt, asset: "USDG", category: "general", hour: 14, actor: "owner", cosigned: false, now: Date.now(), knownFor: 1e6, spent: { day: 0, week: 0, month: 0 }, balance: 1e6 },
          set.contacts,
        )
      : null;

  function apply() {
    if (!draft || blocked) return;
    const res = applyDraft(set, draft);
    save(res.set);
    setOutcome(res.outcome);
    setDraft(null);
    setFindings([]);
    setText("");
  }

  return (
    <section id="account-panel" aria-label={heading} className={`${sticky ? "lg:sticky lg:top-[84px] lg:max-h-[calc(100vh-104px)] lg:overflow-y-auto" : ""} min-w-0 scroll-mt-[76px] overflow-hidden rounded-[12px] border border-line bg-g2 font-sans shadow-[0_18px_50px_-30px_rgba(18,32,58,0.45)]`} data-account-panel>
      <header className="flex items-center justify-between gap-3 border-b border-line bg-g1 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold">{heading}</p>
          <p className="truncate text-[12.5px] text-ink-3">{address ? `Stored for ${shortAddress(address)}` : "Guest draft in this browser"} · {set.rules.length} rule{set.rules.length === 1 ? "" : "s"}</p>
        </div>
        <Link href="/studio" className="shrink-0 text-[13.5px] font-medium text-acc hover:underline">Open studio</Link>
      </header>

      <div className="grid grid-cols-1 gap-4 px-4 py-4">
        {draft ? (
          <div data-panel-draft>
            <p className="font-serif text-[17px] leading-[1.45]">“{draft.text}”</p>
            <p className="mt-2 text-[14px] text-ink-2">{ruleEnglish(draft)}</p>
            <p className="formula mt-2 rounded-[6px] bg-g3 px-3 py-2">{draft.type === "tx" ? `R${set.next} ≡ ${ruleFormula(draft)}` : ruleFormula(draft)}</p>
            <ul className="mt-3 grid gap-1.5">{findings.map((f, i) => <FindingLine key={i} f={f} />)}</ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn btn-sm btn-acc" onClick={apply} disabled={blocked} data-panel-apply>
                {blocked ? "Refused" : draft.type === "remove" ? "Request removal" : "Apply rule"}
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setDraft(null); setFindings([]); }}>Discard</button>
            </div>
          </div>
        ) : error ? (
          <div>
            <p className="font-serif text-[17px] leading-[1.45]">“{text}”</p>
            <p className="mt-2 text-[14px] text-hold" data-panel-error>{error}</p>
          </div>
        ) : (
          <p className="text-[14px] leading-[1.5] text-ink-2">{outcome ?? "Click a sample instruction or type one below. It is drafted, tested against your current rules, and only added if nothing conflicts."}</p>
        )}

        <div className="border-t border-line pt-3">
          <p className="text-[13px] font-semibold text-ink-2">Active rules</p>
          {set.rules.length ? (
            <ol className="mt-2 grid gap-1.5">
              {set.rules.slice(-4).map((r) => (
                <li key={r.id} className="grid grid-cols-[34px_minmax(0,1fr)] gap-2 text-[13.5px]">
                  <span className={`font-mono text-[12px] ${r.type === "meta" ? "text-violet" : "text-acc"}`}>{r.id}</span>
                  <span className="truncate text-ink-2" title={ruleEnglish(r)}>{ruleEnglish(r)}</span>
                </li>
              ))}
              {set.rules.length > 4 ? <li className="text-[12.5px] text-ink-3">and {set.rules.length - 4} more in the studio</li> : null}
            </ol>
          ) : (
            <p className="mt-1.5 text-[13.5px] text-ink-3">None yet. With no rules, every transfer passes.</p>
          )}
        </div>

        <div className="border-t border-line pt-3">
          <p className="text-[13px] font-semibold text-ink-2">Test a transfer</p>
          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_96px] gap-2">
            <input className="field !h-9 !text-[14px]" value={to} onChange={(e) => setTo(e.target.value)} placeholder={testTo} aria-label="Recipient" data-panel-to />
            <input className="field num !h-9 !text-[14px]" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" aria-label="Amount in dollars" data-panel-amount />
          </div>
          {verdict ? (
            <p className={`mt-2 rounded-[6px] border px-3 py-2 text-[13.5px] verdict-${verdict.verdict}`} data-panel-verdict={verdict.verdict}>
              {money(amt)} to {testTo}: {verdict.verdict === "allow" ? "settles" : verdict.verdict === "hold" ? "held" : "refused"}
              {verdict.decidedBy.length ? ` by ${verdict.decidedBy.join(", ")}` : ""}
              {verdict.verdict !== "allow" ? `, ${verdict.checks.find((c) => !c.pass)?.reason}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      <form
        className="flex gap-2 border-t border-line bg-g1 px-3 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) run(text);
        }}
      >
        <input className="field !h-10" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type an instruction for this account" aria-label="Write a rule" data-panel-input />
        <button type="submit" className="btn btn-sm btn-acc !h-10 shrink-0" disabled={!text.trim()}>Draft</button>
      </form>
    </section>
  );
}
