import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, CHAIN } from "@/config/brand";
import { CtaBand, NightHero } from "@/components/site/parts";

export const metadata: Metadata = {
  title: "About",
  description: `Why ${BRAND.name} exists, the principles it is built on and where it stands today.`,
};

const PRINCIPLES = [
  ["You hold the keys", "Self-custody from the first moment. Protection comes from your rules, not from someone else holding your money."],
  ["Rules before code", "What the account must do is written as a condition you can read, and checked before it applies."],
  ["No path through us", "No admin key, no override, no support ticket that unlocks a frozen rule. If you froze it, it stays frozen."],
  ["Honest about status", "Live things are labelled live and planned things are labelled planned. Numbers that do not exist yet are left empty."],
];

const ROADMAP = [
  ["Now", "Rule Studio preview", `Plain-English rules, the logic view, the consistency check, a transfer simulator and signed rule sets, with wallet sign-in on ${CHAIN.name}.`],
  ["Next", `A rule account on ${CHAIN.name}`, "A smart account that evaluates your committed rules on every transfer: recipient lists, caps, approvals, delays and recovery."],
  ["Then", `${BRAND.symbol} with terms`, "Payments that carry a spend rate, allowed uses, a return date and an expiry, enforced on the receiving side."],
  ["Later", "Agents and builders", "Agent accounts with budgets, installable rule templates and community governance of the rulebook."],
];

export default function AboutPage() {
  return (
    <>
      <NightHero title="The team building Oier" lead="Engineers and logicians turning rule-based finance into something anyone can use." sub="The work is research-driven: it follows published results on decidable logic and self-governing specifications, and ships the parts a wallet needs first." />

      <section className="wrap grid grid-cols-1 gap-10 py-[var(--section)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <h2 className="h2">What we will not trade away</h2>
        <dl className="grid border-t border-line">
          {PRINCIPLES.map(([k, v]) => (
            <div key={k} className="grid grid-cols-1 gap-1 border-b border-line py-5 sm:grid-cols-[200px_1fr] sm:gap-6">
              <dt className="text-[17px] font-semibold">{k}</dt>
              <dd className="font-serif text-[16.5px] leading-[1.6] text-ink-2">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-y border-line bg-g2">
        <div className="wrap grid grid-cols-1 gap-10 py-[var(--section)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <h2 className="h2">Where it stands</h2>
            <p className="copy mt-4">An order, not dates. Each step ships when it is safe, and this page changes when it does.</p>
          </div>
          <ol className="relative grid gap-8 border-l-2 border-line pl-6">
            {ROADMAP.map(([when, what, detail], i) => (
              <li key={when} className="relative">
                <span aria-hidden className={`absolute -left-[33px] top-1.5 size-3 rounded-full border-2 ${i === 0 ? "border-acc bg-acc" : "border-ink-3 bg-g2"}`} />
                <p className={`text-[14px] font-semibold ${i === 0 ? "text-acc" : "text-ink-3"}`}>{when}</p>
                <p className="mt-1 text-[19px] font-bold tracking-[-0.01em]">{what}</p>
                <p className="mt-1.5 font-serif text-[16.5px] leading-[1.6] text-ink-2">{detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wrap py-[var(--section)]">
        <p className="copy max-w-[40em]">
          Questions, ideas or a rule you need: reach us on X at <a href={BRAND.x} target="_blank" rel="noreferrer" className="text-acc underline underline-offset-2">{BRAND.xHandle}</a>, or <Link href="/waitlist" className="text-acc underline underline-offset-2">join the waitlist</Link>.
        </p>
      </section>
      <CtaBand />
    </>
  );
}
