import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Fetching all sprints to fix questions format...");
  
  const sprints = await prisma.hackathon.findMany({
    where: { type: "Sprint" }
  });

  for (const sprint of sprints) {
    try {
      if (sprint.questions) {
        let parsed = typeof sprint.questions === "string" ? JSON.parse(sprint.questions) : sprint.questions;
        if (typeof parsed === "string") parsed = JSON.parse(parsed);

        // If it's an array, it means it's missing the { type: "coding", list: [...] } wrapper!
        if (Array.isArray(parsed)) {
          console.log(`Fixing sprint ${sprint.title} (${sprint.joinCode})...`);
          
          const newFormat = {
            type: "coding",
            list: parsed
          };

          await prisma.hackathon.update({
            where: { id: sprint.id },
            data: { questions: JSON.stringify(newFormat) }
          });
          
          console.log(` -> Fixed successfully!`);
        } else {
          console.log(`Sprint ${sprint.title} (${sprint.joinCode}) is already correctly formatted.`);
        }
      }
    } catch (err) {
      console.error(`Error processing sprint ${sprint.title}:`, err);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
