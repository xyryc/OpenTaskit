import 'dotenv/config';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function resetAndSeed() {
  console.log('🧹 [1/3] Starting full database wipe...');

  // Delete in order to satisfy foreign key constraints
  const deletedOffers = await prisma.offer.deleteMany();
  console.log(`   - Deleted ${deletedOffers.count} offers`);

  const deletedSavedTasks = await prisma.savedTask.deleteMany();
  console.log(`   - Deleted ${deletedSavedTasks.count} saved tasks`);

  const deletedTasks = await prisma.task.deleteMany();
  console.log(`   - Deleted ${deletedTasks.count} tasks`);

  const deletedCategories = await prisma.category.deleteMany();
  console.log(`   - Deleted ${deletedCategories.count} categories`);

  const deletedUsers = await prisma.user.deleteMany();
  console.log(`   - Deleted ${deletedUsers.count} users`);

  console.log('🌱 [2/3] Re-seeding clean foundational data...');

  // 1. Re-create Super Admin strictly from .env
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      fullName: 'System Super Admin',
      phoneNumber: '+10000000000',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`   ✅ Admin created: ${admin.email} (ID: ${admin.id})`);

  // 2. Re-create Default Standard Marketplace Categories
  const defaultCategories = [
    {
      name: 'House Cleaning',
      slug: 'house-cleaning',
      icon: 'broom',
      description: 'Home and office cleaning, deep cleaning, and housekeeping',
    },
    {
      name: 'Delivery & Courier',
      slug: 'delivery-courier',
      icon: 'truck',
      description: 'Package pickup, grocery delivery, and courier errands',
    },
    {
      name: 'Handyman & Repairs',
      slug: 'handyman-repairs',
      icon: 'hammer',
      description: 'Furniture assembly, wall mounting, and general home repairs',
    },
    {
      name: 'Home Moving',
      slug: 'home-moving',
      icon: 'box',
      description: 'Apartment moving, heavy lifting, and packing assistance',
    },
    {
      name: 'Gardening & Outdoor',
      slug: 'gardening-outdoor',
      icon: 'leaf',
      description: 'Lawn mowing, weeding, and outdoor yard maintenance',
    },
  ];

  for (const cat of defaultCategories) {
    const createdCat = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        isActive: true,
      },
    });
    console.log(`   ✅ Category created: ${createdCat.name}`);
  }

  // 3. Verification of final counts
  console.log('📊 [3/3] Verifying clean database state...');
  const [userCount, categoryCount, taskCount, offerCount] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.task.count(),
    prisma.offer.count(),
  ]);

  console.log('-------------------------------------------');
  console.log(` Users:       ${userCount} (Super Admin)`);
  console.log(` Categories:  ${categoryCount} (Active)`);
  console.log(` Tasks:       ${taskCount} (Fresh clean slate)`);
  console.log(` Offers:      ${offerCount}`);
  console.log('-------------------------------------------');
  console.log('🎉 Database has been completely reset and seeded successfully!');
}

resetAndSeed()
  .catch((e) => {
    console.error('❌ Reset error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });