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

  // ── Person 2 ────────────────────────────────────────────────────
  const person2 = await prisma.person.upsert({
    where: { document: '987-654-321' },
    update: {},
    create: {
      name: 'Jane Smith',
      document: '987-654-321',
      birthDate: new Date('1985-06-20'),
      status: 1, // ACTIVE
    },
  });
  console.log(`✅ Person created: ${person2.name} (publicId: ${person2.publicId})`);

  // ── Account 2 ───────────────────────────────────────────────────
  const existingAccount2 = await prisma.account.findFirst({
    where: { personId: person2.personId },
  });

  const account2 = existingAccount2 ?? await prisma.account.create({
    data: {
      personId: person2.personId,
      balance: 5000,
      dailyWithdrawalLimit: 3000,
      accountType: 1, // CHECKING
    },
  });
  console.log(`✅ Account created: ${account2.accountId} (balance: ${account2.balance})`);

  // ── Summary ─────────────────────────────────────────────────────
  console.log('\n📋 Seed Summary:');
  console.log(`   Person 1       : ${person.name} (${person.publicId})`);
  console.log(`   Account 1      : ${account.accountId} (balance: ${account.balance})`);
  console.log(`   Person 2       : ${person2.name} (${person2.publicId})`);
  console.log(`   Account 2      : ${account2.accountId} (balance: ${account2.balance})`);
  console.log('\n🚀 You can now use these IDs to test the API (including transfers!)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
