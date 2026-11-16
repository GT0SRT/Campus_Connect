const prisma = require('./src/lib/prisma');

async function main() {
  const users = await prisma.user.findMany();
  console.log('Total users:', users.length);
  for (const u of users) {
    console.log(`- ${u.id}: ${u.email} (${u.username})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
