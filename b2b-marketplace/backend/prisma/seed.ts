import { PrismaClient } from '@prisma/client';
import { seedDemoData } from '../src/seed/demo-data';
import { resolveDemoImageUrls, sanitizeImageQuery } from '../src/modules/demo/image-search.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Northstar Demo marketplace...');

  const query = sanitizeImageQuery(process.env.DEMO_IMAGE_QUERY, 'cats');
  const count = Number(process.env.DEMO_IMAGE_COUNT) || 40;
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  const images = await resolveDemoImageUrls({ query, count, apiKey });
  console.log(`   Images: ${images.source} (${images.urls.length} URLs, query="${images.query}")`);

  const result = await seedDemoData(prisma, false, images.urls);
  console.log('✅ Seed completed:', result);
  console.log('   Admin: admin@demo-marketplace.local / admin123');
  console.log('   Buyer: buyer@demo-marketplace.local / buyer123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
