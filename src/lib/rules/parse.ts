import type { Clause, Draft, ParseResult, Period, Scope } from "./types.ts";

/*
 * Deterministic drafter: plain English in, a structured rule out. It reads a
 * fixed grammar of money phrases (who, how much, how often, when, on what)
 * and never guesses: a sentence it cannot read fully is returned as an error
 * with hints, never half-applied. A language model can sit in front of this
 * later (see drafter.ts); whatever it proposes still lands here as clauses
 * and goes through the same consistency check.
 */

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, a: 1, an: 1, single: 1,
};

export const KNOWN_ASSETS = ["ETH", "USDG", "OIER", "USDC", "USDT", "WETH"];

const AMT = String.raw`(?:[$€£]\s*)?\d[\d,]*(?:\.\d+)?\s*(?:k|m|thousand|million)?(?:\s*(?:usd|dollars?|usdg|usdc|usdt|eth|oier|bucks))?`;

export function parseAmount(raw: string): number | null {
  const m = raw.toLowerCase().replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*(k|m|thousand|million)?/);
  if (!m) return null;
  let n = Number(m[1]);
  if (m[2] === "k" || m[2] === "thousand") n *= 1_000;
  if (m[2] === "m" || m[2] === "million") n *= 1_000_000;
  return Number.isFinite(n) && n > 0 ? n : null;
}

function count(raw: string): number | null {
  const t = raw.trim().toLowerCase();
  if (/^\d+$/.test(t)) return Number(t);
  return NUMBER_WORDS[t] ?? null;
}

function hoursOf(n: number, unit: string) {
  const u = unit.toLowerCase();
  if (u.startsWith("min")) return n / 60;
  if (u.startsWith("h")) return n;
  if (u.startsWith("d")) return n * 24;
  if (u.startsWith("w")) return n * 24 * 7;
  if (u.startsWith("mo")) return n * 24 * 30;
  if (u.startsWith("y")) return n * 24 * 365;
  return n;
}

/** "10pm", "22:00", "6 am", "midnight", "noon" → hour 0–23. */
export function parseHour(raw: string): number | null {
  const t = raw.trim().toLowerCase();
  if (t === "midnight") return 0;
  if (t === "noon" || t === "midday") return 12;
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const ap = m[3]?.replace(/\./g, "");
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h >= 0 && h <= 24 ? h % 24 : null;
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/** "2027-06-01", "1 June 2027", "June 1", "1 August" → epoch ms (UTC midnight). */
export function parseDate(raw: string, now: number): number | null {
  const t = raw.trim().toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, "$1").replace(/,/g, "");
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const month = (s: string) => MONTHS.findIndex((m) => m.startsWith(s.slice(0, 3)));
  let d: number | null = null;
  let mo = -1;
  let y: number | null = null;
  const a = t.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/);
  const b = t.match(/^([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/);
  if (a) {
    d = Number(a[1]);
    mo = month(a[2]);
    y = a[3] ? Number(a[3]) : null;
  } else if (b) {
    d = Number(b[2]);
    mo = month(b[1]);
    y = b[3] ? Number(b[3]) : null;
  }
  if (d === null || mo < 0 || d < 1 || d > 31) return null;
  const year = y ?? new Date(now).getUTCFullYear();
  let at = Date.UTC(year, mo, d);
  // A date without a year means the next one to come.
  if (y === null && at < now) at = Date.UTC(year + 1, mo, d);
  return at;
}

/** Splits "Jack, Coinbase and my sister" into labels. */
function parties(raw: string): string[] {
  return raw
    .replace(/\b(?:addresses?|wallets?|accounts?)\s+(?:of|for)\s+/gi, "")
    .split(/\s*(?:,|;|\band\b|\bor\b|&|\+)\s*/i)
    .map((p) =>
      p
        .replace(/^(?:to|the|my|our|his|her|their)\s+/i, "")
        .replace(/^(?:the|my|our)\s+/i, "")
        .replace(/['’]s\s+(?:wallet|account|address)$/i, "")
        .replace(/\s+(?:wallet|account|address)$/i, "")
        .replace(/[.!?]+$/, "")
        .trim(),
    )
    .filter((p) => p.length > 0 && p.length < 48 && !/^(?:funds?|money|payments?|anything|it|them)$/i.test(p))
    .map(normalizeParty);
}

export function normalizeParty(p: string) {
  return /^0x[0-9a-f]{40}$/i.test(p) ? p.toLowerCase() : p.toLowerCase().replace(/\s+/g, " ");
}

function categories(raw: string): string[] {
  return raw
    .split(/\s*(?:,|\band\b|\bor\b|&)\s*/i)
    .map((c) => c.replace(/^(?:the|a|an|on|for)\s+/i, "").replace(/\s+(?:only|purchases?|spending|merchants?|stuff|things)$/i, "").replace(/[.!?]+$/, "").trim().toLowerCase())
    .filter((c) => c.length > 1 && c.length < 40);
}

const CONTACT_WORDS = /^(?:(?:addresses|people|contacts)\s+(?:i've|i have|i)\s+approved|(?:my\s+)?approved\s+(?:list|addresses|contacts)|(?:my\s+)?contacts|(?:my\s+)?address book)$/i;

const SEND = String.raw`(?:send|sends|sending|pay|pays|paying|transfer|transfers|move|moves)`;
const STOP = String.raw`(?=$|[.;!?]|,?\s+(?:up to|under|below|at most|no more than|with|but|unless|if|for|on|during|between|after|before|max)\b)`;

type Extract = (s: string, out: Clause[], notes: string[], now: number) => string;

/* Each extractor finds its phrase, appends clauses and returns the sentence
   with that phrase blanked, so leftovers can be reported as unread. */
const extractors: Extract[] = [
  // Recipient allowlist.
  (s, out) =>
    s.replace(
      new RegExp(String.raw`(?:can|may|should|must|will)?\s*only\s+(?:be\s+able\s+to\s+)?(?:let\s+(?:this|my|the)\s+account\s+)?${SEND}(?:\s+(?:funds|money|payments?|anything|out))?\s+to\s+(.+?)${STOP}`, "i"),
      (_m, list: string) => {
        const l = list.trim();
        out.push({ k: "allowTo", parties: CONTACT_WORDS.test(l) ? ["@contacts"] : parties(l) });
        return " ";
      },
    ),
  (s, out) =>
    s.replace(new RegExp(String.raw`\b(?:only|solely)\s+(?:to|pays?)\s+(.+?)${STOP}`, "i"), (m, list: string) => {
      if (/^(?:for|on)\b/i.test(list)) return m;
      const l = list.trim();
      out.push({ k: "allowTo", parties: CONTACT_WORDS.test(l) ? ["@contacts"] : parties(l) });
      return " ";
    }),
  // Recipient blocklist.
  (s, out) =>
    s.replace(new RegExp(String.raw`\b(?:never|don't|do not|cannot|can't|can never|must never|block(?:\s+(?:all|any))?)\s+(?:${SEND}\s+)?(?:(?:funds|money|payments?|transfers?|anything)\s+)?to\s+(.+?)${STOP}`, "i"), (_m, list: string) => {
      out.push({ k: "blockTo", parties: parties(list) });
      return " ";
    }),
  // Second approval above a threshold.
  (s, out) =>
    s.replace(new RegExp(String.raw`(?:require|needs?|requires?|ask for|get)\s+(?:a\s+|an\s+|my\s+|our\s+)?(?:second|2nd|extra|another|co-?sign(?:er)?(?:'s)?|[a-z]+(?:'s)?)\s*(?:approval|signature|sign-?off)s?\s+(?:for\s+)?(?:anything\s+|payments?\s+|transfers?\s+)?(?:above|over|more than|bigger than|larger than|exceeding)\s+(${AMT})`, "i"), (_m, a: string) => {
      const v = parseAmount(a);
      if (v) out.push({ k: "cosignAbove", amount: v });
      return " ";
    }),
  (s, out) =>
    s.replace(new RegExp(String.raw`(?:anything|payments?|transfers?|transactions?|amounts?)\s+(?:above|over|more than|bigger than|larger than|exceeding)\s+(${AMT})\s+(?:should\s+|must\s+|will\s+)?(?:needs?|requires?|takes?|waits? for)\s+(?:a\s+|an\s+|my\s+|our\s+)?(?:second|2nd|extra|another|co-?sign(?:er)?|[a-z]+(?:'s)?)?\s*(?:approval|signature|sign-?off)s?(?:\s+as well)?`, "i"), (_m, a: string) => {
      const v = parseAmount(a);
      if (v) out.push({ k: "cosignAbove", amount: v });
      return " ";
    }),
  // Period caps: "$2,000 a day", "cap daily spending at $2,000", "up to £50 a week".
  (s, out) =>
    s.replace(new RegExp(String.raw`(?:cap|limit)\s+(daily|weekly|monthly)\s+(?:spending|outflow|transfers?|payments?)\s+(?:at|to)\s+(${AMT})`, "i"), (_m, p: string, a: string) => {
      const v = parseAmount(a);
      if (v) out.push({ k: "maxPeriod", amount: v, period: ({ daily: "day", weekly: "week", monthly: "month" } as Record<string, Period>)[p.toLowerCase()] });
      return " ";
    }),
  (s, out) =>
    s.replace(new RegExp(String.raw`(daily|weekly|monthly)\s+(?:spending\s+)?(?:limit|cap|max(?:imum)?)\s+(?:of\s+|at\s+|is\s+)?(${AMT})`, "i"), (_m, p: string, a: string) => {
      const v = parseAmount(a);
      if (v) out.push({ k: "maxPeriod", amount: v, period: ({ daily: "day", weekly: "week", monthly: "month" } as Record<string, Period>)[p.toLowerCase()] });
      return " ";
    }),
  (s, out) =>
    s.replace(new RegExp(String.raw`(?:(?:spend|send|pay|move|transfer|use)\s+)?(?:at most|up to|no more than|max(?:imum)?(?:\s+of)?|under|below|less than)?\s*(${AMT})\s*(?:per|a|an|each|every|/)\s*(day|week|month|24\s*h(?:ours)?)(?:\s+max(?:imum)?)?`, "i"), (_m, a: string, p: string) => {
      const v = parseAmount(a);
      const period: Period = /^w/i.test(p) ? "week" : /^m/i.test(p) ? "month" : "day";
      if (v) out.push({ k: "maxPeriod", amount: v, period });
      return " ";
    }),
  // Per-transfer cap.
  (s, out) =>
    s.replace(new RegExp(String.raw`(?:no|never (?:send|pay)(?: a)?|block(?: any)?|reject(?: any)?)\s+(?:single\s+)?(?:payments?|transfers?|transactions?|amounts?|more)?\s*(?:above|over|more than|bigger than|larger than|exceeding)\s+(${AMT})`, "i"), (_m, a: string) => {
      const v = parseAmount(a);
      if (v) out.push({ k: "maxTx", amount: v });
      return " ";
    }),
  (s, out) =>
    s.replace(new RegExp(String.raw`(?:cap|limit)\s+(?:each|every|any|a|single|one)\s+(?:payment|transfer|transaction)s?\s+(?:at|to)\s+(${AMT})`, "i"), (_m, a: string) => {
      const v = parseAmount(a);
      if (v) out.push({ k: "maxTx", amount: v });
      return " ";
    }),
  (s, out) =>
    s.replace(new RegExp(String.raw`(?:at most|up to|no more than|max(?:imum)?(?:\s+of)?|under|below)\s+(${AMT})\s*(?:per|a|an|each|for each|for any)\s+(?:payment|transfer|transaction|purchase|order)`, "i"), (_m, a: string) => {
      const v = parseAmount(a);
      if (v) out.push({ k: "maxTx", amount: v });
      return " ";
    }),
  // Balance floor.
  (s, out) =>
    s.replace(new RegExp(String.raw`(?:never\s+(?:go|drop|fall|let (?:it|the balance|my balance) (?:drop|fall|go))\s+below(?:\s+a)?|keep\s+(?:a\s+)?(?:minimum\s+)?(?:balance\s+of\s+|reserve\s+of\s+)?(?:at least\s+)?|(?:a\s+)?reserve\s+of|never\s+below\s+(?:a\s+)?|minimum\s+balance\s+(?:of\s+)?)\s*(${AMT})(?:\s+(?:reserve|balance|minimum|in the account))?`, "i"), (_m, a: string) => {
      const v = parseAmount(a);
      if (v) out.push({ k: "floor", amount: v });
      return " ";
    }),
  // Quiet hours.
  (s, out) =>
    s.replace(/\b(?:block|pause|stop|no|freeze)\s+(?:all\s+|any\s+)?(?:transactions?|payments?|transfers?|spending|anything\s+(?:leaving|going out))?\s*overnight\b/i, () => {
      out.push({ k: "quietHours", from: 22, to: 6 });
      return " ";
    }),
  (s, out) =>
    s.replace(/\b(?:block|pause|stop|no|freeze)\s+(?:all\s+|any\s+)?(?:transactions?|payments?|transfers?|spending)?\s*(?:between|from)\s+([0-9: ]+(?:am|pm)?|midnight|noon)\s+(?:and|to|until|-)\s+([0-9: ]+(?:am|pm)?|midnight|noon)/i, (m, a: string, b: string) => {
      const from = parseHour(a);
      const to = parseHour(b);
      if (from === null || to === null || from === to) return m;
      out.push({ k: "quietHours", from, to });
      return " ";
    }),
  (s, out) =>
    s.replace(/\bonly\s+(?:send|pay|spend|transact|move money)?\s*(?:between|from)\s+([0-9: ]+(?:am|pm)?|midnight|noon)\s+(?:and|to|until|-)\s+([0-9: ]+(?:am|pm)?|midnight|noon)/i, (m, a: string, b: string) => {
      const from = parseHour(a);
      const to = parseHour(b);
      if (from === null || to === null || from === to) return m;
      out.push({ k: "quietHours", from: to, to: from });
      return " ";
    }),
  (s, out) =>
    s.replace(/\bonly\s+(?:during|in)\s+(?:business|working|office)\s+hours\b/i, () => {
      out.push({ k: "quietHours", from: 17, to: 9 });
      return " ";
    }),
  // Recall window / settlement delay.
  (s, out) =>
    s.replace(/\brecall\s+(?:a\s+|any\s+|every\s+)?(?:payment|transaction|transfer)s?\s+(?:within|for|up to)\s+(\w+)\s*(minutes?|hours?|h|days?)/i, (m, n: string, u: string) => {
      const c = count(n);
      if (!c) return m;
      out.push({ k: "settleDelay", hours: hoursOf(c, u) });
      return " ";
    }),
  (s, out) =>
    s.replace(/\b(?:hold|delay)\s+(?:every|all|each|outgoing)?\s*(?:payments?|transfers?|transactions?)\s+(?:for\s+)?(\w+)\s*(minutes?|hours?|h|days?)/i, (m, n: string, u: string) => {
      const c = count(n);
      if (!c) return m;
      out.push({ k: "settleDelay", hours: hoursOf(c, u) });
      return " ";
    }),
  // New recipients wait.
  (s, out) =>
    s.replace(/\bnew\s+(?:addresses|recipients|contacts|payees|venues?|addresses?)\s+(?:must\s+|should\s+)?(?:wait|take|need|sit for|cool (?:down )?for)\s+(\w+)\s*(hours?|h|days?)(?:\s+before[^.;]*)?/i, (m, n: string, u: string) => {
      const c = count(n);
      if (!c) return m;
      out.push({ k: "newRecipientWait", hours: hoursOf(c, u) });
      return " ";
    }),
  // Assets.
  (s, out) =>
    s.replace(new RegExp(String.raw`\bonly\s+(?:send|spend|pay(?:\s+out)?(?:\s+in)?|move|use|hold)?\s*(${KNOWN_ASSETS.join("|")})(?:\s*(?:,|and|or)\s*(${KNOWN_ASSETS.join("|")}))*`, "i"), (m) => {
      const found = m.toUpperCase().match(new RegExp(String.raw`\b(${KNOWN_ASSETS.join("|")})\b`, "g")) ?? [];
      out.push({ k: "allowAsset", assets: [...new Set(found)] });
      return " ";
    }),
  // Categories.
  (s, out) =>
    s.replace(/\b(?:never|no|block|can't|cannot|must not)\s+(?:pay\s+for|buy|spend\s+(?:it\s+)?on|reach|go\s+to)\s+(.+?)(?=$|[.;!?]|,?\s+(?:up to|under|below|and never|but)\b)/i, (_m, list: string) => {
      out.push({ k: "blockCategory", categories: categories(list) });
      return " ";
    }),
  (s, out) =>
    s.replace(/\b(?:on|for)\s+([a-z][a-z0-9 -]*?)\s+only\b/i, (_m, list: string) => {
      out.push({ k: "allowCategory", categories: categories(list) });
      return " ";
    }),
  (s, out) =>
    s.replace(/\b(?:only\s+(?:for|on|pay\s+for|buy|spend\s+(?:it\s+)?on)|(?:spendable|usable)\s+only\s+on|(?:pay|buy)\s+(?:for\s+)?(.+?)\s+only)\s*(.*?)(?=$|[.;!?]|,?\s+(?:up to|under|below|at most|max)\b)/i, (m, before: string | undefined, after: string) => {
      const list = (before ?? after ?? "").trim();
      if (!list || /^(?:to|between|from|during|in)\b/i.test(list)) return m;
      out.push({ k: "allowCategory", categories: categories(list) });
      return " ";
    }),
  // Expiry.
  (s, out, _n, now) =>
    s.replace(/\b(?:expires?|expiring|stops? working|lapses?|run out|ends?)\s+(?:in|after)\s+(\w+)\s*(hours?|days?|weeks?|months?|years?)/i, (m, n: string, u: string) => {
      const c = count(n);
      if (!c) return m;
      out.push({ k: "expiresAt", at: now + hoursOf(c, u) * 3_600_000 });
      return " ";
    }),
  (s, out, _n, now) =>
    s.replace(/\b(?:expires?|expiring|stops? working|ends?)\s+on\s+([a-z0-9 ,-]+?)(?=$|[.;!?])/i, (m, d: string) => {
      const at = parseDate(d, now);
      if (at === null) return m;
      out.push({ k: "expiresAt", at });
      return " ";
    }),
  // Lock until a date or for a span.
  (s, out, _n, now) =>
    s.replace(/\b(?:lock|freeze|hold)\s+(?:the\s+|all\s+|my\s+)?(?:funds|money|account|savings|balance)?[^.;]*?\b(?:until|till)\s+([a-z0-9 ,-]+?)(?=$|[.;!?])/i, (m, d: string) => {
      const at = parseDate(d, now);
      if (at === null) return m;
      out.push({ k: "lockedUntil", at });
      return " ";
    }),
  (s, out, _n, now) =>
    s.replace(/\b(?:lock|freeze)\s+(?:the\s+|all\s+|my\s+)?(?:funds|money|account|savings|balance)?\s*for\s+(\w+)\s*(days?|weeks?|months?|years?)/i, (m, n: string, u: string) => {
      const c = count(n);
      if (!c) return m;
      out.push({ k: "lockedUntil", at: now + hoursOf(c, u) * 3_600_000 });
      return " ";
    }),
];

const FILLER =
  /\b(?:please|make it so|make sure|ensure|that|so|my|this|the|account|wallet|i want|i'd like|let|me|can|should|must|will|only|it|funds?|money|and|also|any|all|is|be|able|to|a|an|of|wallet's|account's|ever|at|on|in|for|with|payments?|transfers?|transactions?|send|spend|pay|allow(?:ed)?|as well|well|automatically|max|maximum|cap|limit)\b/gi;

function leftover(s: string) {
  return s.replace(/\b[a-z]+['’]s\b/gi, " ").replace(FILLER, " ").replace(/[^a-z0-9$€£]+/gi, " ").trim();
}

const AGENT = /\b(?:my|the|our|this|research|shopping|trading)\s+(?:\w+\s+)?(?:agent|bot|assistant)\b|\bagents?\b/i;

function parseMeta(text: string): Draft | null {
  const t = text.trim();
  const ref = String.raw`(?:rule\s*#?\s*|r)(\d+)`;
  const remove = t.match(new RegExp(String.raw`^(?:remove|delete|drop|revoke|cancel|repeal)\s+${ref}\b`, "i"));
  if (remove) return { type: "remove", text: t, target: `R${remove[1]}` };

  const frozen =
    t.match(new RegExp(String.raw`${ref}\s+(?:can|may|should|must|will)\s*(?:never|not ever|not)\s+(?:ever\s+)?be\s+(?:changed|removed|amended|deleted|edited|loosened|touched)`, "i")) ??
    t.match(new RegExp(String.raw`(?:freeze|lock)\s+${ref}(?:\s+(?:forever|permanently|for good))?`, "i")) ??
    t.match(new RegExp(String.raw`no\s*one\s+(?:\(?not even me\)?\s+)?(?:can|may)\s+(?:ever\s+)?(?:change|remove|amend|delete)\s+${ref}`, "i"));
  if (frozen) return { type: "meta", text: t, target: `R${frozen[1]}`, approvals: 0, noticeDays: 0, frozen: true };

  const gov = t.match(new RegExp(String.raw`(?:changing|amending|editing|removing|deleting|loosening|any change to|changes to|to change|to remove|to amend)\s+${ref}\s+(?:needs|requires|takes|must have|should need|needs to have)\s+(.+)$`, "i"));
  if (gov) {
    const rest = gov[2];
    const ap = rest.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:approvals?|signatures?|sign-?offs?|of\s+\w+)/i);
    const nd = rest.match(/(\d+|one|two|three|seven|ten|thirty)[\s-]*(day|week|month)s?/i);
    const approvals = ap ? count(ap[1]) ?? 0 : 0;
    const noticeDays = nd ? (count(nd[1]) ?? 0) * (nd[2].toLowerCase() === "week" ? 7 : nd[2].toLowerCase() === "month" ? 30 : 1) : 0;
    if (!approvals && !noticeDays) return null;
    return { type: "meta", text: t, target: `R${gov[1]}`, approvals, noticeDays, frozen: false };
  }
  return null;
}

export const HINTS = [
  "My account can only send to Jack and Coinbase",
  "No single payment above $5,000",
  "Cap daily spending at $2,000",
  "Anything over $1,000 needs a second approval",
  "Block transactions overnight",
  "Let me recall a payment within 8 hours",
  "New addresses wait 24 hours",
  "Never send to 0x000000000000000000000000000000000000dEaD",
  "Keep a reserve of $500",
  "My agent can spend up to $50 a week on API credits only",
  "Changing rule 1 needs 3 approvals and a 30-day notice",
  "Rule 2 can never be removed",
];

export function parseRule(input: string, now = Date.now()): ParseResult {
  const text = input.trim().replace(/\s+/g, " ");
  if (text.length < 4) return { ok: false, error: "Write a rule in one sentence.", hints: HINTS.slice(0, 4) };
  if (text.length > 280) return { ok: false, error: "Keep a rule to one sentence (280 characters).", hints: [] };

  const meta = parseMeta(text);
  if (meta) return { ok: true, draft: meta, notes: [] };

  const scope: Scope = AGENT.test(text) ? "agent" : "all";
  const clauses: Clause[] = [];
  const notes: string[] = [];
  let rest = text.replace(AGENT, " ");
  for (const run of extractors) rest = run(rest, clauses, notes, now);

  const unread = leftover(rest);
  if (clauses.length === 0) {
    return {
      ok: false,
      error: "This sentence does not match a rule the drafter can read yet. Nothing was applied.",
      hints: HINTS,
    };
  }
  for (const c of clauses) {
    if ((c.k === "allowTo" || c.k === "blockTo") && c.parties.length === 0)
      return { ok: false, error: "The recipient list is empty. Name at least one person, service or 0x address.", hints: [HINTS[0]] };
    if ((c.k === "allowCategory" || c.k === "blockCategory") && c.categories.length === 0)
      return { ok: false, error: "No spending category was named.", hints: [HINTS[9]] };
  }
  if (unread && unread.split(" ").length > 1) {
    return {
      ok: false,
      error: `Part of the sentence was not understood ("${unread.slice(0, 60)}"). A rule is applied whole or not at all, so nothing was drafted.`,
      hints: ["Split it into two shorter rules", ...HINTS.slice(0, 3)],
    };
  }
  if (scope === "agent" && clauses.every((c) => c.k === "settleDelay")) notes.push("Recall windows apply to the whole account.");
  return { ok: true, draft: { type: "tx", text, scope, clauses }, notes };
}
