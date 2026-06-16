import { NextRequest, NextResponse } from "next/server"
import { getMenuItems, createMenuItem } from "@/lib/db/catering-menu-items"
import { auth } from "@root/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "Nieautoryzowany dostęp" },
        { status: 401 }
      )
    }

    const menuItems = await getMenuItems()
    return NextResponse.json(menuItems)
  } catch (error) {
    console.error("Failed to fetch menu items:", error)
    return NextResponse.json(
      { error: "Nie udało się pobrać dań" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "Nieautoryzowany dostęp" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, type, customType, isVege } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nazwa dania jest wymagana" },
        { status: 400 }
      )
    }

    const menuItem = await createMenuItem({
      name: name.trim(),
      type,
      customType: customType || null,
      isVege: isVege || false,
    })

    return NextResponse.json(menuItem, { status: 201 })
  } catch (error) {
    console.error("Failed to create menu item:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nie udało się dodać dania" },
      { status: 500 }
    )
  }
}
