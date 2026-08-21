async function test() {
    try {
        const response = await fetch("http://localhost:3000/api/sprints/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                language: "javascript",
                code: "function solution(arg1) {\\n  // Write your code here\\n  \\n}", 
                testCases: [{"input":"[2,5,3,1,4]","expectedOutput":"\"12\"","caseIndex":1}]
            })
        });

        const status = response.status;
        const json = await response.json();
        console.log("Status:", status);
        console.log("Response:", JSON.stringify(json, null, 2));
    } catch(e) {
        console.error(e);
    }
}
test();
