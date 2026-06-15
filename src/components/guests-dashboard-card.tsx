import Link from "next/link"
import { getGuests } from "@/lib/db/guests"

export async function GuestsDashboardCard() {
  const guests = await getGuests()

  // Calculate totals using the same formula as GuestList component
  const totalGuests = guests.length
  const totalChildren = guests.reduce((sum, g) => sum + (g.childrenCount || 0), 0)
  const totalSeats = guests.reduce((sum, g) => {
    return sum + 1 + (g.comingAlone ? 0 : 1) + (g.childrenCount || 0)
  }, 0)

  const hasGuests = guests.length > 0

  return (
    <Link
      href="/guests"
      className="block rounded-lg bg-white p-6 shadow-lg hover:shadow-xl transition-shadow border border-zinc-200 flex flex-col h-full"
    >
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-zinc-900">Goście</h2>

        {hasGuests ? (
          // Filled state: show stats
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600">Liczba zaproszeń:</span>
              <span className="text-sm font-semibold text-zinc-900">{totalGuests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600">Łączna liczba dzieci:</span>
              <span className="text-sm font-semibold text-zinc-900">{totalChildren}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600">Łączna liczba miejsc:</span>
              <span className="text-sm font-semibold text-zinc-900">{totalSeats}</span>
            </div>
          </div>
        ) : (
          // Empty state: show message and CTA
          <>
            <p className="mt-2 text-sm text-zinc-600">
              Nie masz jeszcze żadnych gości.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Dodaj pierwszego gościa, aby rozpocząć listę!
            </p>
          </>
        )}
      </div>
      <button className="mt-4 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
        Zarządzaj gośćmi
      </button>
    </Link>
  )
}
