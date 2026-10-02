// On-chain contracts. One place to change after the owner deploys.
//
// FACTORY: paste the OierAccountFactory address shown on /deploy after the
// deployment transaction confirms, then redeploy the site. While it is empty
// every account page says "Not deployed yet". NEXT_PUBLIC_OIER_FACTORY (set at
// build time) overrides it, which is how local fork tests point the site at a
// throwaway factory.

// Deployed 2 Oct 2026, block 78173546, accountCodeHash 0xbb58da43…6f09f6.
const FACTORY = "0x8371C031e8786Fa333dBFE4474998182e27A936A";

export const OIER_FACTORY: string = process.env.NEXT_PUBLIC_OIER_FACTORY || FACTORY;

/** Salt for a person's first account. A second account would use another salt. */
export const ACCOUNT_SALT = "0x6f6965722e6d61696e2e76310000000000000000000000000000000000000000" as `0x${string}`;

export const NATIVE = "0x0000000000000000000000000000000000000000" as const;

/** The contracts have not been audited. Shown wherever money can move. */
export const UNAUDITED_NOTE =
  "The account contracts are unaudited. Start with small amounts, and keep a co-signer and guardians you trust.";
