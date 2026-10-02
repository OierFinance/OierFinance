# Oier Finance

**Own it. Immutable. Enforce. Rules.**
An AI-powered wallet with mathematically immutable rules, on Robinhood Chain. Ticker `$OIER`, site [oier.finance](https://oier.finance), X [@oierfinance](https://x.com/oierfinance).

## The problem

Today a signature is the only thing standing between a wallet and an empty balance. Phish one signature, swap one address in the clipboard, lose one phone, and the money leaves with no ceiling, no delay and no undo. Banks provide those safety nets, but only by holding your funds and keeping the right to rewrite the terms. Smart contracts leave custody with you, yet none of them can tell you whether it conflicts with itself or with anything else you depend on.

## The solution

Oier lets you write the safety nets yourself, in plain English, and makes the account obey them:

- **Rules before signatures.** "Only pay Priya and Halden Exchange" becomes `to ∈ {Priya, Halden Exchange}` and is evaluated on every transfer, so a leaked key cannot pay anyone else.
- **Tested before it takes effect.** Each new rule is compared with the whole set. Contradictions are rejected with the clashing rules named; rules that add nothing, or that leave a listed payee unpayable, are flagged.
- **Guarded rules.** A rule can control edits to another: "Changing rule 1 needs 2 approvals and a 7-day notice", "Freeze rule 2".
- **Conditional money.** `$OIER` payments can carry a spending pace, allowed purchases, a return date and an expiry.
- **Agent budgets.** AI agents get spending rules instead of keys.
- **Bank-style safety nets, self-custodied.** Payment delays, co-signers and recovery expressed as rules.

## What you can try

Live in this repository:

| Feature | Where |
| --- | --- |
| Rule Studio: plain-English instruction to boolean formula, consistency check (contradiction, redundancy, dead recipients, governance), transfer simulator with the deciding rule, rule sets stored per wallet address, signing the set with `personal_sign` (no gas) | `/studio` |
| Conditions composer for `$OIER` payments: conditions as logic, signable, plus a check from the recipient side | `/token` |
| Wallet connection (EIP-6963 browser wallets, optional WalletConnect), Robinhood Chain added on connect, account menu with balance and network status | every page |
| Account panel beside the long pages: sample instructions are drafted, checked and applied with the same engine | `/`, `/use-cases`, `/build`, `/commerce` |
| Early-access request, signed with the wallet and stored on the device | `/waitlist` |
| Live chain reads (block number, balances) through a read-only RPC relay | `/api/rpc` |

Coming later: the on-chain rule account that enforces a committed set on Robinhood Chain, `$OIER` transfers with terms, agent accounts, recovery, and a language model in front of the deterministic grammar. The `$OIER` contract address shows "Published at launch" until it exists.

## Run it locally

Requirements: Node.js 20 or newer and npm. Download ZIP or fork this repository, then:

```bash
npm install
npm run build
npm start          # http://localhost:4790
```

Engine self-check: `npm run test:rules`.

Optional environment variables (the app works without them). Copy `.env.example` to `.env.local` and fill in only what you need:

| Variable | Purpose | Format |
| --- | --- | --- |
| `ROBINHOOD_RPC_URL` | Private Robinhood Chain RPC for server reads (falls back to the public RPC, then publicnode) | full `https://` URL |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Enables the WalletConnect option | 32-character project id from cloud.reown.com |

On Vercel, set the same names under Project, Settings, Environment Variables, then redeploy.

## Network in your wallet

| Field | Value |
| --- | --- |
| Network name | Robinhood Chain |
| Chain ID | 4663 (`0x1237`) |
| RPC URL | https://rpc.mainnet.chain.robinhood.com |
| Currency symbol | ETH |
| Explorer | https://robinhoodchain.blockscout.com |

The site offers to add it when you connect.

## Project layout

```
src/
  app/(site)/            pages: home, studio, token, use-cases, technology, build, commerce, about, waitlist, privacy, terms, notices
  app/api/rpc/           read-only JSON-RPC relay
  components/studio/     Rule Studio, simulator, per-address storage
  components/demo/       account panel used beside the long pages
  components/wallet/     wallet provider, dialog, account menu
  config/brand.ts        name, ticker, links, contract address, chain
  lib/rules/             rule types, deterministic drafter, logic checker
scripts/rules-check.ts   engine self-check
```

## Token contract

`$OIER` on Robinhood Chain: **published at launch.** The address is set in one place, `src/config/brand.ts` (`CA`), and appears with a copy button in the navbar and footer once it is a valid `0x` address.
