import { NextRequest, NextResponse } from "next/server"
import { updateMenuItem, deleteMenuItem } from "@/lib/db/catering-menu-items"
import { auth } from "@root/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const menuItem = await updateMenuItem(id, body)
    return NextResponse.json(menuItem)
  } catch (error) {
    console.error("Failed to update menu item:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nie udało się zaktualizować dania" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    await deleteMenuItem(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete menu item:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nie udało się usunąć dania" },
      { status: 500 }
    )
  }
}
