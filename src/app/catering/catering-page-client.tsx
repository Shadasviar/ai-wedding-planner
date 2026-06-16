"use client"

import { useEffect, useState } from "react"
import type { CateringMenuItem } from "@/lib/db/schema"
import { CateringMenuItemsList } from "@/components/catering-menu-items-list"
import { CateringCostField } from "@/components/catering-cost-field"

interface CateringSettings {
  costPerPlate: number
}

export function CateringPageClient() {
  const [costPerPlate, setCostPerPlate] = useState<number>(0)
  const [menuItems, setMenuItems] = useState<CateringMenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchCatering = async () => {
    try {
      // Fetch settings
      const settingsRes = await fetch("/api/catering")
      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setCostPerPlate(settings.costPerPlate ?? 0)
      }

      // Fetch menu items
      const itemsRes = await fetch("/api/catering-menu-items")
      if (!itemsRes.ok) {
        throw new Error("Nie udało się pobrać dań")
      }
      const data = await itemsRes.json()
      setMenuItems(data)
    } catch (error) {
      console.error("Error fetching catering:", error)
      setMenuItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCostUpdate = async (newCost: number) => {
    try {
      const response = await fetch("/api/catering", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ costPerPlate: newCost }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nie udało się zaktualizować kosztu")
      }

      setCostPerPlate(newCost)
      return true
    } catch (error) {
      console.error("Failed to update cost:", error)
      return false
    }
  }

  useEffect(() => {
    fetchCatering()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-600">Ładowanie...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cost per plate field */}
      <CateringCostField
        costPerPlate={costPerPlate}
        onUpdate={handleCostUpdate}
      />

      {/* Menu items list */}
      <CateringMenuItemsList
        menuItems={menuItems}
        costPerPlate={costPerPlate}
        onRefresh={fetchCatering}
      />
    </div>
  )
}
