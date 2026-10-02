import Link from "next/link";
import { AccountPanel, DemoProvider, TryPrompt } from "@/components/demo/AccountPanel";

/** Dark opening band used at the top of every long page. */
export function NightHero({ title, lead, sub, actions, aside }: { title: React.ReactNode; lead?: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="night night-bg">
      <div className={`wrap grid grid-cols-1 gap-12 pb-16 pt-16 sm:pb-24 sm:pt-24 ${aside ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center" : ""}`}>
        <div className="max-w-[640px]">
          <h1 className="display">{title}</h1>
          {lead ? <p className="mt-7 max-w-[520px] font-sans text-[19px] leading-[1.5] text-ink">{lead}</p> : null}
          {sub ? <p className="mt-4 max-w-[520px] font-serif text-[17px] leading-[1.6] text-ink-2">{sub}</p> : null}
          {actions ? <div className="mt-9 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {aside ? <div className="min-w-0">{aside}</div> : null}
      </div>
    </section>
  );
}

export type Story = { id?: string; kicker: string; title: string; body: React.ReactNode; prompts?: string[]; dark?: boolean; extra?: React.ReactNode };

/** One chapter of a long page: a short heading, a paragraph, and sentences to run. */
export function StoryBlock({ s }: { s: Story }) {
  return (
    <article id={s.id} className={`scroll-mt-[84px] rounded-[10px] border px-6 py-7 sm:px-8 sm:py-9 ${s.dark ? "night night-bg border-transparent" : "border-line bg-g2"}`}>
      <p className="kicker">{s.kicker}</p>
      <h2 className="h2 mt-3 max-w-[15em]">{s.title}</h2>
      <div className="copy mt-4 max-w-[34em]">{s.body}</div>
      {s.prompts?.length ? (
        <div className="mt-6 flex flex-col items-start gap-2">
          {s.prompts.map((p) => <TryPrompt key={p} text={p} />)}
        </div>
      ) : null}
      {s.extra}
    </article>
  );
}

/** Long chapters on the left, the live account panel held on the right. */
export function StoryWithPanel({ stories, heading, intro }: { stories: Story[]; heading?: string; intro?: React.ReactNode }) {
  return (
    <DemoProvider>
      <section className="wrap py-[var(--section)]">
        {intro}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-12">
          <div className="grid grid-cols-1 gap-4">
            {stories.map((s) => <StoryBlock key={s.title} s={s} />)}
          </div>
          <div className="order-first lg:order-none">
            <AccountPanel heading={heading} />
          </div>
        </div>
      </section>
    </DemoProvider>
  );
}

export function CtaBand({ title = "Be among the first to set a rule", body = "Early accounts open in small groups, so each one comes with a real conversation about the rules you need." }: { title?: string; body?: string }) {
  return (
    <section className="wrap pb-[var(--section)]">
      <div className="grid grid-cols-1 gap-6 border-t border-ink pt-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-[640px]">
          <h2 className="h2">{title}</h2>
          <p className="copy mt-4">{body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/waitlist" className="btn btn-acc">Join the waitlist</Link>
          <Link href="/studio" className="btn btn-ghost">Write a rule now</Link>
        </div>
      </div>
    </section>
  );
}
