"use client"

import { useState } from "react"
import type { Service } from "@/lib/db/schema"
import { AddServiceModal } from "@/components/add-service-modal"
import { EditServiceModal } from "./edit-service-modal"
import { DeleteServiceModal } from "./delete-service-modal"

interface ServicesListProps {
  services: Service[]
  onRefresh: () => void
}

export function ServicesList({ services, onRefresh }: ServicesListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingService, setDeletingService] = useState<Service | null>(null)

  // Calculate totals
  const totalServices = services.length
  const totalCost = services.reduce((sum, s) => sum + (s.cost || 0), 0)
  const totalPaid = services.reduce((sum, s) => sum + (s.paidAmount || 0), 0)
  const totalRemaining = totalCost - totalPaid

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-zinc-900">
          Nie masz jeszcze żadnych usług.
        </h3>
        <p className="mt-2 text-sm text-zinc-600">
          Dodaj pierwszą usługę, aby rozpocząć listę!
        </p>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="mt-6 rounded-md bg-zinc-900 px-6 py-2 font-semibold text-white hover:bg-zinc-800"
        >
          Dodaj usługę
        </button>
        <AddServiceModal
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
        <h2 className="text-xl font-semibold text-zinc-900">Usługi</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-md bg-zinc-900 px-4 py-2 font-semibold text-white hover:bg-zinc-800"
        >
          Dodaj usługę
        </button>
      </div>

      {/* Service cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-lg bg-white p-4 shadow-md border border-zinc-200"
          >
            <h3 className="text-lg font-semibold text-zinc-900">
              {service.name}
            </h3>

            {/* Cost breakdown */}
            <div className="mt-2">
              <p className="text-sm text-zinc-600">
                <span className="font-medium">Opłacone:</span> {service.paidAmount || 0} zł / {service.cost || 0} zł
              </p>
            </div>

            {/* Notes */}
            {service.notes && service.notes.trim() && (
              <div className="mt-2">
                <p className="text-sm text-zinc-600 italic">
                  {service.notes}
                </p>
              </div>
            )}

            {/* Deadline */}
            {service.deadline && (
              <div className="mt-2">
                <p className="text-sm text-zinc-600">
                  <span className="font-medium">Termin:</span> {formatDate(service.deadline)}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setEditingService(service)}
                className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Edytuj
              </button>
              <button
                onClick={() => setDeletingService(service)}
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
            <span className="text-zinc-600">Liczba usług:</span>
            <p className="text-lg font-semibold text-zinc-900">{totalServices}</p>
          </div>
          <div>
            <span className="text-zinc-600">Łączny koszt:</span>
            <p className="text-lg font-semibold text-zinc-900">{totalCost} zł</p>
          </div>
          <div>
            <span className="text-zinc-600">Łącznie opłacono:</span>
            <p className="text-lg font-semibold text-zinc-900">{totalPaid} zł</p>
          </div>
          <div>
            <span className="text-zinc-600">Do zapłaty:</span>
            <p className="text-lg font-semibold text-zinc-900">{totalRemaining} zł</p>
          </div>
        </div>
      </div>

      <AddServiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRefresh={onRefresh}
      />

      <EditServiceModal
        service={editingService}
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        onSave={() => {
          setEditingService(null)
          onRefresh()
        }}
      />

      <DeleteServiceModal
        serviceName={deletingService?.name || ""}
        isOpen={!!deletingService}
        onClose={() => setDeletingService(null)}
        onConfirm={async () => {
          if (!deletingService) return
          try {
            const response = await fetch(`/api/services/${deletingService.id}`, {
              method: "DELETE",
            })
            if (!response.ok) {
              const data = await response.json()
              throw new Error(data.error || "Nie udało się usunąć usługi")
            }
            onRefresh()
            setDeletingService(null)
          } catch (error) {
            console.error("Failed to delete service:", error)
            alert(error instanceof Error ? error.message : "Nie udało się usunąć usługi")
          }
        }}
      />
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}
