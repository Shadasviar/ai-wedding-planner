import { NextRequest, NextResponse } from "next/server"
import { getCateringSettings, updateCateringSettings } from "@/lib/db/catering"
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

    const settings = await getCateringSettings()
    return NextResponse.json(settings || { costPerPlate: 0 })
  } catch (error) {
    console.error("Failed to fetch catering settings:", error)
    return NextResponse.json(
      { error: "Nie udało się pobrać ustawień cateringu" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "Nieautoryzowany dostęp" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { costPerPlate } = body

    if (costPerPlate === undefined || costPerPlate === null) {
      return NextResponse.json(
        { error: "Koszt za talerz jest wymagany" },
        { status: 400 }
      )
    }

    const settings = await updateCateringSettings({ costPerPlate })
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Failed to update catering settings:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nie udało się zaktualizować ustawień cateringu" },
      { status: 500 }
    )
  }
}
