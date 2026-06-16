"use client"

import { useState } from "react"

interface DeleteCateringMenuItemModalProps {
  menuItemName: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteCateringMenuItemModal({
  menuItemName,
  isOpen,
  onClose,
  onConfirm,
}: DeleteCateringMenuItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsSubmitting(true)
    await onConfirm()
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-900">Usuń danie</h2>

        <div className="mt-4">
          <p className="text-sm text-zinc-700">
            Czy na pewno chcesz usunąć danie: <span className="font-semibold">{menuItemName}</span>?
          </p>
          <p className="mt-2 text-xs text-red-600">
            Tej operacji nie można cofnąć.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? "Usuwanie..." : "Usuń"}
          </button>
        </div>
      </div>
    </div>
  )
}
