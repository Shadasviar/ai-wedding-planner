import { NextRequest, NextResponse } from "next/server"
import { getGuests, createGuest } from "@/lib/db/guests"
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

    const guests = await getGuests()
    return NextResponse.json(guests)
  } catch (error) {
    console.error("Failed to fetch guests:", error)
    return NextResponse.json(
      { error: "Nie udało się pobrać gości" },
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
    const { name, spouseName, childrenCount, comingAlone } = body

    if (!name) {
      return NextResponse.json(
        { error: "Imię i nazwisko jest wymagane" },
        { status: 400 }
      )
    }

    const guest = await createGuest({
      name,
      spouseName: spouseName || null,
      childrenCount: childrenCount || 0,
      comingAlone: comingAlone || false,
    })

    return NextResponse.json(guest, { status: 201 })
  } catch (error) {
    console.error("Failed to create guest:", error)
    return NextResponse.json(
      { error: "Nie udało się dodać gościa" },
      { status: 500 }
    )
  }
}


