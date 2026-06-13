"use client"

import { useEffect, useState } from "react"
import type { Guest } from "@/lib/db/schema"
import { GuestList } from "@/components/guest-list"

export function GuestsPageClient() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchGuests = async () => {
    try {
      const res = await fetch("/api/guests")
      if (!res.ok) {
        throw new Error("Nie udało się pobrać gości")
      }
      const data = await res.json()
      setGuests(data)
    } catch (error) {
      console.error("Error fetching guests:", error)
      setGuests([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGuests()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-600">Ładowanie...</div>
      </div>
    )
  }

  return <GuestList guests={guests} onRefresh={fetchGuests} />
}
