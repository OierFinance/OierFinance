import type { Metadata } from "next";
import { BRAND, CHAIN, TOKEN, explorerToken, shortAddress } from "@/config/brand";
import { batch } from "@/lib/chain-server";
import { CaStrip } from "@/components/CopyCa";
import { TermsComposer } from "@/components/pages/TermsComposer";
import { CtaBand, NightHero } from "@/components/site/parts";

export const metadata: Metadata = {
  title: "Token",
  description: `${BRAND.symbol} is money you can program: attach a spend rate, allowed purchases, a return date and an expiry to a payment.`,
};

export const revalidate = 300;

/** Total supply read from the token contract; null before launch or when the chain cannot be read. */
async function totalSupply(): Promise<string | null> {
  if (!TOKEN.isLive) return null;
  try {
    const [supply, decimals] = await batch([
      { method: "eth_call", params: [{ to: BRAND.ca, data: "0x18160ddd" }, "latest"] },
      { method: "eth_call", params: [{ to: BRAND.ca, data: "0x313ce567" }, "latest"] },
    ]);
    if (typeof supply !== "string") return null;
    const d = typeof decimals === "string" ? Number(BigInt(decimals)) : 18;
    return (BigInt(supply) / 10n ** BigInt(d)).toLocaleString("en-US");
  } catch {
    return null;
  }
}

const CHAPTERS = [
  { kicker: "Spending scope", title: "Pin money to its purpose", body: "A grocery allowance that refuses everything except groceries. Saturday-only spending money for a child. A travel budget valid in one city. The condition is part of the payment, so nobody has to police it afterwards." },
  { kicker: "Lifetime", title: "Payments that run out", body: "Set a date and the unused part returns to you, passes to someone else, or is retired. Useful for gifts, grants and trial budgets you would otherwise have to chase." },
  { kicker: "Purpose", title: "Single-use money", body: "Funds raised for a roof repair can only pay roofers. A scholarship only reaches tuition. Donors get certainty without asking the recipient for receipts." },
  { kicker: "Tamper resistance", title: "Conditions that outlast second thoughts", body: "Before accepting, a recipient can read every condition. A guarding rule decides whether those conditions may be relaxed later, by whom, and after how much notice." },
  { kicker: "Milestones", title: "Release in stages", body: "Send the whole amount now and let it open in parts: the deposit when the lease is signed, the remainder when the keys change hands." },
  { kicker: "Reach", title: "Choose how far conditions follow the money", body: "Normally the conditions stop with your recipient, and whoever they pay gets unconditional funds. You can extend them one more step, or for good." },
  { kicker: "Governance", title: "Holders set the economics", body: `Supply and fees are intended to be decided by ${BRAND.symbol} holders, through the same propose-then-check process that governs every other rule.` },
];

const EARLY = [
  ["Assistant credit", "Prepaid drafting and checking once a language model is added in front of the grammar."],
  ["Reserved handles", "Pick a short account name before general sign-up opens."],
  ["Template slots", "Publish rule templates for other people ahead of the public release."],
  ["Attribution", "People who contribute rule building blocks are credited in the documentation."],
];

export default async function TokenPage() {
  const supply = await totalSupply();
  const FACTS: [string, string][] = [
    ["Ticker", BRAND.symbol],
    ["Network", CHAIN.name],
    ["Total supply", TOKEN.isLive ? supply ?? "Unavailable right now" : "Published at launch"],
    ["Contract", TOKEN.isLive ? shortAddress(BRAND.ca, 6, 4) : "Published at launch"],
  ];
  return (
    <>
      <NightHero
        title="A currency with conditions"
        lead={`${BRAND.symbol} lets a sender decide what a payment may be used for, how quickly, and for how long. The recipient sees every condition before accepting.`}
        actions={<a href="#contract" className="btn btn-acc">Contract address</a>}
        aside={
          <dl className="border-t border-line font-sans">
            {FACTS.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-6 border-b border-line py-4">
                <dt className="text-[14.5px] text-ink-3">{k}</dt>
                <dd className={`text-right text-[16px] ${v.startsWith("$") ? "font-mono text-acc" : "text-ink"}`}>{v}</dd>
              </div>
            ))}
          </dl>
        }
      />

      <section id="contract" className="wrap scroll-mt-[76px] pt-[var(--section)]">
        <div className="night night-bg grid grid-cols-1 gap-8 rounded-[12px] px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <h2 className="h2">{TOKEN.isLive ? "The one address" : "Where the address will appear"}</h2>
            {TOKEN.isLive ? (
              <>
                <p className="mt-4 max-w-[30em] font-serif text-[17px] leading-[1.6] text-ink-2">
                  This is the only {BRAND.symbol} contract. It is also in the footer of every page. Any other token using the name is not ours.
                </p>
                <p className="mt-3 max-w-[30em] font-serif text-[15px] leading-[1.6] text-ink-3">
                  Today {BRAND.symbol} is a standard token. The payment conditions described below are the design and are not built into the token yet. Transfer rules on your own money already run on chain through Oier accounts.
                </p>
                <a href={explorerToken(BRAND.ca)} target="_blank" rel="noreferrer" className="mt-5 inline-block text-[14.5px] text-acc underline underline-offset-2">
                  View on {CHAIN.explorerName}
                </a>
              </>
            ) : (
              <p className="mt-4 max-w-[30em] font-serif text-[17px] leading-[1.6] text-ink-2">
                There is no {BRAND.symbol} contract yet and no market for it. The real address will be published on this page and in the footer, with a copy button. Ignore any address that circulates before then.
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <CaStrip />
            <p className="text-[13.5px] text-ink-3">{CHAIN.name}, chain id {CHAIN.id}</p>
          </div>
        </div>
      </section>

      <section className="wrap py-[var(--section)]">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-12">
          <div className="grid grid-cols-1 gap-4">
            {CHAPTERS.map((c, i) => (
              <article key={c.title} className={`rounded-[10px] border px-6 py-7 sm:px-8 sm:py-9 ${i % 3 === 0 ? "night night-bg border-transparent" : "border-line bg-g2"}`}>
                <p className="kicker">{c.kicker}</p>
                <h2 className="h2 mt-3 max-w-[14em]">{c.title}</h2>
                <p className="copy mt-4 max-w-[34em]">{c.body}</p>
              </article>
            ))}
          </div>
          <div className="order-first lg:order-none">
            <TermsComposer />
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-g2">
        <div className="wrap grid grid-cols-1 gap-10 py-[var(--section)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <h2 className="h2">Planned perks for early holders</h2>
            <p className="copy mt-4">Nothing here is live and none of it implies the token will be worth anything. These are intentions for people who hold {BRAND.symbol} before the full release, and they may change.</p>
          </div>
          <dl className="grid border-t border-line">
            {EARLY.map(([k, v]) => (
              <div key={k} className="grid grid-cols-1 gap-1 border-b border-line py-5 sm:grid-cols-[200px_1fr] sm:gap-6">
                <dt className="text-[16px] font-semibold">{k}</dt>
                <dd className="font-serif text-[16.5px] leading-[1.6] text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
