import { prisma } from "../src/lib/prisma";

const SOLUTIONS = [
  {
    language: "python",
    code: `
def solution(nums):
    sorted_nums = sorted(nums, reverse=True)
    return (sorted_nums[0] - 1) * (sorted_nums[1] - 1)
`
  },
  {
    language: "javascript",
    code: `
function solution(text) {
    let b=0, a=0, l=0, o=0, n=0;
    for(let c of text) {
        if(c==='b') b++;
        if(c==='a') a++;
        if(c==='l') l++;
        if(c==='o') o++;
        if(c==='n') n++;
    }
    return Math.min(b, a, Math.floor(l/2), Math.floor(o/2), n);
}
`
  },
  {
    language: "python",
    code: `
def solution(nums, target):
    d = {}
    for i, n in enumerate(nums):
        if target - n in d:
            return [d[target-n], i]
        d[n] = i
`
  },
  {
    language: "javascript",
    code: `
function solution(s) {
    return s === s.split('').reverse().join('');
}
`
  },
  {
    language: "python",
    code: `
def solution(s):
    return s[::-1]
`
  },
  {
    language: "javascript",
    code: `
function solution(nums) {
    return Math.min(...nums);
}
`
  },
  {
    language: "typescript",
    code: `
function solution(s: any): any {
    const m = s.match(/[aeiouAEIOU]/g);
    return m ? m.length : 0;
}
`
  },
  {
    language: "sql",
    code: `
SELECT (
  SELECT DISTINCT salary
  FROM Employee
  ORDER BY salary DESC
  LIMIT 1 OFFSET 1
) AS SecondHighestSalary;
`
  },
  {
    language: "python",
    code: `
def solution(nums):
    return sum(nums)
`
  }
];

async function main() {
  console.log("Fetching sprint SP-728857...");
  const sprint = await prisma.hackathon.findFirst({
    where: { joinCode: "SP-728857" }
  });

  if (!sprint) {
    console.error("Sprint not found!");
    return;
  }

  const questions = JSON.parse(sprint.questions as string);
  console.log("Found " + questions.length + " questions. Starting rigorous tests...\n");

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const sol = SOLUTIONS[i];
    
    console.log("Testing Q" + (i+1) + ": " + q.title);
    console.log("Language used: " + sol.language);
    
    const payload = {
      language: sol.language,
      code: sol.code,
      testCases: q.testCases.map((tc: any, idx: number) => ({
        ...tc,
        caseIndex: idx + 1
      }))
    };

    const res = await fetch("http://localhost:3000/api/sprints/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    
    let results = data;
    if (!Array.isArray(results)) {
      if (results.success && Array.isArray(results.data)) {
        results = results.data;
      } else {
        console.log("❌ Execution failed with unexpected response:", results);
        console.log("\n");
        continue;
      }
    }
    
    // Check if all passed
    const total = results.length;
    const passed = results.filter((d: any) => d.status === "pass").length;
    const failed = results.filter((d: any) => d.status !== "pass");

    if (passed === total) {
      console.log("✅ Passed all " + total + " test cases!\n");
    } else {
      console.log("❌ Failed! Passed " + passed + "/" + total);
      console.log("Failure details:");
      failed.forEach((f: any) => console.log(f));
      console.log("\n");
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
