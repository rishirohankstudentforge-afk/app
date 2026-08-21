import { prisma } from "../src/lib/prisma";

const SOLUTIONS = [
  // Q1: Trapping Rain Water (Python)
  {
    language: "python",
    code: "def solution(height):\n    if not height: return '0'\n    l, r = 0, len(height) - 1\n    left_max, right_max = height[l], height[r]\n    ans = 0\n    while l < r:\n        if left_max < right_max:\n            l += 1\n            left_max = max(left_max, height[l])\n            ans += left_max - height[l]\n        else:\n            r -= 1\n            right_max = max(right_max, height[r])\n            ans += right_max - height[r]\n    return str(ans)\n"
  },
  // Q2: Regular Expression Matching (JavaScript)
  {
    language: "javascript",
    code: "function solution(s, p) {\n    const pattern = '^' + p + '$';\n    const regex = new RegExp(pattern);\n    return regex.test(s) ? 'true' : 'false';\n}"
  },
  // Q3: Human Traffic of Stadium (SQL)
  {
    language: "sql",
    code: "SELECT t1.* FROM Stadium t1, Stadium t2, Stadium t3 WHERE t1.people >= 100 AND t2.people >= 100 AND t3.people >= 100 AND ((t1.id - t2.id = 1 AND t1.id - t3.id = 2 AND t2.id - t3.id = 1) OR (t2.id - t1.id = 1 AND t2.id - t3.id = 2 AND t1.id - t3.id = 1) OR (t3.id - t2.id = 1 AND t3.id - t1.id = 2 AND t2.id - t1.id = 1)) ORDER BY t1.visit_date ASC;"
  }
];

async function main() {
  const sprint = await prisma.hackathon.findFirst({
    where: { title: "Redlix Expert Sprint" },
    orderBy: { createdAt: "desc" }
  });

  if (!sprint || !sprint.questions) {
    console.log("Sprint not found");
    return;
  }

  console.log("Verifying Sprint: " + sprint.title + " (" + sprint.joinCode + ")");
  const questions = JSON.parse(sprint.questions);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const sol = SOLUTIONS[i];
    console.log("\\n--- Testing Q" + (i+1) + ": " + q.title + " [" + sol.language + "] ---");

    const payload = {
      language: sol.language,
      code: sol.code,
      testCases: q.testCases
    };

    const res = await fetch("http://localhost:3000/api/sprints/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.success) {
      console.log("Error:", data.error);
      continue;
    }

    const allPassed = data.data.every((r: any) => r.status === "pass");
    console.log("Result: " + (allPassed ? "✅ ALL PASSED" : "❌ FAILED"));
    if (!allPassed) {
      console.log(data.data.filter((r: any) => r.status !== "pass"));
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
