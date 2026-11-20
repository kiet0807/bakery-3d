import { DELIVERY_AREAS } from '@/lib/shop'

/** The districts the shop delivers to, as chips. Place names stay Vietnamese in both languages. */
export function DeliveryAreas({ className = '' }: { className?: string }) {
  return (
    <ul lang="vi" className={`flex flex-wrap gap-2 ${className}`}>
      {DELIVERY_AREAS.map((area) => (
        <li key={area} className="rounded-full border border-line bg-surface px-3 py-1 text-sm font-semibold">
          {area}
        </li>
      ))}
    </ul>
  )
}
