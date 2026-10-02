import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, CHAIN } from "@/config/brand";
import { CtaBand, PageHero, SectionHead } from "@/components/site/parts";

export const metadata: Metadata = {
  title: "About",
  description: `Why ${BRAND.name} exists, the principles it is built on and where it stands today.`,
};

const PRINCIPLES = [
  ["You hold the keys", "Self-custody from the first moment. Protection comes from your rules, not from someone else holding your money."],
  ["Rules before code", "What the account must do is stated as a condition you can read, and checked before it applies."],
  ["No path through us", "No admin key, no override, no support ticket that unlocks a frozen rule. If you froze it, it stays frozen."],
  ["Honest about status", "Live things are labelled live, planned things are labelled planned, and numbers that do not exist yet show as empty."],
];

const ROADMAP = [
  { when: "Now", what: "Rule Studio preview", detail: "Plain-English rules, logic view, consistency check, transfer simulator, signed rule sets. Wallet sign-in on " + CHAIN.name + "." },
  { when: "Next", what: "Rule account on " + CHAIN.name, detail: "A smart account that evaluates your committed rules on every transfer: recipient lists, caps, approvals, delays and recovery." },
  { when: "Then", what: BRAND.symbol + " with terms", detail: "Payments that carry spend rate, allowed uses, return date and expiry, enforced on the receiving side." },
  { when: "Later", what: "Agents and builders", detail: "Agent accounts with budgets, installable rule templates and community governance of the rulebook." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero tag="About" title={<>Finance that does <span className="text-acc">what it was told.</span></>} lead={`${BRAND.name} is a research-driven team of engineers and logicians building a wallet whose protections are rules you write yourself, held to the letter by the account.`} />

      <section className="wrap section !pt-12">
        <SectionHead tag="Principles" title="Four things we will not trade away" />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {PRINCIPLES.map(([t, b]) => (
            <div key={t} className="card p-6">
              <h3 className="h3">{t}</h3>
              <p className="mt-2.5 text-[15px] leading-[1.6] text-ink-2">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-g1">
        <div className="wrap section">
          <SectionHead tag="Where it stands" title="Roadmap" lead="Order, not dates. Each step ships when it is safe, and this page changes when it does." />
          <ol className="mt-10 grid gap-3">
            {ROADMAP.map((r, i) => (
              <li key={r.when} className={`grid gap-2 rounded-[16px] border p-5 sm:grid-cols-[120px_1fr] sm:gap-6 ${i === 0 ? "border-acc/40 bg-acc/[0.04]" : "border-white/[0.08]"}`}>
                <span className={`font-mono text-[12px] uppercase tracking-[0.1em] ${i === 0 ? "text-acc" : "text-ink-3"}`}>{r.when}</span>
                <span>
                  <span className="block font-medium">{r.what}</span>
                  <span className="mt-1 block text-[14.5px] text-ink-2">{r.detail}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-[14.5px] text-ink-2">
            Questions, ideas or a rule you need: reach us on X at{" "}
            <a href={BRAND.x} target="_blank" rel="noreferrer" className="text-acc hover:text-acc-hi">{BRAND.xHandle}</a>, or{" "}
            <Link href="/waitlist" className="text-acc hover:text-acc-hi">join early access</Link>.
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
