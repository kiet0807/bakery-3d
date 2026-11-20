import type { ReactNode } from 'react'

/** An eyebrow and a heading whose last words get the butter highlighter. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  accent,
  level = 2,
  className = '',
  children,
}: {
  id: string
  eyebrow?: string
  title: string
  accent?: string
  level?: 1 | 2
  className?: string
  children?: ReactNode
}) {
  const Heading = level === 1 ? 'h1' : 'h2'
  return (
    <div className={`space-y-3 ${className}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Heading
        id={id}
        className={`font-display leading-[1.05] font-extrabold tracking-tight ${
          level === 1 ? 'text-[clamp(2.4rem,6vw,4.2rem)]' : 'text-[clamp(2rem,4.4vw,3.4rem)]'
        }`}
      >
        {title}
        {accent && <span className="mark">{accent}</span>}
      </Heading>
      {children}
    </div>
  )
}
