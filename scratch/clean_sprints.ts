import { prisma } from "../src/lib/prisma";

async function main() {
  const allSprints = await prisma.hackathon.findMany({
    where: { type: "Sprint" },
    orderBy: { createdAt: "desc" }
  });

  const grouped: Record<string, any[]> = {};
  for (const s of allSprints) {
    if (!grouped[s.title]) grouped[s.title] = [];
    grouped[s.title].push(s);
  }

  console.log("Found Sprints before cleanup:");
  for (const title in grouped) {
    console.log(`- ${title}: ${grouped[title].length} instances`);
  }

  let deletedCount = 0;
  for (const title in grouped) {
    const instances = grouped[title];
    if (instances.length > 1) {
      // Keep the first (newest), delete the rest
      const toDelete = instances.slice(1);
      for (const s of toDelete) {
        await prisma.hackathon.delete({ where: { id: s.id } });
        deletedCount++;
      }
    }
  }

  console.log(`\\nDeleted ${deletedCount} duplicate sprints.`);

  const finalSprints = await prisma.hackathon.findMany({
    where: { type: "Sprint" },
    orderBy: { createdAt: "asc" }
  });

  console.log("\\nFinal Sprint List:");
  for (const s of finalSprints) {
    console.log(`- ${s.title} (${s.joinCode})`);
  }
}

main().finally(() => prisma.$disconnect());
