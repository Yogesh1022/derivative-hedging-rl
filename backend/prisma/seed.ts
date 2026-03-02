import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  const users = [
    {
      email: 'trader1@hedgeai.com',
      password: 'Trader123!',
      name: 'John Trader',
      role: UserRole.TRADER,
    },
    {
      email: 'trader2@hedgeai.com',
      password: 'Trader123!',
      name: 'Sarah Smith',
      role: UserRole.TRADER,
    },
    {
      email: 'analyst@hedgeai.com',
      password: 'Analyst123!',
      name: 'Mike Analyst',
      role: UserRole.ANALYST,
    },
    {
      email: 'admin@hedgeai.com',
      password: 'Admin123!',
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
        status: UserStatus.ACTIVE,
      },
    });

    console.log(`✅ User: ${user.email} (${user.role})`);
  }

  const count = await prisma.user.count();
  console.log(`\n📊 Total users in database: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
