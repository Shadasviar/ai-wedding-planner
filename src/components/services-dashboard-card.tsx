import Link from "next/link"
import { getServices } from "@/lib/db/services"

export async function ServicesDashboardCard() {
  const services = await getServices()

  // Calculate totals
  const totalServices = services.length
  const totalCost = services.reduce((sum, s) => sum + (s.cost || 0), 0)
  const totalPaid = services.reduce((sum, s) => sum + (s.paidAmount || 0), 0)
  const totalRemaining = totalCost - totalPaid

  const hasServices = services.length > 0

  return (
    <Link
      href="/services"
      className="block rounded-lg bg-white p-6 shadow-lg hover:shadow-xl transition-shadow border border-zinc-200 flex flex-col h-full"
    >
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-zinc-900">Usługi</h2>

        {hasServices ? (
          // Filled state: show stats
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600">Liczba usług:</span>
              <span className="text-sm font-semibold text-zinc-900">{totalServices}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600">Łączny koszt:</span>
              <span className="text-sm font-semibold text-zinc-900">{totalCost} zł</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600">Już opłacono:</span>
              <span className="text-sm font-semibold text-zinc-900">{totalPaid} zł</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600">Do zapłaty:</span>
              <span className="text-sm font-semibold text-zinc-900">{totalRemaining} zł</span>
            </div>
          </div>
        ) : (
          // Empty state: show message and CTA
          <>
            <p className="mt-2 text-sm text-zinc-600">
              Nie masz jeszcze żadnych usług.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Dodaj pierwszą usługę, aby rozpocząć listę!
            </p>
          </>
        )}
      </div>
      <button className="mt-4 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
        Zarządzaj usługami
      </button>
    </Link>
  )
}
