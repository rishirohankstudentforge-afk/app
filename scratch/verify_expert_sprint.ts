import { prisma } from "../src/lib/prisma";

async function main() {
  const sprint = await prisma.hackathon.findFirst({
    where: { title: "Redlix Expert Sprint" },
    orderBy: { createdAt: 'desc' }
  });

  if (!sprint) {
    console.log("Sprint not found!");
    return;
  }

  console.log("Sprint found:", sprint.title, "Join Code:", sprint.joinCode);
  
  const questions = JSON.parse(sprint.questions);
  console.log("Number of questions:", questions.length);
  
  const q1 = questions[0];
  console.log("Q1 Title:", q1.title);
  console.log("Q1 Test Cases Count:", q1.testCases.length);
  
  let mediumCount = 0;
  let hardCount = 0;
  
  for (const tc of q1.testCases) {
      if (tc.input.length > 50000) hardCount++;
      else mediumCount++;
  }
  
  console.log("Q1 Medium Cases:", mediumCount);
  console.log("Q1 Hard Cases:", hardCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
