// Placeholder schema - will be replaced with actual Prisma/Drizzle schema in F-02
export interface User {
  id: string
  username: string
  password_hash: string
  created_at: Date
}

// Seed users for testing (passwords are bcrypt hashes of "wedding2026")
export const SEED_USERS = [
  { username: "admin", password: "$2b$10$db4SJG3xrNTJ5TSSZN6OmupEeVcjB6iqW3pWON9QxZ1nYqZZi298K" },
  { username: "user", password: "$2b$10$2BGY4seHkFm/oFKYsYqR5eTAKq03OjTFo17ZmYxR/4bwMAUxTHEiK" },
]
