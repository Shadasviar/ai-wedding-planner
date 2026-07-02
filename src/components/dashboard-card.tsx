"use client"

import Link from "next/link"

interface DashboardCardProps {
  title: string
  emptyMessage: string
  ctaLabel: string
  href: string
  totalCost?: number
}

export function DashboardCard({ title, emptyMessage, ctaLabel, href, totalCost }: DashboardCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-lg bg-white p-6 shadow-lg hover:shadow-xl transition-shadow border border-zinc-200"
    >
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-2 text-sm text-zinc-600">{emptyMessage}</p>

      {totalCost !== undefined && (
        <p className="mt-2 text-2xl font-bold text-zinc-900">{totalCost} zł</p>
      )}

      <button
        className="mt-4 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        {ctaLabel}
      </button>
    </Link>
  )
}
