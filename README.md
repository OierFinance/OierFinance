# Oier Finance

**Own it. Immutable. Enforce. Rules.**
An AI-powered wallet with mathematically immutable rules, on Robinhood Chain. Ticker `$OIER`, site [oier.finance](https://oier.finance), X [@oierfinance](https://x.com/oierfinance).

## The problem

A crypto wallet treats whoever holds the key as the owner. One phished signature, one swapped address or one lost phone, and the balance is gone with no limit, no delay and no way back. Banks offer holds, caps and reversals, but only by keeping your money and the right to change the terms. Smart contracts keep custody with you, but nobody can ask a contract whether it contradicts itself or the other contracts you rely on.

## The solution

Oier lets you write the protections yourself, in plain English, and holds the account to them:

- **Rule-first account.** "My account only sends to Jack and Coinbase" becomes `to ∈ {Jack, Coinbase}`, evaluated on every transfer, so a stolen key still meets the list.
- **Consistency check before apply.** Every new rule is decided against the whole set. Contradictions are refused with the conflicting rules named; rules that add nothing, or that make a named recipient unpayable, are flagged.
- **Rule chains.** A rule can govern another rule: "Changing rule 1 needs 3 approvals and a 30-day notice", "Rule 2 can never be removed".
- **Programmable money.** `$OIER` payments carry terms: spend rate, allowed purchases, return date, expiry.
- **Agent accounts.** Give an AI agent payment rules, not keys.
- **Bank-like protection without a bank.** Recall windows, second approvals and recovery written as rules.

## What you can try

Live in this repository:

| Feature | Where |
| --- | --- |
| Rule Studio: plain-English rule to boolean formula, consistency check (contradiction, redundancy, dead recipients, governance), transfer simulator with the deciding rule, rule sets stored per wallet address, signing the set with `personal_sign` (no gas) | `/studio` |
| Terms composer for `$OIER` payments: terms as logic, signable, with a "recipient tries to spend" check | `/token` |
| Wallet connect (EIP-6963 browser wallets, optional WalletConnect), adds Robinhood Chain on connect, account menu with balance and network status | every page |
| Early-access entry, signed with the wallet and kept on the device | `/waitlist` |
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
  components/wallet/     wallet provider, dialog, account menu
  config/brand.ts        name, ticker, links, contract address, chain
  lib/rules/             rule types, deterministic drafter, logic checker
scripts/rules-check.ts   engine self-check
```

## Token contract

`$OIER` on Robinhood Chain: **published at launch.** The address is set in one place, `src/config/brand.ts` (`CA`), and appears with a copy button in the navbar and footer once it is a valid `0x` address.
