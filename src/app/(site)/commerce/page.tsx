import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, NumberedCard, PageHero, SectionHead } from "@/components/site/parts";

export const metadata: Metadata = {
  title: "Commerce",
  description: "Payments that carry the deal: escrow, milestones, tax splits and receiving terms, enforced by the accounts on both sides.",
};

const FLOWS = [
  { kicker: "Paying for work", title: "Committed up front, released as work lands", body: "Prepaying a contractor means someone has to trust first. Lock the amount where both sides can see it and release it milestone by milestone.", prompts: ["Only send to Acme Studio", "Cap weekly spending at $2,000", "Escrow a prepayment"] },
  { kicker: "Buying online", title: "Checkout with the leverage on your side", body: "Cards keep working after a breach and subscriptions are easy to start and hard to stop, because the payment lives with the merchant. Here it lives with you.", prompts: ["No single payment above $200", "Cancel a subscription from my side"] },
  { kicker: "Books", title: "The paperwork arrives with the money", body: "Most reconciliation exists because payment and context travel apart. Put invoice data on the payment and route the tax share at settlement, and the books close themselves.", prompts: ["Attach invoice data to the payment", "Route VAT automatically"] },
  { kicker: "What you accept", title: "Choose the money you take", body: "If terms can ride on a payment, some will not suit you: funds restricted to certain uses, or recallable weeks later. State what you accept and the rest is declined at the door.", prompts: ["Reject funds with spending restrictions", "Refuse recallable payments over a threshold"] },
];

export default function CommercePage() {
  return (
    <>
      <PageHero tag="Commerce" title={<>Payments that <span className="text-acc">carry the deal.</span></>} lead="Escrow, milestones, tax splits and refund windows written into the payment, so neither side has to trust the other's back office.">
        <Link href="/studio" className="btn btn-acc">Try a merchant rule</Link>
        <Link href="/use-cases" className="btn btn-ghost">More use cases</Link>
      </PageHero>

      <section className="wrap section !pt-12">
        <div className="grid gap-4 md:grid-cols-2">
          {FLOWS.map((f, i) => <NumberedCard key={f.kicker} n={String(i + 1).padStart(2, "0")} {...f} />)}
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-g1">
        <div className="wrap section">
          <div className="grid gap-10 lg:grid-cols-2">
            <SectionHead tag="For merchants and platforms" title="Terms on both ends of the payment" lead="The buyer's account enforces the buyer's conditions; yours enforces your receiving terms. Fewer disputes, fewer cancellation tickets, and reconciliation data that arrives with the funds." />
            <ol className="grid gap-3">
              {[
                ["Buyer", "“No single payment above $200, and new merchants wait 24 hours.”"],
                ["Payment", "Carries the order reference, the tax share and a 14-day refund window."],
                ["Merchant", "“Reject funds with spending restrictions.” Ordinary funds settle; restricted ones are declined."],
              ].map(([who, what]) => (
                <li key={who} className="card flex gap-4 p-5">
                  <span className="label w-20 shrink-0 pt-0.5">{who}</span>
                  <span className="text-[15px] text-ink-2">{what}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <CtaBand title="Selling something?" body="Merchant accounts follow the first personal accounts. Join early access and pick “Running a business account”." />
    </>
  );
}
