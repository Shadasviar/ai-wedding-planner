"use client"

import { useEffect, useState } from "react"
import type { CateringMenuItem } from "@/lib/db/schema"

interface EditCateringMenuItemModalProps {
  menuItem: CateringMenuItem | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function EditCateringMenuItemModal({
  menuItem,
  isOpen,
  onClose,
  onSave,
}: EditCateringMenuItemModalProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState("przekąska")
  const [customType, setCustomType] = useState("")
  const [isVege, setIsVege] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (menuItem) {
      setName(menuItem.name)
      setType(menuItem.type)
      setCustomType(menuItem.customType || "")
      setIsVege(menuItem.isVege)
    }
  }, [menuItem])

  if (!isOpen || !menuItem) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Nazwa dania jest wymagana")
      return
    }

    if (type === "inne" && !customType.trim()) {
      setError("Wpisz własny typ dania")
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/catering-menu-items/${menuItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          customType: type === "inne" ? customType.trim() : null,
          isVege,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nie udało się zaktualizować dania")
      }

      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setError("")
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-900">Edytuj danie</h2>

        {error && (
          <div className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-semibold text-zinc-800">
              Nazwa dania
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="np. Rosół, Schabowy"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label htmlFor="edit-type" className="block text-sm font-semibold text-zinc-800">
              Typ dania
            </label>
            <select
              id="edit-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              disabled={isSubmitting}
            >
              <option value="przekąska">Przekąska</option>
              <option value="danie_ciepłe">Danie ciepłe</option>
              <option value="przystawka">Przystawka</option>
              <option value="inne">Inne</option>
            </select>
          </div>

          {type === "inne" && (
            <div>
              <label htmlFor="edit-customType" className="block text-sm font-semibold text-zinc-800">
                Własny typ dania
              </label>
              <input
                id="edit-customType"
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="np. Deser, Napój"
                disabled={isSubmitting}
              />
            </div>
          )}

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isVege}
                onChange={(e) => setIsVege(e.target.checked)}
                disabled={isSubmitting}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <span className="text-sm text-zinc-700">Czy wegetariańskie?</span>
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-zinc-900 px-4 py-2 font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
