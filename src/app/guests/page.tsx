import { auth } from "@root/auth"
import { redirect } from "next/navigation"
import { GuestsPageClient } from "./guests-page-client"

export default async function GuestsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-full flex flex-col p-8 bg-zinc-50">
      {/* Header with welcome and sign out */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Witaj, {session.user?.name}</h1>
        <form
          action={async () => {
            "use server"
            const { signOut } = await import("@root/auth")
            await signOut()
          }}
        >
          <button className="rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-100">
            Wyloguj
          </button>
        </form>
      </div>

      {/* Guest list - client component handles all interactivity */}
      <div className="flex-1">
        <GuestsPageClient />
      </div>
    </div>
  )
}
