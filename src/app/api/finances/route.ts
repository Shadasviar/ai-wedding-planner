import { NextResponse } from "next/server"
import { getFinancesBreakdown } from "@/lib/db/finances"
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

    const breakdown = await getFinancesBreakdown()
    return NextResponse.json(breakdown)
  } catch (error) {
    console.error("Failed to fetch finances:", error)
    return NextResponse.json(
      { error: "Nie udało się pobrać danych finansowych" },
      { status: 500 }
    )
  }
}
