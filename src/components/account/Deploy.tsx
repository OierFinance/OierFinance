"use client";

import { useEffect, useState } from "react";
import { concat, encodeAbiParameters } from "viem";
import { CHAIN, explorerAddress, isAddress } from "@/config/brand";
import { ACCOUNT_SALT, OIER_FACTORY, UNAUDITED_NOTE } from "@/config/contracts";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useWalletModal } from "@/components/wallet/WalletButton";
import { accountCode, accountCodeHash, factoryAbi, factoryAddress, factoryCode, read, saveFactoryOverride } from "@/lib/oier";
import { Copy, Note, Section } from "./Shell";

type State =
  | { s: "idle" }
  | { s: "signing" }
  | { s: "pending"; hash: string }
  | { s: "done"; hash: string; address: string; block: number; checks: string[] }
  | { s: "error"; text: string };

async function receipt(hash: string) {
  for (let i = 0; i < 300; i++) {
    const res = await fetch("/api/rpc", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [hash] }) });
    const j = await res.json();
    if (j.result) return j.result as { status: string; contractAddress: string; blockNumber: string; gasUsed: string };
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("No receipt after five minutes. Check the transaction in the explorer.");
}

/** Owner tool: deploys OierAccountFactory from the connected wallet. */
export function DeployPanel() {
  const { address, sendTransaction } = useWallet();
  const { open } = useWalletModal();
  const [state, setState] = useState<State>({ s: "idle" });
  const [current, setCurrent] = useState<string | null>(null);
  const configured = isAddress(OIER_FACTORY);

  useEffect(() => setCurrent(factoryAddress()), []);

  async function deploy() {
    try {
      setState({ s: "signing" });
      const data = concat([factoryCode, encodeAbiParameters([{ type: "bytes32" }], [accountCodeHash])]);
      const hash = await sendTransaction({ data });
      setState({ s: "pending", hash });
      const r = await receipt(hash);
      if (r.status !== "0x1" || !r.contractAddress) throw new Error("The deployment reverted.");
      const onChainHash = await read<string>(factoryAbi, r.contractAddress, "accountCodeHash");
      const predicted = address ? await read<string>(factoryAbi, r.contractAddress, "predict", [accountCode, address, ACCOUNT_SALT]) : "";
      setState({
        s: "done",
        hash,
        address: r.contractAddress,
        block: Number(BigInt(r.blockNumber)),
        checks: [
          `accountCodeHash matches this build: ${onChainHash === accountCodeHash ? "yes" : "NO"}`,
          `gas used: ${Number(BigInt(r.gasUsed)).toLocaleString("en-US")}`,
          predicted ? `your own account would be ${predicted}` : "",
        ].filter(Boolean),
      });
    } catch (e) {
      setState({ s: "error", text: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <div className="wrap max-w-[860px] pb-24 pt-12 font-sans sm:pt-16">
      <h1 className="h1">Deploy the account factory</h1>
      <p className="copy mt-5">
        Project owner tool. This sends one transaction from your wallet that deploys <code className="font-mono text-[14px]">OierAccountFactory</code> on {CHAIN.name}. The factory has no owner and nothing to change later; the deploying wallet gets no special rights. Each person later creates their own account through it and pays for that themselves.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4">
        <Note tone="warn">{UNAUDITED_NOTE} Consider an independent review before promoting it widely.</Note>
        {configured ? <Note>This site already points at factory <span className="break-all font-mono">{OIER_FACTORY}</span>. Deploying again creates a separate factory whose accounts get different addresses.</Note> : null}
        <Section title="What gets deployed">
          <dl className="grid gap-2.5 text-[14.5px]">
            {[
              ["Network", `${CHAIN.name} (chain id ${CHAIN.id})`],
              ["Contract", "OierAccountFactory"],
              ["Constructor", "accountCodeHash: the hash of the OierAccount bytecode this site ships"],
              ["accountCodeHash", accountCodeHash],
              ["Factory size", `${(factoryCode.length - 2) / 2} bytes`],
              ["Account size", `${(accountCode.length - 2) / 2} bytes, deployed per person when they create an account`],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 sm:grid-cols-[150px_1fr]">
                <dt className="text-ink-3">{k}</dt>
                <dd className="break-all font-mono text-[13px]">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex flex-wrap gap-3">
            {address ? (
              <button className="btn btn-acc" onClick={deploy} disabled={state.s === "signing" || state.s === "pending"} data-deploy>
                {state.s === "signing" ? "Confirm in wallet…" : state.s === "pending" ? "Deploying…" : "Deploy factory"}
              </button>
            ) : (
              <button className="btn btn-acc" onClick={open}>Connect wallet</button>
            )}
          </div>
        </Section>
        {state.s === "pending" ? <Note>Waiting for transaction <span className="break-all font-mono">{state.hash}</span>…</Note> : null}
        {state.s === "error" ? <Note tone="bad">{state.text}</Note> : null}
        {state.s === "done" ? (
          <Section title="Deployed">
            <p className="flex items-center gap-2">
              <span className="break-all font-mono text-[14px]" data-factory-address>{state.address}</span>
              <Copy value={state.address} />
            </p>
            <a href={explorerAddress(state.address)} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[14px] text-acc underline underline-offset-2">Open in the explorer</a>
            <ul className="mt-3 grid gap-1 text-[14px] text-ink-2">
              {state.checks.map((c) => <li key={c}>{c}</li>)}
              <li>block {state.block.toLocaleString("en-US")}</li>
            </ul>
            <p className="mt-4 text-[14.5px] text-ink-2">
              Next: put this address in <code className="font-mono">FACTORY</code> in <code className="font-mono">src/config/contracts.ts</code> (or set <code className="font-mono">NEXT_PUBLIC_OIER_FACTORY</code> in Vercel) and redeploy the site. To try it before that, use it on this device only:
            </p>
            <button
              className="btn btn-sm btn-ghost mt-3"
              onClick={() => {
                saveFactoryOverride(state.address);
                window.location.href = "/account";
              }}
              data-use-factory
            >
              Use on this device
            </button>
          </Section>
        ) : null}
        {!configured && current ? (
          <Note>
            This device is using factory <span className="break-all font-mono">{current}</span> saved from an earlier deployment.{" "}
            <button
              className="underline"
              onClick={() => {
                saveFactoryOverride(null);
                window.location.reload();
              }}
            >
              Forget it
            </button>
          </Note>
        ) : null}
      </div>
    </div>
  );
}
