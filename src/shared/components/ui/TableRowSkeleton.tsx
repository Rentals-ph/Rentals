'use client'

interface TableRowSkeletonProps {
  columns?: number
  className?: string
}

/**
 * Single table row skeleton. Use in admin/users, admin/agents while loading.
 */
export function TableRowSkeleton({ columns = 5, className = '' }: TableRowSkeletonProps) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <span
            className="block h-4 rounded bg-gray-200 animate-pulse"
            style={{ width: i === 0 ? 36 : i === columns - 1 ? 80 : '70%' }}
          />
        </td>
      ))}
    </tr>
  )
}

/**
 * Full table body skeleton (header + N rows). Use when entire table is loading.
 */
export function TableSkeleton({
  rows = 5,
  columns = 5,
  className = '',
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <table className={`w-full ${className}`}>
      <thead>
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-4 py-2 text-left">
              <span className="block h-4 w-20 rounded bg-gray-100 animate-pulse" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRowSkeleton key={rowIndex} columns={columns} />
        ))}
      </tbody>
    </table>
  )
}
