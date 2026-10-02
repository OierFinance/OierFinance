"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BRAND, CHAIN, shortAddress } from "@/config/brand";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useWalletModal } from "@/components/wallet/WalletButton";
import { activeDrafter } from "@/lib/rules/drafter";
import { HINTS, normalizeParty } from "@/lib/rules/parse";
import { applyDraft, canonical, checkDraft, governance, label, ruleEnglish, ruleFormula, setFormula } from "@/lib/rules/logic";
import type { Draft, Finding, MetaRule, Rule, RuleSet } from "@/lib/rules/types";
import { rpc } from "@/lib/rpc";
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon, WalletIcon } from "@/components/icons";
import { sha256Hex, useRuleStore } from "./useRuleStore";
import { Simulator } from "./Simulator";

const EXAMPLES: { group: string; items: string[] }[] = [
  { group: "Payees", items: ["Only pay Priya and Halden Exchange", "Never pay Mallory", "New payees wait 48 hours"] },
  { group: "Amounts", items: ["Cap each transfer at $3,000", "Spend at most $1,200 a day", "Payments over $4,000 need an extra signature", "Keep at least $750"] },
  { group: "Timing", items: ["Pause payments between 11pm and 7am", "Hold every payment for 6 hours", "Lock my savings until 1 March 2027"] },
  { group: "Agents", items: ["My agent may spend $40 a week on cloud hosting only"] },
  { group: "Rule chains", items: ["Changing rule 1 needs 2 approvals and a 7-day notice", "Freeze rule 2"] },
];

function FindingRow({ f }: { f: Finding }) {
  const tone = f.level === "error" ? "verdict-deny" : f.level === "warn" ? "verdict-hold" : "border-line bg-ink/[0.04] text-ink-2";
  const Icon = f.level === "error" ? AlertIcon : f.level === "warn" ? AlertIcon : f.title === "Consistent" ? CheckIcon : InfoIcon;
  return (
    <li className={`flex gap-2.5 rounded-[10px] border px-3 py-2.5 ${tone}`} data-finding={f.level}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-[14px] font-medium">{f.title}</p>
        <p className="mt-0.5 text-[13px] leading-[1.5] text-ink-2">{f.detail}</p>
      </div>
    </li>
  );
}

function RuleCard({ rule, set, onRemove }: { rule: Rule; set: RuleSet; onRemove: () => void }) {
  const gate = governance(set, rule.id);
  const pending = set.pending.find((p) => p.target === rule.id);
  return (
    <li className="card p-4" data-rule={rule.id}>
      <div className="flex items-start gap-3">
        <span className={`grid h-7 min-w-9 shrink-0 place-items-center rounded-[7px] px-1.5 font-mono text-[12px] font-medium ${rule.type === "meta" ? "bg-violet/15 text-violet" : "bg-acc/15 text-acc"}`}>{rule.id}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-medium leading-[1.4]">{ruleEnglish(rule)}</p>
          <p className="formula mt-1.5">{ruleFormula(rule)}</p>
          <p className="mt-1.5 text-[12.5px] text-ink-3">“{rule.text}”</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {rule.type === "tx" && rule.scope === "agent" ? <span className="chip !min-h-6 !py-0.5 !text-[11.5px]">agent only</span> : null}
            {rule.type === "meta" ? <span className="chip !min-h-6 !py-0.5 !text-[11.5px] !text-violet">governs {(rule as MetaRule).target}</span> : null}
            {gate.frozen ? <span className="chip !min-h-6 !py-0.5 !text-[11.5px] !text-bad">frozen by {gate.by.join(", ")}</span> : gate.by.length ? <span className="chip !min-h-6 !py-0.5 !text-[11.5px] !text-hold">guarded by {gate.by.join(", ")}</span> : null}
            {pending ? <span className="chip !min-h-6 !py-0.5 !text-[11.5px] !text-hold">removal pending</span> : null}
          </div>
        </div>
        <button type="button" onClick={onRemove} aria-label={`Remove ${rule.id}`} title={`Request removal of ${rule.id}`} className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-ink-3 transition-colors hover:border-bad/50 hover:text-bad">
          <CloseIcon className="size-3.5" />
        </button>
      </div>
    </li>
  );
}

export function Studio() {
  const { address, signMessage } = useWallet();
  const { open } = useWalletModal();
  const store = useRuleStore(address);
  const { set, save } = store;

  const [text, setText] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [error, setError] = useState<{ message: string; hints: string[] } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hash, setHash] = useState("");
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [block, setBlock] = useState<number | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactAddr, setContactAddr] = useState("");

  // A rule passed in the link (from Use cases) lands in the input, not applied.
  useEffect(() => {
    const rule = new URLSearchParams(window.location.search).get("rule");
    if (rule) setText(rule.slice(0, 280));
  }, []);

  useEffect(() => {
    let live = true;
    const load = () =>
      rpc<string>("eth_blockNumber")
        .then((hex) => live && setBlock(Number.parseInt(hex, 16)))
        .catch(() => live && setBlock(null));
    load();
    const t = window.setInterval(load, 15000);
    return () => {
      live = false;
      window.clearInterval(t);
    };
  }, []);

  const canon = useMemo(() => canonical(set), [set]);
  useEffect(() => {
    let live = true;
    sha256Hex(canon).then((h) => live && setHash(h));
    return () => {
      live = false;
    };
  }, [canon]);

  const runDraft = useCallback(
    async (sentence: string) => {
      setNotice(null);
      const res = await activeDrafter.draft(sentence);
      if (!res.ok) {
        setDraft(null);
        setFindings([]);
        setError({ message: res.error, hints: res.hints });
        return;
      }
      setError(null);
      setDraft(res.draft);
      setFindings(checkDraft(set, res.draft));
    },
    [set],
  );

  // Re-check an open draft whenever the set changes underneath it.
  useEffect(() => {
    if (draft) setFindings(checkDraft(set, draft));
  }, [set, draft]);

  const blocked = findings.some((f) => f.level === "error");

  function apply() {
    if (!draft || blocked) return;
    const { set: next, outcome } = applyDraft(set, draft);
    save(next);
    setNotice(outcome);
    setDraft(null);
    setFindings([]);
    setText("");
  }

  function requestRemoval(id: string) {
    const d: Draft = { type: "remove", text: `Remove rule ${id.slice(1)}`, target: id };
    setText(d.text);
    setError(null);
    setDraft(d);
    setFindings(checkDraft(set, d));
    document.getElementById("draft-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function commit() {
    if (!address) return open();
    setSigning(true);
    setSignError(null);
    const lines = set.rules.map((r) => `${r.id}: ${ruleFormula(r)}`);
    const message = [
      `${BRAND.name} rule set commit`,
      `Account: ${address}`,
      `Network: ${CHAIN.name} (${CHAIN.id})`,
      `Rules: ${set.rules.length}`,
      `SHA-256: ${hash}`,
      ...lines,
      `Signed at: ${new Date().toISOString()}`,
      "This signature records the rule set. It is not a transaction and costs no gas.",
    ].join("\n");
    try {
      const signature = await signMessage(message);
      store.writeCommit({ hash, signature, at: Date.now(), count: set.rules.length, address });
      setNotice(`Rule set signed by ${shortAddress(address)}.`);
    } catch (e) {
      setSignError(e instanceof Error ? e.message : "The wallet did not sign.");
    } finally {
      setSigning(false);
    }
  }

  const committed = store.commit && store.commit.hash === hash;
  const parties = useMemo(() => {
    const names = new Set<string>(Object.keys(set.contacts));
    for (const r of set.rules) if (r.type === "tx") for (const c of r.clauses) if (c.k === "allowTo" || c.k === "blockTo") c.parties.filter((p) => p !== "@contacts").forEach((p) => names.add(p));
    return [...names];
  }, [set]);

  function addContact() {
    const name = normalizeParty(contactName.trim());
    if (!name || name.startsWith("0x")) return;
    const addr = contactAddr.trim();
    if (addr && !/^0x[0-9a-fA-F]{40}$/.test(addr)) return;
    save({ ...set, contacts: { ...set.contacts, [name]: addr.toLowerCase() } });
    setContactName("");
    setContactAddr("");
  }

  const guestCount = store.guest.rules.length;
  const showMigrate = address && set.rules.length === 0 && guestCount > 0;

  return (
    <div className="wrap pb-24 pt-12 font-sans sm:pt-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[640px]">
          <h1 className="h1">Rule Studio</h1>
          <p className="lead mt-5">Type an instruction in plain English. Oier converts it into logic, compares it with every rule you already hold, and adds it only if nothing clashes. Then test transfers against the result.</p>
        </div>
        <div className="card flex min-w-0 flex-col gap-1.5 p-4 text-[14px] lg:w-[360px]" data-store-owner>
          <p className="label">Rules stored for</p>
          {address ? (
            <p className="truncate font-mono text-[13px] text-ink">{shortAddress(address, 8, 6)}</p>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-ink-2">Guest draft in this browser</p>
              <button type="button" onClick={open} className="btn btn-sm btn-acc">
                <WalletIcon className="size-4" /> Connect
              </button>
            </div>
          )}
          <p className="text-ink-3">
            {CHAIN.name}, block <span className="num text-ink-2" data-block>{block === null ? "…" : `#${block.toLocaleString("en-US")}`}</span>
          </p>
        </div>
      </div>

      {showMigrate ? (
        <div className="card-hi mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-ink-2">You have {guestCount} rule{guestCount > 1 ? "s" : ""} drafted as a guest in this browser.</p>
          <button type="button" className="btn btn-sm btn-acc" onClick={() => save(store.guest)}>
            Move them to this wallet
          </button>
        </div>
      ) : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* Left: write, draft, check */}
        <section className="min-w-0" aria-labelledby="write-title">
          <div className="card-hi p-4 sm:p-5">
            <h2 id="write-title" className="text-[15px] font-semibold">1. Write a rule</h2>
            <form
              className="mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                void runDraft(text);
              }}
            >
              <textarea
                className="field min-h-[92px] text-[15.5px]"
                value={text}
                maxLength={280}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void runDraft(text);
                  }
                }}
                placeholder="For example: Only pay Priya and Halden Exchange"
                aria-label="Rule in plain English"
                data-rule-input
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12.5px] text-ink-3">Drafter: {activeDrafter.name}. No key needed, same answer every time.</p>
                <button type="submit" className="btn btn-sm btn-acc" disabled={!text.trim()} data-draft>
                  Draft and check
                </button>
              </div>
            </form>
            <div className="mt-5 grid gap-3">
              {EXAMPLES.map((g) => (
                <div key={g.group}>
                  <p className="label">{g.group}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {g.items.map((s) => (
                      <button key={s} type="button" className="chip" onClick={() => { setText(s); void runDraft(s); }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="draft-panel" className="card mt-4 p-4 sm:p-5" aria-live="polite">
            <h2 className="text-[15px] font-semibold">2. Draft and check</h2>
            {error ? (
              <div className="mt-3" data-parse-error>
                <p className="flex gap-2 text-[14px] text-bad"><AlertIcon className="mt-0.5 size-4 shrink-0" />{error.message}</p>
                {error.hints.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {error.hints.slice(0, 6).map((h) => (
                      <button key={h} type="button" className="chip" onClick={() => { setText(h); void runDraft(h); }}>{h}</button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : draft ? (
              <div className="mt-3" data-draft-open>
                <p className="text-[16px] font-medium leading-[1.4]">{ruleEnglish(draft)}</p>
                <div className="mt-3 rounded-[10px] border border-line bg-g1 px-3 py-2.5">
                  <p className="label">As logic</p>
                  <p className="formula mt-1" data-draft-formula>{draft.type === "tx" ? `R${set.next}(tx) ≡ ${ruleFormula(draft)}` : ruleFormula(draft)}</p>
                </div>
                <ul className="mt-3 grid gap-2">{findings.map((f, i) => <FindingRow key={i} f={f} />)}</ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="btn btn-sm btn-acc" disabled={blocked} onClick={apply} data-apply>
                    {blocked ? "Refused: inconsistent" : draft.type === "remove" ? (findings[0]?.level === "warn" ? "Queue the removal" : "Remove") : "Apply rule"}
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setDraft(null); setFindings([]); }}>
                    Discard
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-[14px] text-ink-3">{notice ?? "Nothing drafted yet. A rule is applied whole after the check, or not at all."}</p>
            )}
          </div>
        </section>

        {/* Right: the set */}
        <section className="min-w-0" aria-labelledby="set-title">
          <div className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="set-title" className="text-[15px] font-semibold">3. Your rule set ({set.rules.length})</h2>
              <span className={`chip !min-h-6 !text-[11.5px] ${set.rules.length === 0 ? "" : committed ? "!text-ok" : "!text-hold"}`} data-commit-state>
                {set.rules.length === 0 ? "empty" : committed ? "signed" : "unsigned changes"}
              </span>
            </div>
            <p className="formula mt-3 rounded-[10px] border border-line bg-g1 px-3 py-2.5" data-set-formula>{setFormula(set)}</p>
            {set.rules.length ? (
              <ul className="mt-3 grid gap-2">
                {set.rules.map((r) => <RuleCard key={r.id} rule={r} set={set} onRemove={() => requestRemoval(r.id)} />)}
              </ul>
            ) : (
              <p className="mt-4 text-[14px] text-ink-3">No rules yet. With an empty set, every transfer passes, the way an ordinary wallet behaves.</p>
            )}
            {set.pending.length ? (
              <div className="mt-4 rounded-[12px] border border-hold/30 bg-hold/5 p-3">
                <p className="label !text-hold">Amendments waiting</p>
                <ul className="mt-2 grid gap-2">
                  {set.pending.map((p) => {
                    const ends = p.requestedAt + p.noticeDays * 86_400_000;
                    return (
                      <li key={p.target} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                        <span className="text-ink-2">
                          Remove {p.target} · approvals 0/{p.approvals}
                          {p.noticeDays ? ` · notice ends ${new Date(ends).toISOString().slice(0, 10)}` : ""}
                        </span>
                        <button type="button" className="text-ink-3 underline-offset-2 hover:text-ink hover:underline" onClick={() => save({ ...set, pending: set.pending.filter((x) => x !== p) })}>
                          Withdraw
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[12px] text-ink-3">Co-signer approvals are collected from their own wallets once accounts open. In the preview the rule stays in force.</p>
              </div>
            ) : null}
            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 text-[12.5px] text-ink-3">
                SHA-256 <span className="font-mono text-ink-2">{hash ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : "…"}</span>
                {store.commit ? <> · last signed {new Date(store.commit.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</> : null}
              </p>
              <button type="button" className="btn btn-sm btn-ghost shrink-0" onClick={commit} disabled={signing || set.rules.length === 0 || Boolean(committed)} data-commit>
                {signing ? "Confirm in wallet…" : committed ? "Signed" : address ? "Sign rule set (no gas)" : "Connect to sign"}
              </button>
            </div>
            {signError ? <p className="mt-2 text-[12.5px] text-bad">{signError}</p> : null}
          </div>

          <Simulator set={set} parties={parties} ledger={store.ledger} record={store.record} clearLedger={store.clearLedger} />

          <div className="card mt-4 p-4 sm:p-5">
            <h2 className="text-[15px] font-semibold">Address book</h2>
            <p className="mt-2 text-[13px] text-ink-3">Names in rules work without addresses. Add one to resolve pasted addresses to a name, or to fill “addresses I’ve approved”.</p>
            <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]" onSubmit={(e) => { e.preventDefault(); addContact(); }}>
              <input className="field" placeholder="Name, for example Priya" value={contactName} onChange={(e) => setContactName(e.target.value)} aria-label="Contact name" />
              <input className="field font-mono !text-[12.5px]" placeholder="0x… (optional)" value={contactAddr} onChange={(e) => setContactAddr(e.target.value)} aria-label="Contact address" />
              <button type="submit" className="btn btn-sm btn-ghost !h-[42px]">Add</button>
            </form>
            {Object.keys(set.contacts).length ? (
              <ul className="mt-3 grid gap-1.5">
                {Object.entries(set.contacts).map(([n, a]) => (
                  <li key={n} className="flex items-center justify-between gap-3 text-[13.5px]">
                    <span className="min-w-0 truncate"><span className="text-ink">{label(n)}</span> <span className="font-mono text-[12px] text-ink-3">{a ? shortAddress(a) : "no address"}</span></span>
                    <button type="button" className="text-ink-3 hover:text-bad" aria-label={`Delete ${n}`} onClick={() => { const c = { ...set.contacts }; delete c[n]; save({ ...set, contacts: c }); }}>
                      <CloseIcon className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      </div>

      <p className="mt-10 max-w-[760px] text-[13px] leading-[1.6] text-ink-3">
        Preview: rules are drafted, checked and simulated in your browser and stored on this device under your address. Signing records the set; it does not move funds or deploy anything. Enforcement by an on-chain account on {CHAIN.name} is the next release. Try: {HINTS[10]}.
      </p>
    </div>
  );
}
