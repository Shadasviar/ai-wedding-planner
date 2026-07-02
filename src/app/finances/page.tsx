import { auth } from "@root/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getFinancesBreakdown } from "@/lib/db/finances"

export default async function FinancesPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const breakdown = await getFinancesBreakdown()
  const hasAnyCosts = breakdown.total > 0

  return (
    <div className="min-h-full flex flex-col p-8 bg-zinc-50">
      {/* Header with back button, sign out, and welcome */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="inline-block rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            ← Strona główna
          </Link>
          <form
            action={async () => {
              "use server"
              const { signOut } = await import("@root/auth")
              await signOut()
            }}
          >
            <button className="rounded-md border border-zinc-300 px-4 py-2 font-medium text-zinc-900 hover:bg-zinc-100">
              Wyloguj
            </button>
          </form>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900">Witaj, {session.user?.name}</h1>
      </div>

      {/* Finances content */}
      <div className="flex-1 max-w-4xl">
        <h2 className="text-xl font-semibold text-zinc-900 mb-6">Finanse</h2>

        {hasAnyCosts ? (
          <div className="space-y-6">
            {/* Total cost card */}
            <div className="rounded-lg bg-white p-6 shadow-lg border border-zinc-200">
              <h3 className="text-sm font-medium text-zinc-600 mb-2">Łączny koszt wesela</h3>
              <p className="text-4xl font-bold text-zinc-900">{breakdown.total} zł</p>
            </div>

            {/* Breakdown by category */}
            <div className="rounded-lg bg-white p-6 shadow-lg border border-zinc-200">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Szczegóły kosztów</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-zinc-900">Usługi</p>
                    <p className="text-sm text-zinc-600">Koszt wszystkich usług i vendorów</p>
                  </div>
                  <p className="text-xl font-semibold text-zinc-900">{breakdown.services} zł</p>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-zinc-900">Catering</p>
                    <p className="text-sm text-zinc-600">Koszt cateringu (liczba miejsc × koszt za talerz)</p>
                  </div>
                  <p className="text-xl font-semibold text-zinc-900">{breakdown.catering} zł</p>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-zinc-900">Goście</p>
                    <p className="text-sm text-zinc-600">Koszt związany z gośćmi (liczba miejsc × koszt za talerz)</p>
                  </div>
                  <p className="text-xl font-semibold text-zinc-900">{breakdown.guests} zł</p>
                </div>

                <div className="border-t border-zinc-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-zinc-900">Suma</p>
                    </div>
                    <p className="text-2xl font-bold text-zinc-900">{breakdown.total} zł</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Empty state
          <div className="rounded-lg bg-white p-8 shadow-lg border border-zinc-200 text-center">
            <p className="text-lg font-medium text-zinc-900 mb-2">Brak kosztów</p>
            <p className="text-sm text-zinc-600 mb-6">
              Dodaj pierwsze usługi lub skonfiguruj catering, aby zobaczyć podsumowanie kosztów.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/services"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Dodaj usługę
              </Link>
              <Link
                href="/catering"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Skonfiguruj catering
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
