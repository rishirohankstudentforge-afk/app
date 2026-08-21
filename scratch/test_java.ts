async function main() {
  const payload = {
    language: "java",
    code: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        String input = scanner.nextLine();\n        input = input.replace(\"[\", \"\").replace(\"]\", \"\");\n        String[] parts = input.split(\",\");\n        int sum = 0;\n        for (String p : parts) {\n            sum += Integer.parseInt(p.trim());\n        }\n        System.out.println(sum);\n    }\n}",
    testCases: [
      { input: "[3, 4, 5, 2]", expectedOutput: "14" },
      { input: "[10, 20]", expectedOutput: "30" }
    ]
  };

  const res = await fetch("http://localhost:3000/api/sprints/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main();
