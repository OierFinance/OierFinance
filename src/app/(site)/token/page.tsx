import type { Metadata } from "next";
import { BRAND, CHAIN } from "@/config/brand";
import { CaStrip } from "@/components/CopyCa";
import { TermsComposer } from "@/components/pages/TermsComposer";
import { CtaBand, NightHero } from "@/components/site/parts";

export const metadata: Metadata = {
  title: "Token",
  description: `${BRAND.symbol} is money you can program: attach a spend rate, allowed purchases, a return date and an expiry to a payment.`,
};

const FACTS: [string, string][] = [
  ["Ticker", BRAND.symbol],
  ["Network", CHAIN.name],
  ["Total supply", "Published at launch"],
  ["Contract", "Published at launch"],
];

const CHAPTERS = [
  { kicker: "Where and when it can be spent", title: "Pocket money that knows the rules", body: "Attach the conditions to the funds instead of relying on the person who receives them. Pocket money that only works at weekends, a grocery budget that will not pay for anything else, an allowance that cannot go in one afternoon." },
  { kicker: "How long it lasts", title: "Money with an end date", body: "Funds do not have to sit around forever. Give them a lifespan and they come back, move on or stop existing on their own, with no reminder and no awkward conversation about what is left." },
  { kicker: "What it can be used for", title: "Currency with one job", body: "A donation that can only reach charitable outcomes. A grant that cannot be repurposed. The condition sits in the money, so the receiver never has to be trusted and never has to be audited." },
  { kicker: "Protecting the terms", title: "The terms hold, even against you", body: "The recipient sees the terms before accepting. A second rule can say who may loosen them, how many approvals that takes and how much notice is given." },
  { kicker: "Unlocks", title: "Money that opens one step at a time", body: "Funds can arrive whole but stay closed until something happens: rent paid, a deposit reached, a delivery confirmed. Each step opens the next." },
  { kicker: "How far the terms travel", title: "One hop, or all the way", body: "By default your terms end with the person you paid, and whoever they pay receives ordinary money. Say so, and the conditions travel further with the funds." },
  { kicker: "Governance", title: "The economics are not ours to change alone", body: `Supply and the fee model for ${BRAND.symbol} are meant to be set by the people who use it, through the same rule-change process as everything else: the conditions are met first, then the change applies.` },
];

const EARLY = [
  ["Drafting credit", "A prepaid allowance for drafting and checking rules once a language model is placed in front of the grammar."],
  ["First choice of names", "Claim a readable account name before names open to everyone."],
  ["Listing priority", "First in line to publish rule templates that other people can install."],
  ["Credit for your work", "Contribute a rule primitive and get named next to it in the documentation."],
];

export default function TokenPage() {
  return (
    <>
      <NightHero
        title="Money you can program"
        lead={`${BRAND.symbol}. When a plain payment is not enough, attach the strings you need: where it can be spent, how fast, on what, and when it comes back.`}
        actions={<a href="#contract" className="btn btn-acc">Contract address</a>}
        aside={
          <dl className="border-t border-line font-sans">
            {FACTS.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-6 border-b border-line py-4">
                <dt className="text-[14.5px] text-ink-3">{k}</dt>
                <dd className={`text-right text-[16px] ${v.startsWith("$") ? "font-mono text-acc" : "text-ink"}`}>{v}</dd>
              </div>
            ))}
          </dl>
        }
      />

      <section id="contract" className="wrap scroll-mt-[76px] pt-[var(--section)]">
        <div className="night night-bg grid grid-cols-1 gap-8 rounded-[12px] px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <h2 className="h2">The one address to trust</h2>
            <p className="mt-4 max-w-[30em] font-serif text-[17px] leading-[1.6] text-ink-2">
              {BRAND.symbol} is not deployed yet and is not listed anywhere. When it is, its address appears here and in the site footer, ready to copy. Treat any address shared before then as someone else&apos;s.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <CaStrip />
            <p className="text-[13.5px] text-ink-3">{CHAIN.name}, chain id {CHAIN.id}</p>
          </div>
        </div>
      </section>

      <section className="wrap py-[var(--section)]">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-12">
          <div className="grid grid-cols-1 gap-4">
            {CHAPTERS.map((c, i) => (
              <article key={c.title} className={`rounded-[10px] border px-6 py-7 sm:px-8 sm:py-9 ${i % 3 === 0 ? "night night-bg border-transparent" : "border-line bg-g2"}`}>
                <p className="kicker">{c.kicker}</p>
                <h2 className="h2 mt-3 max-w-[14em]">{c.title}</h2>
                <p className="copy mt-4 max-w-[34em]">{c.body}</p>
              </article>
            ))}
          </div>
          <div className="order-first lg:order-none">
            <TermsComposer />
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-g2">
        <div className="wrap grid grid-cols-1 gap-10 py-[var(--section)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <h2 className="h2">What being early is meant to get you</h2>
            <p className="copy mt-4">None of this is live, and none of it is a promise of value. It is the intended programme for people who hold {BRAND.symbol} before the full release, and it may change before then.</p>
          </div>
          <dl className="grid border-t border-line">
            {EARLY.map(([k, v]) => (
              <div key={k} className="grid grid-cols-1 gap-1 border-b border-line py-5 sm:grid-cols-[200px_1fr] sm:gap-6">
                <dt className="text-[16px] font-semibold">{k}</dt>
                <dd className="font-serif text-[16.5px] leading-[1.6] text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
