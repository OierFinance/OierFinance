import type { Clause, ClauseCheck, Draft, Evaluation, Finding, MetaRule, Period, Rule, RuleSet, Scope, Tx, TxRule, Verdict } from "./types.ts";
import { OTHER } from "./types.ts";

/*
 * The logic layer. A rule set denotes one boolean function over a transfer:
 *   allow(tx) ≡ R1(tx) ∧ R2(tx) ∧ …
 * where every clause is a comparison on one variable (recipient, amount,
 * hour, asset, …). Because each variable only meets a finite set of
 * thresholds, the space of transfers splits into finitely many regions that
 * behave identically. The checker picks one witness per region and decides
 * satisfiability, implication and dead entries exactly over that space —
 * a decision, not a sample.
 */

const PERIODS: Period[] = ["day", "week", "month"];
const PERIOD_WORD: Record<Period, string> = { day: "24h", week: "7d", month: "30d" };

export const money = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;
export const dateText = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function label(p: string) {
  if (p === OTHER) return "anyone else";
  if (p === "@contacts") return "address book";
  if (/^0x[0-9a-f]{40}$/.test(p)) return `${p.slice(0, 6)}…${p.slice(-4)}`;
  return p.replace(/\b\w/g, (c) => c.toUpperCase());
}

const set = (xs: string[]) => `{${xs.map(label).join(", ")}}`;

/* ------------------------------------------------------------------ */
/* Formula and plain-English rendering                                  */
/* ------------------------------------------------------------------ */

export function clauseFormula(c: Clause): string {
  switch (c.k) {
    case "allowTo":
      return `to ∈ ${set(c.parties)}`;
    case "blockTo":
      return c.parties.length === 1 ? `¬(to = ${label(c.parties[0])})` : `to ∉ ${set(c.parties)}`;
    case "maxTx":
      return `amount ≤ ${c.amount}`;
    case "maxPeriod":
      return `spent₍${PERIOD_WORD[c.period]}₎ + amount ≤ ${c.amount}`;
    case "cosignAbove":
      return `amount > ${c.amount} → cosigned`;
    case "quietHours":
      return c.from > c.to ? `¬(hour ≥ ${c.from} ∨ hour < ${c.to})` : `¬(${c.from} ≤ hour < ${c.to})`;
    case "settleDelay":
      return `settle ≥ sent + ${c.hours}h  ⟹ recallable`;
    case "newRecipientWait":
      return `known(to) ≥ ${c.hours}h`;
    case "allowAsset":
      return `asset ∈ {${c.assets.join(", ")}}`;
    case "allowCategory":
      return `category ∈ {${c.categories.join(", ")}}`;
    case "blockCategory":
      return `category ∉ {${c.categories.join(", ")}}`;
    case "expiresAt":
      return `now < ${dateText(c.at)}`;
    case "lockedUntil":
      return `now ≥ ${dateText(c.at)}`;
    case "floor":
      return `balance − amount ≥ ${c.amount}`;
  }
}

export function clauseEnglish(c: Clause): string {
  switch (c.k) {
    case "allowTo":
      return c.parties[0] === "@contacts" && c.parties.length === 1 ? "Sends only to names in the address book" : `Sends only to ${c.parties.map(label).join(", ")}`;
    case "blockTo":
      return `Never sends to ${c.parties.map(label).join(", ")}`;
    case "maxTx":
      return `No single transfer above ${money(c.amount)}`;
    case "maxPeriod":
      return `At most ${money(c.amount)} out per ${c.period}`;
    case "cosignAbove":
      return `A second approval above ${money(c.amount)}`;
    case "quietHours":
      return `Nothing leaves between ${hh(c.from)} and ${hh(c.to)}`;
    case "settleDelay":
      return `Settles after ${c.hours}h; recallable until then`;
    case "newRecipientWait":
      return `New recipients wait ${c.hours}h before the first payment`;
    case "allowAsset":
      return `Only ${c.assets.join(", ")} can move`;
    case "allowCategory":
      return `Spendable only on ${c.categories.join(", ")}`;
    case "blockCategory":
      return `Never spendable on ${c.categories.join(", ")}`;
    case "expiresAt":
      return `Stops working on ${dateText(c.at)}`;
    case "lockedUntil":
      return `Locked until ${dateText(c.at)}`;
    case "floor":
      return `Balance never drops below ${money(c.amount)}`;
  }
}

export function ruleFormula(r: Rule | Draft, id = "R"): string {
  if (r.type === "remove") return `amend(${r.target}) := ∅`;
  if (r.type === "meta")
    return r.frozen
      ? `amend(${r.target}) → ⊥`
      : `amend(${r.target}) → ${[r.approvals ? `approvals ≥ ${r.approvals}` : "", r.noticeDays ? `notice ≥ ${r.noticeDays}d` : ""].filter(Boolean).join(" ∧ ")}`;
  const body = r.clauses.map(clauseFormula);
  const joined = body.length > 1 ? body.map((b) => (b.includes("→") || b.includes("∨") ? `(${b})` : b)).join(" ∧ ") : body[0];
  void id;
  return r.scope === "agent" ? `actor = agent → (${joined})` : joined;
}

export function ruleEnglish(r: Rule | Draft): string {
  if (r.type === "remove") return `Remove ${r.target}`;
  if (r.type === "meta") {
    if (r.frozen) return `${r.target} can never be amended or removed`;
    const parts = [r.approvals ? `${r.approvals} approval${r.approvals > 1 ? "s" : ""}` : "", r.noticeDays ? `a ${r.noticeDays}-day public notice` : ""].filter(Boolean);
    return `Amending ${r.target} needs ${parts.join(" and ")}`;
  }
  const lines = r.clauses.map(clauseEnglish).join("; ");
  return r.scope === "agent" ? `For the agent: ${lines.charAt(0).toLowerCase()}${lines.slice(1)}` : lines;
}

/* ------------------------------------------------------------------ */
/* Evaluation                                                           */
/* ------------------------------------------------------------------ */

function partyIn(to: string, list: string[], contacts: Record<string, string>) {
  return list.some((p) => (p === "@contacts" ? Object.keys(contacts).includes(to) : p === to));
}

function checkClause(c: Clause, tx: Tx, contacts: Record<string, string>): { pass: boolean; verdict: Verdict; reason: string } {
  const ok = (reason: string) => ({ pass: true, verdict: "allow" as Verdict, reason });
  const no = (reason: string, verdict: Verdict = "deny") => ({ pass: false, verdict, reason });
  switch (c.k) {
    case "allowTo":
      return partyIn(tx.to, c.parties, contacts) ? ok(`${label(tx.to)} is on the list`) : no(`${label(tx.to)} is not on the list`);
    case "blockTo":
      return partyIn(tx.to, c.parties, contacts) ? no(`${label(tx.to)} is blocked`) : ok("recipient not blocked");
    case "maxTx":
      return tx.amount <= c.amount ? ok(`${money(tx.amount)} ≤ ${money(c.amount)}`) : no(`${money(tx.amount)} is above the ${money(c.amount)} cap`);
    case "maxPeriod": {
      const total = tx.spent[c.period] + tx.amount;
      return total <= c.amount ? ok(`${money(total)} of ${money(c.amount)} this ${c.period}`) : no(`${money(total)} would pass the ${money(c.amount)} ${c.period} cap`);
    }
    case "cosignAbove":
      if (tx.amount <= c.amount) return ok(`below the ${money(c.amount)} approval line`);
      return tx.cosigned ? ok("second approval attached") : no(`above ${money(c.amount)}: waits for a second approval`, "hold");
    case "quietHours": {
      const quiet = c.from > c.to ? tx.hour >= c.from || tx.hour < c.to : tx.hour >= c.from && tx.hour < c.to;
      return quiet ? no(`${hh(tx.hour)} is inside quiet hours`, "hold") : ok(`${hh(tx.hour)} is outside quiet hours`);
    }
    case "settleDelay":
      return ok(`settles in ${c.hours}h, recallable until then`);
    case "newRecipientWait":
      return tx.knownFor >= c.hours ? ok(`recipient known for ${tx.knownFor}h`) : no(`new recipient: ${c.hours - tx.knownFor}h of waiting left`, "hold");
    case "allowAsset":
      return c.assets.includes(tx.asset) ? ok(`${tx.asset} is allowed`) : no(`${tx.asset} is not an allowed asset`);
    case "allowCategory":
      return c.categories.includes(tx.category) ? ok(`${tx.category} is allowed`) : no(`"${tx.category === OTHER ? "other" : tx.category}" is not an allowed category`);
    case "blockCategory":
      return c.categories.includes(tx.category) ? no(`"${tx.category}" is blocked`) : ok("category not blocked");
    case "expiresAt":
      return tx.now < c.at ? ok(`valid until ${dateText(c.at)}`) : no(`expired on ${dateText(c.at)}`);
    case "lockedUntil":
      return tx.now >= c.at ? ok("lock has ended") : no(`locked until ${dateText(c.at)}`, "hold");
    case "floor":
      return tx.balance - tx.amount >= c.amount ? ok(`${money(tx.balance - tx.amount)} left ≥ ${money(c.amount)}`) : no(`would leave ${money(Math.max(0, tx.balance - tx.amount))}, under the ${money(c.amount)} floor`);
  }
}

/** Boolean form of checkClause, without building reasons. Used by the solver. */
function holds(c: Clause, tx: Tx, contacts: Record<string, string>): boolean {
  switch (c.k) {
    case "allowTo":
      return partyIn(tx.to, c.parties, contacts);
    case "blockTo":
      return !partyIn(tx.to, c.parties, contacts);
    case "maxTx":
      return tx.amount <= c.amount;
    case "maxPeriod":
      return tx.spent[c.period] + tx.amount <= c.amount;
    case "cosignAbove":
      return tx.amount <= c.amount || tx.cosigned;
    case "quietHours":
      return !(c.from > c.to ? tx.hour >= c.from || tx.hour < c.to : tx.hour >= c.from && tx.hour < c.to);
    case "settleDelay":
      return true;
    case "newRecipientWait":
      return tx.knownFor >= c.hours;
    case "allowAsset":
      return c.assets.includes(tx.asset);
    case "allowCategory":
      return c.categories.includes(tx.category);
    case "blockCategory":
      return !c.categories.includes(tx.category);
    case "expiresAt":
      return tx.now < c.at;
    case "lockedUntil":
      return tx.now >= c.at;
    case "floor":
      return tx.balance - tx.amount >= c.amount;
  }
}

const applies = (scope: Scope, tx: Tx) => scope === "all" || tx.actor === "agent";

export function evaluate(rules: TxRule[], tx: Tx, contacts: Record<string, string> = {}): Evaluation {
  const checks: ClauseCheck[] = [];
  const effects: string[] = [];
  for (const r of rules) {
    if (!applies(r.scope, tx)) continue;
    for (const c of r.clauses) {
      const res = checkClause(c, tx, contacts);
      checks.push({ ruleId: r.id, clause: c, ...res });
      if (res.pass && c.k === "settleDelay") effects.push(`${r.id}: ${res.reason}`);
    }
  }
  const failing = checks.filter((c) => !c.pass);
  const verdict: Verdict = failing.some((c) => c.verdict === "deny") ? "deny" : failing.length ? "hold" : "allow";
  const decidedBy = [...new Set(failing.filter((c) => verdict === "deny" ? c.verdict === "deny" : true).map((c) => c.ruleId))];
  return { verdict, checks, decidedBy, effects };
}

/* ------------------------------------------------------------------ */
/* Finite witness space                                                 */
/* ------------------------------------------------------------------ */

type Space = {
  to: string[];
  amount: number[];
  asset: string[];
  category: string[];
  hour: number[];
  actor: ("owner" | "agent")[];
  cosigned: boolean[];
  now: number[];
  knownFor: number[];
  spent: Record<Period, number>[];
  balance: number[];
};

const uniq = <T,>(xs: T[]) => [...new Set(xs)];

function space(rules: TxRule[], contacts: Record<string, string>, now: number): Space {
  const cl = rules.flatMap((r) => r.clauses);
  const parties = uniq(cl.flatMap((c) => (c.k === "allowTo" || c.k === "blockTo" ? c.parties : [])).flatMap((p) => (p === "@contacts" ? Object.keys(contacts) : [p])));
  const caps = cl.flatMap((c) => (c.k === "maxPeriod" ? [c.amount] : []));
  const spentVals = uniq([0, ...caps, ...caps.map((c) => Math.max(0, c - 0.01))]).sort((a, b) => a - b);
  const periodsUsed = PERIODS.filter((p) => cl.some((c) => c.k === "maxPeriod" && c.period === p));
  const spent: Record<Period, number>[] = [];
  if (periodsUsed.length === 0) spent.push({ day: 0, week: 0, month: 0 });
  else {
    // Spending over a shorter window can never exceed a longer one.
    for (const d of periodsUsed.includes("day") ? spentVals : [0])
      for (const w of periodsUsed.includes("week") ? spentVals.filter((v) => v >= d) : [d])
        for (const m of periodsUsed.includes("month") ? spentVals.filter((v) => v >= w) : [w]) spent.push({ day: d, week: w, month: m });
  }
  const thresholds = cl.flatMap((c) => (c.k === "maxTx" || c.k === "cosignAbove" || c.k === "floor" ? [c.amount] : c.k === "maxPeriod" ? [c.amount] : []));
  const amount = uniq([0.01, ...thresholds, ...thresholds.map((t) => t + 0.01), ...caps.flatMap((c) => spentVals.filter((s) => s < c).flatMap((s) => [c - s, c - s + 0.01]))])
    .filter((a) => a > 0)
    .map((a) => Math.round(a * 100) / 100)
    .sort((a, b) => a - b);
  const quiet = cl.filter((c): c is Extract<Clause, { k: "quietHours" }> => c.k === "quietHours");
  const hour = quiet.length ? uniq([0, ...quiet.flatMap((q) => [q.from, q.to])]) : [12];
  const assets = uniq(cl.flatMap((c) => (c.k === "allowAsset" ? c.assets : [])));
  const cats = uniq(cl.flatMap((c) => (c.k === "allowCategory" || c.k === "blockCategory" ? c.categories : [])));
  const dates = cl.flatMap((c) => (c.k === "expiresAt" || c.k === "lockedUntil" ? [c.at] : []));
  const nowVals = uniq([now, ...dates.flatMap((d) => [d - 1, d])]).filter((t) => t >= now);
  const waits = cl.flatMap((c) => (c.k === "newRecipientWait" ? [c.hours] : []));
  const floors = cl.flatMap((c) => (c.k === "floor" ? [c.amount] : []));
  return {
    to: [...parties, OTHER],
    amount,
    asset: assets.length ? [...assets, OTHER] : ["USDG"],
    category: cats.length ? [...cats, OTHER] : [OTHER],
    hour,
    actor: rules.some((r) => r.scope === "agent") ? ["owner", "agent"] : ["owner"],
    cosigned: cl.some((c) => c.k === "cosignAbove") ? [false, true] : [false],
    now: nowVals,
    knownFor: waits.length ? uniq([0, ...waits]) : [1e9],
    spent,
    balance: floors.length ? [0, 1e15] : [1e15],
  };
}

type Var = "to" | "amount" | "asset" | "category" | "hour" | "now" | "knownFor" | "cosigned" | "balance" | "spent";

function varsOf(c: Clause): Var[] {
  switch (c.k) {
    case "allowTo":
    case "blockTo":
      return ["to"];
    case "maxTx":
      return ["amount"];
    case "maxPeriod":
      return ["amount", "spent"];
    case "cosignAbove":
      return ["amount", "cosigned"];
    case "quietHours":
      return ["hour"];
    case "settleDelay":
      return [];
    case "newRecipientWait":
      return ["knownFor"];
    case "allowAsset":
      return ["asset"];
    case "allowCategory":
    case "blockCategory":
      return ["category"];
    case "expiresAt":
    case "lockedUntil":
      return ["now"];
    case "floor":
      return ["amount", "balance"];
  }
}

/** A clause, or its negation. */
type Lit = { c: Clause; neg: boolean };

const DEFAULT_TX: Tx = { to: OTHER, amount: 1, asset: "USDG", category: OTHER, hour: 12, actor: "owner", cosigned: false, now: 0, knownFor: 1e9, spent: { day: 0, week: 0, month: 0 }, balance: 1e15 };

/*
 * Is there a transfer making every literal true? Literals only share
 * variables within a component (amount, spending, approval and balance
 * travel together; recipient, hour, asset … stand alone), so each component
 * is decided on its own small grid instead of the full product.
 */
function exists(sp: Space, lits: Lit[], contacts: Record<string, string>, fixed: Partial<Tx> = {}): boolean {
  const parent = new Map<Var, Var>();
  const root = (v: Var): Var => {
    const p = parent.get(v) ?? v;
    if (p === v) return v;
    const r = root(p);
    parent.set(v, r);
    return r;
  };
  for (const l of lits) {
    const vs = varsOf(l.c);
    if (vs.length === 0 && l.neg) return false; // an effect clause always holds
    for (const v of vs) if (!parent.has(v)) parent.set(v, v);
    for (let i = 1; i < vs.length; i++) parent.set(root(vs[i]), root(vs[0]));
  }
  const groups = new Map<Var, Lit[]>();
  for (const l of lits) {
    const vs = varsOf(l.c);
    if (!vs.length) continue;
    const r = root(vs[0]);
    groups.set(r, [...(groups.get(r) ?? []), l]);
  }
  const base: Tx = { ...DEFAULT_TX, now: sp.now[0], ...fixed };
  for (const group of groups.values()) {
    const vs = [...new Set(group.flatMap((l) => varsOf(l.c)))];
    const domains = vs.map((v) => (v in fixed ? [(fixed as Record<string, unknown>)[v]] : (sp[v] as unknown[])));
    let found = false;
    const idx = new Array(vs.length).fill(0);
    const total = domains.reduce((n, d) => n * d.length, 1);
    for (let n = 0; n < total && !found; n++) {
      let k = n;
      const tx: Tx = { ...base };
      for (let i = 0; i < vs.length; i++) {
        idx[i] = k % domains[i].length;
        k = Math.floor(k / domains[i].length);
        (tx as Record<string, unknown>)[vs[i]] = domains[i][idx[i]];
      }
      found = group.every((l) => holds(l.c, tx, contacts) !== l.neg);
    }
    if (!found) return false;
  }
  return true;
}

const litsFor = (rules: TxRule[], actor: "owner" | "agent"): Lit[] =>
  rules.filter((r) => r.scope === "all" || actor === "agent").flatMap((r) => r.clauses.map((c) => ({ c, neg: false })));

/** Some transfer by `actor` passes every rule. */
function satisfiable(sp: Space, rules: TxRule[], contacts: Record<string, string>, actor: "owner" | "agent", fixed: Partial<Tx> = {}) {
  return exists(sp, litsFor(rules, actor), contacts, { ...fixed, actor });
}

/** Every transfer that passes `premises` also passes `rule`. */
function implies(sp: Space, premises: TxRule[], rule: TxRule, contacts: Record<string, string>, actors: ("owner" | "agent")[]) {
  for (const actor of actors) {
    if (rule.scope === "agent" && actor !== "agent") continue;
    const base = litsFor(premises, actor);
    if (!exists(sp, base, contacts, { actor })) continue; // vacuous
    for (const c of rule.clauses) if (exists(sp, [...base, { c, neg: true }], contacts, { actor })) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Consistency check before apply                                       */
/* ------------------------------------------------------------------ */

const txRules = (rs: Rule[]) => rs.filter((r): r is TxRule => r.type === "tx");

/** Smallest subset of `base` that, with `core`, still fails `bad`. Deletion filter. */
function minimal(base: TxRule[], bad: (rs: TxRule[]) => boolean): TxRule[] {
  let keep = [...base];
  for (const r of base) {
    const without = keep.filter((x) => x !== r);
    if (bad(without)) keep = without;
  }
  return keep;
}

const ids = (rs: { id: string }[]) => rs.map((r) => r.id).join(", ");

export function checkDraft(set: RuleSet, draft: Draft, now = Date.now()): Finding[] {
  const findings: Finding[] = [];
  const existing = txRules(set.rules);
  const byId = new Map(set.rules.map((r) => [r.id, r]));

  if (draft.type === "remove") {
    const target = byId.get(draft.target);
    if (!target) return [{ level: "error", title: `${draft.target} does not exist`, detail: "There is no rule with that number in this set.", rules: [] }];
    const gate = governance(set, draft.target);
    if (gate.frozen) return [{ level: "error", title: `${draft.target} is frozen`, detail: `${gate.by.join(", ")} says ${draft.target} can never be amended. The removal is refused.`, rules: gate.by }];
    if (gate.approvals || gate.noticeDays)
      return [{ level: "warn", title: "Amendment is governed", detail: `${gate.by.join(", ")} requires ${gate.approvals ? `${gate.approvals} approval(s)` : ""}${gate.approvals && gate.noticeDays ? " and " : ""}${gate.noticeDays ? `a ${gate.noticeDays}-day notice` : ""}. Applying it queues the removal instead of executing it.`, rules: gate.by }];
    const dependents = set.rules.filter((r) => r.type === "meta" && r.target === draft.target);
    return [{ level: "info", title: "No governance on this rule", detail: dependents.length ? `Removing it also drops ${ids(dependents)}, which only governs it.` : "It is removed immediately.", rules: [] }];
  }

  if (draft.type === "meta") {
    const target = byId.get(draft.target);
    if (!target) return [{ level: "error", title: `${draft.target} does not exist`, detail: "A governance rule must point at a rule already in the set.", rules: [] }];
    const gate = governance(set, draft.target);
    if (gate.frozen) findings.push({ level: "info", title: `${draft.target} is already frozen`, detail: `${gate.by.join(", ")} already makes it unamendable, so this adds nothing.`, rules: gate.by });
    else if (gate.approvals >= draft.approvals && gate.noticeDays >= draft.noticeDays && !draft.frozen)
      findings.push({ level: "info", title: "Already as strict", detail: `${gate.by.join(", ")} already asks for at least this much.`, rules: gate.by });
    findings.push({ level: "info", title: "Governance only tightens", detail: `Adding a condition on how ${draft.target} changes can never loosen it, so this is consistent with every rule in the set.`, rules: [] });
    if (target.type === "meta") findings.push({ level: "info", title: "Rule chain", detail: `${draft.target} governs ${target.target}; this rule now governs ${draft.target}. Undoing ${target.target} means getting past both.`, rules: [draft.target, target.target] });
    return findings;
  }

  const fresh: TxRule = { id: "new", type: "tx", text: draft.text, scope: draft.scope, clauses: draft.clauses, createdAt: now };
  const all = [...existing, fresh];
  const contacts = set.contacts;

  // Clauses that hold no matter what (expired dates, empty lists).
  for (const c of draft.clauses) {
    if (c.k === "expiresAt" && c.at <= now) findings.push({ level: "error", title: "Already expired", detail: `${dateText(c.at)} is in the past, so nothing could ever pass.`, rules: [] });
    if (c.k === "allowTo" && c.parties.includes("@contacts") && Object.keys(contacts).length === 0)
      findings.push({ level: "warn", title: "Address book is empty", detail: "Until you name a contact, this rule blocks every transfer.", rules: [] });
  }

  const sp = space(all, contacts, now);
  const sat = (rs: TxRule[], actor: "owner" | "agent") => satisfiable(sp, rs, contacts, actor);

  // 1. Contradiction: no transfer at all could pass.
  const actors: ("owner" | "agent")[] = draft.scope === "agent" || existing.some((r) => r.scope === "agent") ? ["owner", "agent"] : ["owner"];
  for (const actor of actors) {
    if (sat(all, actor)) continue;
    const core = minimal(existing, (rs) => !sat([...rs, fresh], actor));
    findings.push({
      level: "error",
      title: actor === "agent" && sat(all, "owner") ? "Contradiction for the agent" : "Contradiction",
      detail: core.length
        ? `Together with ${ids(core)}, no ${actor === "agent" ? "agent " : ""}transfer could ever pass. ${ruleFormula(fresh)} ∧ ${core.map((r) => `(${ruleFormula(r)})`).join(" ∧ ")} is unsatisfiable.`
        : `On its own this rule can never be met: ${ruleFormula(fresh)} is unsatisfiable.`,
      rules: core.map((r) => r.id),
    });
    return findings;
  }

  // 2. Redundancy: the set already implies the new rule.
  const implied = (rs: TxRule[]) => implies(sp, rs, fresh, contacts, actors);
  const hasEffect = draft.clauses.some((c) => c.k === "settleDelay");
  if (existing.length && !hasEffect && implied(existing)) {
    const core = minimal(existing, (rs) => implied(rs));
    findings.push({ level: "warn", title: "Already enforced", detail: `${ids(core)} already ${core.length > 1 ? "imply" : "implies"} this rule, so it adds no new restriction. It can still be applied as a backstop.`, rules: core.map((r) => r.id) });
  }

  // 3. The new rule makes an older one redundant.
  for (const r of existing) {
    if (r.clauses.some((c) => c.k === "settleDelay")) continue;
    const others = all.filter((x) => x !== r);
    const covered = implies(sp, others, r, contacts, actors);
    if (covered && !findings.some((f) => f.title === "Already enforced")) findings.push({ level: "info", title: `${r.id} becomes redundant`, detail: `Everything ${r.id} forbids is also forbidden once this rule applies. Keep it if you want it as a backstop.`, rules: [r.id] });
  }

  // 4. Dead entries: a named recipient that this rule leaves unpayable.
  for (const r of all) {
    for (const c of r.clauses) {
      if (c.k !== "allowTo") continue;
      for (const p of c.parties) {
        if (p === "@contacts") continue;
        const actor = r.scope === "agent" ? "agent" : "owner";
        if (satisfiable(sp, all, contacts, actor, { to: p })) continue;
        if (r !== fresh && !satisfiable(sp, existing, contacts, actor, { to: p })) continue;
        const blockers = all.filter((x) => x !== r && x.clauses.some((k) => (k.k === "blockTo" && k.parties.includes(p)) || (k.k === "allowTo" && !k.parties.includes(p) && !k.parties.includes("@contacts"))));
        findings.push({
          level: "warn",
          title: `${label(p)} can never be paid`,
          detail: `${r.id === "new" ? "This rule" : r.id} lists ${label(p)}, but ${blockers.length ? ids(blockers.map((b) => ({ id: b.id === "new" ? "this rule" : b.id }))) : "the rest of the set"} rules out every transfer to them.`,
          rules: blockers.map((b) => b.id).filter((x) => x !== "new"),
        });
      }
    }
  }

  // 5. Effects: two recall windows, the longer one holds.
  const delays = all.flatMap((r) => r.clauses.flatMap((c) => (c.k === "settleDelay" ? [{ id: r.id, h: c.hours }] : [])));
  if (delays.length > 1 && hasEffect) {
    const longest = delays.reduce((a, b) => (b.h > a.h ? b : a));
    findings.push({ level: "info", title: "Several recall windows", detail: `The longest one (${longest.h}h${longest.id === "new" ? ", this rule" : `, ${longest.id}`}) is the one that holds.`, rules: delays.map((d) => d.id).filter((x) => x !== "new") });
  }

  if (!findings.some((f) => f.level !== "info")) findings.unshift({ level: "info", title: "Consistent", detail: existing.length ? `Checked against ${existing.length} rule${existing.length > 1 ? "s" : ""}: at least one transfer still passes, nothing is contradicted.` : "First rule in the set. It is satisfiable on its own.", rules: [] });
  return findings;
}

/* ------------------------------------------------------------------ */
/* Governance (rule chains)                                             */
/* ------------------------------------------------------------------ */

export function governance(set: RuleSet, target: string) {
  const metas = set.rules.filter((r): r is MetaRule => r.type === "meta" && r.target === target);
  return {
    frozen: metas.some((m) => m.frozen),
    approvals: Math.max(0, ...metas.map((m) => m.approvals)),
    noticeDays: Math.max(0, ...metas.map((m) => m.noticeDays)),
    by: metas.map((m) => m.id),
  };
}

/** Applies a checked draft. Returns the new set and a one-line outcome. */
export function applyDraft(set: RuleSet, draft: Draft, now = Date.now()): { set: RuleSet; outcome: string } {
  if (draft.type === "remove") {
    const gate = governance(set, draft.target);
    if (gate.frozen) return { set, outcome: `${draft.target} is frozen; nothing changed.` };
    if (gate.approvals || gate.noticeDays) {
      if (set.pending.some((p) => p.target === draft.target)) return { set, outcome: `A removal of ${draft.target} is already waiting.` };
      return {
        set: { ...set, pending: [...set.pending, { target: draft.target, requestedAt: now, approvals: gate.approvals, noticeDays: gate.noticeDays, text: draft.text }] },
        outcome: `Removal of ${draft.target} queued: ${gate.approvals ? `${gate.approvals} approval(s)` : ""}${gate.approvals && gate.noticeDays ? " + " : ""}${gate.noticeDays ? `${gate.noticeDays}-day notice` : ""}.`,
      };
    }
    // Governance rules that only point at the removed rule go with it.
    const drop = new Set([draft.target]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const r of set.rules) if (r.type === "meta" && drop.has(r.target) && !drop.has(r.id)) {
        drop.add(r.id);
        grew = true;
      }
    }
    return { set: { ...set, rules: set.rules.filter((r) => !drop.has(r.id)), pending: set.pending.filter((p) => !drop.has(p.target)) }, outcome: `Removed ${[...drop].join(", ")}.` };
  }
  const id = `R${set.next}`;
  const rule: Rule = draft.type === "tx" ? { id, type: "tx", text: draft.text, scope: draft.scope, clauses: draft.clauses, createdAt: now } : { id, type: "meta", text: draft.text, target: draft.target, approvals: draft.approvals, noticeDays: draft.noticeDays, frozen: draft.frozen, createdAt: now };
  return { set: { ...set, rules: [...set.rules, rule], next: set.next + 1 }, outcome: `Applied as ${id}.` };
}

/** The whole set as one formula. */
export function setFormula(set: RuleSet) {
  const tx = txRules(set.rules);
  if (!tx.length) return "allow(tx) ≡ ⊤";
  return `allow(tx) ≡ ${tx.map((r) => r.id).join(" ∧ ")}`;
}

/** Canonical JSON for hashing and signing: rules only, stable key order. */
export function canonical(set: RuleSet) {
  return JSON.stringify(
    set.rules.map((r) =>
      r.type === "tx"
        ? { id: r.id, scope: r.scope, formula: ruleFormula(r), text: r.text }
        : { id: r.id, governs: r.target, formula: ruleFormula(r), text: r.text },
    ),
  );
}
