import Link from "next/link";
import { BRAND, CHAIN } from "@/config/brand";
import { CaStrip } from "@/components/CopyCa";
import { AccountSlips, ChainDiagram, TransferDiagram } from "@/components/home/Diagrams";
import { CtaBand, NightHero, StoryWithPanel, type Story } from "@/components/site/parts";

const STORIES: Story[] = [
  {
    kicker: "Security",
    title: "A stolen key does not mean stolen funds",
    body: "Most wallets treat whoever holds the key as the owner. Here the key can only propose a transfer, and your rules decide whether it settles. A fake site, a lost phone or an attacker with your seed phrase all run into the limits you wrote down.",
    prompts: ["My account can only send to Jack and Coinbase", "Anything over $5,000 needs a second approval", "New addresses wait 24 hours"],
  },
  {
    kicker: "Privacy",
    title: "Show that a rule holds without showing the account",
    body: "A counterparty can check that your account follows a rule without learning who you are or what you hold. Each disclosure is chosen by you, limited to one party, and can be withdrawn.",
    prompts: ["Prove a reserve without sharing the balance", "Keep my balance visible to me only"],
  },
  {
    kicker: "The token",
    title: `${BRAND.symbol}: money that carries its terms`,
    body: `${BRAND.symbol} is the currency of the rule system. Attach conditions to a payment: how fast it can be spent, what it can buy, when the unspent part comes back, and when it stops existing.`,
    prompts: ["Spendable only on groceries", "Cap weekly spending at $500", "These funds expire in 1 week"],
    dark: true,
    extra: (
      <div className="mt-8 grid gap-3 border-t border-line pt-6">
        <CaStrip />
        <p className="font-serif text-[15px] leading-[1.6] text-ink-2">
          The contract is not deployed yet. Until it is, the address reads “Published at launch” and the copy button stays off.{" "}
          <Link href="/token" className="text-acc underline underline-offset-2">More about {BRAND.symbol}</Link>
        </p>
      </div>
    ),
  },
  {
    kicker: "Recovery",
    title: "A mistake should not be permanent",
    body: "Banks quietly give you two things a wallet never has: a window to pull back a payment you regret, and a way back in when you lose access. Here both are rules, set in advance while you are calm.",
    prompts: ["Let me recall a payment within 8 hours", "Restore access with three trusted people"],
  },
  {
    kicker: "Recurring money",
    title: "Regular payments that keep to your terms",
    body: "Rent on the first, an allowance every Friday, a share of every payment moved to savings, a ceiling on what can leave in a day. Decide once and the account holds you to it until you change it.",
    prompts: ["Cap daily spending at $2,000", "Keep a reserve of $500", "Pay rent on the 1st"],
  },
  {
    kicker: "DeFi",
    title: "Decide the terms before you go in",
    body: "Lending and swapping usually mean approving a contract and hoping it behaves. Put the limit in your own account instead: how much can be at risk, in which assets, through which venues.",
    prompts: ["No single payment above $2,500", "Only send USDG and ETH", "Never let a swap be sandwiched"],
  },
  {
    kicker: "Everyday",
    title: "The rules people actually ask for",
    body: "Most requests are ordinary. A first account for a teenager that cannot overspend. Nothing leaving overnight. A parent who cannot be talked into a transfer by a stranger on the phone.",
    prompts: ["Block transactions overnight", "Make it so my kid's account can spend $10 per day max"],
  },
  {
    kicker: "Agent accounts",
    title: "Give an agent a budget, not your keys",
    body: "An AI agent gets payment rules: what it may buy, from whom, how much and until when. The worst it can do is spend inside those limits, and removing one rule stops it.",
    prompts: ["My agent can spend up to $50 a week on API credits only", "My agent can only pay Acme Hosting"],
  },
  {
    kicker: "Other people's rules",
    title: "Your rules screen what others send you",
    body: "Payments, tokens and apps can arrive with conditions of their own. Yours are checked against theirs, so you decide in advance what kind of money you will accept.",
    prompts: ["Reject any incoming payment with restrictions", "Refuse tokens the sender can claw back"],
  },
];

export default function Home() {
  return (
    <>
      <NightHero
        title={
          <span className="block" aria-label={BRAND.slogan}>
            {BRAND.acronym.map((a) => (
              <span key={a.letter} className="block">
                <span className="text-acc">{a.letter}</span>
                {a.word.slice(1)}
              </span>
            ))}
          </span>
        }
        lead={<>Say “my account can only send to Jack and Coinbase” and your account enforces it on every transfer, even one signed with a stolen key.</>}
        sub={`${BRAND.name} is a wallet where AI turns your instructions into rules the account can enforce. Each new rule is checked against all the others before it applies.`}
        actions={
          <>
            <Link href="/waitlist" className="btn btn-acc">Join the waitlist</Link>
            <a href="#how" className="btn btn-ghost">See how a rule works</a>
          </>
        }
        aside={<TransferDiagram />}
      />

      <div id="how" className="scroll-mt-[60px]">
        <StoryWithPanel
          stories={STORIES}
          intro={
            <div className="mb-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-12">
              <h2 className="h1 max-w-[12em]">Write it in a sentence. It holds on every transfer.</h2>
              <p className="copy self-end">
                Each chapter below ends with sentences you can run. They go to the account on the right, where the drafter turns them into logic and checks them against the rules you already have. Nothing here moves real money.
              </p>
            </div>
          }
        />
      </div>

      <section className="night night-bg">
        <div className="wrap grid grid-cols-1 gap-12 py-[var(--section)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
          <div>
            <h2 className="h2 max-w-[13em]">Protection, without handing anyone your money</h2>
            <dl className="mt-10 grid border-y border-line">
              {[
                ["A bank gives you", "Limits, holds and reversals, on condition that it keeps your money and can change the terms."],
                ["A smart contract gives you", "Code you have to audit, which cannot tell you whether it contradicts itself or any other contract."],
                [`${BRAND.name} gives you`, "The same holds and reversals, written as rules: a payment can wait eight hours or need a second approval. Every rule is checked for consistency before it applies, and enforced against whoever holds the key."],
              ].map(([k, v], i) => (
                <div key={k} className={`grid grid-cols-1 gap-1 py-5 sm:grid-cols-[200px_1fr] sm:gap-6 ${i ? "border-t border-line" : ""}`}>
                  <dt className={`text-[15px] font-semibold ${i === 2 ? "text-acc" : "text-ink"}`}>{k}</dt>
                  <dd className="font-serif text-[16.5px] leading-[1.6] text-ink-2">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 max-w-[34em] font-serif text-[16px] leading-[1.6] text-ink-3">Checking a rule against every other rule, and letting a rule govern its own amendment, is what the account is built around.</p>
            <Link href="/technology" className="btn btn-ghost mt-8">How the checking works</Link>
          </div>
          <div>
            <AccountSlips />
          </div>
        </div>
      </section>

      <section id="rule-chains" className="wrap scroll-mt-[60px] py-[var(--section)]">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
          <h2 className="h1 max-w-[11em]">Rules that protect your other rules</h2>
          <p className="copy self-end">
            A limit is only as strong as the process for changing it. So a rule can govern another: you set the rule, then the conditions for amending it, then what it takes to change those. You can even write a rule that nobody, you included, can remove.
          </p>
        </div>
        <div className="mt-12">
          <ChainDiagram />
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 border-t border-line pt-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <p className="copy max-w-[40em]">
            Getting around R1 means amending R2 first, which means unwinding R3, in the open, with a month&apos;s notice and three people watching. In the Rule Studio, a request to remove R1 is queued behind the approvals and a request to remove R2 is refused.
          </p>
          <Link href={`/studio?rule=${encodeURIComponent("Changing rule 1 needs 3 approvals and a 30-day notice")}`} className="btn btn-acc">Build a rule chain</Link>
        </div>
      </section>

      <CtaBand body={`Early accounts on ${CHAIN.name} open in small groups, so each one comes with a real conversation about the rules you need. Join the waitlist.`} />
    </>
  );
}
