/* Drawn explanations. Each one shows a mechanism from the product, not decoration. */

const SANS = "var(--font-schibsted), Helvetica, Arial, sans-serif";
const MONO = "var(--font-plex-mono), Menlo, monospace";

/** A signed transfer meets the rule set; one path settles, one is refused at R1. */
export function TransferDiagram() {
  const gates = [
    { id: "R1", f: "to ∈ {Jack, Coinbase}", y: 92 },
    { id: "R2", f: "spent(24h) + amount ≤ 2000", y: 172 },
    { id: "R3", f: "amount > 5000 → cosigned", y: 252 },
  ];
  return (
    <figure className="draw" aria-labelledby="transfer-diagram-cap">
      <svg viewBox="0 0 600 380" className="h-auto w-full" role="img" aria-label="Two transfers signed with the same key. One to Jack passes all three rules and settles. One to an unknown address fails R1 and is refused.">
        <g fontFamily={SANS}>
          {/* signer */}
          <rect x="8" y="150" width="152" height="66" rx="8" fill="none" stroke="rgba(220,230,245,0.35)" />
          <text x="24" y="176" fill="#eef2f6" fontSize="14" fontWeight="600">Any key signs</text>
          <text x="24" y="198" fill="#8f9cae" fontSize="12.5">yours, or a stolen one</text>

          {/* rule column */}
          <rect x="204" y="56" width="236" height="236" rx="8" fill="rgba(220,230,245,0.04)" stroke="rgba(220,230,245,0.22)" />
          <text x="220" y="44" fill="#8f9cae" fontSize="12.5">Your rule set, checked in order</text>
          {gates.map((g) => (
            <g key={g.id}>
              <rect x="216" y={g.y - 22} width="212" height="50" rx="6" fill="#16264a" stroke="rgba(220,230,245,0.18)" />
              <text x="228" y={g.y - 2} fill="#74d6c3" fontSize="12" fontFamily={MONO}>{g.id}</text>
              <text x="228" y={g.y + 16} fill="#d6deea" fontSize="11.5" fontFamily={MONO}>{g.f}</text>
            </g>
          ))}

          {/* settles path */}
          <path className="trace" d="M160 172 C 190 172, 186 100, 216 100" fill="none" stroke="#74d6c3" strokeWidth="2" />
          <path className="trace" d="M428 270 C 456 270, 452 300, 470 300" fill="none" stroke="#74d6c3" strokeWidth="2" />
          <rect x="470" y="278" width="122" height="44" rx="6" fill="rgba(116,214,195,0.12)" stroke="#74d6c3" />
          <text x="484" y="298" fill="#a3e6d9" fontSize="13.5" fontWeight="600">Settles</text>
          <text x="484" y="314" fill="#8f9cae" fontSize="11.5">$400 to Jack</text>

          {/* refused path */}
          <path d="M160 196 C 190 196, 186 112, 216 112" fill="none" stroke="#f39283" strokeWidth="2" strokeDasharray="5 5" />
          <path d="M428 92 C 456 92, 452 66, 470 66" fill="none" stroke="#f39283" strokeWidth="2" strokeDasharray="5 5" />
          <rect x="470" y="44" width="122" height="44" rx="6" fill="rgba(243,146,131,0.1)" stroke="#f39283" />
          <text x="484" y="64" fill="#f6b3a8" fontSize="13.5" fontWeight="600">Refused</text>
          <text x="484" y="80" fill="#8f9cae" fontSize="11.5">at R1</text>

          <text x="8" y="352" fill="#8f9cae" fontSize="12.5">The key only proposes. The rules decide whether money moves.</text>
        </g>
      </svg>
      <figcaption id="transfer-diagram-cap" className="sr-only">How a transfer is checked against a rule set</figcaption>
    </figure>
  );
}

/** Three rules, each governing the one before it. */
export function ChainDiagram() {
  const rules = [
    { id: "R1", head: "The rule", text: "Only sends to my two children.", f: "to ∈ {Ana, Leo}", x: 0 },
    { id: "R2", head: "Who can change R1", text: "3 approvals, 30 days' notice.", f: "amend(R1) → approvals ≥ 3 ∧ notice ≥ 30d", x: 420 },
    { id: "R3", head: "What locks R2", text: "R2 can never be removed.", f: "amend(R2) → ⊥", x: 840 },
  ];
  return (
    <figure aria-label="Rule chain: R3 locks R2, R2 governs changes to R1">
      <div className="hidden md:block">
        <svg viewBox="0 0 1180 250" className="h-auto w-full" role="img" aria-label="R1 is the rule. R2 says changing R1 needs three approvals and 30 days. R3 says R2 can never be removed.">
          <g fontFamily={SANS}>
            {rules.map((r, i) => (
              <g key={r.id} transform={`translate(${r.x} 30)`}>
                <rect width="340" height="170" rx="10" fill="#ffffff" stroke={i === 0 ? "#0e7c6b" : "#d5dbe1"} strokeWidth={i === 0 ? 1.5 : 1} />
                <text x="24" y="38" fill={i === 0 ? "#0e7c6b" : "#5b46ad"} fontSize="15" fontWeight="700" fontFamily={MONO}>{r.id}</text>
                <text x="70" y="38" fill="#465160" fontSize="14.5" fontWeight="600">{r.head}</text>
                <text x="24" y="82" fill="#121821" fontSize="17" fontWeight="600">{r.text}</text>
                <rect x="24" y="110" width="292" height="36" rx="5" fill="#f2f4f6" />
                <text x="34" y="133" fill="#08483f" fontSize="11.5" fontFamily={MONO}>{r.f}</text>
              </g>
            ))}
            {[0, 1].map((i) => (
              <g key={i}>
                <path d={`M${420 * (i + 1) - 2} 145 L${340 + 420 * i + 4} 145`} stroke="#5b46ad" strokeWidth="1.5" markerEnd="url(#arrow)" fill="none" />
                <text x={380 + 420 * i} y="133" textAnchor="middle" fill="#5b46ad" fontSize="12.5" fontWeight="600">governs</text>
              </g>
            ))}
            <text x="0" y="236" fill="#66717f" fontSize="14">Read right to left: to loosen R1 you must first get past R2, and R3 says R2 stays.</text>
          </g>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="#5b46ad" />
            </marker>
          </defs>
        </svg>
      </div>
      <ol className="grid grid-cols-1 gap-3 md:hidden">
        {rules.map((r, i) => (
          <li key={r.id} className={`rounded-[10px] border bg-g2 p-5 ${i === 0 ? "border-acc" : "border-line"}`}>
            <p className="text-[14.5px] font-semibold text-ink-2"><span className={`mr-2 font-mono ${i === 0 ? "text-acc" : "text-violet"}`}>{r.id}</span>{r.head}</p>
            <p className="mt-2 text-[18px] font-semibold">{r.text}</p>
            <p className="formula mt-3 rounded-[5px] bg-g3 px-3 py-2">{r.f}</p>
            {i > 0 ? <p className="mt-2 text-[13.5px] font-semibold text-violet">governs R{i}</p> : null}
          </li>
        ))}
      </ol>
    </figure>
  );
}

/** Three household accounts, each with the rule that protects it. */
export function AccountSlips() {
  const slips = [
    { who: "Personal account", rule: "Sends only to an approved list", f: "to ∈ approved", tilt: "" },
    { who: "Mum's account", rule: "Pays the grandchildren and nobody else", f: "to ∈ {Ana, Leo}", tilt: "lg:ml-12" },
    { who: "Kid's account", rule: "$10 a day, raised only with a parent", f: "spent(24h) + amount ≤ 10", tilt: "lg:ml-5" },
  ];
  return (
    <ul className="grid grid-cols-1 gap-3" aria-label="Example accounts and their rules">
      {slips.map((s) => (
        <li key={s.who} className={`rounded-[10px] border border-line bg-g2 p-5 ${s.tilt}`}>
          <p className="text-[13.5px] font-semibold text-ink-3">{s.who}</p>
          <p className="mt-1 text-[18px] font-semibold leading-[1.3] text-ink">{s.rule}</p>
          <p className="formula mt-2">{s.f}</p>
        </li>
      ))}
    </ul>
  );
}
