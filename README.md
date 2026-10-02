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
| **On-chain account** (`OierAccount`): create it at an address known in advance, deposit ETH or USDG, propose transfers with a live `check()` pre-flight, a queue with recall, co-signer approvals (transaction or EIP-712 signature), rules on-chain with guards, guardian recovery | `/account`, `/account/send`, `/account/queue`, `/account/rules`, `/account/recovery` |
| Factory deployment from the connected wallet (project owner) | `/deploy` |

Until the factory is deployed the Account pages show "Not deployed yet". Coming later: agent session keys, `$OIER` transfers with terms, and a language model in front of the deterministic grammar. The `$OIER` contract address shows "Published at launch" until it exists.

## On-chain enforcement (unaudited)

> **The contracts are unaudited.** They hold real funds once used. Start with small amounts and set a co-signer and guardians you trust.

`contracts/src/OierAccount.sol` is a plain contract account (no ERC-4337, no bundler, no paid service). Its owner can only *propose* transfers; the contract decides:

| Rule | Enforced how |
| --- | --- |
| Payee allowlist and blocklist | `propose` and again at `execute` |
| Per-transfer cap, 24-hour cap (hourly buckets), 7-day cap (daily buckets), per asset | counted at `propose`, refunded on recall |
| Co-signer above an amount | `approveTransfer` or `approveTransferWithSig` (EIP-712) by the required number of co-signers |
| Settlement delay and recall | `execute` only after `executeAfter`; owner, co-signers or guardians can `cancelTransfer` until then |
| New-payee cooldown | a payee first seen at time T cannot be paid before T + cooldown |
| Quiet hours, lock date | `execute` refuses inside quiet hours or before the lock date |
| Guarded rule changes (rule chains) | `configure` applies tightening at once; loosening is queued behind the rule's guard (delay, co-signer approvals, or never if frozen). Guards are rules with their own guards. Freezing and long locks also wait, so a stolen key cannot brick the account |
| Guardian recovery | guardians start and support a recovery; after the threshold and the timelock anyone can finalize it. The owner can veto unless every guardian supports it |

There is no admin key, no upgrade path and no generic call function. `OierAccountFactory` deploys accounts with CREATE2 at an address that depends only on the owner and a salt; it only accepts bytecode whose hash matches the one fixed at its deployment, and keeps no rights.

Tests: `forge test` (Foundry; 26 unit and fuzz tests plus two invariants: a stolen owner key never pays a non-listed address before a loosening change has waited its full delay, and live proposals never exceed the 24-hour cap in any window).

### Deploying the factory (project owner)

1. Run the site with a wallet that holds a little ETH on Robinhood Chain.
2. Open `/deploy`, connect, check the `accountCodeHash` shown, press **Deploy factory** and confirm in the wallet. Measured cost: about 413,000 gas, roughly 0.00002 ETH at 0.03 gwei.
3. Copy the factory address into `FACTORY` in `src/config/contracts.ts` (or set `NEXT_PUBLIC_OIER_FACTORY` at build time) and redeploy the site.
4. Each person then creates their own account on `/account` (about 4.5 to 5.2 million gas including the bytecode, roughly 0.00015 to 0.0002 ETH at 0.03 gwei). Day-to-day calls cost 50,000 to 300,000 gas.

After changing the contracts: `forge build && npm run abi` regenerates `src/contracts/*`.

## Run it locally

Requirements: Node.js 20 or newer and npm. Download ZIP or fork this repository, then:

```bash
npm install
npm run build
npm start          # http://localhost:4790
```

Engine self-check: `npm run test:rules`. Contract tests need [Foundry](https://getfoundry.sh): `forge test`.

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
contracts/src/           OierAccount.sol, OierAccountFactory.sol
contracts/test/          Foundry unit, fuzz and invariant tests
src/
  app/(site)/            pages: home, studio, account/*, deploy, token, use-cases, technology, build, commerce, about, waitlist, privacy, terms, notices
  components/account/    account pages, deploy panel
  config/contracts.ts    factory address (one place)
  contracts/             generated ABI + bytecode (npm run abi)
  lib/oier.ts            contract reads, encodings, address prediction
  lib/compile.ts         Rule Studio set to on-chain rule calls
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
