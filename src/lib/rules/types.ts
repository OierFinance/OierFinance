/*
 * Rule model. A transaction rule is a conjunction of clauses over the
 * variables of one proposed transfer; a governance rule constrains how
 * another rule may be amended. Everything here is plain data so a rule set
 * can be stored, hashed and signed as JSON.
 */

export type Period = "day" | "week" | "month";

export type Clause =
  /** to ∈ parties. "@contacts" stands for every name in the address book. */
  | { k: "allowTo"; parties: string[] }
  /** to ∉ parties */
  | { k: "blockTo"; parties: string[] }
  /** amount ≤ max */
  | { k: "maxTx"; amount: number }
  /** spent(period) + amount ≤ cap */
  | { k: "maxPeriod"; amount: number; period: Period }
  /** amount > threshold → cosigned */
  | { k: "cosignAbove"; amount: number }
  /** hour ∉ [from, to) — wraps past midnight when from > to */
  | { k: "quietHours"; from: number; to: number }
  /** effect: the transfer settles after `hours` and can be recalled until then */
  | { k: "settleDelay"; hours: number }
  /** knownFor(to) ≥ hours */
  | { k: "newRecipientWait"; hours: number }
  /** asset ∈ assets */
  | { k: "allowAsset"; assets: string[] }
  /** category ∈ categories */
  | { k: "allowCategory"; categories: string[] }
  /** category ∉ categories */
  | { k: "blockCategory"; categories: string[] }
  /** now < at (epoch ms) */
  | { k: "expiresAt"; at: number }
  /** now ≥ at (epoch ms) */
  | { k: "lockedUntil"; at: number }
  /** balance − amount ≥ floor */
  | { k: "floor"; amount: number };

export type ClauseKind = Clause["k"];

/** Who is spending. Owner rules bind every actor; agent rules bind the agent only. */
export type Scope = "all" | "agent";

export type TxRule = {
  id: string;
  type: "tx";
  text: string;
  scope: Scope;
  clauses: Clause[];
  createdAt: number;
};

export type MetaRule = {
  id: string;
  type: "meta";
  text: string;
  /** Id of the rule this one governs (it may itself be a governance rule). */
  target: string;
  approvals: number;
  noticeDays: number;
  /** No amendment is ever admissible. */
  frozen: boolean;
  createdAt: number;
};

export type Rule = TxRule | MetaRule;

/** A rule as drafted from a sentence, before it has an id. */
export type Draft =
  | { type: "tx"; text: string; scope: Scope; clauses: Clause[] }
  | { type: "meta"; text: string; target: string; approvals: number; noticeDays: number; frozen: boolean }
  | { type: "remove"; text: string; target: string };

export type ParseResult = { ok: true; draft: Draft; notes: string[] } | { ok: false; error: string; hints: string[] };

/** One proposed transfer, as the evaluator sees it. */
export type Tx = {
  /** Lower-case party label, or "__other" for an address nobody named. */
  to: string;
  amount: number;
  asset: string;
  category: string;
  hour: number;
  actor: "owner" | "agent";
  cosigned: boolean;
  now: number;
  /** Hours since this recipient was first paid (0 = never paid). */
  knownFor: number;
  spent: Record<Period, number>;
  balance: number;
};

export type Verdict = "allow" | "hold" | "deny";

export type ClauseCheck = { ruleId: string; clause: Clause; pass: boolean; verdict: Verdict; reason: string };

export type Evaluation = {
  verdict: Verdict;
  checks: ClauseCheck[];
  /** The rules that decided the outcome (first failing ones). */
  decidedBy: string[];
  /** Effects such as a recall window, from rules that passed. */
  effects: string[];
};

export type Finding = {
  level: "error" | "warn" | "info";
  title: string;
  detail: string;
  rules: string[];
};

export type RuleSet = {
  rules: Rule[];
  /** Next numeric id to hand out; ids are never reused. */
  next: number;
  /** Name → 0x address. Optional; names work without an address. */
  contacts: Record<string, string>;
  /** Removals waiting on approvals or a notice period. */
  pending: { target: string; requestedAt: number; approvals: number; noticeDays: number; text: string }[];
};

export const EMPTY_SET: RuleSet = { rules: [], next: 1, contacts: {}, pending: [] };

export const OTHER = "__other";
