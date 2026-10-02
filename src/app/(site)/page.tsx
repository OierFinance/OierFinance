import Link from "next/link";
import { BRAND, CHAIN } from "@/config/brand";
import { CaStrip } from "@/components/CopyCa";
import { RuleTerminal } from "@/components/home/RuleTerminal";
import { CtaBand, NumberedCard, Prompt, SectionHead } from "@/components/site/parts";
import { ArrowRight, CheckIcon, CloseIcon } from "@/components/icons";

const CAPABILITIES = [
  {
    kicker: "Security",
    title: "A stolen key is not a stolen balance",
    body: "In most wallets the key is the owner. Here the key only proposes a transfer; your rules decide whether it settles. A phished signature or a lost phone runs straight into the limits you wrote down.",
    prompts: ["My account can only send to Jack and Coinbase", "Anything over $5,000 needs a second approval", "New addresses wait 24 hours"],
    status: "preview" as const,
  },
  {
    kicker: "Recovery",
    title: "Room to undo a mistake",
    body: "Banks quietly give you two things wallets never did: a window to pull back a payment and a way back in when access is lost. Both become rules you set in advance, while you are calm.",
    prompts: ["Let me recall a payment within 8 hours", "Restore my rules to how they were on 1 August"],
    status: "preview" as const,
  },
  {
    kicker: "Programmable money",
    title: "$OIER carries its own terms",
    body: "Attach conditions to the money itself: how fast it can be spent, on what, when the unspent part comes home and when it stops existing. The receiver sees the terms before accepting.",
    prompts: ["Spendable only on groceries", "These funds expire in 1 week"],
    status: "planned" as const,
  },
  {
    kicker: "Agent accounts",
    title: "Give an agent a budget, never a key",
    body: "An AI agent gets its own rules: what it may buy, from whom, how much and until when. The worst it can do is spend inside the fence, and one rule removes the fence entirely.",
    prompts: ["My agent can spend up to $50 a week on API credits only"],
    status: "preview" as const,
  },
  {
    kicker: "Everyday",
    title: "The ordinary requests",
    body: "A first account for a teenager that cannot overspend, nothing leaving while you sleep, a parent protected from a persuasive phone call. Plain requests in plain words.",
    prompts: ["Block transactions overnight", "Make it so my kid's account can spend $10 per day max"],
    status: "preview" as const,
  },
  {
    kicker: "Recurring",
    title: "Money that runs without your attention",
    body: "Rent on the first, an allowance every Friday, a share of every incoming payment moved to savings. Write the terms once and the account keeps to them until you change them.",
    prompts: ["Pay rent on the 1st", "Keep a reserve of $500"],
    status: "planned" as const,
  },
  {
    kicker: "DeFi guardrails",
    title: "Decide the terms before you enter",
    body: "Lending and swapping usually means approving a contract and hoping. Put the constraint in your account instead: how much can be at risk, through which venues, on what terms.",
    prompts: ["No single payment above $2,500", "Only send USDG and ETH"],
    status: "preview" as const,
  },
  {
    kicker: "Privacy",
    title: "Prove a fact, keep the account",
    body: "Show a counterparty that a rule holds without showing who you are or what you hold. Every disclosure is chosen, scoped to one party and revocable.",
    prompts: ["Prove a reserve without sharing the balance"],
    status: "planned" as const,
  },
  {
    kicker: "Incoming terms",
    title: "Your rules screen what others send",
    body: "Payments, tokens and apps can arrive with conditions attached. Your rules are checked against theirs, so you decide up front what kind of money you will accept.",
    prompts: ["Reject any incoming payment with restrictions"],
    status: "planned" as const,
  },
];

const MATRIX: { row: string; bank: boolean | string; contract: boolean | string; oier: boolean | string }[] = [
  { row: "Holds, limits and reversals", bank: true, contract: "if coded", oier: true },
  { row: "You keep custody of the funds", bank: false, contract: true, oier: true },
  { row: "Terms cannot be changed under you", bank: false, contract: "if immutable", oier: true },
  { row: "New terms checked against existing ones", bank: false, contract: false, oier: true },
  { row: "Written in plain language", bank: "small print", contract: false, oier: true },
  { row: "A stolen key still meets your limits", bank: "n/a", contract: false, oier: true },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <CheckIcon className="mx-auto size-4 text-ok" />;
  if (v === false) return <CloseIcon className="mx-auto size-4 text-ink-3" />;
  return <span className="text-[12.5px] text-ink-3">{v}</span>;
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="wrap relative pb-10 pt-14 sm:pt-20">
          <div className="flex flex-wrap items-center gap-3">
            <span className="tag">Early access · {CHAIN.name}</span>
          </div>
          <h1 className="h1 mt-6 max-w-[980px]">
            Your wallet, held to <span className="text-acc">your word.</span>
          </h1>
          <p className="lead mt-6 max-w-[700px]">
            {BRAND.tagline} Say “my account only sends to Jack and Coinbase” and every transfer is checked against it, even one signed with a stolen key.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/studio" className="btn btn-acc">Open Rule Studio <ArrowRight className="size-4" /></Link>
            <Link href="/waitlist" className="btn btn-ghost">Join early access</Link>
          </div>

          <ol className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.08] lg:grid-cols-4" aria-label={BRAND.slogan}>
            {BRAND.acronym.map((a) => (
              <li key={a.letter} className="min-w-0 bg-g0 p-5 sm:p-7">
                <span aria-hidden className="block font-display text-[clamp(72px,11vw,148px)] font-bold leading-[0.82] tracking-[-0.05em] text-acc">{a.letter}</span>
                <span className="mt-4 block font-display text-[clamp(20px,2.2vw,28px)] font-semibold tracking-[-0.02em]">{a.word}</span>
                <span className="mt-1.5 block text-[14px] leading-[1.5] text-ink-2">{a.line}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Keys sign, rules settle */}
      <section className="wrap section !pt-16">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <SectionHead tag="How a rule works" title="Keys sign. Rules settle." lead="A signature only proposes a transfer. Before it settles, it is evaluated against the whole rule set as one boolean formula. If any rule is false for that transfer, it does not leave." />
            <ol className="mt-8 grid gap-3">
              {[
                ["01", "You write a sentence", "The drafter turns it into clauses: who, how much, how often, when, on what."],
                ["02", "It is checked before it applies", "Against every rule you already have. Contradictions are refused, overlaps are flagged."],
                ["03", "Every transfer is evaluated", "Allowed, held for an approval, or refused, with the rule that decided it."],
              ].map(([n, t, b]) => (
                <li key={n} className="flex gap-4 rounded-[14px] border border-white/[0.07] p-4">
                  <span className="font-mono text-[12px] text-acc">{n}</span>
                  <span>
                    <span className="block font-medium">{t}</span>
                    <span className="mt-1 block text-[14.5px] text-ink-2">{b}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <RuleTerminal />
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-t border-white/[0.06] bg-g1">
        <div className="wrap section">
          <SectionHead tag="What rules cover" title="Nine kinds of rules, one account" lead="Sentences marked with a dot open in the Rule Studio and run there today. The rest are on the roadmap and say so." />
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {CAPABILITIES.map((c, i) => <NumberedCard key={c.kicker} n={String(i + 1).padStart(2, "0")} {...c} />)}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="wrap section">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
          <SectionHead tag="Protection without a custodian" title="What a bank gives you, without handing over the money" lead="A bank offers holds and reversals on the condition that it keeps your funds and can rewrite the terms. A contract keeps custody with you but cannot tell you whether it contradicts itself. Oier keeps both halves." />
          <div className="card min-w-0 overflow-hidden">
            <table className="w-full table-fixed text-left text-[14px]">
              <thead>
                <tr className="border-b border-white/[0.08] text-[12px]">
                  <th className="w-[46%] px-4 py-3 font-normal text-ink-3" scope="col"><span className="sr-only">Property</span></th>
                  <th className="px-2 py-3 text-center font-medium text-ink-2" scope="col">Bank</th>
                  <th className="px-2 py-3 text-center font-medium text-ink-2" scope="col">Contract</th>
                  <th className="px-2 py-3 text-center font-semibold text-acc" scope="col">Oier</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((m) => (
                  <tr key={m.row} className="border-b border-white/[0.05] last:border-0">
                    <th scope="row" className="px-4 py-3 font-normal leading-[1.4] text-ink">{m.row}</th>
                    <td className="px-2 py-3 text-center"><Cell v={m.bank} /></td>
                    <td className="px-2 py-3 text-center"><Cell v={m.contract} /></td>
                    <td className="bg-acc/[0.04] px-2 py-3 text-center"><Cell v={m.oier} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Rule chains */}
      <section id="rule-chains" className="border-y border-white/[0.06] bg-g1">
        <div className="wrap section">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <SectionHead tag="Rule chains" title="Rules that guard your other rules" lead="A limit is only as strong as the way it can be changed. So a rule can govern another: who may amend it, with how many approvals and how much notice. Chain them, and loosening the first means unwinding every link above it in the open." />
              <div className="mt-8 flex flex-wrap gap-1.5">
                <Prompt text="My account can only send to Jack and Coinbase" />
                <Prompt text="Changing rule 1 needs 3 approvals and a 30-day notice" />
                <Prompt text="Rule 2 can never be removed" />
              </div>
            </div>
            <ol className="relative grid gap-3">
              {[
                { id: "R1", head: "The rule", body: "This account only sends to Jack and Coinbase.", f: "to ∈ {Jack, Coinbase}", tone: "acc" },
                { id: "R2", head: "Who can change R1", body: "Amending R1 needs three approvals and a 30-day public notice.", f: "amend(R1) → approvals ≥ 3 ∧ notice ≥ 30d", tone: "violet" },
                { id: "R3", head: "What locks R2", body: "R2 can never be removed, not even by you.", f: "amend(R2) → ⊥", tone: "violet" },
              ].map((r, k) => (
                <li key={r.id} className="card relative p-5" style={{ marginLeft: `${k * 6}%` }}>
                  <div className="flex items-center gap-3">
                    <span className={`grid h-7 min-w-9 place-items-center rounded-[7px] font-mono text-[12px] ${r.tone === "acc" ? "bg-acc/15 text-acc" : "bg-violet/15 text-violet"}`}>{r.id}</span>
                    <span className="label">{r.head}</span>
                    {k > 0 ? <span className="ml-auto font-mono text-[11px] text-ink-3">governs R{k}</span> : <span className="ml-auto font-mono text-[11px] text-ok">active</span>}
                  </div>
                  <p className="mt-3 text-[15.5px]">{r.body}</p>
                  <p className="formula mt-2">{r.f}</p>
                </li>
              ))}
              <li className="mt-2 text-[14.5px] leading-[1.6] text-ink-2">Getting around R1 means amending R2 first, and R3 says R2 stays. In the studio, a removal request for R1 is queued behind three approvals; one for R2 is refused outright.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Token */}
      <section className="wrap section">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHead tag="The token" title={<>{BRAND.symbol}: money that keeps its promises</>} lead="$OIER is the currency of the rule system. Its job is to carry terms with a payment: spend rate, allowed purchases, return date and expiry, enforced wherever it travels." />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/token" className="btn btn-ghost">About {BRAND.symbol} <ArrowRight className="size-4" /></Link>
            </div>
          </div>
          <div className="card p-5 sm:p-6">
            <p className="label">Contract · {CHAIN.name}</p>
            <div className="mt-3"><CaStrip /></div>
            <ul className="mt-5 grid gap-2 text-[14.5px] text-ink-2">
              {["Send $2,000 to my daughter, $500 a week at most", "Unspent funds come back after a month", "Charity funds spendable only on charitable outcomes"].map((t) => (
                <li key={t} className="flex gap-2.5"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-acc" />{t}</li>
              ))}
            </ul>
            <p className="mt-5 text-[12.5px] text-ink-3">Until the contract is published the address reads “Published at launch”. Anything claiming to be {BRAND.symbol} before then is not ours.</p>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
