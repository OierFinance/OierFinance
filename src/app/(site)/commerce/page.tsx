import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, NightHero, StoryWithPanel, type Story } from "@/components/site/parts";

export const metadata: Metadata = {
  title: "Commerce",
  description: "Payments that carry the deal: escrow, milestones, tax splits and receiving terms, enforced by the accounts on both sides.",
};

const STORIES: Story[] = [
  { kicker: "Paying for work", title: "Committed up front, released as the work lands", body: "Prepaying a contractor means someone has to go first. Set the amount aside where both sides can see it and release it milestone by milestone, so neither side works blind.", prompts: ["Only send to Acme Studio", "Cap weekly spending at $2,000", "Escrow a prepayment"] },
  { kicker: "Buying online", title: "Checkout with the leverage on your side", body: "Card numbers keep working after a breach, and subscriptions are easy to start and hard to stop, because the payment lives with the merchant. Here it lives with you.", prompts: ["No single payment above $200", "New addresses wait 24 hours", "Cancel a subscription from my side"] },
  { kicker: "Books and reconciliation", title: "The paperwork arrives with the money", body: "Most bookkeeping exists because payment and context travel separately. Carry the invoice data on the payment and route the tax share at settlement, and the books close themselves.", prompts: ["Attach invoice data to the payment", "Split UK receipts into the VAT account"] },
  { kicker: "What you accept", title: "Decide which money you take", body: "If terms can travel with a payment, some will not suit your business: funds restricted to certain uses, or recallable weeks later. State what you accept, and the rest is declined at the door.", prompts: ["Reject funds with spending restrictions", "Refuse recallable payments over a threshold"], dark: true },
];

export default function CommercePage() {
  return (
    <>
      <NightHero
        title="Commerce where the payment carries the deal"
        lead="Escrow, milestones, tax splits and refund windows written into the payment, so neither side depends on the other's back office."
        actions={
          <>
            <a href="#flows" className="btn btn-acc">See the flows</a>
            <Link href="/use-cases" className="btn btn-ghost">More use cases</Link>
          </>
        }
      />
      <div id="flows" className="scroll-mt-[60px]">
        <StoryWithPanel stories={STORIES} />
      </div>
      <section className="border-y border-line bg-g2">
        <div className="wrap grid grid-cols-1 gap-10 py-[var(--section)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <h2 className="h2">Terms on both ends of the payment</h2>
            <p className="copy mt-4">The buyer&apos;s account enforces the buyer&apos;s conditions and yours enforces your receiving terms. Fewer disputes, fewer cancellation tickets, and reconciliation data that arrives with the funds.</p>
          </div>
          <dl className="grid border-t border-line">
            {[
              ["The buyer says", "“No single payment above $200, and new merchants wait 24 hours.”"],
              ["The payment carries", "The order reference, the tax share and a 14-day refund window."],
              ["The merchant says", "“Reject funds with spending restrictions.” Ordinary funds settle; restricted ones are declined."],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-1 gap-1 border-b border-line py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
                <dt className="text-[16px] font-semibold">{k}</dt>
                <dd className="font-serif text-[16.5px] leading-[1.6] text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <div className="pt-[var(--section)]" />
      <CtaBand title="Selling something?" body="Merchant accounts follow the first personal accounts. Join the waitlist and choose “Running a business account”." />
    </>
  );
}
