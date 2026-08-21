
async function main() {
  const url = "http://localhost:3000/api/sprints/execute";
  const payload = {
    language: "python",
    code: "def solution(s):\n    return s[::-1]\n",
    testCases: [
      { input: "\"hello\"", expectedOutput: "\"olleh\"", caseIndex: 1 },
      { input: "\"world\"", expectedOutput: "\"dlrow\"", caseIndex: 2 }
    ]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.text();
  console.log(data);
}

main();
