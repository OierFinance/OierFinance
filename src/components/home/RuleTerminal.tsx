"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { parseRule } from "@/lib/rules/parse";
import { evaluate, label, money, ruleFormula } from "@/lib/rules/logic";
import type { Tx, TxRule } from "@/lib/rules/types";

/* A live loop through the real drafter and evaluator: a sentence becomes a
   formula, then a transfer someone tries with a stolen key meets it. */

const SCENES: { rule: string; attempt: Partial<Tx>; story: string }[] = [
  { rule: "My account can only send to Jack and Coinbase", attempt: { to: "unknown address", amount: 4200 }, story: "Stolen key tries to drain to a fresh address" },
  { rule: "Cap daily spending at $2,000", attempt: { to: "jack", amount: 1500, spent: { day: 900, week: 900, month: 900 } }, story: "Second transfer of the day goes over the cap" },
  { rule: "Anything over $1,000 needs a second approval", attempt: { to: "coinbase", amount: 3000 }, story: "Large transfer, no co-signer yet" },
  { rule: "Block transactions overnight", attempt: { to: "jack", amount: 80, hour: 3 }, story: "Payment attempted at 03:00" },
  { rule: "My agent can spend up to $50 a week on API credits only", attempt: { actor: "agent", to: "api provider", amount: 20, category: "api credits" }, story: "Agent buys API credits within budget" },
];

const BASE: Tx = { to: "jack", amount: 100, asset: "USDG", category: "general", hour: 14, actor: "owner", cosigned: false, now: 0, knownFor: 1e6, spent: { day: 0, week: 0, month: 0 }, balance: 25_000 };

export function RuleTerminal() {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(0);
  const scene = SCENES[i];

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setTyped(scene.rule.length);
      const t = window.setTimeout(() => setI((v) => (v + 1) % SCENES.length), 6000);
      return () => window.clearTimeout(t);
    }
    if (typed < scene.rule.length) {
      const t = window.setTimeout(() => setTyped((v) => v + 1), 28);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      setTyped(0);
      setI((v) => (v + 1) % SCENES.length);
    }, 4200);
    return () => window.clearTimeout(t);
  }, [typed, scene]);

  const done = typed >= scene.rule.length;
  const result = useMemo(() => {
    const parsed = parseRule(scene.rule, 0);
    if (!parsed.ok || parsed.draft.type !== "tx") return null;
    const rule: TxRule = { id: "R1", type: "tx", text: scene.rule, scope: parsed.draft.scope, clauses: parsed.draft.clauses, createdAt: 0 };
    const tx = { ...BASE, ...scene.attempt };
    return { formula: ruleFormula(rule), tx, ev: evaluate([rule], tx) };
  }, [scene]);

  return (
    <div className="card overflow-hidden" data-terminal>
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">rule engine · live</span>
        <span className="flex gap-1">
          {SCENES.map((_, k) => <span key={k} className={`h-1 w-4 rounded-full ${k === i ? "bg-acc" : "bg-white/10"}`} />)}
        </span>
      </div>
      <div className="grid gap-4 p-4 sm:p-5">
        <div>
          <p className="label !text-[10px]">You say</p>
          <p className="mt-1.5 min-h-[52px] text-[17px] leading-[1.45] text-ink">
            “{scene.rule.slice(0, typed)}
            {!done ? <span className="animate-blink text-acc">▍</span> : "”"}
          </p>
        </div>
        <div className={`transition-opacity duration-500 ${done ? "opacity-100" : "opacity-0"}`}>
          <p className="label !text-[10px]">Held as</p>
          <p className="formula mt-1.5 rounded-[10px] border border-white/[0.08] bg-g1 px-3 py-2">{result?.formula}</p>
        </div>
        <div className={`transition-opacity delay-300 duration-500 ${done ? "opacity-100" : "opacity-0"}`}>
          <p className="label !text-[10px]">{scene.story}</p>
          {result ? (
            <div className={`mt-1.5 flex flex-wrap items-center justify-between gap-2 rounded-[10px] border px-3 py-2.5 verdict-${result.ev.verdict}`}>
              <span className="text-[13.5px]">
                {money(result.tx.amount)} → {label(result.tx.to)}
                {result.tx.actor === "agent" ? " (agent)" : ""}
              </span>
              <span className="font-mono text-[12px] uppercase tracking-[0.08em]">
                {result.ev.verdict === "allow" ? "settles" : result.ev.verdict === "hold" ? "held" : "refused"} · {result.ev.checks.find((c) => !c.pass)?.reason ?? result.ev.checks[0]?.reason}
              </span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-3 text-[13px]">
        <span className="text-ink-3">Same engine as the studio. Nothing is scripted.</span>
        <Link href="/studio" className="text-acc hover:text-acc-hi">Write your own →</Link>
      </div>
    </div>
  );
}
