import { prisma } from "../src/lib/prisma";

async function main() {
  const sprint = await prisma.hackathon.findFirst({
    where: { joinCode: "SP-728857" }
  });

  if (!sprint) {
    console.error("Sprint not found!");
    return;
  }

  let questions = JSON.parse(sprint.questions as string);

  for (let q of questions) {
    if (q.title.includes("SQL")) {
      // Fix SQL input
      for (let tc of q.testCases) {
        if (tc.input.startsWith('"') && tc.input.endsWith('"')) {
          tc.input = tc.input.slice(1, -1);
        }
      }
    } else {
      // Fix algorithmic expectedOutputs
      for (let tc of q.testCases) {
        let val = tc.expectedOutput;
        // If it's a string wrapped in quotes, and the inner part is a number, array, or boolean, unwrap it
        if (val.startsWith('"') && val.endsWith('"')) {
          let inner = val.slice(1, -1);
          // If inner is a number
          if (!isNaN(Number(inner))) {
            tc.expectedOutput = inner;
          } 
          // If inner is a boolean
          else if (inner === 'true' || inner === 'false') {
            tc.expectedOutput = inner;
          }
          // If inner is an array
          else if (inner.startsWith('[') && inner.endsWith(']')) {
            tc.expectedOutput = inner;
          }
        }
      }
    }
  }

  await prisma.hackathon.update({
    where: { id: sprint.id },
    data: { questions: JSON.stringify(questions) }
  });

  console.log("Fixed sprint data in DB.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
