import { NextRequest, NextResponse } from "next/server"
import { getServices, createService } from "@/lib/db/services"
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

    const services = await getServices()
    return NextResponse.json(services)
  } catch (error) {
    console.error("Failed to fetch services:", error)
    return NextResponse.json(
      { error: "Nie udało się pobrać usług" },
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
    const { name, cost, paidAmount, notes, deadline } = body

    if (!name) {
      return NextResponse.json(
        { error: "Nazwa usługi jest wymagana" },
        { status: 400 }
      )
    }

    const service = await createService({
      name,
      cost: cost ?? 0,
      paidAmount: paidAmount ?? 0,
      notes: notes || "",
      deadline: deadline || null,
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error("Failed to create service:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nie udało się dodać usługi" },
      { status: 500 }
    )
  }
}
