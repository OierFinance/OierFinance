import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/config/brand";
import { CtaBand, PageHero, SectionHead } from "@/components/site/parts";
import { ArrowRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "Technology",
  description: "Rules held as boolean logic: decided for consistency before they apply, able to govern their own amendment.",
};

const BENEFITS = [
  ["Know before it applies", "A new rule is decided against the whole set first. If no transfer could ever satisfy the result, you learn that at writing time, not when a payment fails."],
  ["Sentences, not code", "You state what must hold. The clauses that enforce it are derived from the sentence, and shown to you as a formula before anything changes."],
  ["Changes on the rule's terms", "A rule can say how it may be amended. Every change request is checked against those conditions and refused, queued or applied accordingly."],
  ["Rules about rules", "Because a rule is a value the system reasons over, one rule can guard another, and that one can be guarded in turn."],
];

const ROWS = [
  ["What you write", "Steps the machine follows", "A condition that must hold"],
  ["How it is checked", "Audits and tests over the cases someone thought of", "Decided over every case the rule can distinguish"],
  ["Conflicts between rules", "Found when something breaks", "Found before the rule applies, with the rules involved named"],
  ["Changing it later", "Patch, redeploy, hope nothing else moved", "An amendment, admitted only if the rules guarding it allow"],
  ["Rules about rules", "Numeric parameters at best", "First-class: a rule can govern any other rule"],
];

export default function TechnologyPage() {
  return (
    <>
      <PageHero tag="Technology" title={<>Rules held as <span className="text-acc">logic</span>, not as code.</>} lead="Every rule is a boolean condition over a transfer. The account allows a transfer only when the conjunction of all its rules is true, and a rule is admitted only when that conjunction can still be true.">
        <Link href="/studio" className="btn btn-acc">See it in the studio <ArrowRight className="size-4" /></Link>
        {BRAND.github ? <a href={BRAND.github} target="_blank" rel="noreferrer" className="btn btn-ghost">Source on GitHub</a> : null}
      </PageHero>

      <section className="wrap section !pt-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <SectionHead tag="A rule, as the account holds it" title="One sentence, one formula" lead="The sentence on top is what you typed. The line underneath is what the account evaluates on every transfer. Nothing in between is hidden." />
          <div className="card-hi p-5 sm:p-6">
            <p className="label">You say</p>
            <p className="mt-2 text-[18px]">“My account can only send to Jack and Coinbase, and nothing over $5,000 without a second approval.”</p>
            <p className="label mt-6">Held as</p>
            <p className="formula mt-2 rounded-[10px] border border-white/[0.08] bg-g1 px-3 py-3 !text-[14px]">allow(tx) ≡ to ∈ &#123;Jack, Coinbase&#125; ∧ (amount &gt; 5000 → cosigned)</p>
            <p className="label mt-6">Decided before applying</p>
            <p className="mt-2 text-[14.5px] text-ink-2">Satisfiable: a $100 transfer to Jack passes. Not implied by existing rules. No named recipient becomes unpayable.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-g1">
        <div className="wrap section">
          <SectionHead tag="Why logic" title="Writing the test, and getting the guard for free" />
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {BENEFITS.map(([t, b], i) => (
              <div key={t} className="card p-6">
                <p className="font-mono text-[12px] text-acc">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="h3 mt-3">{t}</h3>
                <p className="mt-2.5 text-[15px] leading-[1.6] text-ink-2">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap section">
        <SectionHead tag="Under the hood of the preview" title="How the checker decides" lead="The Rule Studio runs a small, complete decision procedure in your browser. No model and no server is involved in the verdict." />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {[
            ["Clauses over variables", "Each clause compares one variable of a transfer (recipient, amount, hour, asset, category, date, spending so far) against a constant. A rule is a conjunction of clauses; a set is a conjunction of rules."],
            ["Finitely many cases", "Each variable only meets a finite list of thresholds, so the space of transfers splits into regions that every rule treats the same way. One witness per region is enough, and variables that never meet in a clause are decided separately."],
            ["Explained, not just refused", "When a new rule makes the set unsatisfiable, a deletion pass finds the smallest group of existing rules that conflict with it, and those are the ones named in the refusal."],
          ].map(([t, b]) => (
            <div key={t} className="card p-6">
              <h3 className="h3">{t}</h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-ink-2">{b}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="card p-6">
            <p className="label">Checks run before apply</p>
            <ul className="mt-4 grid gap-2.5 text-[14.5px] text-ink-2">
              {["Contradiction: no transfer could pass the set any more", "Contradiction for the agent only: the agent could never pay", "Already enforced: the set implies the new rule", "Made redundant: an older rule adds nothing once this applies", "Dead entry: a named recipient that can never be paid", "Governance: frozen rules refuse amendments; guarded ones queue them"].map((x) => (
                <li key={x} className="flex gap-2.5"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-acc" />{x}</li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <p className="label">Limits, stated plainly</p>
            <ul className="mt-4 grid gap-2.5 text-[14.5px] text-ink-2">
              {["The grammar reads a fixed set of phrasings. Anything else is refused whole, never half-applied.", "Spending windows are checked with the activity recorded in the preview, on this device.", "Enforcement against a real key needs the on-chain account, which is the next release.", "Temporal operators beyond windows and dates (until, since, eventually) are research work in progress."].map((x) => (
                <li key={x} className="flex gap-2.5"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-hold" />{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-g1">
        <div className="wrap section">
          <SectionHead tag="Compared" title="Conventional development, and a rule set" />
          <div className="card mt-10 min-w-0 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[14.5px]">
              <thead>
                <tr className="border-b border-white/[0.08] text-[12.5px]">
                  <th className="w-[22%] px-5 py-3 font-normal text-ink-3" scope="col"><span className="sr-only">Aspect</span></th>
                  <th className="px-5 py-3 font-medium text-ink-2" scope="col">Conventional code</th>
                  <th className="px-5 py-3 font-semibold text-acc" scope="col">An Oier rule set</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([a, b, c]) => (
                  <tr key={a} className="border-b border-white/[0.05] last:border-0 align-top">
                    <th scope="row" className="px-5 py-4 font-medium">{a}</th>
                    <td className="px-5 py-4 text-ink-2">{b}</td>
                    <td className="bg-acc/[0.04] px-5 py-4 text-ink">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-8 max-w-[760px] text-[14.5px] leading-[1.6] text-ink-2">
            Oier is research-driven: the design follows published work on decidable logics, boolean algebras and specifications that can reason about their own amendment. The preview implements the decidable core that a wallet needs today and grows from there.
          </p>
        </div>
      </section>

      <CtaBand title="Read the rule, then break it" body="Every claim on this page can be tested in the studio. Write two rules that disagree and watch the second one get refused." />
    </>
  );
}
