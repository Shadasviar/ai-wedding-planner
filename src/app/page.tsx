import { auth } from "@root/auth"
import { redirect } from "next/navigation"
import { signOut } from "@root/auth"
import { GuestsDashboardCard } from "@/components/guests-dashboard-card"
import { ServicesDashboardCard } from "@/components/services-dashboard-card"
import { DashboardCard } from "@/components/dashboard-card"

export default async function Home() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-full flex flex-col p-8">
      {/* Header with welcome and sign out */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Welcome, {session.user?.name}</h1>
        <form
          action={async () => {
            "use server"
            await signOut()
          }}
        >
          <button className="rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-50">
            Sign Out
          </button>
        </form>
      </div>

      {/* Dashboard grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GuestsDashboardCard />
        <ServicesDashboardCard />
        <DashboardCard
          title="Timeline"
          emptyMessage="No activities planned yet — Add your first activity to stay on track!"
          ctaLabel="Add first activity"
          href="/timeline"
        />
        <DashboardCard
          title="Finances"
          emptyMessage="Total wedding cost so far"
          ctaLabel="$0.00"
          href="/finances"
        />
      </div>
    </div>
  )
}
