import { prisma } from "../src/lib/prisma";

async function main() {
  // Find Redlix Hackathon
  const hackathons = await prisma.hackathon.findMany({
    where: {
      joinCode: null,
      title: { contains: "Redlix", mode: "insensitive" }
    }
  });

  if (hackathons.length === 0) {
    console.log("No Redlix hackathon found. Creating one...");
    // Just in case, if they deleted it
  }

  const redlixHackathon = hackathons[0] || await prisma.hackathon.create({
    data: {
      title: "Redlix Internal Hackathon",
      description: "An internal hackathon",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      teamSize: 4
    }
  });

  console.log("Found parent hackathon:", redlixHackathon.title);

  // Generate some coding questions
  const questions = [
    {
      title: "Reverse a String",
      type: "coding",
      difficulty: "Easy",
      description: "Write a function `solution(s)` that reverses a string. You will receive a string, and you should return a reversed string.",
      timeLimit: 10,
      testCases: [
        { input: "\"hello\"", expectedOutput: "\"olleh\"" },
        { input: "\"world\"", expectedOutput: "\"dlrow\"" }
      ]
    },
    {
      title: "Valid Palindrome",
      type: "coding",
      difficulty: "Medium",
      description: "Write a function `solution(s)` that returns true if a string is a palindrome, and false otherwise.",
      timeLimit: 15,
      testCases: [
        { input: "\"racecar\"", expectedOutput: "true" },
        { input: "\"hello\"", expectedOutput: "false" }
      ]
    },
    {
      title: "Fibonacci Number",
      type: "coding",
      difficulty: "Easy",
      description: "Write a function `solution(n)` that calculates the nth Fibonacci number.",
      timeLimit: 10,
      testCases: [
        { input: "2", expectedOutput: "1" },
        { input: "4", expectedOutput: "3" },
        { input: "10", expectedOutput: "55" }
      ]
    }
  ];

  const sprintId = `SP-${Math.floor(100000 + Math.random() * 900000)}`;

  const sprint = await prisma.hackathon.create({
    data: {
      title: "Redlix Sprint Challenge",
      description: "A 180-minute sprint with algorithms.",
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 60 * 1000), // 180 min
      joinCode: sprintId,
      parentHackathonId: redlixHackathon.id,
      questions: JSON.stringify(questions),
      isStarted: true,
      teamSize: 1
    }
  });

  console.log("Created Sprint:", sprint.title);
  console.log("Join Code:", sprint.joinCode);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
