// Self-check for the rule engine: node --experimental-strip-types scripts/rules-check.ts
import { parseRule } from "../src/lib/rules/parse.ts";
import { applyDraft, checkDraft, evaluate, ruleFormula } from "../src/lib/rules/logic.ts";
import { EMPTY_SET, type RuleSet, type TxRule, type Tx } from "../src/lib/rules/types.ts";

let failures = 0;
function d(s: string) {
  const r = parseRule(s, now);
  if (!r.ok) throw new Error(`unreadable: ${s}`);
  return r.draft;
}
const now = Date.UTC(2026, 9, 2, 12);
function ok(cond: boolean, msg: string) {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
}

const sentences: [string, string][] = [
  ["My account can only send to Jack and Coinbase", "allowTo"],
  ["Only let this account send to addresses I've approved", "allowTo"],
  ["No single payment above $5,000", "maxTx"],
  ["Cap daily spending at $2,000", "maxPeriod"],
  ["Make it so my kid's account can spend $10 per day max", "maxPeriod"],
  ["Anything over $5,000 should need my wife's approval as well", "cosignAbove"],
  ["Require a second approval above $1k", "cosignAbove"],
  ["Block overnight transactions", "quietHours"],
  ["Block payments between 10pm and 6am", "quietHours"],
  ["Allow me to recall a transaction within 8 hours", "settleDelay"],
  ["Let me recall a payment within 8 hours", "settleDelay"],
  ["New addresses wait 24 hours", "newRecipientWait"],
  ["Never send to 0x000000000000000000000000000000000000dEaD", "blockTo"],
  ["Keep a reserve of $500", "floor"],
  ["Never go below a $5,000 reserve", "floor"], ["Pay the team but never below a $5,000 reserve", "ERR"],
  ["My agent can spend up to $50 a week on API credits only", "maxPeriod,allowCategory"],
  ["Let my research agent pay for API credits only, up to £50 a week", "allowCategory,maxPeriod"],
  ["Only send USDG", "allowAsset"],
  ["Money that can't reach gambling", "blockCategory"],
  ["These funds expire in 1 week", "expiresAt"],
  ["Lock the funds until 1 June 2027", "lockedUntil"],
  ["Make it so my mom's wallet can only send funds to the grandkids", "allowTo"],
];
for (const [s, kinds] of sentences) {
  const r = parseRule(s, now);
  const got = r.ok && r.draft.type === "tx" ? r.draft.clauses.map((c) => c.k).sort().join(",") : r.ok ? r.draft.type : `ERR ${r.error}`;
  ok(kinds === "ERR" ? got.startsWith("ERR") : got === kinds.split(",").sort().join(","), `${s}  →  ${got}${r.ok ? `   ${ruleFormula(r.draft)}` : ""}`);
}
for (const [s, t] of [["Changing rule 1 needs 3 approvals and a 30-day notice", "meta"], ["Rule 2 can never be removed", "meta"], ["remove rule 1", "remove"], ["what is the weather", "ERR"]] as const) {
  const r = parseRule(s, now);
  ok((r.ok ? r.draft.type : "ERR") === t, `${s} → ${r.ok ? r.draft.type + " " + ruleFormula(r.draft) : "ERR"}`);
}

function add(set: RuleSet, s: string) {
  const r = parseRule(s, now);
  if (!r.ok) throw new Error(s);
  return { set: applyDraft(set, r.draft, now).set, findings: checkDraft(set, r.draft, now) };
}
let set: RuleSet = EMPTY_SET;
({ set } = add(set, "My account can only send to Jack and Coinbase"));
let f = checkDraft(set, d("Never send to Jack"), now);
ok(f.some((x) => x.title.includes("Jack can never be paid")), "block Jack after allow {Jack, Coinbase} → dead entry warning");
const p2 = parseRule("Only send to Alice", now);
f = p2.ok ? checkDraft(set, p2.draft, now) : [];
ok(f.some((x) => x.level === "error" && x.rules.includes("R1")), "allow {Alice} vs allow {Jack, Coinbase} → contradiction with R1");
({ set } = add(set, "No single payment above $500"));
f = checkDraft(set, d("Require a second approval above $5,000"), now);
ok(f.some((x) => x.title === "Already enforced" && x.rules.includes("R2")), "cosign above 5000 under max 500 → redundant by R2");
f = checkDraft(set, d("Cap daily spending at $100"), now);
ok(f.some((x) => x.title === "R2 becomes redundant"), "daily 100 makes per-tx 500 redundant");
const s3 = add(set, "Cap weekly spending at $1,000").set;
f = checkDraft(s3, d("Cap daily spending at $100"), now);
ok(!f.some((x) => x.title.includes("R3 becomes redundant")), "daily 100 does NOT make weekly 1000 redundant");
f = checkDraft(EMPTY_SET, d("Lock the funds until 1 June 2027. These funds expire in 1 week"), now);
ok(f.some((x) => x.level === "error"), "lock 2027 + expire in a week → contradiction");
({ set } = add(set, "Changing rule 1 needs 3 approvals and a 30-day notice"));
({ set } = add(set, "Rule 3 can never be removed"));
f = checkDraft(set, d("remove rule 3"), now);
ok(f[0].level === "error", "remove frozen R3 → refused");
f = checkDraft(set, d("remove rule 1"), now);
ok(f[0].level === "warn", "remove governed R1 → queued");
const base: Tx = { to: "jack", amount: 100, asset: "USDG", category: "__other", hour: 12, actor: "owner", cosigned: false, now, knownFor: 1e9, spent: { day: 0, week: 0, month: 0 }, balance: 1e6 };
const tx = set.rules.filter((r): r is TxRule => r.type === "tx");
ok(evaluate(tx, base).verdict === "allow", "Jack $100 → allow");
ok(evaluate(tx, { ...base, to: "mallory" }).verdict === "deny", "Mallory → deny");
ok(evaluate(tx, { ...base, amount: 900 }).decidedBy.includes("R2"), "$900 → deny by R2");
const t0 = performance.now();
let big: RuleSet = EMPTY_SET;
for (const s of ["Only send to Jack, Coinbase, Alice and Bob", "Cap daily spending at $2,000", "Cap weekly spending at $5,000", "Cap monthly spending at $9,000", "No single payment above $1,500", "Anything over $1,000 needs a second approval", "Block overnight transactions", "Block payments between 1pm and 2pm", "New addresses wait 24 hours", "Keep a reserve of $500", "My agent can spend up to $50 a week on API credits only", "Only send USDG and ETH"]) big = add(big, s).set;
checkDraft(big, d("Never send to Bob"), now);
ok(performance.now() - t0 < 3000, `12-rule set checked in ${Math.round(performance.now() - t0)} ms`);
console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
