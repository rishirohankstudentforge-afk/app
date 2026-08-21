import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

async function main() {
  const scrapedPath = "C:\\\\Users\\\\padar\\\\.gemini\\\\antigravity-ide\\\\brain\\\\f2bf9cea-0c39-479c-ae59-e40904404dd0\\\\scratch\\\\scraped_questions.json";
  const scrapedData = JSON.parse(fs.readFileSync(scrapedPath, "utf-8"));
  
  const hardQuestions = scrapedData.filter((q: any) => q.difficulty === 'Hard').slice(0, 3);
  
  const casesPath = path.join(process.cwd(), "scratch", "hard_cases.json");
  const hardCases = JSON.parse(fs.readFileSync(casesPath, "utf-8"));

  const q1 = {
    title: "1. " + hardQuestions[0].title,
    type: "coding",
    difficulty: "Hard",
    description: hardQuestions[0].description,
    timeLimit: 25,
    testCases: hardCases.q1
  };

  const q2 = {
    title: "2. " + hardQuestions[1].title,
    type: "coding",
    difficulty: "Hard",
    description: hardQuestions[1].description,
    timeLimit: 25,
    testCases: hardCases.q2
  };

  const q3 = {
    title: "3. " + hardQuestions[2].title,
    type: "coding",
    difficulty: "Hard",
    description: hardQuestions[2].description,
    timeLimit: 25,
    testCases: hardCases.q3
  };

  const sqlSetup = "CREATE TABLE Employee (Id INT, Name VARCHAR(255), Salary INT, DepartmentId INT); " +
                   "CREATE TABLE Department (Id INT, Name VARCHAR(255)); " +
                   "INSERT INTO Department VALUES (1, 'IT'), (2, 'Sales'); " +
                   "INSERT INTO Employee VALUES (1, 'Joe', 85000, 1), (2, 'Henry', 80000, 2), (3, 'Sam', 60000, 2), (4, 'Max', 90000, 1), (5, 'Janet', 69000, 1), (6, 'Randy', 85000, 1), (7, 'Will', 70000, 1);";
  
  const sqlOutput = '[{"Department": "IT", "Employee": "Max", "Salary": 90000}, {"Department": "IT", "Employee": "Joe", "Salary": 85000}, {"Department": "IT", "Employee": "Randy", "Salary": 85000}, {"Department": "IT", "Employee": "Will", "Salary": 70000}, {"Department": "Sales", "Employee": "Henry", "Salary": 80000}, {"Department": "Sales", "Employee": "Sam", "Salary": 60000}]';

  const q4 = {
    title: "4. Department Top Three Salaries",
    type: "coding",
    difficulty: "Hard",
    description: "Write a SQL query to find employees who earn the top three salaries in each of the company's departments. For the above tables, your SQL query should return the following rows (order of rows does not matter).",
    timeLimit: 20,
    testCases: [
      { input: sqlSetup, expectedOutput: sqlOutput }
    ]
  };

  const questions = [q1, q2, q3, q4];
  const joinCode = "HRD-" + Math.floor(100000 + Math.random() * 900000);

  const hackathon = await prisma.hackathon.create({
    data: {
      title: "Redlix Hard Sprint",
      description: "4 Hard Level Questions (3 Algo, 1 SQL)",
      startDate: new Date(),
      endDate: new Date(Date.now() + 150 * 60000), // 150 minutes
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
