import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/config/brand";
import { Waitlist } from "@/components/pages/Waitlist";

export const metadata: Metadata = {
  title: "Early access",
  description: `Request an early ${BRAND.name} account. Sign with your wallet, no gas.`,
};

const STEPS = [
  ["An invite arrives", "When your group comes up, you get a link to open an early account."],
  ["You open the account", "You hold the keys from the first moment. Nobody else ever does."],
  ["You set your first rule", "Say what the account must do. Early on, not every rule in the studio will be enforceable yet."],
];

export default function WaitlistPage() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="dots absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="wrap relative grid gap-12 pb-20 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="tag">Early access</p>
          <h1 className="h1 mt-5">Be early to <span className="text-acc">your own rules.</span></h1>
          <p className="lead mt-6 max-w-[560px]">First accounts open in small groups, so every early user gets a real conversation with us about the rules they need. Until then, the Rule Studio is open to everyone.</p>
          <dl className="mt-8 flex flex-wrap gap-8">
            <div><dt className="label">Token</dt><dd className="mt-1 font-mono text-[15px] text-acc">{BRAND.symbol}</dd></div>
            <div><dt className="label">Status</dt><dd className="mt-1 text-[15px]">Preview</dd></div>
          </dl>
          <h2 className="label mt-12">What happens next</h2>
          <ol className="mt-4 grid gap-3">
            {STEPS.map(([t, b], i) => (
              <li key={t} className="flex gap-4 rounded-[14px] border border-white/[0.07] p-4">
                <span className="font-mono text-[12px] text-acc">{String(i + 1).padStart(2, "0")}</span>
                <span><span className="block font-medium">{t}</span><span className="mt-1 block text-[14.5px] text-ink-2">{b}</span></span>
              </li>
            ))}
          </ol>
          <Link href="/studio" className="mt-6 inline-block text-[14.5px] text-acc hover:text-acc-hi">Write a rule while you wait →</Link>
        </div>
        <div className="min-w-0"><Waitlist /></div>
      </div>
    </section>
  );
}
