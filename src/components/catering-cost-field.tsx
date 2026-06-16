"use client"

import { useState } from "react"

interface CateringCostFieldProps {
  costPerPlate: number
  onUpdate: (newCost: number) => Promise<boolean>
}

export function CateringCostField({ costPerPlate, onUpdate }: CateringCostFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempCost, setTempCost] = useState(costPerPlate)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEdit = () => {
    setTempCost(costPerPlate)
    setError("")
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (tempCost < 0) {
      setError("Koszt nie może być ujemny")
      return
    }

    setError("")
    setIsSubmitting(true)

    const success = await onUpdate(tempCost)
    if (success) {
      setIsEditing(false)
    }
    setIsSubmitting(false)
  }

  const handleCancel = () => {
    setTempCost(costPerPlate)
    setError("")
    setIsEditing(false)
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md border border-zinc-200">
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">Koszt za talerz</h2>

      {error && (
        <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        {isEditing ? (
          <>
            <div className="flex-1">
              <label htmlFor="costPerPlate" className="sr-only">
                Koszt za talerz
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="costPerPlate"
                  type="number"
                  min="0"
                  value={tempCost}
                  onChange={(e) => setTempCost(parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border border-zinc-400 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  disabled={isSubmitting}
                  autoFocus
                />
                <span className="text-sm font-semibold text-zinc-700">zł</span>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="rounded-md bg-zinc-900 px-4 py-2 font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSubmitting ? "Zapisywanie..." : "Zapisz"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Anuluj
            </button>
          </>
        ) : (
          <>
            <div className="flex-1">
              <span className="text-2xl font-bold text-zinc-900">{costPerPlate}</span>
              <span className="text-lg text-zinc-600 ml-2">zł</span>
              <span className="text-sm text-zinc-500 ml-2">/ talerz</span>
            </div>
            <button
              onClick={handleEdit}
              className="rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Edytuj
            </button>
          </>
        )}
      </div>
    </div>
  )
}
