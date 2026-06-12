"use client"

interface DashboardCardProps {
  title: string
  emptyMessage: string
  ctaLabel: string
  href: string
}

export function DashboardCard({ title, emptyMessage, ctaLabel, href }: DashboardCardProps) {
  return (
    <a
      href={href}
      onClick={(e) => e.preventDefault()}
      className="block rounded-lg bg-white p-6 shadow-lg hover:shadow-xl transition-shadow border border-zinc-200"
    >
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-2 text-sm text-zinc-600">{emptyMessage}</p>
      <button
        disabled
        className="mt-4 w-full rounded-md bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-500 cursor-not-allowed"
        title="Coming in next update"
      >
        {ctaLabel}
      </button>
    </a>
  )
}
