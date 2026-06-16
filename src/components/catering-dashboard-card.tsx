import Link from "next/link"
import { getCateringSettings, getTotalCateringCost } from "@/lib/db/catering"
import { getMenuItems } from "@/lib/db/catering-menu-items"

export async function CateringDashboardCard() {
  const settings = await getCateringSettings()
  const menuItems = await getMenuItems()
  const totalCateringCost = await getTotalCateringCost()

  const costPerPlate = settings?.costPerPlate ?? 0
  const hasMenuItems = menuItems.length > 0

  return (
    <Link
      href="/catering"
      className="block rounded-lg bg-white p-6 shadow-lg hover:shadow-xl transition-shadow border border-zinc-200 flex flex-col h-full"
    >
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-zinc-900">Catering</h2>

        {hasMenuItems ? (
          // Filled state: show stats
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600">Liczba dań:</span>
              <span className="text-sm font-semibold text-zinc-900">{menuItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600">Koszt za talerz:</span>
              <span className="text-sm font-semibold text-zinc-900">{costPerPlate} zł</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600">Łączny koszt:</span>
              <span className="text-sm font-semibold text-zinc-900">{totalCateringCost} zł</span>
            </div>
          </div>
        ) : (
          // Empty state: show message and CTA
          <>
            <p className="mt-2 text-sm text-zinc-600">
              Nie masz jeszcze żadnych dań.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Dodaj pierwsze danie, aby rozpocząć menu!
            </p>
          </>
        )}
      </div>
      <button className="mt-4 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
        Zarządzaj menu
      </button>
    </Link>
  )
}
