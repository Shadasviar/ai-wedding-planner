"use client"

import { useState, useEffect } from "react"
import type { Service } from "@/lib/db/schema"
import { ServicesList } from "@/components/services-list"
import { AddServiceModal } from "./add-service-modal"

export function ServicesPageClient() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services")
      if (!response.ok) {
        throw new Error("Failed to fetch services")
      }
      const data = await response.json()
      setServices(data)
    } catch (error) {
      console.error("Error fetching services:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-zinc-600">Ładowanie usług...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ServicesList
        services={services}
        onRefresh={fetchServices}
      />
      <AddServiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRefresh={fetchServices}
      />
    </div>
  )
}
