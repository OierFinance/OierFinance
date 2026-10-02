"use client";

import { useEffect, useState } from "react";
import { formatUnits, parseUnits, type Hex } from "viem";
import { CHAIN, isAddress, shortAddress } from "@/config/brand";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useRuleStore } from "@/components/studio/useRuleStore";
import { keyName } from "@/lib/compile";
import { ASSETS, CHANGE_STATUS, DENY_TEXT, TRANSFER_STATUS, accountAbi, assetBy, duration, encodeAccount, read, readMany, type Change, type Transfer } from "@/lib/oier";
import { AccountShell, Note, Section, TxMessage } from "./Shell";
import { useAccount, useTx } from "./useAccount";

const when = (ts: number) => new Date(ts * 1000).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export function SendPage() {
  const acc = useAccount();
  const { address } = useWallet();
  const store = useRuleStore(address);
  const [asset, setAsset] = useState<string>(ASSETS[0].address);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("25");
  const [pre, setPre] = useState<{ code: number; executeAfter: number; needsCosign: boolean } | null>(null);
  const { run, busy, message } = useTx();

  const meta = assetBy(asset)!;
  const resolved = isAddress(to) ? to : store.set.contacts[to.trim().toLowerCase()] || "";
  let raw = 0n;
  try {
    raw = amount ? parseUnits(amount, meta.decimals) : 0n;
  } catch {
    raw = 0n;
  }

  useEffect(() => {
    if (!acc.account || !acc.exists || !isAddress(resolved) || raw <= 0n) {
      setPre(null);
      return;
    }
    let live = true;
    const t = window.setTimeout(() => {
      read<readonly [number, bigint, boolean]>(accountAbi, acc.account!, "check", [asset, resolved, raw])
        .then(([code, after, cos]) => live && setPre({ code: Number(code), executeAfter: Number(after), needsCosign: cos }))
        .catch(() => live && setPre(null));
    }, 300);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [acc.account, acc.exists, asset, resolved, raw, acc.state?.transferCount]);

  const contacts = Object.entries(store.set.contacts).filter(([, a]) => a);

  return (
    <AccountShell acc={acc} title="Send">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Section title="Propose a transfer">
          <form
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!isAddress(resolved) || raw <= 0n) return;
              run("Transfer proposed", { to: acc.account!, data: encodeAccount("propose", [asset, resolved, raw]) }, acc.refresh);
            }}
          >
            <label className="grid gap-1 text-[13.5px] text-ink-3 sm:col-span-2">
              Pay to (0x address or a name from your studio address book)
              <input className="field font-mono !text-[13.5px]" list="send-contacts" value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x…" data-send-to />
              <datalist id="send-contacts">{contacts.map(([n]) => <option key={n} value={n} />)}</datalist>
              {to && !isAddress(to) ? <span className="text-[12.5px]">{resolved ? `Resolves to ${shortAddress(resolved)}` : "Not an address, and not a name with an address."}</span> : null}
            </label>
            <label className="grid gap-1 text-[13.5px] text-ink-3">
              Asset
              <select className="field" value={asset} onChange={(e) => setAsset(e.target.value)} data-send-asset>
                {ASSETS.map((a) => <option key={a.address} value={a.address}>{a.symbol}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-[13.5px] text-ink-3">
              Amount
              <input className="field num" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" data-send-amount />
            </label>
            <div className="sm:col-span-2">
              {pre ? (
                <p className={`rounded-[6px] border px-3 py-2.5 text-[14.5px] verdict-${pre.code ? "deny" : pre.needsCosign || pre.executeAfter > (acc.now || 0) + 60 ? "hold" : "allow"}`} data-precheck={pre.code ? "deny" : "ok"}>
                  {pre.code
                    ? `The account will refuse this: ${DENY_TEXT[pre.code] ?? `code ${pre.code}`}.`
                    : `Allowed. It can be sent from ${when(pre.executeAfter)}${pre.needsCosign ? " once a co-signer approves" : ""}. Until then you, a co-signer or a guardian can recall it.`}
                </p>
              ) : (
                <p className="text-[14px] text-ink-3">The account&apos;s own check() runs here as you type.</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <button className="btn btn-acc" disabled={Boolean(busy) || !acc.role.owner || !pre || pre.code !== 0} data-propose>
                {busy ? "Confirm in wallet…" : "Propose transfer"}
              </button>
              {!acc.role.owner ? <p className="mt-2 text-[13px] text-ink-3">Only the owner can propose transfers.</p> : null}
              <TxMessage message={message} />
            </div>
          </form>
        </Section>
        <Section title="How sending works">
          <ol className="grid gap-3 font-serif text-[16px] leading-[1.55] text-ink-2">
            <li>1. You propose. The contract checks payee, caps and blocklist, and counts the amount against the caps straight away.</li>
            <li>2. It waits for the settlement delay, any new-payee cooldown, the lock date and quiet hours, and for co-signer approval if the amount is above the line.</li>
            <li>3. Then anyone can press send. Until that moment, you, a co-signer or a guardian can recall it, and the caps are refunded.</li>
          </ol>
          <p className="mt-4 text-[13px] text-ink-3">Gas is paid in ETH on {CHAIN.name} by whoever sends each transaction.</p>
        </Section>
      </div>
    </AccountShell>
  );
}

export function QueuePage() {
  const acc = useAccount();
  const { signTypedData, address } = useWallet();
  const [transfers, setTransfers] = useState<(Transfer & { id: number })[]>([]);
  const [changes, setChanges] = useState<(Change & { id: number })[]>([]);
  const [sigFor, setSigFor] = useState<{ id: number; cosigner: string; sig: string } | null>(null);
  const [pasted, setPasted] = useState("");
  const { run, busy, message, setMessage } = useTx();

  const tc = acc.state?.transferCount ?? 0;
  const cc = acc.state?.changeCount ?? 0;
  useEffect(() => {
    if (!acc.account || !acc.exists) return;
    let live = true;
    const ids = Array.from({ length: Math.min(tc, 20) }, (_, i) => tc - 1 - i);
    const cids = Array.from({ length: Math.min(cc, 20) }, (_, i) => cc - 1 - i);
    readMany([...ids.map((id) => ({ abi: accountAbi, to: acc.account!, fn: "transferAt", args: [BigInt(id)] })), ...cids.map((id) => ({ abi: accountAbi, to: acc.account!, fn: "changeAt", args: [BigInt(id)] }))])
      .then((r) => {
        if (!live) return;
        setTransfers(ids.map((id, i) => ({ ...(r[i] as Transfer), id })).filter((t) => t.asset !== undefined));
        setChanges(cids.map((id, i) => ({ ...(r[ids.length + i] as Change), id })).filter((c) => c.key !== undefined));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [acc.account, acc.exists, tc, cc, acc.state]);

  const now = acc.now || Math.floor(Date.now() / 1000);
  const canRecall = acc.role.owner || acc.role.cosigner || acc.role.guardian;

  async function signApproval(t: Transfer & { id: number }) {
    try {
      const sig = await signTypedData({
        types: {
          EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
          ApproveTransfer: [
            { name: "id", type: "uint256" },
            { name: "asset", type: "address" },
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
          ],
        },
        primaryType: "ApproveTransfer",
        domain: { name: "OierAccount", version: "1", chainId: CHAIN.id, verifyingContract: acc.account },
        message: { id: t.id, asset: t.asset, to: t.to, amount: t.amount.toString() },
      });
      setSigFor({ id: t.id, cosigner: address!, sig });
    } catch (e) {
      setMessage({ tone: "bad", text: e instanceof Error ? e.message : "The wallet did not sign." });
    }
  }

  return (
    <AccountShell acc={acc} title="Queue">
      <Section title="Transfers" aside={<span className="text-[13px] text-ink-3">Latest 20 · chain time {when(now)}</span>}>
        {transfers.length === 0 ? <p className="text-[14.5px] text-ink-3">No transfers proposed yet.</p> : null}
        <ul className="grid gap-2">
          {transfers.map((t) => {
            const a = assetBy(t.asset);
            const due = Number(t.executeAfter) <= now;
            const pending = t.status === 0;
            return (
              <li key={t.id} className="grid gap-3 rounded-[8px] border border-line p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" data-transfer={t.id} data-status={TRANSFER_STATUS[t.status]}>
                <div className="min-w-0">
                  <p className="text-[15px]">
                    <span className="font-mono text-[12.5px] text-ink-3">#{t.id}</span> {formatUnits(t.amount, a?.decimals ?? 18)} {a?.symbol ?? shortAddress(t.asset)} to <span className="font-mono text-[13px]">{shortAddress(t.to, 8, 6)}</span>
                  </p>
                  <p className="mt-1 text-[13.5px] text-ink-3">
                    {TRANSFER_STATUS[t.status]}
                    {pending ? ` · ${due ? "due now" : `due ${when(Number(t.executeAfter))} (in ${duration(Number(t.executeAfter) - now)})`}` : ""}
                    {t.needsCosign ? ` · approvals ${t.approvals}/${acc.state?.cosignRequired ?? 0}` : ""}
                  </p>
                </div>
                {pending ? (
                  <div className="flex flex-wrap gap-2">
                    {acc.role.cosigner && t.needsCosign ? (
                      <>
                        <button className="btn btn-sm btn-ghost" disabled={Boolean(busy)} onClick={() => run(`Approved #${t.id}`, { to: acc.account!, data: encodeAccount("approveTransfer", [BigInt(t.id)]) }, acc.refresh)} data-approve>Approve</button>
                        <button className="btn btn-sm btn-ghost" disabled={Boolean(busy)} onClick={() => signApproval(t)}>Sign approval (no gas)</button>
                      </>
                    ) : null}
                    <button className="btn btn-sm btn-acc" disabled={Boolean(busy) || !due} onClick={() => run(`Sent #${t.id}`, { to: acc.account!, data: encodeAccount("execute", [BigInt(t.id)]) }, acc.refresh)} data-execute>Send now</button>
                    {canRecall ? <button className="btn btn-sm btn-ghost !text-bad" disabled={Boolean(busy)} onClick={() => run(`Recalled #${t.id}`, { to: acc.account!, data: encodeAccount("cancelTransfer", [BigInt(t.id)]) }, acc.refresh)} data-recall>Recall</button> : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        {sigFor ? (
          <div className="mt-4"><Note>Signed approval for #{sigFor.id}. Send this to the owner, or submit it here: <span className="break-all font-mono text-[12px]">{sigFor.sig}</span></Note></div>
        ) : null}
        <form
          className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[90px_minmax(0,1fr)_minmax(0,1fr)_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            const [id, cos, sig] = pasted.split(/\s+/);
            if (!id || !isAddress(cos ?? "") || !sig) return setMessage({ tone: "bad", text: "Paste: transfer id, co-signer address and signature, separated by spaces." });
            run(`Approval submitted for #${id}`, { to: acc.account!, data: encodeAccount("approveTransferWithSig", [BigInt(id), cos, sig as Hex]) }, acc.refresh);
          }}
        >
          <p className="self-center text-[13.5px] text-ink-3 sm:col-span-4">Submit a co-signer&apos;s signed approval (id, co-signer, signature):</p>
          <input className="field font-mono !text-[12.5px] sm:col-span-3" value={pasted || (sigFor ? `${sigFor.id} ${sigFor.cosigner} ${sigFor.sig}` : "")} onChange={(e) => setPasted(e.target.value)} placeholder="3 0xCoSigner… 0xSignature…" />
          <button className="btn btn-sm btn-ghost !h-10" disabled={Boolean(busy)}>Submit</button>
        </form>
        <TxMessage message={message} />
      </Section>

      <Section title="Rule changes waiting">
        {changes.length === 0 ? <p className="text-[14.5px] text-ink-3">No rule changes have been queued. Tightening applies at once and never appears here.</p> : null}
        <ul className="grid gap-2">
          {changes.map((c) => {
            const ready = Number(c.readyAt) <= now;
            return (
              <li key={c.id} className="grid gap-3 rounded-[8px] border border-line p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" data-change={c.id} data-status={CHANGE_STATUS[c.status]}>
                <div className="min-w-0">
                  <p className="text-[15px]"><span className="font-mono text-[12.5px] text-ink-3">#{c.id}</span> Loosens: {keyName(c.key)}</p>
                  <p className="mt-1 text-[13.5px] text-ink-3">
                    {CHANGE_STATUS[c.status]}
                    {c.status === 0 ? ` · ${ready ? "ready" : `ready ${when(Number(c.readyAt))}`}${c.approvalsNeeded ? ` · approvals ${c.approvals}/${c.approvalsNeeded}` : ""}` : ""}
                  </p>
                </div>
                {c.status === 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {acc.role.cosigner && c.approvalsNeeded ? <button className="btn btn-sm btn-ghost" disabled={Boolean(busy)} onClick={() => run(`Approved change #${c.id}`, { to: acc.account!, data: encodeAccount("approveChange", [BigInt(c.id)]) }, acc.refresh)}>Approve</button> : null}
                    <button className="btn btn-sm btn-acc" disabled={Boolean(busy) || !ready} onClick={() => run(`Applied change #${c.id}`, { to: acc.account!, data: encodeAccount("applyChange", [BigInt(c.id)]) }, acc.refresh)} data-apply-change>Apply</button>
                    {canRecall ? <button className="btn btn-sm btn-ghost !text-bad" disabled={Boolean(busy)} onClick={() => run(`Cancelled change #${c.id}`, { to: acc.account!, data: encodeAccount("cancelChange", [BigInt(c.id)]) }, acc.refresh)} data-cancel-change>Cancel</button> : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Section>
    </AccountShell>
  );
}
