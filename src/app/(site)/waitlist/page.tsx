import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/config/brand";
import { Waitlist } from "@/components/pages/Waitlist";

export const metadata: Metadata = {
  title: "Early access",
  description: `Request an early ${BRAND.name} account. Sign with your wallet, no gas.`,
};

const STEPS = [
  ["You receive an invite", "We contact you when a place opens for your group."],
  ["You create the account", "Keys are generated on your device and never leave your control."],
  ["You add rules", "Start with one sentence. Some rule types arrive after the first release."],
];

export default function WaitlistPage() {
  return (
    <>
      <section className="night night-bg">
        <div className="wrap grid grid-cols-1 gap-12 pb-20 pt-16 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div>
            <h1 className="display">Get early access</h1>
            <p className="mt-7 max-w-[30em] font-serif text-[18px] leading-[1.6] text-ink-2">We are letting people in a few at a time, so we can talk through the rules each person needs. Leave your details here and try the Rule Studio in the meantime.</p>
            <p className="mt-8 text-[15px] text-ink-3">Token: <span className="font-mono text-acc">{BRAND.symbol}</span></p>
          </div>
          <div className="min-w-0">
            <Waitlist />
          </div>
        </div>
      </section>
      <section className="wrap grid grid-cols-1 gap-10 py-[var(--section)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <h2 className="h2">After you sign up</h2>
          <Link href="/studio" className="mt-4 inline-block text-[15px] font-semibold text-acc underline underline-offset-2">Try the Rule Studio now</Link>
        </div>
        <ol className="grid border-t border-line">
          {STEPS.map(([t, b], i) => (
            <li key={t} className="grid grid-cols-1 gap-1 border-b border-line py-5 sm:grid-cols-[48px_1fr]">
              <span className="font-mono text-[15px] text-acc">{i + 1}</span>
              <span><span className="block text-[18px] font-semibold">{t}</span><span className="mt-1 block font-serif text-[16.5px] text-ink-2">{b}</span></span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
