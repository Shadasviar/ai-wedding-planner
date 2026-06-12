"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid credentials")
    } else {
      router.push("/")
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg">
        <h1 className="text-center text-2xl font-bold text-zinc-900">Sign In</h1>

        {error && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-zinc-800">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-zinc-800">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-white font-semibold hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
        >
          Sign In
        </button>
      </form>
    </div>
  )
}
