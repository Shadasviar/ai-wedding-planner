"use client"

import { useState } from "react"

interface DeleteGuestModalProps {
  guestName: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteGuestModal({ guestName, isOpen, onClose, onConfirm }: DeleteGuestModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    await onConfirm()
    setIsDeleting(false)
  }

  const handleClose = () => {
    if (!isDeleting) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-900">Usuń gościa</h2>

        <div className="mt-4">
          <p className="text-sm text-zinc-600">
            Czy na pewno chcesz usunąć gościa: <span className="font-semibold text-zinc-900">{guestName}</span>?
          </p>
          <p className="mt-2 text-sm text-red-600 font-medium">
            Tej operacji nie można cofnąć.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
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
