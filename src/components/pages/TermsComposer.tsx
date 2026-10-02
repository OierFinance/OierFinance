"use client";

import { useEffect, useMemo, useState } from "react";
import { BRAND, CHAIN } from "@/config/brand";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useWalletModal } from "@/components/wallet/WalletButton";
import { clauseEnglish, clauseFormula, dateText, evaluate, money } from "@/lib/rules/logic";
import type { Clause, Period, Tx, TxRule } from "@/lib/rules/types";

/* Terms that travel with a payment. Built from the same clauses as account
   rules, so the recipient's spending is evaluated by the same logic. */

const list = (s: string) => s.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);

export function TermsComposer() {
  const { address, signMessage } = useWallet();
  const { open } = useWalletModal();
  const [to, setTo] = useState("my daughter");
  const [amount, setAmount] = useState("2000");
  const [rate, setRate] = useState("500");
  const [period, setPeriod] = useState<Period>("week");
  const [allowed, setAllowed] = useState("");
  const [blocked, setBlocked] = useState("gambling");
  const [returnDays, setReturnDays] = useState("30");
  const [expiryDays, setExpiryDays] = useState("");
  const [hops, setHops] = useState<"one" | "travel">("one");
  const [now, setNow] = useState(0);
  const [sig, setSig] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [spend, setSpend] = useState("120");
  const [spendCat, setSpendCat] = useState("groceries");
  const [spendDay, setSpendDay] = useState("3");

  useEffect(() => setNow(Date.now()), []);

  const clauses = useMemo(() => {
    const c: Clause[] = [];
    const r = Number(rate);
    if (r > 0) c.push({ k: "maxPeriod", amount: r, period });
    if (list(allowed).length) c.push({ k: "allowCategory", categories: list(allowed) });
    if (list(blocked).length) c.push({ k: "blockCategory", categories: list(blocked) });
    const e = Number(expiryDays);
    if (e > 0 && now) c.push({ k: "expiresAt", at: now + e * 86_400_000 });
    return c;
  }, [rate, period, allowed, blocked, expiryDays, now]);

  const total = Number(amount) || 0;
  const back = Number(returnDays) || 0;
  const rule: TxRule = { id: "T", type: "tx", text: "terms", scope: "all", clauses, createdAt: now };
  const formula = [...clauses.map(clauseFormula), back ? `t ≥ sent + ${back}d → return(unspent)` : "", hops === "one" ? "hop > 1 → terms end" : "terms travel with every hop"].filter(Boolean);

  const tx: Tx = {
    to: "merchant",
    amount: Number(spend) || 0,
    asset: "OIER",
    category: spendCat.trim().toLowerCase() || "general",
    hour: 12,
    actor: "owner",
    cosigned: false,
    now: now + (Number(spendDay) || 0) * 86_400_000,
    knownFor: 1e6,
    spent: { day: 0, week: 0, month: 0 },
    balance: total,
  };
  const ev = evaluate([rule], tx);
  const returned = back > 0 && (Number(spendDay) || 0) >= back;

  const envelope = {
    asset: BRAND.symbol,
    network: `${CHAIN.name} (${CHAIN.id})`,
    to,
    amount: total,
    terms: formula,
    returnUnspentAfterDays: back || null,
    termsEnd: hops === "one" ? "after the recipient spends" : "never (travel with the funds)",
  };

  async function sign() {
    if (!address) return open();
    setErr(null);
    try {
      setSig(await signMessage(`${BRAND.name} payment terms (draft, no transfer)\n${JSON.stringify(envelope, null, 2)}`));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The wallet did not sign.");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" data-composer>
      <div className="card p-5 sm:p-6">
        <p className="label">Compose terms</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-[12.5px] text-ink-3">Send to<input className="field" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <label className="grid gap-1 text-[12.5px] text-ink-3">Amount ({BRAND.symbol})<input className="field num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <label className="grid gap-1 text-[12.5px] text-ink-3">Spend at most<input className="field num" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="no limit" /></label>
          <label className="grid gap-1 text-[12.5px] text-ink-3">per
            <select className="field" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
              <option value="day">day</option><option value="week">week</option><option value="month">month</option>
            </select>
          </label>
          <label className="grid gap-1 text-[12.5px] text-ink-3">Only on (comma separated)<input className="field" value={allowed} onChange={(e) => setAllowed(e.target.value)} placeholder="anything" /></label>
          <label className="grid gap-1 text-[12.5px] text-ink-3">Never on<input className="field" value={blocked} onChange={(e) => setBlocked(e.target.value)} placeholder="nothing blocked" /></label>
          <label className="grid gap-1 text-[12.5px] text-ink-3">Unspent returns after (days)<input className="field num" inputMode="numeric" value={returnDays} onChange={(e) => setReturnDays(e.target.value)} placeholder="never" /></label>
          <label className="grid gap-1 text-[12.5px] text-ink-3">Stops existing after (days)<input className="field num" inputMode="numeric" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} placeholder="never" /></label>
          <fieldset className="grid gap-1.5 text-[13.5px] text-ink-2 sm:col-span-2">
            <legend className="text-[12.5px] text-ink-3">When the recipient pays someone else</legend>
            <label className="flex items-center gap-2"><input type="radio" name="hops" checked={hops === "one"} onChange={() => setHops("one")} className="accent-[#4fe3b8]" /> Terms end; the shop receives ordinary funds</label>
            <label className="flex items-center gap-2"><input type="radio" name="hops" checked={hops === "travel"} onChange={() => setHops("travel")} className="accent-[#4fe3b8]" /> Terms travel on with the money</label>
          </fieldset>
        </div>
      </div>

      <div className="grid min-w-0 gap-4">
        <div className="card-hi p-5 sm:p-6">
          <p className="label">The payment, as terms</p>
          <p className="mt-3 text-[16px] leading-[1.5]">
            {money(total).replace("$", "")} {BRAND.symbol} to {to || "…"}
            {clauses.length ? ". " + clauses.map(clauseEnglish).join(". ") : ""}
            {back ? `. Unspent funds return after ${back} days` : ""}.
          </p>
          <div className="mt-3 rounded-[10px] border border-white/[0.08] bg-g1 px-3 py-2.5">
            {formula.map((f) => <p key={f} className="formula">{f}</p>)}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-sm btn-acc" onClick={sign} data-sign-terms>{address ? "Sign terms (no gas)" : "Connect to sign"}</button>
            <span className="text-[12.5px] text-ink-3">{sig ? `Signed · ${sig.slice(0, 12)}…` : "A signature over the terms, not a transfer."}</span>
          </div>
          {err ? <p className="mt-2 text-[12.5px] text-bad">{err}</p> : null}
        </div>

        <div className="card p-5 sm:p-6">
          <p className="label">The recipient tries to spend</p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            <label className="grid gap-1 text-[12.5px] text-ink-3">Amount<input className="field num" value={spend} onChange={(e) => setSpend(e.target.value)} inputMode="decimal" /></label>
            <label className="grid gap-1 text-[12.5px] text-ink-3">On<input className="field" value={spendCat} onChange={(e) => setSpendCat(e.target.value)} /></label>
            <label className="grid gap-1 text-[12.5px] text-ink-3">Day after receipt<input className="field num" value={spendDay} onChange={(e) => setSpendDay(e.target.value)} inputMode="numeric" /></label>
          </div>
          <div className={`mt-3 rounded-[10px] border px-3 py-2.5 text-[14px] verdict-${returned ? "deny" : ev.verdict}`} data-terms-verdict>
            {returned
              ? `Day ${spendDay}: the unspent balance has already gone back to the sender.`
              : ev.verdict === "allow"
                ? `Spends. ${ev.checks.map((c) => c.reason).join("; ") || "No terms limit this."}`
                : `Refused: ${ev.checks.filter((c) => !c.pass).map((c) => c.reason).join("; ")}.`}
          </div>
          <p className="mt-2 text-[12px] text-ink-3">Preview evaluated in your browser{now ? ` · reference date ${dateText(now)}` : ""}. Transfers with terms arrive with the token release.</p>
        </div>
      </div>
    </div>
  );
}
