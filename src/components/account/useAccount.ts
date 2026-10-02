"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isAddress, USDG } from "@/config/brand";
import { NATIVE } from "@/config/contracts";
import { useWallet } from "@/components/wallet/WalletProvider";
import { waitForReceipt } from "@/lib/rpc";
import { accountAbi, balanceOf, factoryAddress, getCode, latestTimestamp, predictAccount, readMany, simulate, type Limits } from "@/lib/oier";

export type AccountState = {
  owner: string;
  inSetup: boolean;
  setupEndsAt: number;
  allowlistOn: boolean;
  settleDelay: number;
  payeeCooldown: number;
  quietOn: boolean;
  quietFrom: number;
  quietTo: number;
  tzOffset: number;
  lockUntil: number;
  cosigners: string[];
  cosignRequired: number;
  guardians: string[];
  recoveryThreshold: number;
  recoveryDelay: number;
  recoveryCandidate: string;
  recoveryStartedAt: number;
  recoverySupport: number;
  transferCount: number;
  changeCount: number;
  usdgLimits: Limits;
  ethLimits: Limits;
  balances: { usdg: bigint; eth: bigint };
};

/** The viewed account: ?account=0x… when given, else the connected wallet's own predicted account. */
export function useAccount() {
  const { address } = useWallet();
  const [factory, setFactory] = useState<`0x${string}` | null>(null);
  const [override, setOverride] = useState<string | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);
  const [state, setState] = useState<AccountState | null>(null);
  const [now, setNow] = useState(0);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFactory(factoryAddress());
    const q = new URLSearchParams(window.location.search).get("account");
    setOverride(q && isAddress(q) ? q : null);
  }, []);

  const own = useMemo(() => (factory && address ? predictAccount(factory, address as `0x${string}`) : null), [factory, address]);
  const account = override ?? own;

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!account) return;
    let live = true;
    (async () => {
      try {
        const code = await getCode(account);
        if (!live) return;
        if (!code || code === "0x") {
          setExists(false);
          setState(null);
          return;
        }
        setExists(true);
        const fns = ["owner", "inSetup", "setupEndsAt", "allowlistOn", "settleDelay", "payeeCooldown", "quietOn", "quietFrom", "quietTo", "tzOffset", "lockUntil", "cosigners", "cosignRequired", "guardians", "recoveryThreshold", "recoveryDelay", "recoveryCandidate", "recoveryStartedAt", "recoverySupport", "transferCount", "changeCount"];
        const r = await readMany([
          ...fns.map((fn) => ({ abi: accountAbi, to: account, fn })),
          { abi: accountAbi, to: account, fn: "limits", args: [USDG.address] },
          { abi: accountAbi, to: account, fn: "limits", args: [NATIVE] },
        ]);
        const [usdg, eth, ts] = await Promise.all([balanceOf(USDG.address, account).catch(() => 0n), balanceOf(NATIVE, account).catch(() => 0n), latestTimestamp().catch(() => Math.floor(Date.now() / 1000))]);
        if (!live) return;
        const n = (v: unknown) => Number(v ?? 0);
        setNow(ts);
        setState({
          owner: String(r[0]),
          inSetup: Boolean(r[1]),
          setupEndsAt: n(r[2]),
          allowlistOn: Boolean(r[3]),
          settleDelay: n(r[4]),
          payeeCooldown: n(r[5]),
          quietOn: Boolean(r[6]),
          quietFrom: n(r[7]),
          quietTo: n(r[8]),
          tzOffset: n(r[9]),
          lockUntil: n(r[10]),
          cosigners: (r[11] as string[]) ?? [],
          cosignRequired: n(r[12]),
          guardians: (r[13] as string[]) ?? [],
          recoveryThreshold: n(r[14]),
          recoveryDelay: n(r[15]),
          recoveryCandidate: String(r[16] ?? ""),
          recoveryStartedAt: n(r[17]),
          recoverySupport: n(r[18]),
          transferCount: n(r[19]),
          changeCount: n(r[20]),
          usdgLimits: (r[21] as Limits) ?? { txCap: 0n, dayCap: 0n, weekCap: 0n, cosignAbove: 0n },
          ethLimits: (r[22] as Limits) ?? { txCap: 0n, dayCap: 0n, weekCap: 0n, cosignAbove: 0n },
          balances: { usdg, eth },
        });
        setError(null);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : "Could not read the account.");
      }
    })();
    return () => {
      live = false;
    };
  }, [account, tick]);

  // Light polling keeps timers and statuses honest without hammering the RPC.
  useEffect(() => {
    const t = window.setInterval(refresh, 20000);
    return () => window.clearInterval(t);
  }, [refresh]);

  const me = address?.toLowerCase() ?? "";
  const role = {
    owner: Boolean(state && state.owner.toLowerCase() === me),
    cosigner: Boolean(state && state.cosigners.some((c) => c.toLowerCase() === me)),
    guardian: Boolean(state && state.guardians.some((g) => g.toLowerCase() === me)),
  };

  return { factory, account, own, viewingOther: Boolean(override), exists, state, now, refresh, error, role, connected: Boolean(address) };
}

/** Sends one transaction from the connected wallet and waits for it. */
export function useTx() {
  const { sendTransaction, address } = useWallet();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const run = useCallback(
    async (label: string, tx: { to?: string; data?: `0x${string}`; value?: bigint }, after?: () => void) => {
      setBusy(label);
      setMessage(null);
      try {
        // Dry-run first, so a rule refusal is explained before the wallet opens.
        if (tx.to && address) await simulate({ from: address, to: tx.to, data: tx.data, value: tx.value });
        const hash = await sendTransaction(tx);
        const r = await waitForReceipt(hash, 180_000);
        if (!r.ok) throw new Error("The transaction reverted on-chain.");
        setMessage({ tone: "ok", text: `${label}: confirmed in block ${r.block.toLocaleString("en-US")}.` });
        after?.();
        return hash;
      } catch (e) {
        setMessage({ tone: "bad", text: explain(e) });
        return null;
      } finally {
        setBusy(null);
      }
    },
    [sendTransaction, address],
  );
  return { run, busy, message, setMessage };
}

const ERRORS: Record<string, string> = {
  NotOwner: "Only the account owner (or, for recalls, a co-signer or guardian) can do this.",
  NotCosigner: "Only a co-signer of this account can approve.",
  NotGuardian: "Only a guardian of this account can do this.",
  NotReady: "Not yet: the waiting period has not passed.",
  NeedsApprovals: "More co-signer approvals are needed first.",
  QuietHours: "The account is inside its quiet hours. Try again after they end.",
  Locked: "The account is locked until its lock date.",
  Frozen: "That rule is frozen and can never be loosened.",
  BadState: "That item is no longer pending.",
  CallFailed: "The payment itself failed (not enough balance in the account?).",
  BadParams: "One of the values is out of range.",
  UnknownChange: "The contract does not recognise that rule change.",
  BadSignature: "The signature does not belong to that co-signer.",
  WrongCode: "The factory rejected the account bytecode.",
};

export function explain(e: unknown) {
  const text = e instanceof Error ? e.message : String(e);
  for (const [k, v] of Object.entries(ERRORS)) if (text.includes(k)) return v;
  const denied = text.match(/Denied\((\d)\)/);
  if (denied) return `Refused by the account's rules (code ${denied[1]}).`;
  return text.length > 220 ? `${text.slice(0, 220)}…` : text;
}
