import { prisma } from "../src/lib/prisma";

const SOLUTIONS = [
  // 1. Angle Between Hands of a Clock (Python)
  {
    language: "python",
    code: "def solution(h, m):\n    h = int(h)\n    m = int(m)\n    hAngle = (h % 12) * 30 + m * 0.5\n    mAngle = m * 6\n    diff = abs(hAngle - mAngle)\n    return min(diff, 360 - diff)\n"
  },
  // 2. Container With Most Water (JavaScript)
  {
    language: "javascript",
    code: "function solution(nums) {\n    let maxArea = 0;\n    let left = 0, right = nums.length - 1;\n    while(left < right) {\n        maxArea = Math.max(maxArea, Math.min(nums[left], nums[right]) * (right - left));\n        if(nums[left] < nums[right]) left++;\n        else right--;\n    }\n    return maxArea.toString();\n}"
  },
  // 3. Maximum Subarray (C++)
  {
    language: "cpp",
    code: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    string input;\n    getline(cin, input);\n    vector<int> nums;\n    string temp = \"\";\n    for(char c : input) {\n        if(c == '-' || (c >= '0' && c <= '9')) {\n            temp += c;\n        } else if (temp != \"\") {\n            nums.push_back(stoi(temp));\n            temp = \"\";\n        }\n    }\n    if(temp != \"\") nums.push_back(stoi(temp));\n\n    int maxSoFar = nums[0], currMax = nums[0];\n    for (int i = 1; i < nums.size(); i++) {\n        currMax = max(nums[i], currMax + nums[i]);\n        maxSoFar = max(maxSoFar, currMax);\n    }\n    cout << maxSoFar << endl;\n    return 0;\n}"
  },
  // 4. Product of Array Except Self (JavaScript)
  {
    language: "javascript",
    code: "function solution(nums) {\n    const n = nums.length;\n    const ans = new Array(n).fill(1);\n    let left = 1;\n    for(let i=0; i<n; i++) {\n        ans[i] = left;\n        left *= nums[i];\n    }\n    let right = 1;\n    for(let i=n-1; i>=0; i--) {\n        ans[i] *= right;\n        right *= nums[i];\n    }\n    return ans;\n}"
  },
  // 5. Jump Game (TypeScript)
  {
    language: "typescript",
    code: "function solution(nums: number[]): boolean {\n    let maxReach = 0;\n    let possible = true;\n    for(let i=0; i<nums.length; i++) {\n        if(i > maxReach) { possible = false; break; }\n        maxReach = Math.max(maxReach, i + nums[i]);\n    }\n    return possible;\n}"
  },
  // 6. Second Highest Salary (SQL)
  {
    language: "sql",
    code: "SELECT (\n  SELECT DISTINCT salary \n  FROM Employee \n  ORDER BY salary DESC \n  LIMIT 1 OFFSET 1\n) AS SecondHighestSalary;"
  }
];

async function main() {
  const sprint = await prisma.hackathon.findFirst({
    where: { title: "Redlix Medium Sprint" },
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
