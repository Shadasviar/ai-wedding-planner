import { auth } from "@root/auth"
import { redirect } from "next/navigation"
import { signOut } from "@root/auth"

export default async function Home() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">Welcome, {session.user?.name}</h1>
      <p className="mt-4 text-zinc-600">Wedding Planner Dashboard</p>

      <form
        action={async () => {
          "use server"
          await signOut()
        }}
        className="mt-8"
      >
        <button className="rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-50">
          Sign Out
        </button>
      </form>
    </div>
  )
}
