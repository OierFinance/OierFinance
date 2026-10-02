import {
  concat,
  decodeErrorResult,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  getContractAddress,
  keccak256,
  type Abi,
  type Hex,
} from "viem";
import { oierAccountAbi, oierAccountBytecode } from "@/contracts/oierAccount";
import { oierAccountFactoryAbi, oierAccountFactoryBytecode } from "@/contracts/oierAccountFactory";
import { ACCOUNT_SALT, NATIVE, OIER_FACTORY } from "@/config/contracts";
import { USDG, isAddress } from "@/config/brand";

/* Reads and encodings for OierAccount, over this site's read-only RPC relay. */

export const accountAbi = oierAccountAbi;
export const factoryAbi = oierAccountFactoryAbi;
export const accountCode = oierAccountBytecode as Hex;
export const factoryCode = oierAccountFactoryBytecode as Hex;
export const accountCodeHash = keccak256(accountCode);

const FACTORY_OVERRIDE_KEY = "oier.factory.override";

/** Factory address: the configured one, else one saved on this device from /deploy. */
export function factoryAddress(): `0x${string}` | null {
  if (isAddress(OIER_FACTORY)) return OIER_FACTORY;
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(FACTORY_OVERRIDE_KEY) ?? "";
    return isAddress(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveFactoryOverride(address: string | null) {
  try {
    if (address) window.localStorage.setItem(FACTORY_OVERRIDE_KEY, address);
    else window.localStorage.removeItem(FACTORY_OVERRIDE_KEY);
  } catch {
    // Storage blocked: the configured address still applies.
  }
}

export function factoryIsLocalOverride() {
  return !isAddress(OIER_FACTORY) && factoryAddress() !== null;
}

/** The account address `owner` gets from `factory` with the default salt. */
export function predictAccount(factory: `0x${string}`, owner: `0x${string}`, salt: Hex = ACCOUNT_SALT) {
  return getContractAddress({
    opcode: "CREATE2",
    from: factory,
    salt: keccak256(encodeAbiParameters([{ type: "address" }, { type: "bytes32" }], [owner, salt])),
    bytecode: concat([accountCode, encodeAbiParameters([{ type: "address" }], [owner])]),
  });
}

type Call = { to: string; data: Hex };

async function relay(body: unknown) {
  const res = await fetch("/api/rpc", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(typeof json.error === "string" ? json.error : json.error?.message ?? `RPC ${res.status}`);
  return json;
}

export async function rawCall(to: string, data: Hex): Promise<Hex> {
  const json = await relay({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] });
  return json.result as Hex;
}

/** One contract read. */
export async function read<T>(abi: Abi, to: string, functionName: string, args: unknown[] = []): Promise<T> {
  const data = encodeFunctionData({ abi, functionName, args } as never);
  const out = await rawCall(to, data);
  return decodeFunctionResult({ abi, functionName, data: out } as never) as T;
}

/** Many reads in one relay batch (20 per request). Failed reads come back null. */
export async function readMany(reads: { abi: Abi; to: string; fn: string; args?: unknown[] }[]): Promise<unknown[]> {
  const out: unknown[] = [];
  for (let i = 0; i < reads.length; i += 20) {
    const chunk = reads.slice(i, i + 20);
    const body = chunk.map((r, j) => ({ jsonrpc: "2.0", id: j, method: "eth_call", params: [{ to: r.to, data: encodeFunctionData({ abi: r.abi, functionName: r.fn, args: r.args ?? [] } as never) }, "latest"] }));
    const json = (await relay(body)) as { id: number; result: Hex | null }[];
    for (let j = 0; j < chunk.length; j++) {
      const res = json.find((x) => x.id === j)?.result;
      try {
        out.push(res && res !== "0x" ? decodeFunctionResult({ abi: chunk[j].abi, functionName: chunk[j].fn, data: res } as never) : null);
      } catch {
        out.push(null);
      }
    }
  }
  return out;
}

/** Dry-runs a transaction; throws an Error named after the contract's revert reason. */
export async function simulate(tx: { from: string; to: string; data?: Hex; value?: bigint }) {
  const res = await fetch("/api/rpc", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ from: tx.from, to: tx.to, data: tx.data ?? "0x", value: tx.value ? `0x${tx.value.toString(16)}` : "0x0" }, "latest"] }),
    cache: "no-store",
  });
  const json = await res.json();
  const err = json.error as { message?: string; data?: unknown } | string | undefined;
  if (!err) return;
  if (typeof err === "string") throw new Error(err);
  const data = typeof err.data === "string" ? err.data : typeof (err.data as { data?: string })?.data === "string" ? (err.data as { data: string }).data : null;
  if (data && data.startsWith("0x") && data.length >= 10) {
    for (const abi of [accountAbi, factoryAbi] as Abi[]) {
      try {
        const d = decodeErrorResult({ abi, data: data as Hex });
        throw new Error(d.args?.length ? `${d.errorName}(${d.args.join(",")})` : d.errorName);
      } catch (e) {
        if (e instanceof Error && !/not found|AbiErrorSignatureNotFound/i.test(e.message) && !e.message.startsWith("Encoded error")) throw e;
      }
    }
  }
  throw new Error(err.message ?? "The transaction would fail.");
}

export async function getCode(address: string): Promise<Hex> {
  const json = await relay({ jsonrpc: "2.0", id: 1, method: "eth_getCode", params: [address, "latest"] });
  return (json.result ?? "0x") as Hex;
}

export async function balanceOf(asset: string, holder: string): Promise<bigint> {
  if (asset === NATIVE) {
    const json = await relay({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [holder, "latest"] });
    return BigInt(json.result ?? "0x0");
  }
  const data = ("0x70a08231" + holder.toLowerCase().replace(/^0x/, "").padStart(64, "0")) as Hex;
  const out = await rawCall(asset, data);
  return out && out !== "0x" ? BigInt(out) : 0n;
}

export async function latestTimestamp(): Promise<number> {
  const json = await relay({ jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: ["latest", false] });
  return Number(BigInt(json.result?.timestamp ?? "0x0"));
}

export const encodeAccount = (functionName: string, args: unknown[] = []) => encodeFunctionData({ abi: accountAbi, functionName, args } as never);
export const encodeFactory = (functionName: string, args: unknown[] = []) => encodeFunctionData({ abi: factoryAbi, functionName, args } as never);

export const ASSETS = [
  { symbol: "USDG", address: USDG.address as `0x${string}`, decimals: USDG.decimals },
  { symbol: "ETH", address: NATIVE as `0x${string}`, decimals: 18 },
];
export const assetBy = (address: string) => ASSETS.find((a) => a.address.toLowerCase() === address.toLowerCase());

export const DENY_TEXT: Record<number, string> = {
  1: "the payee is on the blocklist",
  2: "the payee is not on the allowlist",
  3: "it is above the per-transfer cap",
  4: "it would pass the 24-hour cap",
  5: "it would pass the 7-day cap",
  6: "the amount is zero",
};

export const TRANSFER_STATUS = ["pending", "sent", "recalled"] as const;
export const CHANGE_STATUS = ["queued", "applied", "cancelled"] as const;

export type Transfer = { asset: `0x${string}`; to: `0x${string}`; amount: bigint; proposedAt: bigint; executeAfter: bigint; hourIdx: number; dayIdx: number; approvals: number; needsCosign: boolean; status: number };
export type Change = { key: Hex; data: Hex; proposedAt: bigint; readyAt: bigint; approvalsNeeded: number; approvals: number; status: number };
export type Limits = { txCap: bigint; dayCap: bigint; weekCap: bigint; cosignAbove: bigint };
export type Guard = { delay: number; approvals: number; frozen: boolean; set: boolean };

export function shortHex(v: string, a = 6, b = 4) {
  return v.length > a + b + 2 ? `${v.slice(0, a)}…${v.slice(-b)}` : v;
}

export function duration(seconds: number) {
  if (seconds <= 0) return "none";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d ? `${d}d` : "", h ? `${h}h` : "", !d && m ? `${m}m` : ""].filter(Boolean).join(" ") || `${seconds}s`;
}
