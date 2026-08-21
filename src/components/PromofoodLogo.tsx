interface Props {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

/**
 * Approximate recreation of the Promofood mark (blue-to-teal diamond with a
 * green leaf accent) — swap for the real asset in /public once available.
 */
export default function PromofoodLogo({ size = 28, withWordmark = false, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="pf-diamond" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5BC2E8" />
            <stop offset="100%" stopColor="#1C7FB8" />
          </linearGradient>
        </defs>
        <rect x="18" y="18" width="64" height="64" rx="14" transform="rotate(45 50 50)" fill="url(#pf-diamond)" />
        <path d="M50 28 C59 39 59 56 50 70 C41 56 41 39 50 28 Z" fill="#ffffff" opacity="0.92" />
        <path d="M50 34 C61 41 63 52 55 63 C58 51 53 42 50 34 Z" fill="#7CB93E" />
      </svg>
      {withWordmark && (
        <span className="text-lg font-semibold" style={{ color: "var(--brand)" }}>
          Promofood
        </span>
      )}
    </span>
  );
}
