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
    <section className="min-w-0 overflow-hidden rounded-[12px] border border-line bg-g2 font-sans shadow-[0_18px_50px_-30px_rgba(18,32,58,0.45)] lg:sticky lg:top-[84px] lg:max-h-[calc(100vh-104px)] lg:overflow-y-auto" aria-label="Program a payment" data-composer>
      <header className="border-b border-line bg-g1 px-4 py-3">
        <p className="text-[15px] font-semibold">Program a payment</p>
        <p className="text-[12.5px] text-ink-3">Terms are drafted and signed here; transfers with terms arrive with the token.</p>
      </header>
      <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2">
        <label className="grid grid-cols-1 gap-1 text-[13px] text-ink-3">Send to<input className="field" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <label className="grid grid-cols-1 gap-1 text-[13px] text-ink-3">Amount in {BRAND.symbol}<input className="field num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
        <label className="grid grid-cols-1 gap-1 text-[13px] text-ink-3">Spend at most<input className="field num" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="no limit" /></label>
        <label className="grid grid-cols-1 gap-1 text-[13px] text-ink-3">per
          <select className="field" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
            <option value="day">day</option><option value="week">week</option><option value="month">month</option>
          </select>
        </label>
        <label className="grid grid-cols-1 gap-1 text-[13px] text-ink-3">Only on<input className="field" value={allowed} onChange={(e) => setAllowed(e.target.value)} placeholder="anything" /></label>
        <label className="grid grid-cols-1 gap-1 text-[13px] text-ink-3">Never on<input className="field" value={blocked} onChange={(e) => setBlocked(e.target.value)} placeholder="nothing blocked" /></label>
        <label className="grid grid-cols-1 gap-1 text-[13px] text-ink-3">Unspent returns after (days)<input className="field num" inputMode="numeric" value={returnDays} onChange={(e) => setReturnDays(e.target.value)} placeholder="never" /></label>
        <label className="grid grid-cols-1 gap-1 text-[13px] text-ink-3">Stops existing after (days)<input className="field num" inputMode="numeric" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} placeholder="never" /></label>
        <fieldset className="grid grid-cols-1 gap-1.5 text-[14px] text-ink-2 sm:col-span-2">
          <legend className="text-[13px] text-ink-3">When the recipient pays someone else</legend>
          <label className="flex items-center gap-2"><input type="radio" name="hops" checked={hops === "one"} onChange={() => setHops("one")} className="accent-[#0e7c6b]" /> The terms end with them</label>
          <label className="flex items-center gap-2"><input type="radio" name="hops" checked={hops === "travel"} onChange={() => setHops("travel")} className="accent-[#0e7c6b]" /> The terms travel on with the money</label>
        </fieldset>
      </div>

      <div className="border-t border-line px-4 py-4">
        <p className="font-serif text-[17px] leading-[1.5]">
          {money(total).replace("$", "")} {BRAND.symbol} to {to || "…"}
          {clauses.length ? ". " + clauses.map(clauseEnglish).join(". ") : ""}
          {back ? `. Unspent funds return after ${back} days` : ""}.
        </p>
        <div className="mt-3 rounded-[6px] bg-g3 px-3 py-2">
          {formula.map((f) => <p key={f} className="formula">{f}</p>)}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-sm btn-acc" onClick={sign} data-sign-terms>{address ? "Sign the terms" : "Connect to sign"}</button>
          <span className="text-[13px] text-ink-3">{sig ? `Signed ${sig.slice(0, 12)}…` : "A signature over the terms. No transfer, no gas."}</span>
        </div>
        {err ? <p className="mt-2 text-[13px] text-bad">{err}</p> : null}
      </div>

      <div className="border-t border-line bg-g1 px-4 py-4">
        <p className="text-[13px] font-semibold text-ink-2">Now be the recipient and try to spend it</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <label className="grid grid-cols-1 gap-1 text-[12.5px] text-ink-3">Amount<input className="field num !h-9" value={spend} onChange={(e) => setSpend(e.target.value)} inputMode="decimal" /></label>
          <label className="grid grid-cols-1 gap-1 text-[12.5px] text-ink-3">On<input className="field !h-9" value={spendCat} onChange={(e) => setSpendCat(e.target.value)} /></label>
          <label className="grid grid-cols-1 gap-1 text-[12.5px] text-ink-3">Day<input className="field num !h-9" value={spendDay} onChange={(e) => setSpendDay(e.target.value)} inputMode="numeric" /></label>
        </div>
        <p className={`mt-2 rounded-[6px] border px-3 py-2 text-[14px] verdict-${returned ? "deny" : ev.verdict}`} data-terms-verdict>
          {returned
            ? `Day ${spendDay}: the unspent balance has already gone back to the sender.`
            : ev.verdict === "allow"
              ? `Spends. ${ev.checks.map((c) => c.reason).join("; ") || "No terms limit this."}`
              : `Refused: ${ev.checks.filter((c) => !c.pass).map((c) => c.reason).join("; ")}.`}
        </p>
        <p className="mt-2 text-[12.5px] text-ink-3">Checked in your browser{now ? `, counting from ${dateText(now)}` : ""}.</p>
      </div>
    </section>
  );
}
