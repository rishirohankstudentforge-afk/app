const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDemoSprint() {
  try {
    const redlix = await prisma.hackathon.findFirst({
      where: {
        title: { contains: 'Redlix' },
        joinCode: null
      }
    });

    if (!redlix) {
      console.log('No Redlix hackathon found.');
      return;
    }

    const joinCode = 'SP-' + Date.now();

    const questions = {
      type: 'coding',
      list: [
        {
          title: "Two Sum",
          problemDescription: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
          codeTemplate: "function twoSum(nums, target) {\n  // Write your code here\n}",
          testCases: [
            { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
            { input: "[3,2,4]\n6", expectedOutput: "[1,2]" }
          ],
          languageCategory: "coding"
        },
        {
          title: "Reverse String",
          problemDescription: "Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
          codeTemplate: "function reverseString(s) {\n  // Write your code here\n}",
          testCases: [
            { input: "[\"h\",\"e\",\"l\",\"l\",\"o\"]", expectedOutput: "[\"o\",\"l\",\"l\",\"e\",\"h\"]" },
            { input: "[\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]", expectedOutput: "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]" }
          ],
          languageCategory: "coding"
        },
        {
          title: "Create a Button Component",
          problemDescription: "Create a functional React component that renders a button. When clicked, the button text should change from 'Click Me' to 'Clicked!'.",
          codeTemplate: "export default function Button() {\n  return <button>Click Me</button>;\n}",
          testCases: [
            { input: "render", expectedOutput: "<button>Click Me</button>" }
          ],
          languageCategory: "frontend"
        },
        {
          title: "Find Top Customers",
          problemDescription: "Write a SQL query to find the names of customers who have made purchases totaling more than $1000. \n\nTable 'orders': customer_name (varchar), amount (int).",
          codeTemplate: "-- Write your SQL query here\nSELECT * FROM orders;",
          testCases: [
            { input: "EXECUTE", expectedOutput: "John Doe\nAlice Smith" }
          ],
          languageCategory: "sql"
        }
      ]
    };

    const sprint = await prisma.hackathon.create({
      data: {
        title: "Demo Sprint 2",
        description: "A 60-minute coding sprint with algorithm, frontend, and SQL challenges.",
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 60 * 1000), // 60 mins from now
        teamSize: 1,
        type: "Online",
        questions: JSON.stringify(questions),
        joinCode: joinCode,
        isStarted: false,
        parentHackathonId: redlix.id
      }
    });

    console.log('Sprint Created:', sprint.id, 'Join Code:', sprint.joinCode);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoSprint();
