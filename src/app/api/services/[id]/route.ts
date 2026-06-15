import { NextRequest, NextResponse } from "next/server"
import { updateService, deleteService } from "@/lib/db/services"
import { auth } from "@root/auth"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "Nieautoryzowany dostęp" },
        { status: 401 }
      )
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)
    const body = await request.json()

    const service = await updateService(id, body)
    return NextResponse.json(service)
  } catch (error) {
    console.error("Failed to update service:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nie udało się zaktualizować usługi" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "Nieautoryzowany dostęp" },
        { status: 401 }
      )
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)
    await deleteService(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete service:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nie udało się usunąć usługi" },
      { status: 500 }
    )
  }
}
