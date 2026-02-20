import { PrismaClient } from '../src/prisma/prismaClient';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Person ──────────────────────────────────────────────────────
  const person = await prisma.person.upsert({
    where: { document: '123-456-789' },
    update: {},
    create: {
      name: 'John Doe',
      document: '123-456-789',
      birthDate: new Date('1990-01-15'),
      status: 1, // ACTIVE
    },
  });
  console.log(`✅ Person created: ${person.name} (publicId: ${person.publicId})`);

  // ── Account ─────────────────────────────────────────────────────
  const existingAccount = await prisma.account.findFirst({
    where: { personId: person.personId },
  });

  const account = existingAccount ?? await prisma.account.create({
    data: {
      personId: person.personId,
      balance: 10000,
      dailyWithdrawalLimit: 5000,
      accountType: 1, // CHECKING
    },
  });
  console.log(`✅ Account created: ${account.accountId} (balance: ${account.balance})`);

  // ── Summary ─────────────────────────────────────────────────────
  console.log('\n📋 Seed Summary:');
  console.log(`   Person publicId : ${person.publicId}`);
  console.log(`   Account ID      : ${account.accountId}`);
  console.log(`   Balance         : ${account.balance}`);
  console.log(`   Daily Limit     : ${account.dailyWithdrawalLimit}`);
  console.log('\n🚀 You can now use these IDs to test the API!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
