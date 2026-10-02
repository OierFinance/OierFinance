import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/config/brand";
import { CtaBand, NightHero } from "@/components/site/parts";

export const metadata: Metadata = {
  title: "Technology",
  description: "Rules held as boolean logic: decided for consistency before they apply, and able to govern their own amendment.",
};

const SUBNAV = [
  ["benefits", "Benefits"],
  ["capabilities", "Capabilities"],
  ["build", "What you can build"],
  ["compared", "Compared"],
  ["start", "Get started"],
];

const BENEFITS = [
  ["Know before it applies", "A new rule is decided against the whole set first. If no transfer could ever pass the result, you find out while writing, not when a payment fails."],
  ["Sentences in, logic out", "You state what must hold. The clauses that enforce it come from the sentence and are shown to you as a formula before anything changes."],
  ["Changes on the rule's terms", "A rule can say how it may be amended. Each change request is checked against those conditions, then refused, queued or applied."],
  ["Rules about rules", "A rule is a value the system can reason about, so one rule can guard another, and that one can be guarded in turn."],
];

const CAPS = [
  {
    kicker: "Decidability",
    title: "Conflicts are found, not stumbled on",
    body: "Every clause compares one property of a transfer with a fixed value. That keeps the space of transfers finite in the ways that matter, so whether a set of rules can be satisfied is decided outright rather than estimated from test cases.",
    spec: { head: "Checker output", big: "Satisfiable", note: "At least one transfer passes every rule.", rows: [["Method", "Exhaustive over threshold regions"], ["If unsatisfiable", "Refused, with the conflicting rules named"]] },
  },
  {
    kicker: "Self-reference",
    title: "A rule can govern another rule",
    body: "Governance rules point at other rules: how many approvals an amendment needs, how long the notice runs, or that no amendment is admissible at all. Chains of them are checked the same way as everything else.",
    spec: { head: "A rule over a rule", big: "3 approvals, 30 days", note: "Changing R1 needs three approvals and a 30-day notice.", rows: [["Governs", "Which amendments are admissible"], ["Used for", "Rule chains, shared accounts"]] },
  },
  {
    kicker: "Revision",
    title: "Change the set without breaking it",
    body: "Adding a rule can only narrow what the account allows, so additions are checked for contradiction and redundancy. Widening means removing a rule, and removal is exactly what governance rules control.",
    spec: { head: "Update path", big: "check, then apply", note: "Inconsistent updates are refused before they touch the set.", rows: [["Checked first", "Contradiction, redundancy, dead recipients"], ["Applies to", "Your set and every rule guarding it"]] },
  },
];

const BUILD = [
  ["Accounts that explain themselves", "Questions about the account are decided, not guessed: what a rule permits, whether a change is safe, whether two rules can conflict.", "Decided within the supported clauses"],
  ["Accounts users can reprogram", "People change the account by stating new requirements. The conditions for accepting a change are part of the rule set, not a separate process.", "A change is admitted only if it is satisfiable"],
  ["High-assurance by default", "Methods normally reserved for safety-critical systems, applied to an everyday wallet. What must hold is settled before anything runs.", "Decided before execution, not sampled by tests"],
];

const ROWS = [
  ["What you write", "The steps the machine takes", "A condition that must be true for every transfer"],
  ["How it is checked", "Audits and tests over the cases someone thought of", "Decided over every case the rules can tell apart"],
  ["Conflicts between rules", "Found when something breaks", "Found before the rule applies, with the rules involved named"],
  ["Changing it later", "Patch, redeploy, and hope nothing else moved", "An amendment, admitted only if the rules guarding it allow"],
  ["Rules about rules", "Numeric parameters at most", "Any rule can govern any other rule"],
];

export default function TechnologyPage() {
  return (
    <>
      <NightHero
        title="Rules as logic"
        lead="Instead of writing the steps a program takes, state what must hold. The account evaluates that condition on every transfer."
        actions={
          <>
            <Link href="/studio" className="btn btn-acc">Try the checker</Link>
            {BRAND.github ? <a href={BRAND.github} target="_blank" rel="noreferrer" className="btn btn-ghost">Read the source</a> : null}
          </>
        }
        aside={
          <div className="rounded-[10px] border border-line bg-g2 font-sans">
            <p className="border-b border-line px-5 py-3 text-[13.5px] text-ink-3">A rule, as the account holds it</p>
            <div className="px-5 py-6">
              <p className="font-mono text-[clamp(17px,2vw,22px)] text-acc">spent(24h) + amount ≤ 2000</p>
              <p className="mt-3 font-serif text-[16px] text-ink-2">From the sentence “Cap daily spending at $2,000”. Nothing leaves once the day&apos;s total would pass 2,000.</p>
            </div>
          </div>
        }
      />

      <nav aria-label="On this page" className="sticky top-[60px] z-30 border-b border-line bg-g2/95 backdrop-blur-sm">
        <div className="wrap flex gap-6 overflow-x-auto py-3 text-[14px] [scrollbar-width:none]">
          {SUBNAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 text-ink-2 hover:text-ink">{label}</a>
          ))}
        </div>
      </nav>

      <section className="wrap grid grid-cols-1 gap-8 py-[var(--section)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <h2 className="h2">How the rule engine works</h2>
        <div className="lg:border-l lg:border-line lg:pl-10">
          <p className="lead">A rule set is one boolean formula over a transfer. The account allows a transfer only when every rule is true for it, and admits a new rule only when the whole set can still be true.</p>
          <div className="mt-8 rounded-[8px] border border-line bg-g2 p-5 font-sans">
            <p className="text-[13.5px] font-semibold text-ink-2">Under the hood</p>
            <p className="mt-2 font-serif text-[16px] leading-[1.6] text-ink-2">Clauses compare one variable of a transfer with a constant: recipient, amount, spending so far, hour, asset, category, date, approvals. Rules are conjunctions of clauses; governance rules constrain amendments of other rules.</p>
            <p className="mt-4 text-[13.5px] font-semibold text-ink-2">Connectives</p>
            <p className="formula mt-1 !text-[14px]">∧ and, ∨ or, ¬ not, → implies, ∈ member of, ⊥ never</p>
          </div>
        </div>
      </section>

      <section id="benefits" className="scroll-mt-[110px] border-y border-line bg-g1">
        <div className="wrap py-[var(--section)]">
          <h2 className="h2 max-w-[18em]">Like writing the test a payment must pass, and getting the guard with it</h2>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(([t, b]) => (
              <div key={t} className="border-t-2 border-ink pt-5">
                <h3 className="text-[18px] font-bold leading-[1.25] tracking-[-0.01em]">{t}</h3>
                <p className="mt-2.5 font-serif text-[16px] leading-[1.6] text-ink-2">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="capabilities" className="wrap scroll-mt-[110px] py-[var(--section)]">
        <h2 className="h1 max-w-[13em]">Three properties a wallet has not had before</h2>
        <div className="mt-14 grid gap-16">
          {CAPS.map((c, i) => (
            <div key={c.title} className={`grid items-start gap-8 lg:grid-cols-2 lg:gap-16 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <p className="kicker">{c.kicker}</p>
                <h3 className="h2 mt-3 max-w-[14em]">{c.title}</h3>
                <p className="copy mt-4">{c.body}</p>
              </div>
              <div className="overflow-hidden rounded-[10px] border border-line bg-g2 font-sans">
                <p className="border-b border-line bg-g1 px-5 py-2.5 text-[13.5px] text-ink-3">{c.spec.head}</p>
                <div className="px-5 py-5">
                  <p className="font-mono text-[22px] text-acc-deep">{c.spec.big}</p>
                  <p className="mt-1.5 font-serif text-[15.5px] text-ink-2">{c.spec.note}</p>
                </div>
                <dl>
                  {c.spec.rows.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-6 border-t border-line px-5 py-3 text-[14px]">
                      <dt className="text-ink-3">{k}</dt>
                      <dd className="text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="build" className="scroll-mt-[110px] border-y border-line bg-g1">
        <div className="wrap py-[var(--section)]">
          <h2 className="h2">Better accounts, built a better way</h2>
          <p className="copy mt-3">A few things this makes possible.</p>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {BUILD.map(([t, b, p]) => (
              <div key={t} className="flex flex-col rounded-[10px] border border-line bg-g2 p-6">
                <h3 className="text-[19px] font-bold leading-[1.25] tracking-[-0.01em]">{t}</h3>
                <p className="mt-2.5 font-serif text-[16px] leading-[1.6] text-ink-2">{b}</p>
                <p className="mt-auto border-t border-line pt-4 text-[13.5px] text-ink-3">Property: {p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="compared" className="night night-bg scroll-mt-[110px]">
        <div className="wrap py-[var(--section)]">
          <h2 className="h2">The shorter path to correct</h2>
          <p className="mt-3 max-w-[36em] font-serif text-[17px] leading-[1.6] text-ink-2">The differences come from stating conditions instead of steps, deciding them instead of sampling them, and checking changes before they apply.</p>
          <div className="mt-10 min-w-0 overflow-x-auto rounded-[10px] border border-line">
            <table className="w-full min-w-[680px] text-left font-sans text-[15px]">
              <thead>
                <tr className="border-b border-line text-[13.5px]">
                  <th className="w-[22%] px-5 py-3 font-normal text-ink-3" scope="col"><span className="sr-only">Aspect</span></th>
                  <th className="px-5 py-3 font-semibold text-ink-3" scope="col">Conventional code</th>
                  <th className="bg-g2 px-5 py-3 font-semibold text-acc" scope="col">An Oier rule set</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([a, b, c]) => (
                  <tr key={a} className="border-b border-line align-top last:border-0">
                    <th scope="row" className="px-5 py-4 font-semibold">{a}</th>
                    <td className="px-5 py-4 text-ink-3">{b}</td>
                    <td className="bg-g2 px-5 py-4 text-ink">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="start" className="wrap scroll-mt-[110px] py-[var(--section)]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <h2 className="h2">Run the checker yourself</h2>
            <p className="copy mt-4">The Rule Studio runs the same drafter and decision procedure described here, in your browser, with no key and no server in the verdict. Write two rules that disagree and watch the second one get refused, with the reason.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/studio" className="btn btn-acc">Open the Rule Studio</Link>
              {BRAND.github ? <a href={BRAND.github} target="_blank" rel="noreferrer" className="btn btn-ghost">View the repository</a> : null}
            </div>
          </div>
          <div className="lg:border-l lg:border-line lg:pl-10">
            <h3 className="h3">Research-driven, and honest about limits</h3>
            <ul className="mt-4 grid gap-3 font-serif text-[16.5px] leading-[1.6] text-ink-2">
              <li>The design follows published work on decidable logic, boolean algebras and specifications that can reason about their own amendment.</li>
              <li>The preview grammar reads a fixed set of phrasings. Anything else is refused whole, never half-applied.</li>
              <li>Spending windows count activity recorded in the preview on your device. Enforcement against a real key arrives with the on-chain account.</li>
              <li>Richer time conditions, such as until, since and eventually, are research in progress.</li>
            </ul>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
