import { prisma } from "../src/lib/prisma";

async function main() {
  const sprint = await prisma.hackathon.findUnique({
    where: { joinCode: "SP-258869" }
  });

  if (!sprint || !sprint.questions) return;

  const arr = JSON.parse(sprint.questions);
  if (Array.isArray(arr)) {
    const newQuestions = {
      type: "coding",
      list: arr
    };
    await prisma.hackathon.update({
      where: { joinCode: "SP-258869" },
      data: { questions: JSON.stringify(newQuestions) }
    });
    console.log("Fixed sprint questions format.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
