"use client"

import { useState } from "react"

interface DeleteServiceModalProps {
  serviceName: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteServiceModal({ serviceName, isOpen, onClose, onConfirm }: DeleteServiceModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    await onConfirm()
    setIsDeleting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-900">Usuń usługę</h2>

        <div className="mt-4">
          <p className="text-zinc-700">
            Czy na pewno chcesz usunąć usługę: <span className="font-semibold">{serviceName}</span>?
          </p>
          <p className="mt-2 text-sm text-red-600 font-medium">
            Tej operacji nie można cofnąć.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </button>
        </div>
      </div>
    </div>
  )
}
