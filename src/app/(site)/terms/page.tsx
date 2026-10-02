import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import { Legal } from "@/components/pages/Legal";

export const metadata: Metadata = { title: "Terms", description: `Terms for using the ${BRAND.name} preview site.` };

export default function TermsPage() {
  return (
    <Legal title="Terms of use" updated="2 October 2026">
      <p>Using this site means you accept the terms below. If you would rather not, please stop using it.</p>
      <h2>What the site does, and does not do</h2>
      <p>The Rule Studio drafts, checks and simulates rules in your browser. The Account pages help you create and operate your own OierAccount contract on Robinhood Chain from your own wallet. The site never holds your keys or your funds, and nobody operating it can move them; every transaction is signed in your wallet.</p>
      <h2>Unaudited contracts</h2>
      <p>The OierAccount and OierAccountFactory contracts have not been audited. They may contain mistakes that lose or lock funds. Use small amounts, set a co-signer and guardians you trust, and read every rule before you rely on it. Rules written in the studio that the contract does not enforce are listed as such and protect nothing on-chain.</p>
      <h2>No advice</h2>
      <p>Nothing here is financial, legal, tax or investment advice. Examples involving amounts, family members or businesses are illustrations.</p>
      <h2>The {BRAND.symbol} token</h2>
      <p>No {BRAND.symbol} contract is published at the time of writing. Descriptions of programmable terms, early-holder benefits and governance describe intended features that may change or never ship. Holding any token involves risk, including the total loss of its value. Only the address shown on this site, once published, refers to {BRAND.symbol}.</p>
      <h2>Your wallet, your responsibility</h2>
      <p>You are responsible for your keys and for what you sign. Read every wallet prompt. This site requests account access, a network switch, message signatures and, on the Account pages, transactions you start yourself.</p>
      <h2>Availability</h2>
      <p>The site is provided as is, without warranties of any kind, and may change or go offline at any time. To the extent the law allows, we are not liable for losses arising from its use.</p>
      <h2>Changes</h2>
      <p>These terms may be updated; the date above shows the latest version.</p>
    </Legal>
  );
}
