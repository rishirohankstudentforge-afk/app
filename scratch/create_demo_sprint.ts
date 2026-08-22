import 'dotenv/config';
import { prisma } from "../src/lib/prisma";

async function main() {
  // Find "mrdu hackthon"
  const parentHackathon = await prisma.hackathon.findFirst({
    where: { title: { contains: "mrdu", mode: "insensitive" } }
  });

  if (!parentHackathon) {
    console.error("Could not find mrdu hackthon");
    return;
  }

  console.log(`Found parent hackathon: ${parentHackathon.title} (${parentHackathon.id})`);

  // Question 1: Container With Most Water (Algo Medium)
  const waterCases = [];
  for (let i = 0; i < 15; i++) {
    const len = Math.floor(Math.random() * 8) + 2;
    const arr = Array.from({length: len}, () => Math.floor(Math.random() * 10) + 1);
    let maxArea = 0;
    let left = 0, right = arr.length - 1;
    while (left < right) {
      maxArea = Math.max(maxArea, Math.min(arr[left], arr[right]) * (right - left));
      if (arr[left] < arr[right]) left++;
      else right--;
    }
    waterCases.push({ input: "[" + arr.join(",") + "]", expectedOutput: maxArea.toString() });
  }
  const q1 = {
    title: "1. Container With Most Water",
    type: "coding",
    difficulty: "Medium",
    description: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water.",
    timeLimit: 15,
    testCases: waterCases
  };

  // Question 2: Maximum Subarray (Algo Medium)
  const kadaneCases = [];
  for (let i = 0; i < 15; i++) {
    const arr = Array.from({length: 8}, () => Math.floor(Math.random() * 20) - 10);
    arr[0] = Math.abs(arr[0]) || 1; // avoid all negatives for simplicity
    let maxSoFar = arr[0], currMax = arr[0];
    for (let j = 1; j < arr.length; j++) {
      currMax = Math.max(arr[j], currMax + arr[j]);
      maxSoFar = Math.max(maxSoFar, currMax);
    }
    kadaneCases.push({ input: "[" + arr.join(",") + "]", expectedOutput: maxSoFar.toString() });
  }
  const q2 = {
    title: "2. Maximum Subarray",
    type: "coding",
    difficulty: "Medium",
    description: "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
    timeLimit: 15,
    testCases: kadaneCases
  };

  const questions = [q1, q2];
  const joinCode = "DEMO-" + Math.floor(100000 + Math.random() * 900000);

  const sprint = await prisma.hackathon.create({
    data: {
      title: "Redlix Demo Sprint",
      startDate: new Date(),
      endDate: new Date(Date.now() + 120 * 60000), // 2 hours
      teamSize: 1,
      type: "Sprint",
      description: "Demo Sprint with 2 Medium Algorithms",
      joinCode: joinCode,
      questions: JSON.stringify(questions),
      parentHackathonId: parentHackathon.id
    }
  });

  console.log("Created Sprint: " + sprint.title);
  console.log("Join Code: " + joinCode);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
