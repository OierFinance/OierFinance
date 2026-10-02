"use client";

import { useCallback, useMemo } from "react";
import { useLocalStore } from "@/components/wallet/useLocalStore";
import { EMPTY_SET, type Period, type RuleSet } from "@/lib/rules/types";

/*
 * Rule sets live in this browser, one per wallet address (plus a guest draft
 * for visitors who have not connected). Nothing is sent to a server.
 */

export type LedgerEntry = { to: string; amount: number; asset: string; category: string; actor: "owner" | "agent"; at: number };
export type Commit = { hash: string; signature: string; at: number; count: number; address: string };

export const storeKey = (address: string | null) => (address ? `oier.rules.${address.toLowerCase()}` : "oier.rules.guest");

export function useRuleStore(address: string | null) {
  const key = storeKey(address);
  const [set, writeSet] = useLocalStore<RuleSet>(key, EMPTY_SET);
  const [ledger, writeLedger] = useLocalStore<LedgerEntry[]>(`${key}.ledger`, []);
  const [commit, writeCommit] = useLocalStore<Commit | null>(`${key}.commit`, null);
  const [guest] = useLocalStore<RuleSet>(storeKey(null), EMPTY_SET);

  const save = useCallback((next: RuleSet) => writeSet(next), [writeSet]);
  const record = useCallback((entry: LedgerEntry) => writeLedger([entry, ...ledger].slice(0, 200)), [ledger, writeLedger]);
  const clearLedger = useCallback(() => writeLedger([]), [writeLedger]);

  return { key, set: set ?? EMPTY_SET, save, ledger, record, clearLedger, commit, writeCommit, guest };
}

const WINDOW: Record<Period, number> = { day: 86_400_000, week: 7 * 86_400_000, month: 30 * 86_400_000 };

/** Spending per window and how long a recipient has been known, from the preview ledger. */
export function useLedgerFacts(ledger: LedgerEntry[], now: number, actor: "owner" | "agent") {
  return useMemo(() => {
    const out: Record<Period, number> = { day: 0, week: 0, month: 0 };
    for (const e of ledger) {
      if (actor === "agent" && e.actor !== "agent") continue;
      for (const p of Object.keys(WINDOW) as Period[]) if (now - e.at < WINDOW[p] && now >= e.at) out[p] += e.amount;
    }
    const firstPaid = (to: string) => {
      const hits = ledger.filter((e) => e.to === to).map((e) => e.at);
      return hits.length ? Math.max(0, (now - Math.min(...hits)) / 3_600_000) : 0;
    };
    return { spent: out, firstPaid };
  }, [ledger, now, actor]);
}

export async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
