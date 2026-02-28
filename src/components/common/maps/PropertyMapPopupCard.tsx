import Link from 'next/link'

interface PropertyMapPopupCardProps {
  id?: number | string
  title?: string | null
  type?: string | null
  location?: string | null
  priceLabel?: string | null
  imageUrl?: string | null
  className?: string
}

export default function PropertyMapPopupCard({
  id,
  title,
  type,
  location,
  priceLabel,
  imageUrl,
  className = '',
}: PropertyMapPopupCardProps) {
  const safeTitle = title || 'Property'
  const safeType = type || 'Property'
  const safeLocation = location || 'Location not specified'

  return (
    <article
      className={`flex h-full w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.15)] ${className}`}
    >
      <div className="relative h-40 w-full overflow-hidden bg-slate-100 sm:h-44">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={safeTitle}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="h-full w-full bg-slate-200" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600">
          {safeType}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          {safeTitle}
        </h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
          {safeLocation}
        </p>
        {priceLabel && (
          <p className="mt-1 text-base font-bold text-slate-900">
            {priceLabel}
          </p>
        )}

        {id && (
          <div className="mt-2">
            <Link
              href={`/property/${id}`}
              className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_2px_8px_rgba(37,99,235,0.35)] transition hover:bg-blue-700"
            >
              View details
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}

