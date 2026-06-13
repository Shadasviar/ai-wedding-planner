"use client"

import { useState, useEffect } from "react"
import type { Guest } from "@/lib/db/schema"

interface EditGuestModalProps {
  guest: Guest | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function EditGuestModal({ guest, isOpen, onClose, onSave }: EditGuestModalProps) {
  const [name, setName] = useState("")
  const [hasPartner, setHasPartner] = useState(true)
  const [spouseName, setSpouseName] = useState("")
  const [childrenCount, setChildrenCount] = useState(0)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Populate form when guest changes
  useEffect(() => {
    if (guest) {
      setName(guest.name)
      setHasPartner(!guest.comingAlone)
      setSpouseName(guest.spouseName || "")
      setChildrenCount(guest.childrenCount || 0)
    }
  }, [guest])

  if (!isOpen || !guest) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Imię i nazwisko jest wymagane")
      return
    }

    if (childrenCount < 0) {
      setError("Liczba dzieci nie może być ujemna")
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/guests/${guest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          spouseName: hasPartner ? (spouseName.trim() || null) : null,
          childrenCount,
          comingAlone: !hasPartner,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nie udało się zapisać zmian")
      }

      onSave()
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
        <h2 className="text-xl font-semibold text-zinc-900">Edytuj gościa</h2>

        {error && (
          <div className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-semibold text-zinc-800">
              Imię i nazwisko
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="np. Jan Kowalski"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-800">
              Czy guest przychodzi z osobą towarzyszącą?
            </label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="edit-hasPartner"
                  checked={hasPartner === true}
                  onChange={() => setHasPartner(true)}
                  disabled={isSubmitting}
                  className="text-zinc-900 focus:ring-zinc-900"
                />
                <span className="text-sm text-zinc-700">Tak</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="edit-hasPartner"
                  checked={hasPartner === false}
                  onChange={() => setHasPartner(false)}
                  disabled={isSubmitting}
                  className="text-zinc-900 focus:ring-zinc-900"
                />
                <span className="text-sm text-zinc-700">Nie (samodzielnie)</span>
              </label>
            </div>
          </div>

          {hasPartner && (
            <div>
              <label htmlFor="edit-spouseName" className="block text-sm font-semibold text-zinc-800">
                Małżonek / Osoba towarzysząca
              </label>
              <input
                id="edit-spouseName"
                type="text"
                value={spouseName}
                onChange={(e) => setSpouseName(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="np. Anna Kowalska (opcjonalnie)"
                disabled={isSubmitting}
              />
            </div>
          )}

          <div>
            <label htmlFor="edit-childrenCount" className="block text-sm font-semibold text-zinc-800">
              Liczba dzieci
            </label>
            <input
              id="edit-childrenCount"
              type="number"
              min="0"
              value={childrenCount}
              onChange={(e) => setChildrenCount(parseInt(e.target.value) || 0)}
              className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              disabled={isSubmitting}
            />
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
