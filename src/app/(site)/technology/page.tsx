import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/config/brand";
import { CtaBand, NightHero } from "@/components/site/parts";

export const metadata: Metadata = {
  title: "Technology",
  description: "Rules held as boolean logic: decided for consistency before they apply, and able to govern their own amendment.",
};

const SUBNAV = [
  ["benefits", "Why logic"],
  ["capabilities", "Properties"],
  ["build", "Possibilities"],
  ["compared", "Code vs rules"],
  ["start", "Try it"],
];

const BENEFITS = [
  ["Conflicts surface early", "Contradictions are caught while you write the rule, long before a payment depends on it."],
  ["Nothing hidden between words and enforcement", "The formula derived from your sentence is shown to you, and that formula is exactly what runs."],
  ["Amendments obey the rules", "A rule may carry its own amendment policy, and every edit is measured against it."],
  ["Layered protection", "Rules can refer to rules, so protection can be stacked as many levels deep as you need."],
];

const CAPS = [
  {
    kicker: "Decidability",
    title: "Every conflict is decided, never guessed",
    body: "Each clause compares one property of a transfer with a fixed value. Because of that, the possible transfers fall into a finite number of groups the rules treat alike, and the checker can examine every group instead of sampling a few.",
    spec: { head: "Checker result", big: "Satisfiable", note: "Some transfer still passes every rule in the set.", rows: [["Method", "One witness per threshold region"], ["On failure", "Rejected, with the clashing rules listed"]] },
  },
  {
    kicker: "Self-reference",
    title: "Rules that point at rules",
    body: "A governance rule names another rule and states what an edit to it requires: a number of approvals, a notice period, or nothing at all because edits are forbidden. Chains of these are checked like any other rule.",
    spec: { head: "Governance rule", big: "2 approvals, 7 days", note: "Editing R1 requires two approvals and a week of notice.", rows: [["Controls", "Which edits are allowed"], ["Typical use", "Shared accounts, rule chains"]] },
  },
  {
    kicker: "Revision",
    title: "Edits that cannot break the set",
    body: "Adding a rule can only narrow what the account permits, so new rules are tested for contradiction and redundancy. Loosening means deleting a rule, which is precisely what governance rules regulate.",
    spec: { head: "Edit path", big: "test, then commit", note: "An inconsistent edit never reaches the set.", rows: [["Tested for", "Contradiction, redundancy, unpayable payees"], ["Covers", "The set plus every rule guarding it"]] },
  },
];

const BUILD = [
  ["Self-describing accounts", "You can ask what a rule allows, whether an edit is safe, or whether two rules collide, and get a definite answer.", "Definite within the supported clauses"],
  ["Accounts owners can reshape", "Owners change behaviour by adding requirements, and the policy for accepting changes lives inside the rule set itself.", "Edits are accepted only when satisfiable"],
  ["Assurance for everyday money", "The kind of up-front checking used in safety-critical engineering, applied to a household wallet.", "Settled before execution"],
];

const ROWS = [
  ["You describe", "Instructions to execute", "Conditions to satisfy"],
  ["Verification", "Tests and audits over chosen scenarios", "A decision covering every case the rules distinguish"],
  ["Rule clashes", "Discovered in production", "Rejected at writing time, with the culprits named"],
  ["Later edits", "Patch and redeploy", "Accepted only if the guarding rules allow"],
  ["Meta-rules", "Rare, usually one config value", "Any rule can govern any other"],
];

export default function TechnologyPage() {
  return (
    <>
      <NightHero
        title="Instructions, held as logic"
        lead="Oier does not run your instructions as a script. It stores them as conditions, and a transfer goes through only when every condition is true."
        actions={
          <>
            <Link href="/studio" className="btn btn-acc">Open the Rule Studio</Link>
            {BRAND.github ? <a href={BRAND.github} target="_blank" rel="noreferrer" className="btn btn-ghost">Source code</a> : null}
          </>
        }
        aside={
          <div className="rounded-[10px] border border-line bg-g2 font-sans">
            <p className="border-b border-line px-5 py-3 text-[13.5px] text-ink-3">One rule in the engine</p>
            <div className="px-5 py-6">
              <p className="font-mono text-[clamp(17px,2vw,22px)] text-acc">spent(24h) + amount ≤ 1200</p>
              <p className="mt-3 font-serif text-[16px] text-ink-2">Typed as “Spend at most $1,200 a day”. Any transfer that would push the day&apos;s total past 1,200 is stopped.</p>
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
        <h2 className="h2">Inside the engine</h2>
        <div className="lg:border-l lg:border-line lg:pl-10">
          <p className="lead">Your rules form a single true-or-false test applied to each transfer. A transfer passes when the test is true, and a new rule is accepted only if the test can still come out true for some transfer.</p>
          <div className="mt-8 rounded-[8px] border border-line bg-g2 p-5 font-sans">
            <p className="text-[13.5px] font-semibold text-ink-2">Under the hood</p>
            <p className="mt-2 font-serif text-[16px] leading-[1.6] text-ink-2">Each clause looks at one property of a transfer (payee, amount, spend so far, hour, asset, category, date, co-signatures) and compares it with a value. A rule joins clauses with “and”. Governance rules restrict edits to other rules.</p>
            <p className="mt-4 text-[13.5px] font-semibold text-ink-2">Connectives</p>
            <p className="formula mt-1 !text-[14px]">∧ and, ∨ or, ¬ not, → implies, ∈ member of, ⊥ never</p>
          </div>
        </div>
      </section>

      <section id="benefits" className="scroll-mt-[110px] border-y border-line bg-g1">
        <div className="wrap py-[var(--section)]">
          <h2 className="h2 max-w-[18em]">What changes when rules are logic</h2>
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
        <h2 className="h1 max-w-[13em]">Three engine properties</h2>
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
          <h2 className="h2">What it makes possible</h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {BUILD.map(([t, b, p]) => (
              <div key={t} className="flex flex-col rounded-[10px] border border-line bg-g2 p-6">
                <h3 className="text-[19px] font-bold leading-[1.25] tracking-[-0.01em]">{t}</h3>
                <p className="mt-2.5 font-serif text-[16px] leading-[1.6] text-ink-2">{b}</p>
                <p className="mt-auto border-t border-line pt-4 text-[13.5px] text-ink-3">Guarantee: {p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="compared" className="night night-bg scroll-mt-[110px]">
        <div className="wrap py-[var(--section)]">
          <h2 className="h2">Code versus a rule set</h2>
          <p className="mt-3 max-w-[36em] font-serif text-[17px] leading-[1.6] text-ink-2">Three habits make the difference: describe conditions rather than steps, decide them rather than sample them, and test every edit before it lands.</p>
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
            <h2 className="h2">Try the engine</h2>
            <p className="copy mt-4">The Rule Studio runs this exact drafter and checker inside your browser. No API key, no server involved in the verdict. Enter two rules that contradict each other and the second is rejected with an explanation.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/studio" className="btn btn-acc">Open the Rule Studio</Link>
              {BRAND.github ? <a href={BRAND.github} target="_blank" rel="noreferrer" className="btn btn-ghost">Browse the code</a> : null}
            </div>
          </div>
          <div className="lg:border-l lg:border-line lg:pl-10">
            <h3 className="h3">Grounded in research, clear about limits</h3>
            <ul className="mt-4 grid gap-3 font-serif text-[16.5px] leading-[1.6] text-ink-2">
              <li>The approach draws on published work in decidable logic and boolean algebra, including specifications that can describe how they may be changed.</li>
              <li>The preview understands a fixed set of phrasings. A sentence it cannot fully read is rejected outright, never applied in part.</li>
              <li>Spending windows use the activity you record in the preview on this device. Enforcement against real keys comes with the on-chain account.</li>
              <li>Richer conditions over time, like “until” or “since”, are still being researched.</li>
            </ul>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
