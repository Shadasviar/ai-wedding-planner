"use client"

import { useState } from "react"

interface AddServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
}

export function AddServiceModal({ isOpen, onClose, onRefresh }: AddServiceModalProps) {
  const [name, setName] = useState("")
  const [cost, setCost] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [notes, setNotes] = useState("")
  const [deadline, setDeadline] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!name.trim()) {
      setError("Nazwa usługi jest wymagana")
      return
    }

    if (cost < 0) {
      setError("Koszt nie może być ujemny")
      return
    }

    if (paidAmount < 0) {
      setError("Opłacona kwota nie może być ujemna")
      return
    }

    if (paidAmount > cost) {
      setError("Opłacona kwota nie może przekraczać całkowitej kwoty")
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          cost,
          paidAmount,
          notes: notes.trim(),
          deadline: deadline || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nie udało się dodać usługi")
      }

      // Reset form
      setName("")
      setCost(0)
      setPaidAmount(0)
      setNotes("")
      setDeadline("")
      onRefresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setName("")
      setCost(0)
      setPaidAmount(0)
      setNotes("")
      setDeadline("")
      setError("")
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-900">Dodaj usługę</h2>

        {error && (
          <div className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-zinc-800">
              Nazwa usługi
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="np. DJ, Fotograf, Kwiaty"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label htmlFor="cost" className="block text-sm font-semibold text-zinc-800">
              Całkowity koszt (zł)
            </label>
            <input
              id="cost"
              type="number"
              min="0"
              value={cost}
              onChange={(e) => setCost(parseInt(e.target.value) || 0)}
              className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="paidAmount" className="block text-sm font-semibold text-zinc-800">
              Już opłacono (zł)
            </label>
            <input
              id="paidAmount"
              type="number"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseInt(e.target.value) || 0)}
              className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-zinc-800">
              Notatki
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="np. Wysłać listę muzyk do 12.07"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-semibold text-zinc-800">
              Termin
            </label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
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
              {isSubmitting ? "Dodawanie..." : "Dodaj usługę"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
