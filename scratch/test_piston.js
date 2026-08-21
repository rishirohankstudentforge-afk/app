
async function testPiston() {
  const codeJS = `console.log("Hello JS");`;
  const codeJava = `public class Main { public static void main(String[] args) { System.out.println("Hello Java"); } }`;

  console.log("Testing JS with -1 limit...");
  let res = await fetch("http://16.170.166.176:2000/api/v2/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: "javascript",
      version: "*",
      files: [{ content: codeJS }],
      run_memory_limit: -1,
      compile_memory_limit: -1
    })
  });
  console.log("JS -1 limit:", await res.json());

  console.log("Testing Java with -1 limit...");
  res = await fetch("http://16.170.166.176:2000/api/v2/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: "java",
      version: "*",
      files: [{ content: codeJava }],
      run_memory_limit: -1,
      compile_memory_limit: -1
    })
  });
  console.log("Java -1 limit:", await res.json());
}

testPiston().catch(console.error);
