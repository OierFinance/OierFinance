import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, NightHero, StoryWithPanel, type Story } from "@/components/site/parts";

export const metadata: Metadata = {
  title: "Commerce",
  description: "Payments that carry the deal: escrow, milestones, tax splits and receiving terms, enforced by the accounts on both sides.",
};

const STORIES: Story[] = [
  { kicker: "Hiring", title: "Money set aside, paid out per milestone", body: "Park the full fee where the contractor can see it is real, then release a share as each agreed milestone is signed off. Nobody has to pay or work on faith.", prompts: ["Only pay Fernhill Studio", "Cap weekly spending at $1,500", "Release 25% when each milestone is signed off"] },
  { kicker: "Shopping", title: "Card fraud and sticky subscriptions, handled from your side", body: "Each merchant gets a capped permission you can revoke, so a leaked card number or an unwanted renewal stops at your account instead of at a call centre.", prompts: ["Cap each payment at $150", "New payees wait 48 hours", "End any renewal I have not confirmed"] },
  { kicker: "Accounting", title: "Receipts that file themselves", body: "Invoice references and the tax split travel inside the payment, so reconciliation happens at settlement rather than at month end.", prompts: ["Tag every payment with its invoice number", "Send the sales tax share to the tax account"] },
  { kicker: "Acceptance", title: "Choose the money you will take", body: "Money arriving at your business may carry conditions. Your account can turn away payments that are restricted to certain uses or that the payer could claw back later.", prompts: ["Decline payments that come with conditions", "Decline refundable payments above $500"], dark: true },
];

export default function CommercePage() {
  return (
    <>
      <NightHero
        title="Payments that bring their own contract"
        lead="Escrow, staged release, tax routing and refund windows ride along with the money, so buyer and seller do not have to trust each other's paperwork."
        actions={
          <>
            <a href="#flows" className="btn btn-acc">Four commerce flows</a>
            <Link href="/use-cases" className="btn btn-ghost">Browse use cases</Link>
          </>
        }
      />
      <div id="flows" className="scroll-mt-[60px]">
        <StoryWithPanel stories={STORIES} />
      </div>
      <section className="border-y border-line bg-g2">
        <div className="wrap grid grid-cols-1 gap-10 py-[var(--section)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <h2 className="h2">Both sides enforce their own terms</h2>
            <p className="copy mt-4">A buyer's account applies the buyer's conditions; a merchant's account applies its acceptance policy. The result is fewer chargebacks, fewer support tickets about cancellations, and books that balance the moment money lands.</p>
          </div>
          <dl className="grid border-t border-line">
            {[
              ["Buyer's rule", "“Cap each payment at $150, and new payees wait 48 hours.”"],
              ["Inside the payment", "An order number, the sales tax share and a two-week refund window."],
              ["Merchant's rule", "“Decline payments that come with conditions.” Plain funds settle; conditional ones bounce."],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 border-b border-line py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
                <dt className="text-[16px] font-semibold">{k}</dt>
                <dd className="font-serif text-[16.5px] leading-[1.6] text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <div className="pt-[var(--section)]" />
      <CtaBand title="Run a business?" body="Merchant accounts follow soon after personal ones. Request early access and pick “Business payments”." />
    </>
  );
}
