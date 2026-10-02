import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/config/brand";
import { Waitlist } from "@/components/pages/Waitlist";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description: `Request an early ${BRAND.name} account. Sign with your wallet, no gas.`,
};

const STEPS = [
  ["An invite arrives", "When your group comes up, you get a link to open an early account."],
  ["You open the account", "You hold the keys from the first moment. Nobody else ever does."],
  ["You set your first rule", "Say what the account must do. Early on, not every rule in the studio will be enforceable yet."],
];

export default function WaitlistPage() {
  return (
    <>
      <section className="night night-bg">
        <div className="wrap grid grid-cols-1 gap-12 pb-20 pt-16 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div>
            <h1 className="display">Join the waitlist</h1>
            <p className="mt-7 max-w-[30em] font-serif text-[18px] leading-[1.6] text-ink-2">Accounts will open in small groups, so every early user gets a real conversation with us about the rules they want. Leave your details, and write a rule in the studio while you wait.</p>
            <p className="mt-8 text-[15px] text-ink-3">Token: <span className="font-mono text-acc">{BRAND.symbol}</span></p>
          </div>
          <div className="min-w-0">
            <Waitlist />
          </div>
        </div>
      </section>
      <section className="wrap grid grid-cols-1 gap-10 py-[var(--section)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <h2 className="h2">What happens next</h2>
          <Link href="/studio" className="mt-4 inline-block text-[15px] font-semibold text-acc underline underline-offset-2">Write a rule while you wait</Link>
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
