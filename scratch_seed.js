const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hackathon = await prisma.hackathon.findFirst({
    where: { name: { contains: "Redlix", mode: "insensitive" } }
  });

  if (!hackathon) {
    console.error("Hackathon 'Redlix' not found.");
    process.exit(1);
  }

  console.log(`Found Hackathon: ${hackathon.name} (ID: ${hackathon.id})`);

  const deletedSprints = await prisma.sprint.deleteMany({
    where: { hackathonId: hackathon.id }
  });
  console.log(`Deleted ${deletedSprints.count} existing sprints.`);

  const questions = {
    type: "coding",
    list: [
      {
        title: "Two Sum",
        difficulty: "Easy",
        timeLimit: 15,
        problemDescription: `Given an array of integers and a target sum, return the indices of the two numbers that add up to the target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\nYou can return the answer in any order.`,
        testCases: [
          { caseIndex: 1, input: "[2, 7, 11, 15]\\n9", expectedOutput: "[0, 1]" },
          { caseIndex: 2, input: "[3, 2, 4]\\n6", expectedOutput: "[1, 2]" },
          { caseIndex: 3, input: "[3, 3]\\n6", expectedOutput: "[0, 1]" }
        ],
        codeTemplate: `function solution(numsStr, targetStr) {\n  const nums = JSON.parse(numsStr);\n  const target = parseInt(targetStr, 10);\n  \n  // Write your logic here:\n  const map = new Map();\n  for(let i = 0; i < nums.length; i++) {\n      const complement = target - nums[i];\n      if (map.has(complement)) return JSON.stringify([map.get(complement), i]);\n      map.set(nums[i], i);\n  }\n  return "[]";\n}`
      },
      {
        title: "Fibonacci Sequence",
        difficulty: "Easy",
        timeLimit: 10,
        problemDescription: `The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.\n        \nGiven n, calculate F(n).`,
        testCases: [
          { caseIndex: 1, input: "2", expectedOutput: "1" },
          { caseIndex: 2, input: "3", expectedOutput: "2" },
          { caseIndex: 3, input: "4", expectedOutput: "3" }
        ],
        codeTemplate: `function solution(nStr) {\n  const n = parseInt(nStr, 10);\n  // Write your code here\n  \n}`
      },
      {
        title: "Build a Login Button (Frontend)",
        difficulty: "Medium",
        timeLimit: 20,
        problemDescription: `Build a simple HTML button with the following requirements:\n1. It must have an ID of 'login-btn'.\n2. The text inside the button must say "Login to Redlix".\n3. It must have a CSS background color of 'red'.\n\nYour code will be evaluated visually via Live Preview. When you click 'Run Tests', the system will check if the element exists in the DOM.`,
        testCases: [
          { caseIndex: 1, input: "DOM_CHECK", expectedOutput: "PASS" }
        ],
        codeTemplate: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    /* Add your CSS styling here */\n    \n  </style>\n</head>\n<body>\n  \n  <!-- Add your HTML here -->\n\n</body>\n</html>`
      },
      {
        title: "Top Earning Employees (SQL)",
        difficulty: "Medium",
        timeLimit: 20,
        problemDescription: `Write a SQL query to find the names and salaries of employees who earn more than 50000.\n        \nTable: \`employees\`\nColumns: \`id\` (int), \`name\` (text), \`salary\` (int)\n\nReturn the results containing only the \`name\` and \`salary\` columns.`,
        testCases: [
          { 
            caseIndex: 1, 
            input: "CREATE TABLE employees (id INTEGER, name TEXT, salary INTEGER); INSERT INTO employees VALUES (1, 'Alice', 60000), (2, 'Bob', 45000), (3, 'Charlie', 55000);", 
            expectedOutput: '[{"name": "Alice", "salary": 60000}, {"name": "Charlie", "salary": 55000}]' 
          }
        ],
        codeTemplate: `-- Write your SQL query below\nSELECT \n`
      }
    ]
  };

  const newSprint = await prisma.sprint.create({
    data: {
      hackathonId: hackathon.id,
      title: "Demo Sprint 1",
      startTime: new Date(Date.now() - 1000 * 60 * 60),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 2),
      status: "active",
      questions: JSON.stringify(questions)
    }
  });

  console.log(`Successfully created Sprint: ${newSprint.title} (ID: ${newSprint.id})`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
