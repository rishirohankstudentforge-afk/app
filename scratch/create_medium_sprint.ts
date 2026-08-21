import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

async function main() {
  // Load scraped questions
  const scrapedPath = "C:\\\\Users\\\\padar\\\\.gemini\\\\antigravity-ide\\\\brain\\\\f2bf9cea-0c39-479c-ae59-e40904404dd0\\\\scratch\\\\scraped_questions.json";
  const scrapedData = JSON.parse(fs.readFileSync(scrapedPath, "utf-8"));
  
  const angleQ = scrapedData.find((q: any) => q.id === "1344");
  const sqlQ = scrapedData.find((q: any) => q.id === "176");

  // Question 1: Angle Between Hands of a Clock (15 cases)
  const angleCases = [];
  for (let i = 0; i < 15; i++) {
    const h = Math.floor(Math.random() * 12) + 1;
    const m = Math.floor(Math.random() * 60);
    let hAngle = (h % 12) * 30 + m * 0.5;
    let mAngle = m * 6;
    let diff = Math.abs(hAngle - mAngle);
    let ans = Math.min(diff, 360 - diff);
    angleCases.push({ input: h + ", " + m, expectedOutput: ans.toString() });
  }

  const q1 = {
    title: "1. Angle Between Hands of a Clock",
    type: "coding",
    difficulty: "Medium",
    description: angleQ.description,
    timeLimit: 15,
    testCases: angleCases
  };

  // Question 2: Container With Most Water
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
  const q2 = {
    title: "2. Container With Most Water",
    type: "coding",
    difficulty: "Medium",
    description: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water.",
    timeLimit: 15,
    testCases: waterCases
  };

  // Question 3: Search Insert Position (Easy/Medium) -> Let's use Maximum Subarray (Kadane's)
  const kadaneCases = [];
  for (let i = 0; i < 15; i++) {
    const arr = Array.from({length: 8}, () => Math.floor(Math.random() * 20) - 10);
    // Ensure at least one positive to avoid empty
    arr[0] = Math.abs(arr[0]) || 1;
    let maxSoFar = arr[0], currMax = arr[0];
    for (let j = 1; j < arr.length; j++) {
      currMax = Math.max(arr[j], currMax + arr[j]);
      maxSoFar = Math.max(maxSoFar, currMax);
    }
    kadaneCases.push({ input: "[" + arr.join(",") + "]", expectedOutput: maxSoFar.toString() });
  }
  const q3 = {
    title: "3. Maximum Subarray",
    type: "coding",
    difficulty: "Medium",
    description: "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
    timeLimit: 15,
    testCases: kadaneCases
  };

  // Question 4: Product of Array Except Self
  const productCases = [];
  for (let i = 0; i < 15; i++) {
    const arr = Array.from({length: 4}, () => Math.floor(Math.random() * 5) + 1);
    const ans = arr.map((_, idx) => arr.reduce((acc, val, j) => idx === j ? acc : acc * val, 1));
    productCases.push({ input: "[" + arr.join(",") + "]", expectedOutput: "[" + ans.join(",") + "]" });
  }
  const q4 = {
    title: "4. Product of Array Except Self",
    type: "coding",
    difficulty: "Medium",
    description: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].",
    timeLimit: 15,
    testCases: productCases
  };

  // Question 5: Jump Game
  const jumpCases = [];
  for (let i = 0; i < 15; i++) {
    const arr = Array.from({length: 5}, () => Math.floor(Math.random() * 3));
    let maxReach = 0;
    let possible = true;
    for (let j = 0; j < arr.length; j++) {
      if (j > maxReach) { possible = false; break; }
      maxReach = Math.max(maxReach, j + arr[j]);
    }
    jumpCases.push({ input: "[" + arr.join(",") + "]", expectedOutput: possible ? "true" : "false" });
  }
  const q5 = {
    title: "5. Jump Game",
    type: "coding",
    difficulty: "Medium",
    description: "You are given an integer array nums. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position. Return true if you can reach the last index, or false otherwise.",
    timeLimit: 15,
    testCases: jumpCases
  };

  // Question 6: Second Highest Salary (SQL)
  const sqlSetup = "CREATE TABLE Employee (id INT, salary INT); INSERT INTO Employee VALUES (1, 100), (2, 200), (3, 300);";
  const q6 = {
    title: "6. Second Highest Salary",
    type: "coding",
    difficulty: "Medium",
    description: sqlQ.description,
    timeLimit: 15,
    testCases: [
      { input: sqlSetup, expectedOutput: "[{\"SecondHighestSalary\": 200}]" }
    ]
  };

  const questions = [q1, q2, q3, q4, q5, q6];

  const joinCode = "MED-" + Math.floor(100000 + Math.random() * 900000);

  const hackathon = await prisma.hackathon.create({
    data: {
      title: "Redlix Medium Sprint",
      startDate: new Date(),
      endDate: new Date(Date.now() + 150 * 60000), // 150 minutes
      teamSize: 1,
      type: "Sprint",
      description: "6 Medium Level Questions (5 Algo, 1 SQL)",
      joinCode: joinCode,
      questions: JSON.stringify(questions),
    }
  });

  console.log("Created Sprint: " + hackathon.title);
  console.log("Join Code: " + joinCode);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
