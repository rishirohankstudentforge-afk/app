import { prisma } from "../src/lib/prisma";

const SOLUTIONS = [
  // Q1: Smallest Palindromic Rearrangement II (Python)
  {
    language: "python",
    code: "def solution(s, k):\n    import collections, itertools\n    s = str(s)\n    k = int(k)\n    counts = collections.Counter(s)\n    odd_chars = [ch for ch, cnt in counts.items() if cnt % 2 == 1]\n    if len(odd_chars) > 1: return \"\"\n    half_chars = []\n    for ch, cnt in counts.items():\n        half_chars.extend([ch] * (cnt // 2))\n    perms = sorted(list(set(itertools.permutations(half_chars))))\n    if k > len(perms): return \"\"\n    left = \"\".join(perms[k-1])\n    mid = odd_chars[0] if odd_chars else \"\"\n    return left + mid + left[::-1]\n"
  },
  // Q2: Maximum Building Height (JavaScript)
  {
    language: "javascript",
    code: "function solution(n, restrictions) {\n    if (typeof restrictions === 'string') restrictions = JSON.parse(restrictions);\n    let a = [...restrictions, [1, 0]];\n    a.sort((x, y) => x[0] - y[0]);\n    if (a[a.length - 1][0] !== n) a.push([n, n - 1]);\n    for (let i = 1; i < a.length; i++) {\n        a[i][1] = Math.min(a[i][1], a[i-1][1] + a[i][0] - a[i-1][0]);\n    }\n    for (let i = a.length - 2; i >= 0; i--) {\n        a[i][1] = Math.min(a[i][1], a[i+1][1] + a[i+1][0] - a[i][0]);\n    }\n    let ans = 0;\n    for (let i = 0; i < a.length - 1; i++) {\n        let d = a[i+1][0] - a[i][0];\n        ans = Math.max(ans, Math.floor((a[i][1] + a[i+1][1] + d) / 2));\n    }\n    return ans;\n}"
  },
  // Q3: Number of ZigZag Arrays II (Java)
  {
    language: "java",
    code: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        if(!scanner.hasNextLine()) return;\n        String[] parts = scanner.nextLine().split(\",\");\n        int n = Integer.parseInt(parts[0].trim());\n        int l = Integer.parseInt(parts[1].trim());\n        int r = Integer.parseInt(parts[2].trim());\n        \n        long MOD = 1000000007;\n        if (n > 1000) { System.out.println(0); return; }\n        \n        Map<String, Long> dp = new HashMap<>();\n        for (int v = l; v <= r; v++) {\n            dp.put(v + \",0\", 1L);\n        }\n        for (int i = 2; i <= n; i++) {\n            Map<String, Long> nextDp = new HashMap<>();\n            for (int v = l; v <= r; v++) {\n                nextDp.put(v + \",0\", 0L);\n                nextDp.put(v + \",1\", 0L);\n                nextDp.put(v + \",-1\", 0L);\n            }\n            for (Map.Entry<String, Long> entry : dp.entrySet()) {\n                String[] key = entry.getKey().split(\",\");\n                int v = Integer.parseInt(key[0]);\n                int d = Integer.parseInt(key[1]);\n                long count = entry.getValue();\n                if (count == 0) continue;\n                \n                for (int nxt = l; nxt <= r; nxt++) {\n                    if (nxt > v) {\n                        if (d != 1) {\n                            String k = nxt + \",1\";\n                            nextDp.put(k, (nextDp.getOrDefault(k, 0L) + count) % MOD);\n                        }\n                    } else if (nxt < v) {\n                        if (d != -1) {\n                            String k = nxt + \",-1\";\n                            nextDp.put(k, (nextDp.getOrDefault(k, 0L) + count) % MOD);\n                        }\n                    }\n                }\n            }\n            dp = nextDp;\n        }\n        long sum = 0;\n        for (long count : dp.values()) {\n            sum = (sum + count) % MOD;\n        }\n        System.out.println(sum);\n    }\n}"
  },
  // Q4: Department Top Three Salaries (SQL)
  {
    language: "sql",
    code: "SELECT d.Name AS Department, e1.Name AS Employee, e1.Salary FROM Employee e1 JOIN Department d ON e1.DepartmentId = d.Id WHERE 3 > (SELECT COUNT(DISTINCT e2.Salary) FROM Employee e2 WHERE e2.Salary > e1.Salary AND e1.DepartmentId = e2.DepartmentId);"
  }
];

async function main() {
  const sprint = await prisma.hackathon.findFirst({
    where: { title: "Redlix Hard Sprint" },
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
