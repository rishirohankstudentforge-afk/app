import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

async function main() {
  const casesPath = path.join(process.cwd(), "scratch", "expert_cases.json");
  const cases = JSON.parse(fs.readFileSync(casesPath, "utf-8"));

  const newCasesPath = path.join(process.cwd(), "scratch", "expert_cases_new.json");
  const newCases = JSON.parse(fs.readFileSync(newCasesPath, "utf-8"));

  const q1 = {
    title: "1. Maximize the Number of Active Sections",
    type: "coding",
    difficulty: "Expert",
    description: "You are given a binary string s of length n, where '1' represents an active section and '0' represents an inactive section. You can perform at most one trade to maximize the number of active sections in s. In a trade, you: Convert a contiguous block of '1's that is surrounded by '0's to all '0's. Afterward, convert a contiguous block of '0's that is surrounded by '1's to all '1's. Additionally, you are given a 2D array queries, where queries[i] = [li, ri] represents a substring s[li...ri]. For each query, determine the maximum possible number of active sections in s after making the optimal trade on the substring s[li...ri]. Return an array answer, where answer[i] is the result for queries[i]. Note: For each query, treat s[li...ri] as if it is augmented with a '1' at both ends. The augmented '1's do not contribute to the final count. The queries are independent of each other.",
    timeLimit: 30,
    testCases: newCases
  };

  const q2 = {
    title: "2. Regular Expression Matching",
    type: "coding",
    difficulty: "Expert",
    description: "Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*' where: '.' Matches any single character. '*' Matches zero or more of the preceding element. The matching should cover the entire input string (not partial).",
    timeLimit: 35,
    testCases: cases.q2
  };

  const sqlSetup = "CREATE TABLE Stadium (id INT, visit_date DATE, people INT); " +
                   "INSERT INTO Stadium VALUES (1, '2017-01-01', 10), (2, '2017-01-02', 109), (3, '2017-01-03', 150), (4, '2017-01-04', 99), (5, '2017-01-05', 145), (6, '2017-01-06', 1455), (7, '2017-01-07', 199), (8, '2017-01-09', 188);";
  
  const sqlOutput = '[{"id": 5, "visit_date": "2017-01-05", "people": 145}, {"id": 6, "visit_date": "2017-01-06", "people": 1455}, {"id": 7, "visit_date": "2017-01-07", "people": 199}]';

  const q3 = {
    title: "3. Human Traffic of Stadium",
    type: "coding",
    difficulty: "Expert",
    description: "Write a SQL query to display the records with three or more rows with consecutive id's, and the number of people is greater than or equal to 100 for each. Return the result table ordered by visit_date in ascending order.",
    timeLimit: 25,
    testCases: [
      { input: sqlSetup, expectedOutput: sqlOutput }
    ]
  };

  const questions = [q1, q2, q3];
  const joinCode = "EXP-" + Math.floor(100000 + Math.random() * 900000);

  const hackathon = await prisma.hackathon.create({
    data: {
      title: "Redlix Expert Sprint",
      description: "3 Expert Level Questions (2 Algo, 1 SQL)",
      startDate: new Date(),
      endDate: new Date(Date.now() + 120 * 60000), // 120 minutes
      teamSize: 1,
      type: "Sprint",
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
