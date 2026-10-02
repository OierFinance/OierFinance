import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, CHAIN } from "@/config/brand";
import { CtaBand, NightHero } from "@/components/site/parts";

export const metadata: Metadata = {
  title: "About",
  description: `Why ${BRAND.name} exists, the principles it is built on and where it stands today.`,
};

const PRINCIPLES = [
  ["Self-custody", "The account is yours from day one. Safety comes from the rules you write, not from handing your funds to someone else."],
  ["Rules before code", "Every behaviour of the account can be read as a condition, and is tested before it takes effect."],
  ["No path through us", "There is no master key and no back door. A rule you froze cannot be thawed by us, by support, or by anyone."],
  ["Honest about status", "Working features are marked as working, future ones as planned, and figures we do not have yet stay blank."],
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
      <NightHero title="Who is behind Oier" lead="A small group of engineers and logicians who think a wallet should keep the promises its owner writes down." sub="Our approach is research-driven. We build on published results in decidable logic and self-amending specifications, and ship the parts an everyday wallet needs first." />

      <section className="wrap grid grid-cols-1 gap-10 py-[var(--section)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <h2 className="h2">Principles</h2>
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
            <h2 className="h2">Roadmap</h2>
            <p className="copy mt-4">A sequence rather than a calendar. Each stage ships when it is ready, and this list is updated when it does.</p>
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
          Want to suggest a rule type or ask something? Write to us on X at <a href={BRAND.x} target="_blank" rel="noreferrer" className="text-acc underline underline-offset-2">{BRAND.xHandle}</a>, or <Link href="/waitlist" className="text-acc underline underline-offset-2">request early access</Link>.
        </p>
      </section>
      <CtaBand />
    </>
  );
}
