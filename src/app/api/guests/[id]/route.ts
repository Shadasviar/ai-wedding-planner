import { NextRequest, NextResponse } from "next/server"
import { updateGuest, deleteGuest } from "@/lib/db/guests"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    if (!id) {
      return NextResponse.json(
        { error: "Nieprawidłowe ID gościa" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, spouseName, childrenCount, comingAlone } = body

    if (!name) {
      return NextResponse.json(
        { error: "Imię i nazwisko jest wymagane" },
        { status: 400 }
      )
    }

    const guest = await updateGuest(id, {
      name,
      spouseName: spouseName || null,
      childrenCount: childrenCount || 0,
      comingAlone: comingAlone || false,
    })

    return NextResponse.json(guest)
  } catch (error) {
    console.error("Failed to update guest:", error)
    return NextResponse.json(
      { error: "Nie udało się zapisać zmian" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    if (!id) {
      return NextResponse.json(
        { error: "Nieprawidłowe ID gościa" },
        { status: 400 }
      )
    }

    await deleteGuest(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete guest:", error)
    return NextResponse.json(
      { error: "Nie udało się usunąć gościa" },
      { status: 500 }
    )
  }
}
