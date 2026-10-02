import type { Metadata } from "next";
import { BRAND, CHAIN } from "@/config/brand";
import { Legal } from "@/components/pages/Legal";

export const metadata: Metadata = { title: "Notices", description: `Status and safety notices for ${BRAND.name}.` };

export default function NoticesPage() {
  return (
    <Legal title="Notices" updated="2 October 2026">
      <h2>Pre-launch status</h2>
      <p>{BRAND.name} is in preview. The Rule Studio, the terms composer and early-access sign-up run in your browser. The on-chain rule account on {CHAIN.name} is not deployed yet. Wherever a figure would depend on a contract, the site shows it as empty or “Published at launch”.</p>
      <h2>Token address</h2>
      <p>The {BRAND.symbol} contract address will be published in one place: the navbar and footer of {BRAND.domain}, with a copy button. Until then the button is disabled. Any address circulated before that is not ours.</p>
      <h2>Impersonation</h2>
      <p>We will never message you first, ask for a seed phrase, ask you to “validate” a wallet, or offer a presale in direct messages. The only official account is {BRAND.xHandle} on X.</p>
      <h2>Partnerships and audits</h2>
      <p>{BRAND.name} has not announced any partnerships, integrations or security audits. Any such claim will appear on this site first.</p>
      <h2>Rule limits in the preview</h2>
      <p>The drafter reads a fixed grammar. Sentences it cannot read are refused whole rather than guessed at. Spending windows count only activity recorded in the preview on your device.</p>
    </Legal>
  );
}
