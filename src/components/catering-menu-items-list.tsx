"use client"

import { useState, useEffect } from "react"
import type { CateringMenuItem, Guest } from "@/lib/db/schema"
import { AddCateringMenuItemModal } from "@/components/add-catering-menu-item-modal"
import { EditCateringMenuItemModal } from "./edit-catering-menu-item-modal"
import { DeleteCateringMenuItemModal } from "./delete-catering-menu-item-modal"

interface CateringMenuItemsListProps {
  menuItems: CateringMenuItem[]
  costPerPlate: number
  onRefresh: () => void
}

export function CateringMenuItemsList({
  menuItems,
  costPerPlate,
  onRefresh,
}: CateringMenuItemsListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<CateringMenuItem | null>(null)
  const [deletingMenuItem, setDeletingMenuItem] = useState<CateringMenuItem | null>(null)

  // Calculate totals
  const totalItems = menuItems.length

  // Get total seats count for total catering cost calculation
  const [totalSeats, setTotalSeats] = useState<number>(0)

  // Fetch guest count and calculate total seats on mount
  useEffect(() => {
    fetch("/api/guests")
      .then((res) => res.json())
      .then((guests: Guest[]) => {
        // Calculate total seats: each guest (1) + partner slot if not comingAlone (1 or 0) + children
        const seats = guests.reduce((sum: number, g: Guest) => {
          return sum + 1 + (g.comingAlone ? 0 : 1) + (g.childrenCount || 0)
        }, 0)
        setTotalSeats(seats)
      })
      .catch(() => setTotalSeats(0))
  }, [])

  const totalCateringCost = costPerPlate * totalSeats

  // Type display mapping
  const typeDisplay: Record<string, string> = {
    przekąska: "Przekąska",
    danie_ciepłe: "Danie ciepłe",
    przystawka: "Przystawka",
    inne: "Inne",
  }

  if (menuItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🍽️</div>
        <h3 className="text-lg font-semibold text-zinc-900">
          Nie masz jeszcze żadnych dań.
        </h3>
        <p className="mt-2 text-sm text-zinc-600">
          Dodaj pierwsze danie, aby rozpocząć menu!
        </p>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="mt-6 rounded-md bg-zinc-900 px-6 py-2 font-semibold text-white hover:bg-zinc-800"
        >
          Dodaj danie
        </button>
        <AddCateringMenuItemModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onRefresh={onRefresh}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with add button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900">Menu</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-md bg-zinc-900 px-4 py-2 font-semibold text-white hover:bg-zinc-800"
        >
          Dodaj danie
        </button>
      </div>

      {/* Menu item cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="rounded-lg bg-white p-4 shadow-md border border-zinc-200 flex flex-col h-full"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">
                {item.name}
              </h3>
              {item.isVege && (
                <span className="text-xl" title="Wegetariańskie">🌱</span>
              )}
            </div>

            {/* Type badge */}
            <div className="mt-2">
              <span className="inline-block rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                {typeDisplay[item.type] || item.type}
              </span>
              {item.type === "inne" && item.customType && (
                <span className="ml-2 text-xs text-zinc-500 italic">
                  ({item.customType})
                </span>
              )}
            </div>

            {/* Action buttons - pushed to bottom */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setEditingMenuItem(item)}
                className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Edytuj
              </button>
              <button
                onClick={() => setDeletingMenuItem(item)}
                className="flex-1 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Usuń
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Aggregate summary */}
      <div className="rounded-lg bg-zinc-50 p-4 border border-zinc-200">
        <h4 className="font-semibold text-zinc-900 mb-3">Podsumowanie</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-zinc-600">Liczba dań:</span>
            <p className="text-lg font-semibold text-zinc-900">{totalItems}</p>
          </div>
          <div>
            <span className="text-zinc-600">Koszt za talerz:</span>
            <p className="text-lg font-semibold text-zinc-900">{costPerPlate} zł</p>
          </div>
          <div>
            <span className="text-zinc-600">Łączna liczba miejsc:</span>
            <p className="text-lg font-semibold text-zinc-900">{totalSeats}</p>
          </div>
          <div>
            <span className="text-zinc-600">Łączny koszt cateringu:</span>
            <p className="text-lg font-semibold text-zinc-900">{totalCateringCost} zł</p>
          </div>
        </div>
      </div>

      <AddCateringMenuItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRefresh={onRefresh}
      />

      <EditCateringMenuItemModal
        menuItem={editingMenuItem}
        isOpen={!!editingMenuItem}
        onClose={() => setEditingMenuItem(null)}
        onSave={() => {
          setEditingMenuItem(null)
          onRefresh()
        }}
      />

      <DeleteCateringMenuItemModal
        menuItemName={deletingMenuItem?.name || ""}
        isOpen={!!deletingMenuItem}
        onClose={() => setDeletingMenuItem(null)}
        onConfirm={async () => {
          if (!deletingMenuItem) return
          try {
            const response = await fetch(`/api/catering-menu-items/${deletingMenuItem.id}`, {
              method: "DELETE",
            })
            if (!response.ok) {
              const data = await response.json()
              throw new Error(data.error || "Nie udało się usunąć dania")
            }
            onRefresh()
            setDeletingMenuItem(null)
          } catch (error) {
            console.error("Failed to delete menu item:", error)
            alert(error instanceof Error ? error.message : "Nie udało się usunąć dania")
          }
        }}
      />
    </div>
  )
}
