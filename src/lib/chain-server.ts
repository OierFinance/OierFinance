import "server-only";
import { CHAIN, serverRpc } from "@/config/brand";

/* Server-side chain reads. One JSON-RPC batch per request, configured
   endpoint first (ROBINHOOD_RPC_URL), public endpoints after. No key needed. */

type RpcCall = { method: string; params: unknown[] };

// An endpoint that just failed sits out for a minute, so every read does not
// pay its timeout again. Some networks intercept the primary host's DNS.
const benched = new Map<string, number>();
const BENCH_MS = 60_000;

function endpoints() {
  const all = [serverRpc(), CHAIN.publicRpc, CHAIN.fallbackRpc].filter((url, i, list) => list.indexOf(url) === i);
  const now = Date.now();
  const ready = all.filter((url) => (benched.get(url) ?? 0) < now);
  return ready.length ? ready : all;
}

/** Whether a private endpoint is configured (the value itself is never exposed). */
export const hasPrivateRpc = () => Boolean(process.env.ROBINHOOD_RPC_URL);

export async function batch(calls: RpcCall[]): Promise<(unknown | null)[]> {
  if (calls.length === 0) return [];
  let lastError: unknown;
  for (const url of endpoints()) {
    try {
      const out: (unknown | null)[] = new Array(calls.length).fill(null);
      // Chunked: public endpoints reject large batches with an HTML error page.
      for (let start = 0; start < calls.length; start += 20) {
        const chunk = calls.slice(start, start + 20);
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(chunk.map((c, i) => ({ jsonrpc: "2.0", id: start + i, method: c.method, params: c.params }))),
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`rpc ${res.status}`);
        const body = (await res.json()) as { id: number; result?: unknown }[];
        if (!Array.isArray(body)) throw new Error("rpc batch unsupported");
        for (const item of body) out[item.id] = item.result ?? null;
      }
      return out;
    } catch (error) {
      benched.set(url, Date.now() + BENCH_MS);
      lastError = error;
    }
  }
  throw lastError;
}

export const ethCall = (to: string, data: string): RpcCall => ({ method: "eth_call", params: [{ to, data }, "latest"] });
