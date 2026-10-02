import Link from "next/link";
import { BRAND, CHAIN, TOKEN } from "@/config/brand";
import { CaStrip } from "@/components/CopyCa";
import { AccountSlips, ChainDiagram, TransferDiagram } from "@/components/home/Diagrams";
import { CtaBand, NightHero, StoryWithPanel, type Story } from "@/components/site/parts";

const STORIES: Story[] = [
  {
    kicker: "Security",
    title: "Whoever signs, the rules still answer",
    body: "In an ordinary wallet, a signature is the whole decision. In Oier a signature only asks. The account then compares the request with your rules, so a phishing page or someone holding your seed phrase gets exactly as far as your rules let anyone get.",
    prompts: ["Only pay Priya and Halden Exchange", "Payments over $4,000 need an extra signature", "New payees wait 48 hours"],
  },
  {
    kicker: "Privacy",
    title: "Prove the rule, keep the account to yourself",
    body: "Sometimes another party needs to know your account follows a rule, such as holding a minimum reserve. The plan is to let them verify that single fact and nothing else: no identity, no balance, no history.",
    prompts: ["Show a lender my reserve, not my balance"],
  },
  {
    kicker: "The token",
    title: `${BRAND.symbol}: a payment that remembers its conditions`,
    body: `${BRAND.symbol} is the native currency of the rule system. A sender can attach limits that stay with the funds: a spending pace, the kinds of purchase allowed, a date when leftovers return, a date when the money expires.`,
    prompts: ["Spendable only on school supplies", "Cap weekly spending at $300", "These funds lapse after 10 days"],
    dark: true,
    extra: (
      <div className="mt-8 grid gap-3 border-t border-line pt-6">
        <CaStrip />
        <p className="font-serif text-[15px] leading-[1.6] text-ink-2">
          {TOKEN.isLive
            ? `The ${BRAND.symbol} contract is live on ${CHAIN.name}. Copy it here or from the footer, and ignore any other address using the name.`
            : "No contract exists yet, so the address field shows “Published at launch” and copying is switched off."}{" "}
          <Link href="/token" className="text-acc underline underline-offset-2">Read the token page</Link>
        </p>
      </div>
    ),
  },
  {
    kicker: "Recovery",
    title: "Room to change your mind",
    body: "Banks have long offered two safety nets that wallets lack: undoing a payment sent by mistake, and getting back in after losing access. In Oier you configure both yourself, ahead of time.",
    prompts: ["Hold every payment for 6 hours", "Three friends can restore my access"],
  },
  {
    kicker: "Recurring money",
    title: "Set the routine once",
    body: "Salary splits, allowances, standing payments and a daily ceiling are decisions you make once, on a good day. After that the account carries them out and refuses anything that breaks them, until you edit the rule.",
    prompts: ["Spend at most $1,200 a day", "Keep at least $750", "Move a tenth of every salary to savings"],
  },
  {
    kicker: "DeFi",
    title: "Your limits come with you into every protocol",
    body: "Interacting with a lending market or an exchange normally means granting it broad permissions. With Oier the boundary lives in your account: which assets may leave, how much at a time, and to which venues.",
    prompts: ["Cap each transfer at $3,000", "Only move ETH or USDG", "Refuse swaps with more than 1% slippage"],
  },
  {
    kicker: "Everyday",
    title: "Small rules for real households",
    body: "Most of what families want is modest. A daily limit for a teenager. No payments at three in the morning. A grandparent who cannot be pressured into wiring money to a stranger.",
    prompts: ["Pause payments between 11pm and 7am", "My daughter's account gets $15 a day"],
  },
  {
    kicker: "Agent accounts",
    title: "Software that spends on an allowance",
    body: "When an AI agent pays for things on your behalf, it gets a budget and a list of permitted payees instead of your keys. If it misbehaves, the damage is capped by the budget, and deleting its rule switches it off.",
    prompts: ["My agent may spend $40 a week on cloud hosting only", "My agent can only pay Brightline Hosting"],
  },
  {
    kicker: "Incoming money",
    title: "Screen the strings attached to what you receive",
    body: "A payment sent to you may carry its own conditions. Oier compares those conditions with your rules first, and money you would not want, such as funds the sender can pull back, can be turned away automatically.",
    prompts: ["Decline payments that come with conditions", "Turn away tokens the sender can reclaim"],
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
        lead={<>Tell your account it may pay only Priya and Halden Exchange. From then on it refuses every other destination, no matter who holds the key.</>}
        sub={`${BRAND.name} pairs a wallet with an assistant that writes your instructions down as logic. Before a new instruction takes effect, it is tested against the ones already in place.`}
        actions={
          <>
            <Link href="/waitlist" className="btn btn-acc">Get early access</Link>
            <a href="#how" className="btn btn-ghost">Watch a transfer get checked</a>
          </>
        }
        aside={<TransferDiagram />}
      />

      <div id="how" className="scroll-mt-[60px]">
        <StoryWithPanel
          stories={STORIES}
          intro={
            <div className="mb-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-12">
              <h2 className="h1 max-w-[12em]">Plain sentences in, enforced rules out</h2>
              <p className="copy self-end">
                Every section below ends with sample instructions. Click one and the account panel drafts it, shows the resulting logic, and tests it against the rules you already have. The panel only drafts; real enforcement happens in your account contract.
              </p>
            </div>
          }
        />
      </div>

      <section className="night night-bg">
        <div className="wrap grid grid-cols-1 gap-12 py-[var(--section)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
          <div>
            <h2 className="h2 max-w-[13em]">Safety nets without a custodian</h2>
            <dl className="mt-10 grid border-y border-line">
              {[
                ["With a bank", "You get limits and reversals, but the bank holds the funds and writes the terms."],
                ["With a smart contract", "You keep the funds, but you inherit code that nobody checked against your other commitments."],
                [`With ${BRAND.name}`, "You keep the funds and get the safety nets as rules: delays, co-signers, caps. Each one is tested against the rest before it starts, and it binds every key that touches the account."],
              ].map(([k, v], i) => (
                <div key={k} className={`grid gap-1 py-5 sm:grid-cols-[200px_1fr] sm:gap-6 ${i ? "border-t border-line" : ""}`}>
                  <dt className={`text-[15px] font-semibold ${i === 2 ? "text-acc" : "text-ink"}`}>{k}</dt>
                  <dd className="font-serif text-[16.5px] leading-[1.6] text-ink-2">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 max-w-[34em] font-serif text-[16px] leading-[1.6] text-ink-3">That cross-checking, together with rules that guard their own amendment, is the core of the design.</p>
            <Link href="/technology" className="btn btn-ghost mt-8">Inside the engine</Link>
          </div>
          <div>
            <AccountSlips />
          </div>
        </div>
      </section>

      <section id="rule-chains" className="wrap scroll-mt-[60px] py-[var(--section)]">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
          <h2 className="h1 max-w-[11em]">Locks on the locks</h2>
          <p className="copy self-end">
            Whoever can edit a safeguard can switch it off. Oier lets you guard the settings too: one rule names the limit, a second says what it takes to alter the first, and a third can make the second permanent.
          </p>
        </div>
        <div className="mt-12">
          <ChainDiagram />
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 border-t border-line pt-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <p className="copy max-w-[40em]">
            To weaken R1, someone first has to clear R2, and R3 forbids removing R2. Every step is visible to the people it names. Try it in the studio: a request to remove R1 waits in a queue, and a request to remove R2 is rejected.
          </p>
          <Link href={`/studio?rule=${encodeURIComponent("Changing rule 1 needs 2 approvals and a 7-day notice")}`} className="btn btn-acc">Try a chain in the studio</Link>
        </div>
      </section>

      <CtaBand title="Ready when your account is" body={`We are opening accounts on ${CHAIN.name} a few at a time. Put your name down and draft your first rules today.`} />
    </>
  );
}
