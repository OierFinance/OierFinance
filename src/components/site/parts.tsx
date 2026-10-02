import Link from "next/link";
import { parseRule } from "@/lib/rules/parse";
import { ArrowRight } from "@/components/icons";

export function PageHero({ tag, title, lead, children }: { tag: string; title: React.ReactNode; lead?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div aria-hidden className="dots absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="wrap relative pb-16 pt-14 sm:pb-20 sm:pt-20">
        <p className="tag">{tag}</p>
        <h1 className="h1 mt-5 max-w-[900px]">{title}</h1>
        {lead ? <p className="lead mt-6 max-w-[680px]">{lead}</p> : null}
        {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </section>
  );
}

export function SectionHead({ tag, title, lead, id }: { tag: string; title: React.ReactNode; lead?: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="max-w-[760px]">
      <p className="tag">{tag}</p>
      <h2 className="h2 mt-4">{title}</h2>
      {lead ? <p className="lead mt-4">{lead}</p> : null}
    </div>
  );
}

/** A sample sentence. Opens it in the Rule Studio when the drafter can read it; otherwise marked as planned. */
export function Prompt({ text }: { text: string }) {
  const readable = parseRule(text).ok;
  if (!readable)
    return (
      <span className="chip cursor-default opacity-80" title="Not in the preview grammar yet">
        {text} <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">planned</span>
      </span>
    );
  return (
    <Link href={`/studio?rule=${encodeURIComponent(text)}`} className="chip">
      <span className="size-1.5 shrink-0 rounded-full bg-acc" />
      {text}
    </Link>
  );
}

export function NumberedCard({ n, kicker, title, body, prompts, status }: { n: string; kicker: string; title: string; body: string; prompts?: string[]; status?: "planned" | "preview" }) {
  return (
    <article className="card flex flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[12px] text-ink-3">
          {n} · <span className="uppercase tracking-[0.1em]">{kicker}</span>
        </p>
        {status ? <span className={`chip !min-h-6 !py-0 !text-[11px] ${status === "preview" ? "!text-acc" : ""}`}>{status === "preview" ? "in preview" : "planned"}</span> : null}
      </div>
      <h3 className="h3 mt-4">{title}</h3>
      <p className="mt-3 text-[15px] leading-[1.6] text-ink-2">{body}</p>
      {prompts?.length ? (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
          {prompts.map((p) => <Prompt key={p} text={p} />)}
        </div>
      ) : null}
    </article>
  );
}

export function CtaBand({ title = "Get a seat before accounts open", body = "Early accounts open in small groups. Join the list and write your first rule in the studio while you wait." }: { title?: string; body?: string }) {
  return (
    <section className="wrap section">
      <div className="card-hi relative overflow-hidden p-7 sm:p-12">
        <div aria-hidden className="dots absolute inset-0 opacity-60" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[620px]">
            <h2 className="h2">{title}</h2>
            <p className="lead mt-4">{body}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/waitlist" className="btn btn-acc">Join early access <ArrowRight className="size-4" /></Link>
            <Link href="/studio" className="btn btn-ghost">Open Rule Studio</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
