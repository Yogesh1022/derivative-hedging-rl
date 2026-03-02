// ═══════════════════════════════════════════════════════════════
// CREATE TEST USERS SCRIPT
// Run this to create test trader accounts
// ═══════════════════════════════════════════════════════════════

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🔧 Creating test users...\n');

  const users = [
    {
      email: 'trader1@hedgeai.com',
      password: 'Trader123!',
      name: 'John Trader',
      role: 'TRADER',
    },
    {
      email: 'trader2@hedgeai.com',
      password: 'Trader123!',
      name: 'Sarah Smith',
      role: 'TRADER',
    },
    {
      email: 'analyst@hedgeai.com',
      password: 'Analyst123!',
      name: 'Mike Analyst',
      role: 'ANALYST',
    },
    {
      email: 'admin@hedgeai.com',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'ADMIN',
    },
  ];

  for (const userData of users) {
    try {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`⚠️  User ${userData.email} already exists - skipping`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          status: 'ACTIVE',
        },
      });

      console.log(`✅ Created user: ${user.email} (${user.role}) - ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Password: ${userData.password}\n`);
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }

  console.log('\n📊 Current users in database:');
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  console.table(allUsers);
  console.log(`\nTotal users: ${allUsers.length}`);
}

createTestUsers()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
