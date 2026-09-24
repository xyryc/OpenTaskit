import 'dotenv/config';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding realistic distance-tiered tasks...');

  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error('No user found in database to assign tasks to.');
  }

  const handyman = await prisma.category.findFirst({ where: { slug: 'handyman-repairs' } });
  const cleaning = await prisma.category.findFirst({ where: { slug: 'house-cleaning' } });
  const moving = await prisma.category.findFirst({ where: { slug: 'home-moving' } });

  const tasksToCreate = [
    {
      title: 'Assemble IKEA 3-Door Wardrobe',
      details: 'Need an experienced handyman to assemble a Pax wardrobe with mirror doors. Tools provided if needed.',
      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'],
      categoryId: handyman?.id || (await prisma.category.findFirst())!.id,
      locationType: 'IN_PERSON' as const,
      address: 'Kandy Road, Peliyagoda, Kelaniya',
      latitude: 6.9650,
      longitude: 79.9150, // ~7.2 km from Colombo center
      budget: 6500,
      isBudgetFlexible: true,
      paymentMethod: 'CASH' as const,
      timeType: 'ASAP' as const,
      status: 'OPEN' as const,
      userId: user.id,
    },
    {
      title: 'Deep Clean 2-Bedroom Apartment',
      details: 'Moving into a new apartment in Rawathawatte, needs deep cleaning including kitchen cabinets and balcony.',
      images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'],
      categoryId: cleaning?.id || (await prisma.category.findFirst())!.id,
      locationType: 'IN_PERSON' as const,
      address: 'Galle Road, Rawathawatte, Moratuwa',
      latitude: 6.7730,
      longitude: 79.8816, // ~17.1 km from Colombo center
      budget: 11500,
      isBudgetFlexible: true,
      paymentMethod: 'CASH' as const,
      timeType: 'ASAP' as const,
      status: 'OPEN' as const,
      userId: user.id,
    },
    {
      title: 'Move Heavy Furniture & Boxes',
      details: 'Assistance needed to load, transport, and unload heavy furniture and roughly 15 cartons.',
      images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'],
      categoryId: moving?.id || (await prisma.category.findFirst())!.id,
      locationType: 'IN_PERSON' as const,
      address: 'Main Street, Negombo',
      latitude: 7.2008,
      longitude: 79.8737, // ~30.4 km from Colombo center
      budget: 18000,
      isBudgetFlexible: false,
      paymentMethod: 'CASH' as const,
      timeType: 'ASAP' as const,
      status: 'OPEN' as const,
      userId: user.id,
    },
  ];

  for (const t of tasksToCreate) {
    const existing = await prisma.task.findFirst({ where: { title: t.title } });
    if (!existing) {
      const created = await prisma.task.create({ data: t });
      console.log(`✅ Created task: "${created.title}" at (${created.latitude}, ${created.longitude})`);
    } else {
      console.log(`ℹ️ Task "${t.title}" already exists.`);
    }
  }

  console.log('🎉 Distance seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
