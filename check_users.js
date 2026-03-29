const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    include: {
      accounts: true
    }
  })
  console.log('--- DATABASE USERS ---')
  users.forEach(u => {
    console.log(`User: ${u.email} (ID: ${u.id}) - Accounts: ${u.accounts.length}`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
