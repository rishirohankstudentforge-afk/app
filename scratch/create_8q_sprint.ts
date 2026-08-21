import { prisma } from "../src/lib/prisma";

async function main() {
  const hackathons = await prisma.hackathon.findMany({
    where: {
      joinCode: null,
      title: { contains: "Redlix", mode: "insensitive" }
    }
  });

  const redlixHackathon = hackathons[0] || await prisma.hackathon.create({
    data: {
      title: "Redlix Internal Hackathon",
      description: "An internal hackathon",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      teamSize: 4
    }
  });

  // Question 1: Max Product
  const maxProductTC = [];
  for (let i=0; i<15; i++) {
    const arr = Array.from({length: 5}, () => Math.floor(Math.random()*10)+1);
    const sorted = [...arr].sort((a,b) => b-a);
    const expected = (sorted[0]-1) * (sorted[1]-1);
    maxProductTC.push({ input: `[${arr.join(',')}]`, expectedOutput: `"${expected}"` });
  }

  // Question 2: Balloons
  const balloonsTC = [
    { input: '"nlaebolko"', expectedOutput: '"1"' },
    { input: '"loonbalxballpoon"', expectedOutput: '"2"' },
    { input: '"leetcode"', expectedOutput: '"0"' },
    { input: '"balloonballoonballoon"', expectedOutput: '"3"' },
    { input: '"bbaallllooooonn"', expectedOutput: '"2"' },
    { input: '"bbaallllooonn"', expectedOutput: '"1"' }, 
    { input: '"b"', expectedOutput: '"0"' },
    { input: '"balon"', expectedOutput: '"0"' },
    { input: '"balloonballoon"', expectedOutput: '"2"' },
    { input: '"balloonballoonb"', expectedOutput: '"2"' },
    { input: '"bbaallllooooonnballoon"', expectedOutput: '"3"' },
    { input: '"xxyyzz"', expectedOutput: '"0"' },
    { input: '"ballooooon"', expectedOutput: '"1"' },
    { input: '"balllloon"', expectedOutput: '"1"' },
    { input: '"bbbaaabbbllllooooonnnn"', expectedOutput: '"2"' } 
  ];

  // Question 3: Two Sum
  const twoSumTC = [];
  for(let i=0; i<15; i++) {
    const target = 10 + i;
    const arr = [1, 2, 3, target-3, target+1]; 
    twoSumTC.push({ input: `[${arr.join(',')}], ${target}`, expectedOutput: '"[2,3]"' });
  }

  // Question 4: Valid Palindrome
  const isPal = (s: string) => s === s.split('').reverse().join('');
  const palStrs = ["racecar", "hello", "level", "world", "madam", "civic", "redlix", "radar", "kayak", "rotor", "apple", "refer", "banana", "deified", "stats"];
  const palTC = palStrs.map(s => ({ input: `"${s}"`, expectedOutput: `"${isPal(s)}"` }));

  // Question 5: Reverse String
  const revStrs = ["hello", "world", "redlix", "javascript", "typescript", "coding", "sprint", "hackathon", "abc", "xyz", "qwerty", "asdf", "zxcv", "test", "case"];
  const revTC = revStrs.map(s => ({ input: `"${s}"`, expectedOutput: `"${s.split('').reverse().join('')}"` }));

  // Question 6: Find Minimum Element
  const minTC = [];
  for(let i=0; i<15; i++) {
    const arr = Array.from({length: 6}, () => Math.floor(Math.random()*100)-50);
    const expected = Math.min(...arr);
    minTC.push({ input: `[${arr.join(',')}]`, expectedOutput: `"${expected}"` });
  }

  // Question 7: Count Vowels
  const countVowels = (s: string) => (s.match(/[aeiouAEIOU]/g) || []).length;
  const vowelStrs = ["hello", "world", "education", "apple", "banana", "rhythm", "sky", "aeiou", "AEIOU", "bcdfg", "redlix", "sprint", "hackathon", "test", "case"];
  const vowelTC = vowelStrs.map(s => ({ input: `"${s}"`, expectedOutput: `"${countVowels(s)}"` }));

  // Question 8: SQL Second Highest Salary
  const sqlTC = [];
  for(let i=0; i<15; i++) {
    if (i < 10) {
      const s1 = 100 + i*10;
      const s2 = s1 + 100;
      const s3 = s2 + 100;
      const setup = `CREATE TABLE Employee (id INT, salary INT); INSERT INTO Employee VALUES (1, ${s1}), (2, ${s2}), (3, ${s3});`;
      sqlTC.push({ input: `"${setup}"`, expectedOutput: `[{"SecondHighestSalary": ${s2}}]` });
    } else {
      const s1 = 100 + i*10;
      const setup = `CREATE TABLE Employee (id INT, salary INT); INSERT INTO Employee VALUES (1, ${s1});`;
      sqlTC.push({ input: `"${setup}"`, expectedOutput: `[{"SecondHighestSalary": null}]` });
    }
  }

  const questions = [
    {
      title: "1. Maximum Product of Two Elements",
      type: "coding",
      difficulty: "Easy",
      description: "Choose two different array elements and maximize (a-1)*(b-1). You will receive an array of positive integers, and you should return the maximum product.",
      timeLimit: 15,
      testCases: maxProductTC
    },
    {
      title: "2. Maximum Number of Balloons",
      type: "coding",
      difficulty: "Easy",
      description: "Find how many copies of the word 'balloon' can be constructed from the letters of text, using each input character at most once.",
      timeLimit: 15,
      testCases: balloonsTC
    },
    {
      title: "3. Two Sum",
      type: "coding",
      difficulty: "Easy",
      description: "Given an array of integers and an integer target, return the indices of the two numbers such that they add up to the target. Assume exactly one valid solution exists.",
      timeLimit: 15,
      testCases: twoSumTC
    },
    {
      title: "4. Valid Palindrome",
      type: "coding",
      difficulty: "Easy",
      description: "Write a function that returns true if a given lowercase string is a palindrome, and false otherwise.",
      timeLimit: 10,
      testCases: palTC
    },
    {
      title: "5. Reverse String",
      type: "coding",
      difficulty: "Easy",
      description: "Write a function that returns the reverse of the given string.",
      timeLimit: 10,
      testCases: revTC
    },
    {
      title: "6. Find Minimum Element",
      type: "coding",
      difficulty: "Easy",
      description: "Write a function that receives an array of integers and returns the smallest integer in the array.",
      timeLimit: 10,
      testCases: minTC
    },
    {
      title: "7. Count Vowels",
      type: "coding",
      difficulty: "Easy",
      description: "Write a function that counts the number of vowels (a, e, i, o, u) in a given string.",
      timeLimit: 10,
      testCases: vowelTC
    },
    {
      title: "8. Second Highest Salary (SQL)",
      type: "sql",
      difficulty: "Easy",
      description: "Write an SQL query to report the second highest salary from the Employee table. If there is no second highest salary, the query should report null.",
      timeLimit: 15,
      testCases: sqlTC
    }
  ];

  const sprintId = `SP-${Math.floor(100000 + Math.random() * 900000)}`;

  const sprint = await prisma.hackathon.create({
    data: {
      title: "Redlix Mega Sprint (8 Questions)",
      description: "A 2hr 30min sprint packed with 8 coding and SQL questions, rigorously tested with 15 test cases each.",
      startDate: new Date(),
      endDate: new Date(Date.now() + 150 * 60 * 1000), // 150 min = 2.5 hrs
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
