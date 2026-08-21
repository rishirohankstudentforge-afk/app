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

  // 1. Modify the SQL question (Question 8) to only have 1 simple test case
  const sqlSetup = `CREATE TABLE Employee (id INT, salary INT); INSERT INTO Employee VALUES (1, 100), (2, 200), (3, 300);`;
  questions[7].testCases = [
    { input: `"${sqlSetup}"`, expectedOutput: `[{"SecondHighestSalary": 200}]` }
  ];

  // 2. Add one more easy algorithmic question (Question 9: Sum of Array)
  const sumArrayTC = [];
  for (let i = 0; i < 15; i++) {
    const arr = Array.from({length: 4}, () => Math.floor(Math.random() * 20));
    const sum = arr.reduce((a, b) => a + b, 0);
    sumArrayTC.push({ input: `[${arr.join(',')}]`, expectedOutput: `"${sum}"` });
  }

  questions.push({
    title: "9. Sum of Array",
    type: "coding",
    difficulty: "Easy",
    description: "Write a function that receives an array of integers and returns the sum of all elements.",
    timeLimit: 10,
    testCases: sumArrayTC
  });

  // Update the sprint in the database
  await prisma.hackathon.update({
    where: { id: sprint.id },
    data: { questions: JSON.stringify(questions) }
  });

  console.log("Successfully added Question 9 and modified SQL question!");
  console.log("Total questions now:", questions.length);
  console.log("SQL test cases count:", questions[7].testCases.length);
  console.log("Question 9 test cases count:", questions[8].testCases.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
