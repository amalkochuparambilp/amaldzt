import { ensureDatabaseSeeded, fetchFullCMSStateFromPostgres } from '../src/db/cmsRepository.ts';
import { prisma } from '../src/db/prisma.ts';

async function main() {
  console.log('Seeding Prisma PostgreSQL database (pooled.db.prisma.io)...');
  await ensureDatabaseSeeded(true);
  const state = await fetchFullCMSStateFromPostgres();
  console.log(
    `Database seeded successfully: ${state.projects.length} projects, ${state.skills.length} skills, ${state.collaborations.length} collaborations, ${state.logos.length} logos.`
  );
}

main()
  .catch((err) => {
    console.error('Error seeding Prisma PostgreSQL database:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
