import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import { Legal } from "@/components/pages/Legal";

export const metadata: Metadata = { title: "Terms", description: `Terms for using the ${BRAND.name} preview site.` };

export default function TermsPage() {
  return (
    <Legal title="Terms of use" updated="2 October 2026">
      <p>Using this site means you accept the terms below. If you would rather not, please stop using it.</p>
      <h2>A preview, not a service</h2>
      <p>The site and the Rule Studio are a public preview. They draft, check and simulate rules in your browser. They do not hold funds, execute transfers or enforce anything on a blockchain. Simulated outcomes describe what the rule logic decides; they are not a guarantee of how a future product will behave.</p>
      <h2>No advice</h2>
      <p>Nothing here is financial, legal, tax or investment advice. Examples involving amounts, family members or businesses are illustrations.</p>
      <h2>The {BRAND.symbol} token</h2>
      <p>No {BRAND.symbol} contract is published at the time of writing. Descriptions of programmable terms, early-holder benefits and governance describe intended features that may change or never ship. Holding any token involves risk, including the total loss of its value. Only the address shown on this site, once published, refers to {BRAND.symbol}.</p>
      <h2>Your wallet, your responsibility</h2>
      <p>You are responsible for your keys and for what you sign. Read every wallet prompt. This site only requests account access, a network switch and message signatures.</p>
      <h2>Availability</h2>
      <p>The site is provided as is, without warranties of any kind, and may change or go offline at any time. To the extent the law allows, we are not liable for losses arising from its use.</p>
      <h2>Changes</h2>
      <p>These terms may be updated; the date above shows the latest version.</p>
    </Legal>
  );
}
