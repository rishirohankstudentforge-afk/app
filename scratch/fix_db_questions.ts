import { prisma } from "../src/lib/prisma";

async function main() {
  const sprints = await prisma.hackathon.findMany({
    where: { type: "Sprint" }
  });

  console.log(`Found ${sprints.length} sprints. Fixing formats...`);

  let fixedCount = 0;

  for (const sprint of sprints) {
    if (!sprint.questions) continue;
    
    let parsed;
    try {
      parsed = JSON.parse(sprint.questions);
    } catch(e) {
      continue;
    }

    if (Array.isArray(parsed)) {
      console.log(`Fixing sprint: ${sprint.title} (${sprint.joinCode})`);
      const newQuestions = JSON.stringify({
        type: "coding",
        list: parsed
      });

      await prisma.hackathon.update({
        where: { id: sprint.id },
        data: { questions: newQuestions }
      });
      fixedCount++;
    }
  }

  console.log(`Fixed ${fixedCount} sprints successfully!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
