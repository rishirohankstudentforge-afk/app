import { prisma } from '../src/lib/prisma';

async function main() {
  let sprint = await prisma.hackathon.findFirst({
    where: { title: "Demo Sprint 1" }
  });

  const questions = {
    type: "coding",
    list: [
      {
        type: "coding",
        title: "FizzBuzz",
        difficulty: "Easy",
        timeLimit: 15,
        problemDescription: `Write a function that takes an integer n and returns a string array where:\n- arr[i] == "FizzBuzz" if i is divisible by 3 and 5.\n- arr[i] == "Fizz" if i is divisible by 3.\n- arr[i] == "Buzz" if i is divisible by 5.\n- arr[i] == i (as a string) if none of the above conditions are true.`,
        testCases: [
          { caseIndex: 1, input: "3", expectedOutput: '["1", "2", "Fizz"]' },
          { caseIndex: 2, input: "5", expectedOutput: '["1", "2", "Fizz", "4", "Buzz"]' }
        ],
        codeTemplate: `def solution(n):\n    # Write your logic here:\n    return []`,
      },
      {
        type: "coding",
        title: "Valid Palindrome",
        difficulty: "Easy",
        timeLimit: 15,
        problemDescription: "Write a function that takes a string s and returns true if it is a palindrome, or false otherwise.",
        testCases: [
          { caseIndex: 1, input: '"racecar"', expectedOutput: "true" },
          { caseIndex: 2, input: '"hello"', expectedOutput: "false" }
        ],
        codeTemplate: `def solution(s):\n    # Write your logic here:\n    return False`
      },
      {
        title: "Login to Redlix",
        difficulty: "Medium",
        timeLimit: 20,
        problemDescription: `Build a simple HTML button with the following requirements:\n1. It must have an ID of 'login-btn'.\n2. The text inside must contain "Login to Redlix".\n3. It must have a CSS background color of 'red'.\n\nYour code will be evaluated visually via Live Preview. When you click 'Run Tests', the system will check if the element exists in the DOM.`,
        testCases: [
          { caseIndex: 1, input: "DOM_CHECK", expectedOutput: "PASS" }
        ],
        codeTemplate: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    /* Add your CSS styling here */\n    \n  </style>\n</head>\n<body>\n  \n  <!-- Add your HTML here -->\n\n</body>\n</html>`
      },
      {
        title: "Employee Salaries (SQL)",
        difficulty: "Medium",
        timeLimit: 20,
        problemDescription: `Write a SQL query to find the names of employees who have a salary greater than 50000.\n        \nTable: \`employees\`\nColumns: \`id\` (int), \`name\` (text), \`salary\` (int)\n\nReturn the results containing only the \`name\` column.`,
        testCases: [
          { 
            caseIndex: 1, 
            input: "CREATE TABLE employees (\n  id INTEGER,\n  name TEXT,\n  salary INTEGER\n);\n\nINSERT INTO employees VALUES \n  (1, 'Alice', 60000),\n  (2, 'Bob', 45000),\n  (3, 'Charlie', 80000);", 
            expectedOutput: "[\n  {\n    \"name\": \"Alice\"\n  },\n  {\n    \"name\": \"Charlie\"\n  }\n]" 
          }
        ],
        codeTemplate: `-- Write your SQL query below\nSELECT \n`
      }
    ]
  };

  if (!sprint) {
    console.log("Demo Sprint 1 not found. Creating it...");
    const parent = await prisma.hackathon.findFirst({
        where: { parentHackathonId: null }
    });
    
    sprint = await prisma.hackathon.create({
      data: {
        title: "Demo Sprint 1",
        description: "Demo technical sprint featuring Algorithms, Frontend, and SQL.",
        startDate: new Date(),
        endDate: new Date(Date.now() + 120 * 60000), // 120 mins
        teamSize: 1,
        type: "Online",
        isStarted: false,
        parentHackathonId: parent ? parent.id : null,
        joinCode: "SPRNT1",
        questions: JSON.stringify(questions)
      }
    });
  } else {
    console.log("Demo Sprint 1 found. Updating questions...");
    await prisma.hackathon.update({
      where: { id: sprint.id },
      data: { 
          questions: JSON.stringify(questions),
          joinCode: sprint.joinCode || "SPRNT1"
      }
    });
  }

  console.log("Demo Sprint 1 updated successfully with joinCode SPRNT1!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
