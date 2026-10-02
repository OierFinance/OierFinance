// Single place to change project identity. Everything on the site reads from here.
// The token contract below is a placeholder until launch: paste the real
// 0x address (0x + 40 hex) into CA and the navbar pill, the footer block and
// every copy button switch from "Published at launch" to a working copy.

const CA = "0xxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

export const isAddress = (v: string): v is `0x${string}` => /^0x[0-9a-fA-F]{40}$/.test(v);

export const BRAND = {
  name: "Oier Finance",
  word: "Oier",
  ticker: "OIER",
  symbol: "$OIER",
  domain: "oier.finance",
  url: "https://oier.finance",
  slogan: "Own it. Immutable. Enforce. Rules.",
  /** The slogan as an acronym of the name, one letter per word. */
  acronym: [
    { letter: "O", word: "Own it.", line: "Your keys, your account, your terms." },
    { letter: "I", word: "Immutable.", line: "Rules you lock stay locked, even against you." },
    { letter: "E", word: "Enforce.", line: "Every transfer is checked before it settles." },
    { letter: "R", word: "Rules.", line: "Written in plain words, held as logic." },
  ],
  tagline: "AI-powered wallet with mathematically immutable rules.",
  description:
    "Oier Finance is a wallet where plain-language instructions become enforceable rules. Every new rule is checked against the ones you already have before it applies, and a stolen key still meets your limits.",
  x: "https://x.com/oierfinance",
  xHandle: "@oierfinance",
  /** Public GitHub repository. Empty hides every GitHub link on the site. */
  github: "https://github.com/OierFinance/OierFinance" as string,
  ca: CA,
} as const;

// Public endpoints are the default. An operator can point server reads at a
// private RPC with ROBINHOOD_RPC_URL (optional, server only).
const PUBLIC_RPC = "https://rpc.mainnet.chain.robinhood.com";

export const CHAIN = {
  id: 4663,
  hex: "0x1237",
  name: "Robinhood Chain",
  nativeSymbol: "ETH",
  decimals: 18,
  publicRpc: PUBLIC_RPC,
  /** Second public endpoint, used for reads only when the first one fails. */
  fallbackRpc: "https://robinhood-rpc.publicnode.com",
  explorer: "https://robinhoodchain.blockscout.com",
  explorerName: "Blockscout",
} as const;

export const USDG = {
  symbol: "USDG",
  address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  decimals: 6,
} as const;

/** RPC for server code: the private endpoint when set, else the public one. */
export function serverRpc() {
  return process.env.ROBINHOOD_RPC_URL || PUBLIC_RPC;
}

export const TOKEN = {
  get isLive() {
    return isAddress(BRAND.ca);
  },
};

export function explorerAddress(address: string) {
  return `${CHAIN.explorer}/address/${address}`;
}
export function explorerToken(address: string) {
  return `${CHAIN.explorer}/token/${address}`;
}
export function shortAddress(address: string, head = 6, tail = 4) {
  if (address.length <= head + tail + 2) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}
