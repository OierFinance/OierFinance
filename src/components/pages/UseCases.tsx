"use client";

import { useState } from "react";
import { AccountPanel, DemoProvider, TryPrompt } from "@/components/demo/AccountPanel";

type Case = { tag: string; title: string; body: string; say: string };

const CASES: Case[] = [
  { tag: "Family", title: "A parent's account a scam call cannot move", body: "A persuasive caller can talk someone into sending money. They cannot talk past a recipient list that was set weeks ago.", say: "Make it so my mom's wallet can only send funds to the grandkids" },
  { tag: "Family", title: "A first account with a daily ceiling", body: "Spend freely under the line; past it, the account declines. The line moves only when the parent agrees.", say: "Make it so my kid's account can spend $10 per day max" },
  { tag: "Family", title: "A window to take back a hurried payment", body: "Transfers settle after a delay instead of instantly, so a wrong address or a pressured payment can be recalled.", say: "Allow me to recall a transaction within 8 hours" },
  { tag: "Security", title: "A stolen key that still cannot drain the account", body: "The key signs, the rules settle. Whoever holds the phone still meets the recipient list.", say: "Only let this account send to addresses I've approved" },
  { tag: "Security", title: "Two signatures above a line you choose", body: "Small payments go through as usual. Large ones wait for a second person to approve from their own device.", say: "Anything over $5,000 should need my wife's approval as well" },
  { tag: "Security", title: "New recipients cool off first", body: "A freshly pasted address cannot be paid on the spot. A day of waiting defeats most address-swap tricks.", say: "New addresses wait 24 hours" },
  { tag: "Business", title: "A contractor wallet with a hard ceiling", body: "Give someone a working budget inside a limit they cannot lift. The ceiling belongs to the account, not to whoever spends.", say: "Cap weekly spending at $1,000" },
  { tag: "Business", title: "Payroll that never overdraws", body: "Scheduled payouts with a floor underneath. If a run would cut into the reserve, it stops.", say: "Never go below a $5,000 reserve" },
  { tag: "Agents", title: "An AI agent on a budget", body: "The agent gets payment rules, not keys: what it may buy, how much and how often.", say: "Let my research agent pay for API credits only, up to $50 a week" },
  { tag: "Agents", title: "One merchant, nothing else", body: "A permission that names a single payee. Point it anywhere else and it stops matching.", say: "My agent can only pay Acme Hosting" },
  { tag: "Saving", title: "Savings that are hard to raid", body: "Lock a pot until a date. It stays visible and untouchable, including to you on a bad day.", say: "Lock the funds until 1 June 2027" },
  { tag: "Saving", title: "Nothing leaves while you sleep", body: "Late-night transfers wait until morning, which is when most regrettable ones would have been reconsidered.", say: "Block transactions overnight" },
  { tag: "Governance", title: "A rule that guards a rule", body: "Changing your recipient list takes three approvals and a month of notice that everyone can see.", say: "Changing rule 1 needs 3 approvals and a 30-day notice" },
  { tag: "Governance", title: "A rule even you cannot remove", body: "Some promises are worth making permanent. A frozen rule refuses every amendment.", say: "Rule 2 can never be removed" },
  { tag: "Protection", title: "A limit someone asked you to hold", body: "A friend in a rough patch can hand you a cap they cannot lift themselves, with an end date built in.", say: "Limit my brother's account to $10 a day for the next week" },
  { tag: "Protection", title: "A backup key that wakes only if you go quiet", body: "A trusted person's key does nothing while you are active and becomes usable after a long silence.", say: "Let my sister's backup key work only after 6 months of no activity" },
  { tag: "Protection", title: "Roll the rules back to a date", body: "Return the whole set to how it stood on a given day, through the same approvals as any other amendment.", say: "Restore my rules to how they were on 1 August" },
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
