import { auth } from "@root/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ServicesPageClient } from "./services-page-client"

export default async function ServicesPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

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

      {/* Service list - client component handles all interactivity */}
      <div className="flex-1">
        <ServicesPageClient />
      </div>
    </div>
  )
}
