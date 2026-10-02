type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ArrowRight = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="M3.5 8h9M8.5 4l4 4-4 4" />
  </svg>
);
export const ArrowUpRight = ({ className = "size-3.5" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="M5 11l6-6M6 5h5v5" />
  </svg>
);
export const CheckIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);
export const ChevronDownIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="M4 6l4 4 4-4" />
  </svg>
);
export const CloseIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);
export const CopyIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 3.5v-.5a1 1 0 00-1-1h-6a1 1 0 00-1 1v6a1 1 0 001 1h.5" />
  </svg>
);
export const LogOutIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="M6 13.5H3.5a1 1 0 01-1-1v-9a1 1 0 011-1H6M10.5 11l3-3-3-3M13.5 8H6" />
  </svg>
);
export const WalletIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <rect x="2" y="4" width="12" height="9" rx="1.8" />
    <path d="M2 6.5h12M10.5 9.5h1.5" />
  </svg>
);
export const AlertIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 5v3.5M8 11h.01" />
  </svg>
);
export const MenuIcon = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 20 20" className={className} {...base}>
    <path d="M3 6.5h14M3 13.5h14" />
  </svg>
);
export const InfoIcon = ({ className = "size-3.5" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <circle cx="8" cy="8" r="6.2" />
    <path d="M8 7.2v3.6M8 5.2h.01" />
  </svg>
);
export const XIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
export const GithubIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 007.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 015.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

/* App sidebar glyphs */
