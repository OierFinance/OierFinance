import type { Metadata } from "next";
import { BRAND, CHAIN } from "@/config/brand";
import { CaStrip } from "@/components/CopyCa";
import { TermsComposer } from "@/components/pages/TermsComposer";
import { CtaBand, NumberedCard, PageHero, SectionHead } from "@/components/site/parts";

export const metadata: Metadata = {
  title: `${BRAND.symbol}`,
  description: `${BRAND.symbol} is programmable money: attach spend rate, allowed purchases, a return date and an expiry to a payment.`,
};

const FACTS = [
  { k: "Ticker", v: BRAND.symbol },
  { k: "Network", v: CHAIN.name },
  { k: "Supply", v: "Published at launch" },
  { k: "Status", v: "Pre-launch" },
];

const TERMS = [
  { kicker: "Where and when", title: "Pocket money with a calendar", body: "Funds that only work at weekends, a grocery budget that will not pay for anything else, an allowance that cannot go in one afternoon.", prompts: ["Spendable only on groceries", "Cap weekly spending at $100"] },
  { kicker: "How long", title: "Money with an end date", body: "Give funds a lifespan. When it runs out they come back, move on or simply stop existing, with no reminder and no awkward conversation about leftovers.", prompts: ["These funds expire in 1 week", "Let me recall a payment within 8 hours"] },
  { kicker: "What for", title: "Currency with one job", body: "A donation that can only reach charitable outcomes, a grant that cannot be repurposed. The condition sits in the money, so the receiver never has to be audited.", prompts: ["Spendable only on charitable outcomes", "Money that can't reach gambling"] },
  { kicker: "Protecting terms", title: "Terms that hold, even against the sender", body: "The recipient sees the terms before accepting, and a second rule can say who may loosen them and how much notice that takes.", prompts: ["Changing rule 1 needs 2 approvals and a 7-day notice"] },
  { kicker: "Unlocks", title: "Money that opens step by step", body: "Funds arrive whole but stay closed until something happens: rent paid, a deposit reached, a delivery confirmed. Each step opens the next.", prompts: ["Lock the funds until 1 June 2027"] },
  { kicker: "How far terms go", title: "One hop, or all the way", body: "By default the terms stop with the person you paid, and whoever they pay receives ordinary money. Say so, and the conditions travel further.", prompts: [] },
];

export default function TokenPage() {
  return (
    <>
      <PageHero tag={`${BRAND.symbol} · programmable money`} title={<>Money that remembers <span className="text-acc">what you said.</span></>} lead={`${BRAND.symbol} is the currency of the rule system. When a plain transfer is not enough, attach the strings: how fast it can be spent, on what, when it comes back and when it ends.`} />

      <section className="wrap section !pt-12">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="card p-5 sm:p-6">
            <p className="label">Contract address</p>
            <div className="mt-3"><CaStrip /></div>
            <p className="mt-4 text-[13.5px] leading-[1.6] text-ink-3">
              The contract has not been published. Until it is, this reads “Published at launch” and the copy button stays off. No exchange listing, presale or swap link on this site is live yet; treat any address shared elsewhere as unverified.
            </p>
          </div>
          <dl className="card grid grid-cols-2 gap-px overflow-hidden bg-white/[0.06] p-0">
            {FACTS.map((f) => (
              <div key={f.k} className="bg-g2 p-4">
                <dt className="label">{f.k}</dt>
                <dd className="mt-1.5 text-[15px]">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="wrap pb-[var(--section)]">
        <SectionHead tag="Try it" title="Compose a payment with terms" lead="Set the terms, read them back as logic, sign them with your wallet, then play the recipient and try to spend." />
        <div className="mt-10"><TermsComposer /></div>
      </section>

      <section className="border-t border-white/[0.06] bg-g1">
        <div className="wrap section">
          <SectionHead tag="What terms can say" title="Six kinds of strings" />
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {TERMS.map((t, i) => <NumberedCard key={t.kicker} n={String(i + 1).padStart(2, "0")} {...t} />)}
          </div>
        </div>
      </section>

      <section className="wrap section">
        <SectionHead tag="Being early" title="What early holders are planned to receive" lead="Nothing below is live. It is the intended programme, subject to change before launch, and none of it is a promise of value." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Drafting credits", "A prepaid allowance for drafting and checking rules once a language model sits in front of the grammar."],
            ["First pick of names", "Claim a readable account name before names open to everyone."],
            ["Listing priority", "First in line to publish rule templates others can install."],
            ["Credit for your work", "Contribute a rule primitive and get named next to it in the docs."],
          ].map(([t, b]) => (
            <div key={t} className="card p-5">
              <p className="font-medium">{t}</p>
              <p className="mt-2 text-[14px] leading-[1.6] text-ink-2">{b}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[13px] text-ink-3">Supply, fee model and economics are to be set under community governance, through the same rule-change process as everything else.</p>
      </section>

      <CtaBand />
    </>
  );
}
