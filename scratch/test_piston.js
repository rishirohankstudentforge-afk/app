const PISTON_URL = "http://16.170.166.176:2000/api/v2/execute";

async function testPiston() {
    const testCasesJson = '[{"input":"[2,5,3,1,4]","expectedOutput":"\\"12\\""}]';
    const userCode = `function solution(arg1) {
  // Write your code here
  
}`;

    const wrapperCode = `// @ts-nocheck
// --- USER CODE START ---
${userCode}
// --- USER CODE END ---

const testCases = JSON.parse(String.raw\`${testCasesJson}\`);
const results = [];

for (const tc of testCases) {
    try {
        const args = eval("[" + tc.input + "]");
        const actual = solution(...args);
        const actualJson = JSON.stringify(actual);
        
        let passed = false;
        try {
            const normalizedExpected = JSON.stringify(JSON.parse(tc.expectedOutput));
            passed = actualJson === normalizedExpected;
        } catch(e) {
            passed = actualJson === tc.expectedOutput;
        }
        
        results.push({
            caseIndex: tc.caseIndex,
            status: passed ? "pass" : "fail",
            expected: tc.expectedOutput,
            actual: actualJson
        });
    } catch(err) {
        results.push({
            caseIndex: tc.caseIndex,
            status: "fail",
            error: err.toString()
        });
    }
}

console.log(JSON.stringify(results));
`;

console.log("Wrapper code:");
console.log(wrapperCode);

    const payload = {
        language: "typescript",
        version: "*",
        files: [{ content: wrapperCode }],
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_memory_limit: -1,
        run_memory_limit: -1
    };

    try {
        const response = await fetch(PISTON_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const json = await response.json();
        console.log(JSON.stringify(json, null, 2));
    } catch (e) {
        console.error(e);
    }
}
testPiston();
