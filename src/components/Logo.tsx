/** A line-drawn cake slice under a little cloud. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf9f4" />
          <stop offset="1" stopColor="#8ea2ff" />
        </linearGradient>
      </defs>
      <path
        d="M10 11.5a3 3 0 0 1 3-3c.5-1.7 2-2.8 3.7-2.6 1.7.1 3 1.4 3.2 3.1a2.6 2.6 0 0 1 2.3 2.6H10.6"
        stroke="url(#logo-gradient)"
        strokeWidth="1.6"
      />
      <path
        d="M6 18.5 26 15v9.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"
        stroke="url(#logo-gradient)"
        strokeWidth="1.6"
      />
      <path d="M6 22l20-3.2" stroke="#ff8ab4" strokeWidth="1.6" />
    </svg>
  )
}
