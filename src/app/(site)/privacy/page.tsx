import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import { Legal } from "@/components/pages/Legal";

export const metadata: Metadata = { title: "Privacy", description: `How ${BRAND.name} handles data in the preview.` };

export default function PrivacyPage() {
  return (
    <Legal title="Privacy" updated="2 October 2026">
      <p>This page explains what the {BRAND.name} preview site does with information. The short version: the preview keeps your data in your own browser and does not run accounts, analytics or a database.</p>
      <h2>What stays on your device</h2>
      <ul>
        <li>Rule sets you write in the Rule Studio, the address book, preview activity and signatures you make, stored in your browser&apos;s local storage under your wallet address.</li>
        <li>Your early-access entry (email if you give one, interests, share name, optional wallet signature).</li>
        <li>Which wallet you last connected, so the site can reconnect it.</li>
      </ul>
      <p>Clearing site data in your browser removes all of it. We cannot see or restore it.</p>
      <h2>What reaches a server</h2>
      <ul>
        <li>Read-only chain requests (block number, balances) pass through this site&apos;s relay to a {`Robinhood Chain`} RPC provider. They include the public address you connected and nothing else.</li>
        <li>If you choose WalletConnect, the connection runs through that service under its own terms.</li>
        <li>Standard request logs kept by the hosting provider (IP address, time, page).</li>
      </ul>
      <h2>Wallets and signatures</h2>
      <p>Connecting a wallet shares a public address. Signing a message (a rule set, payment terms or an early-access entry) proves you control that address; it is not a transaction and moves no funds. We never ask for a seed phrase or private key, and nobody acting for us ever will.</p>
      <h2>When accounts open</h2>
      <p>A real early-access list and live accounts will need their own processing. This page will be updated before any of that starts, and you will be asked before an entry you saved locally is submitted.</p>
      <h2>Contact</h2>
      <p>Questions: {BRAND.xHandle} on X.</p>
    </Legal>
  );
}
