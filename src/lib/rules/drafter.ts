import { parseRule } from "./parse.ts";
import type { ParseResult } from "./types.ts";

/*
 * Drafting seam. Today the drafter is the deterministic grammar in parse.ts,
 * which needs no key and gives the same answer every time. A language model
 * can be added later behind this same signature: it would rewrite a free-form
 * sentence into one the grammar reads (or emit clauses directly), and its
 * output still goes through checkDraft() before anything applies. The model
 * never decides whether a rule is consistent; the logic does.
 */

export type Drafter = {
  name: string;
  draft: (sentence: string, now?: number) => Promise<ParseResult>;
};

export const deterministicDrafter: Drafter = {
  name: "Built-in grammar",
  draft: async (sentence, now) => parseRule(sentence, now),
};

export const activeDrafter: Drafter = deterministicDrafter;
