"use client";

import { useState } from "react";
import { AccountPanel, DemoProvider, TryPrompt } from "@/components/demo/AccountPanel";

type Case = { tag: string; title: string; body: string; say: string };

const CASES: Case[] = [
  { tag: "Family", title: "Grandparents who cannot be rushed", body: "Phone scams depend on urgency. A payee list fixed weeks in advance gives the caller nothing to work with.", say: "Only pay Ana and Leo" },
  { tag: "Family", title: "A teen account with a daily ceiling", body: "Pocket money lasts the day it was meant for, and lifting the limit needs a parent's signature.", say: "My daughter's account gets $15 a day" },
  { tag: "Family", title: "Second thoughts, built in", body: "Every outgoing payment waits a few hours, long enough to cancel one sent in a panic.", say: "Hold every payment for 6 hours" },
  { tag: "Security", title: "Destinations a thief cannot change", body: "Even with the seed phrase, an attacker can only send to the people already on your list.", say: "Only pay Priya and Halden Exchange" },
  { tag: "Security", title: "Large payments take two people", body: "Above an amount you pick, a payment waits until your co-signer adds their signature.", say: "Payments over $4,000 need an extra signature" },
  { tag: "Security", title: "No instant payouts to new addresses", body: "Clipboard malware swaps addresses and counts on speed. Two days of waiting for new payees takes that away.", say: "New payees wait 48 hours" },
  { tag: "Business", title: "A petty-cash wallet", body: "Staff can spend from it without asking, up to a weekly limit the owner sets.", say: "Spend at most $800 a week" },
  { tag: "Business", title: "Payroll with a safety margin", body: "Salaries go out on schedule but never eat into the operating reserve.", say: "Keep at least $10,000" },
  { tag: "Agents", title: "A purchasing agent on a budget", body: "The agent buys in one category and cannot exceed its weekly allowance.", say: "My agent may spend $40 a week on cloud hosting only" },
  { tag: "Agents", title: "An agent tied to one supplier", body: "It may pay the vendor you named. Any other payee is rejected.", say: "My agent can only pay Brightline Hosting" },
  { tag: "Saving", title: "A pot that opens on a date", body: "Money for a flat deposit stays put until the day you chose.", say: "Lock my savings until 1 March 2027" },
  { tag: "Saving", title: "Quiet hours for spending", body: "Nothing leaves late at night, which is when most impulse purchases happen.", say: "Pause payments between 11pm and 7am" },
  { tag: "Governance", title: "Edits need a quorum", body: "Your payee list changes only with two approvals and a week's notice.", say: "Changing rule 1 needs 2 approvals and a 7-day notice" },
  { tag: "Governance", title: "A promise made permanent", body: "Freeze a rule so that no later version of you can undo it.", say: "Freeze rule 2" },
  { tag: "Protection", title: "A travel budget that expires", body: "Holiday money that simply stops working after the trip.", say: "These funds lapse after 10 days" },
  { tag: "Protection", title: "Access for family after a long silence", body: "If the account sees no activity for a year, a relative you named can step in.", say: "After a year of silence, my brother can access this account" },
];

const TAGS = ["All", "Family", "Security", "Business", "Agents", "Saving", "Governance", "Protection"];

export function UseCases() {
  const [tag, setTag] = useState("All");
  const shown = CASES.filter((c) => tag === "All" || c.tag === tag);
  return (
    <DemoProvider>
      <section className="wrap py-[var(--section)]">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-12">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by situation">
              {TAGS.map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tag === t} onClick={() => setTag(t)} className={`rounded-[5px] border px-3 py-1.5 text-[14px] transition-colors ${tag === t ? "border-ink bg-ink text-g2" : "border-line bg-g2 text-ink-2 hover:border-ink-3"}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-6 grid gap-3">
              {shown.map((c) => (
                <article key={c.title} className="rounded-[10px] border border-line bg-g2 px-6 py-6">
                  <p className="kicker">{c.tag}</p>
                  <h2 className="h3 mt-2">{c.title}</h2>
                  <p className="copy mt-2 !text-[16px]">{c.body}</p>
                  <div className="mt-4"><TryPrompt text={c.say} /></div>
                </article>
              ))}
            </div>
          </div>
          <div className="order-first lg:order-none">
            <AccountPanel />
          </div>
        </div>
      </section>
    </DemoProvider>
  );
}
