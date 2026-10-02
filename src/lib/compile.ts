import { encodeAbiParameters, encodeFunctionData, keccak256, parseUnits, toHex, type Hex } from "viem";
import { USDG } from "@/config/brand";
import { label } from "@/lib/rules/logic";
import type { MetaRule, RuleSet, TxRule } from "@/lib/rules/types";

/*
 * Compiles a Studio rule set into IOierRules calls for an OierAccount.
 * Dollar amounts become USDG amounts (1 USDG = $1). Clauses the contract does
 * not enforce yet are listed as skipped, with the reason, never dropped silently.
 */

export const RULES_ABI = [
  { type: "function", name: "setAllowlistOn", inputs: [{ name: "on", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setAllowed", inputs: [{ name: "to", type: "address" }, { name: "ok", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setBlocked", inputs: [{ name: "to", type: "address" }, { name: "b", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    name: "setLimits",
    inputs: [
      { name: "asset", type: "address" },
      { name: "txCap", type: "uint256" },
      { name: "dayCap", type: "uint256" },
      { name: "weekCap", type: "uint256" },
      { name: "cosignAbove", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  { type: "function", name: "setCosigners", inputs: [{ name: "list", type: "address[]" }, { name: "required", type: "uint8" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setTiming", inputs: [{ name: "settleDelay", type: "uint32" }, { name: "payeeCooldown", type: "uint32" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setQuietHours", inputs: [{ name: "on", type: "bool" }, { name: "from", type: "uint8" }, { name: "to", type: "uint8" }, { name: "offset", type: "int32" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setRecovery", inputs: [{ name: "guardians", type: "address[]" }, { name: "threshold", type: "uint8" }, { name: "delay", type: "uint32" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setLockUntil", inputs: [{ name: "until", type: "uint64" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setGuard", inputs: [{ name: "target", type: "bytes32" }, { name: "delay", type: "uint32" }, { name: "approvals", type: "uint8" }, { name: "frozen", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
] as const;

export const rule = (functionName: (typeof RULES_ABI)[number]["name"], args: unknown[]) => encodeFunctionData({ abi: RULES_ABI, functionName, args } as never) as Hex;

const k = (s: string) => keccak256(toHex(s));
export const KEYS = {
  default: k("oier.default"),
  allow: k("oier.allow"),
  block: k("oier.block"),
  cosigners: k("oier.cosigners"),
  timing: k("oier.timing"),
  quiet: k("oier.quiet"),
  recovery: k("oier.recovery"),
  lock: k("oier.lock"),
};
export const limitsKey = (asset: string) => keccak256(encodeAbiParameters([{ type: "string" }, { type: "address" }], ["oier.limits", asset as `0x${string}`]));
export const guardKey = (target: Hex) => keccak256(encodeAbiParameters([{ type: "string" }, { type: "bytes32" }], ["oier.guard", target]));

export const KEY_NAMES: Record<string, string> = {
  [KEYS.default]: "Default guard",
  [KEYS.allow]: "Payee allowlist",
  [KEYS.block]: "Blocklist",
  [KEYS.cosigners]: "Co-signers",
  [KEYS.timing]: "Delay and payee cooldown",
  [KEYS.quiet]: "Quiet hours",
  [KEYS.recovery]: "Guardians",
  [KEYS.lock]: "Lock date",
  [limitsKey(USDG.address)]: "USDG limits",
  [limitsKey("0x0000000000000000000000000000000000000000")]: "ETH limits",
};
export const keyName = (key: string) => KEY_NAMES[key] ?? (Object.entries(KEY_NAMES).find(([kk]) => guardKey(kk as Hex) === key)?.[1] ? `Guard of ${Object.entries(KEY_NAMES).find(([kk]) => guardKey(kk as Hex) === key)?.[1]}` : `Rule ${key.slice(0, 10)}…`);

export type Compiled = { calls: { label: string; data: Hex }[]; skipped: { rule: string; reason: string }[] };

const usd = (n: number) => parseUnits(String(Math.round(n * 1e6) / 1e6), USDG.decimals);

/** Which on-chain keys a Studio transaction rule writes to. */
function keysOf(r: TxRule): Hex[] {
  const out = new Set<Hex>();
  for (const c of r.clauses) {
    if (c.k === "allowTo") out.add(KEYS.allow);
    if (c.k === "blockTo") out.add(KEYS.block);
    if (c.k === "maxTx" || c.k === "cosignAbove" || (c.k === "maxPeriod" && c.period !== "month")) out.add(limitsKey(USDG.address));
    if (c.k === "settleDelay" || c.k === "newRecipientWait") out.add(KEYS.timing);
    if (c.k === "quietHours") out.add(KEYS.quiet);
    if (c.k === "lockedUntil") out.add(KEYS.lock);
  }
  return [...out];
}

export function compileRuleSet(set: RuleSet, tzOffsetSeconds: number): Compiled {
  const calls: Compiled["calls"] = [];
  const skipped: Compiled["skipped"] = [];
  const tx = set.rules.filter((r): r is TxRule => r.type === "tx");
  const resolve = (p: string) => (/^0x[0-9a-f]{40}$/.test(p) ? p : set.contacts[p] || "");

  let allowOn = false;
  const allowed = new Set<string>();
  const blocked = new Set<string>();
  let txCap = 0, dayCap = 0, weekCap = 0, cosign = 0, delay = 0, cooldown = 0, lock = 0;
  let quiet: { from: number; to: number } | null = null;

  for (const r of tx) {
    if (r.scope === "agent") {
      skipped.push({ rule: r.id, reason: "Agent-only rules are enforced off-chain for now." });
      continue;
    }
    for (const c of r.clauses) {
      switch (c.k) {
        case "allowTo": {
          allowOn = true;
          for (const p of c.parties) {
            if (p === "@contacts") {
              Object.values(set.contacts).filter(Boolean).forEach((a) => allowed.add(a));
              continue;
            }
            const a = resolve(p);
            if (a) allowed.add(a);
            else skipped.push({ rule: r.id, reason: `${label(p)} has no address in the address book, so it cannot be listed on-chain.` });
          }
          break;
        }
        case "blockTo":
          for (const p of c.parties) {
            const a = resolve(p);
            if (a) blocked.add(a);
            else skipped.push({ rule: r.id, reason: `${label(p)} has no address in the address book, so it cannot be blocked on-chain.` });
          }
          break;
        case "maxTx":
          txCap = txCap ? Math.min(txCap, c.amount) : c.amount;
          break;
        case "maxPeriod":
          if (c.period === "day") dayCap = dayCap ? Math.min(dayCap, c.amount) : c.amount;
          else if (c.period === "week") weekCap = weekCap ? Math.min(weekCap, c.amount) : c.amount;
          else skipped.push({ rule: r.id, reason: "Monthly caps are not enforced on-chain yet (24-hour and 7-day caps are)." });
          break;
        case "cosignAbove":
          cosign = cosign ? Math.min(cosign, c.amount) : c.amount;
          break;
        case "settleDelay":
          delay = Math.max(delay, Math.round(c.hours * 3600));
          break;
        case "newRecipientWait":
          cooldown = Math.max(cooldown, Math.round(c.hours * 3600));
          break;
        case "quietHours":
          quiet = { from: c.from, to: c.to };
          break;
        case "lockedUntil":
          lock = Math.max(lock, Math.floor(c.at / 1000));
          break;
        default:
          skipped.push({ rule: r.id, reason: `“${c.k === "allowAsset" ? "allowed assets" : c.k === "floor" ? "minimum balance" : c.k === "expiresAt" ? "expiry" : "spending categories"}” is checked in the studio only; the contract does not enforce it yet.` });
      }
    }
  }

  if (allowOn) calls.push({ label: "Turn on the payee allowlist", data: rule("setAllowlistOn", [true]) });
  for (const a of allowed) calls.push({ label: `Allow ${a.slice(0, 8)}…`, data: rule("setAllowed", [a, true]) });
  for (const a of blocked) calls.push({ label: `Block ${a.slice(0, 8)}…`, data: rule("setBlocked", [a, true]) });
  if (txCap || dayCap || weekCap || cosign)
    calls.push({ label: `USDG limits: ${[txCap && `$${txCap} per transfer`, dayCap && `$${dayCap} per 24h`, weekCap && `$${weekCap} per 7 days`, cosign && `co-sign above $${cosign}`].filter(Boolean).join(", ")}`, data: rule("setLimits", [USDG.address, txCap ? usd(txCap) : 0n, dayCap ? usd(dayCap) : 0n, weekCap ? usd(weekCap) : 0n, cosign ? usd(cosign) : 0n]) });
  if (delay || cooldown) calls.push({ label: `Delay ${Math.round(delay / 3600)}h, new payees wait ${Math.round(cooldown / 3600)}h`, data: rule("setTiming", [delay, cooldown]) });
  if (quiet) calls.push({ label: `Quiet hours ${quiet.from}:00 to ${quiet.to}:00 local`, data: rule("setQuietHours", [true, quiet.from, quiet.to, tzOffsetSeconds]) });
  if (lock) calls.push({ label: `Locked until ${new Date(lock * 1000).toISOString().slice(0, 10)}`, data: rule("setLockUntil", [BigInt(lock)]) });

  // Governance: a Studio meta rule guards every on-chain key its target writes.
  const byId = new Map(set.rules.map((r) => [r.id, r]));
  const keysForRule = (id: string): Hex[] => {
    const r = byId.get(id);
    if (!r) return [];
    if (r.type === "tx") return keysOf(r);
    return keysForRule(r.target).map((kk) => guardKey(kk));
  };
  for (const m of set.rules.filter((r): r is MetaRule => r.type === "meta")) {
    const targets = keysForRule(m.target);
    if (!targets.length) {
      skipped.push({ rule: m.id, reason: `${m.target} has nothing enforced on-chain to guard.` });
      continue;
    }
    for (const t of targets) {
      calls.push({
        label: `${m.id}: ${m.frozen ? "freeze" : `${m.approvals} approval(s), ${m.noticeDays}-day wait`} for ${keyName(t)}`,
        data: m.frozen ? rule("setGuard", [t, 2 * 86400, 0, true]) : rule("setGuard", [t, Math.min(30, m.noticeDays) * 86400, Math.min(10, m.approvals), false]),
      });
    }
  }
  return { calls, skipped };
}
