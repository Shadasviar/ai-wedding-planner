"use client"

import { useState } from "react"
import type { Guest } from "@/lib/db/schema"
import { AddGuestModal } from "./add-guest-modal"
import { EditGuestModal } from "./edit-guest-modal"
import { DeleteGuestModal } from "./delete-guest-modal"

interface GuestListProps {
  guests: Guest[]
  onRefresh: () => void
}

export function GuestList({ guests, onRefresh }: GuestListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [deletingGuest, setDeletingGuest] = useState<Guest | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Calculate totals
  // Default: each guest has a partner slot, unless comingAlone=true
  const totalGuests = guests.length
  const totalWithPartner = guests.filter((g) => !g.comingAlone).length // Guests with partner slot (default)
  const totalAlone = guests.filter((g) => g.comingAlone).length // Guests explicitly coming alone
  const totalPartners = totalWithPartner
  const totalChildren = guests.reduce((sum, g) => sum + (g.childrenCount || 0), 0)
  // Seats: each guest (1) + partner slot if not comingAlone (1 or 0) + children
  const totalSeats = guests.reduce((sum, g) => {
    return sum + 1 + (g.comingAlone ? 0 : 1) + (g.childrenCount || 0)
  }, 0)

  if (guests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-lg font-semibold text-zinc-900">
          Nie masz jeszcze żadnych gości.
        </h3>
        <p className="mt-2 text-sm text-zinc-600">
          Dodaj pierwszego gościa, aby rozpocząć listę!
        </p>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="mt-6 rounded-md bg-zinc-900 px-6 py-2 font-semibold text-white hover:bg-zinc-800"
        >
          Dodaj gościa
        </button>
        <AddGuestModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={onRefresh}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with add button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900">Goście</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-md bg-zinc-900 px-4 py-2 font-semibold text-white hover:bg-zinc-800"
        >
          Dodaj gościa
        </button>
      </div>

      {/* Guest cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guests.map((guest) => {
          const hasSpouse = !!guest.spouseName
          const isComingAlone = guest.comingAlone
          // Each guest has: 1 (self) + 1 (partner slot unless comingAlone) + children
          const totalPersons = 1 + (isComingAlone ? 0 : 1) + (guest.childrenCount || 0)

          return (
            <div
              key={guest.id}
              className="rounded-lg bg-white p-4 shadow-md border border-zinc-200"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {guest.name}
              </h3>

              {!isComingAlone ? (
                <p className="mt-2 text-sm text-zinc-600">
                  {hasSpouse ? (
                    <>
                      <span className="font-medium">Małżonek:</span> {guest.spouseName}
                    </>
                  ) : (
                    <span className="font-medium">Osoba towarzysząca</span>
                  )}
                </p>
              ) : (
                <p className="mt-2 text-sm text-zinc-600">
                  <span className="font-medium text-zinc-400">(bez osoby towarzyszącej)</span>
                </p>
              )}

              {guest.childrenCount !== undefined && guest.childrenCount > 0 && (
                <p className="mt-1 text-sm text-zinc-600">
                  <span className="font-medium">Dzieci:</span> {guest.childrenCount}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-zinc-100">
                <p className="text-sm font-semibold text-zinc-900">
                  Łącznie: {totalPersons} osób
                </p>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setEditingGuest(guest)}
                  className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Edytuj
                </button>
                <button
                  onClick={() => setDeletingGuest(guest)}
                  className="flex-1 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Usuń
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Aggregate summary */}
      <div className="rounded-lg bg-zinc-50 p-4 border border-zinc-200">
        <h4 className="font-semibold text-zinc-900 mb-3">Podsumowanie</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-zinc-600">Liczba zaproszeń:</span>
            <p className="text-lg font-semibold text-zinc-900">{totalGuests}</p>
          </div>
          <div>
            <span className="text-zinc-600">Z osobą towarzyszącą:</span>
            <p className="text-lg font-semibold text-zinc-900">{totalPartners}</p>
          </div>
          <div>
            <span className="text-zinc-600">Łączna liczba dzieci:</span>
            <p className="text-lg font-semibold text-zinc-900">{totalChildren}</p>
          </div>
          <div>
            <span className="text-zinc-600">Łączna liczba miejsc:</span>
            <p className="text-lg font-semibold text-zinc-900">{totalSeats}</p>
          </div>
        </div>
      </div>

      <AddGuestModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={onRefresh}
      />

      <EditGuestModal
        guest={editingGuest}
        isOpen={!!editingGuest}
        onClose={() => setEditingGuest(null)}
        onSave={() => {
          setEditingGuest(null)
          onRefresh()
        }}
      />

      <DeleteGuestModal
        guestName={deletingGuest?.name || ""}
        isOpen={!!deletingGuest}
        onClose={() => setDeletingGuest(null)}
        onConfirm={async () => {
          if (!deletingGuest) return
          setIsDeleting(true)
          try {
            const response = await fetch(`/api/guests/${deletingGuest.id}`, {
              method: "DELETE",
            })
            if (!response.ok) {
              const data = await response.json()
              throw new Error(data.error || "Nie udało się usunąć gościa")
            }
            onRefresh()
            setDeletingGuest(null)
          } catch (error) {
            console.error("Failed to delete guest:", error)
            alert(error instanceof Error ? error.message : "Nie udało się usunąć gościa")
          } finally {
            setIsDeleting(false)
          }
        }}
      />
    </div>
  )
}
