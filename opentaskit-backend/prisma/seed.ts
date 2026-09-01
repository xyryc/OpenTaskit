import 'dotenv/config';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Read Super Admin credentials strictly from .env
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      '❌ Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file before seeding!',
    );
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN', // Ensure role is ADMIN even if updated
    },
    create: {
      email: adminEmail,
      fullName: 'System Super Admin',
      phoneNumber: '+10000000000',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Admin ready: ${admin.email} (Role: ${admin.role})`);

  // 2. Seed Default Standard Categories
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
      description:
        'Furniture assembly, wall mounting, and general home repairs',
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
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        isActive: true,
      },
    });
    console.log(`✅ Category ready: ${category.name}`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
