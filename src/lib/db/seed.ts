import { db } from '.'
import { users, SEED_USERS } from './schema'

export async function seed() {
  for (const userData of SEED_USERS) {
    await db.insert(users).values({
      username: userData.username,
      passwordHash: userData.password,
    }).run()
  }
  console.log(`Seeded ${SEED_USERS.length} users`)
}

// Run if called directly
const scriptPath = process.argv[1]
if (scriptPath && scriptPath.includes('seed')) {
  seed().catch(console.error)
}
