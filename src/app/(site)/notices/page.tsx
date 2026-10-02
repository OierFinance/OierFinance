import type { Metadata } from "next";
import { BRAND, CHAIN } from "@/config/brand";
import { Legal } from "@/components/pages/Legal";

export const metadata: Metadata = { title: "Notices", description: `Status and safety notices for ${BRAND.name}.` };

export default function NoticesPage() {
  return (
    <Legal title="Notices" updated="2 October 2026">
      <h2>Status</h2>
      <p>The Rule Studio, the terms composer and early-access sign-up run in your browser. On {CHAIN.name}, the OierAccount contract enforces payee lists, per-transfer and rolling caps, co-signer approval, settlement delays with recall, a new-payee cooldown, quiet hours, a lock date, guarded rule changes and guardian recovery. Until the factory is deployed, the Account pages say “Not deployed yet”. Wherever a figure would depend on a contract that does not exist, the site leaves it empty.</p>
      <h2>Unaudited</h2>
      <p>The account contracts have not had an independent security audit. Use small amounts until one has been published here.</p>
      <h2>Token address</h2>
      <p>The {BRAND.symbol} contract address will be published in one place: the navbar and footer of {BRAND.domain}, with a copy button. Until then the button is disabled. Any address circulated before that is not ours.</p>
      <h2>Impersonation</h2>
      <p>We will never message you first, ask for a seed phrase, ask you to “validate” a wallet, or offer a presale in direct messages. The only official account is {BRAND.xHandle} on X.</p>
      <h2>Partnerships and audits</h2>
      <p>{BRAND.name} has not announced any partnerships, integrations or security audits. Any such claim will appear on this site first.</p>
      <h2>What the studio can and cannot enforce</h2>
      <p>The drafter reads a fixed grammar and refuses sentences it cannot read. When rules are pushed to an account, monthly caps, spending categories, allowed assets, minimum balances, expiry and agent-only rules stay in the studio: the contract does not enforce them yet, and the Account pages list them as skipped. Dollar amounts become USDG amounts on-chain.</p>
    </Legal>
  );
}
