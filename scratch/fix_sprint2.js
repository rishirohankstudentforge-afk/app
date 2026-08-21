const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sprint = await prisma.hackathon.findFirst({
    where: { title: "Demo Sprint 2" }
  });

  if (!sprint) {
    console.error("Sprint not found");
    return;
  }

  const questions = {
    type: "coding",
    list: [
      {
        type: "coding",
        title: "Reverse String",
        difficulty: "Easy",
        timeLimit: 15,
        problemDescription: `Write a function that reverses a string. The input string is given as a normal string.`,
        testCases: [
          { caseIndex: 1, input: '"hello"', expectedOutput: '"olleh"' },
          { caseIndex: 2, input: '"world"', expectedOutput: '"dlrow"' },
          { caseIndex: 3, input: '"redlix"', expectedOutput: '"xilder"' }
        ],
        codeTemplate: `def solution(s):\n    # Write your logic here:\n    return ""`,
      },
      {
        type: "coding",
        title: "Find Maximum Element",
        difficulty: "Easy",
        timeLimit: 15,
        problemDescription: "Write a function that takes an array of numbers and returns the maximum number in the array.",
        testCases: [
          { caseIndex: 1, input: "[1, 5, 3, 9, 2]", expectedOutput: "9" },
          { caseIndex: 2, input: "[-1, -5, -3]", expectedOutput: "-1" },
          { caseIndex: 3, input: "[42]", expectedOutput: "42" }
        ],
        codeTemplate: `def solution(nums):\n    # Write your logic here:\n    return 0`
      },
      {
        title: "Build a Warning Alert (Frontend)",
        difficulty: "Medium",
        timeLimit: 20,
        problemDescription: `Build a simple HTML element with the following requirements:\n1. It must have an ID of 'warning-alert'.\n2. The text inside must contain "Warning".\n3. It must have a CSS background color of 'orange'.\n\nYour code will be evaluated visually via Live Preview. When you click 'Run Tests', the system will check if the element exists in the DOM.`,
        testCases: [
          { caseIndex: 1, input: "DOM_CHECK", expectedOutput: "PASS" }
        ],
        codeTemplate: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    /* Add your CSS styling here */\n    \n  </style>\n</head>\n<body>\n  \n  <!-- Add your HTML here -->\n\n</body>\n</html>`
      },
      {
        title: "Active Users (SQL)",
        difficulty: "Medium",
        timeLimit: 20,
        problemDescription: `Write a SQL query to find the names of users who have a status of 'active'.\n        \nTable: \`users\`\nColumns: \`id\` (int), \`name\` (text), \`status\` (text)\n\nReturn the results containing only the \`name\` column.`,
        testCases: [
          { 
            caseIndex: 1, 
            input: "CREATE TABLE users (\n  id INTEGER,\n  name TEXT,\n  status TEXT\n);\n\nINSERT INTO users VALUES \n  (1, 'Alice', 'active'),\n  (2, 'Bob', 'inactive'),\n  (3, 'Charlie', 'active');", 
            expectedOutput: "[\n  {\n    \"name\": \"Alice\"\n  },\n  {\n    \"name\": \"Charlie\"\n  }\n]" 
          }
        ],
        codeTemplate: `-- Write your SQL query below\nSELECT \n`
      }
    ]
  };

  await prisma.hackathon.update({
    where: { id: sprint.id },
    data: { questions: JSON.stringify(questions) }
  });

  console.log("Sprint 2 questions updated successfully with correct quotes for Piston API.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
