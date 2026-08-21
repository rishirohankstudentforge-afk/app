
async function testPistonRecursion() {
  const code = `
def recurse():
    recurse()
recurse()
`;

  console.log("Testing infinite recursion...");
  let res = await fetch("http://16.170.166.176:2000/api/v2/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: "python",
      version: "*",
      files: [{ content: code }]
    })
  });
  console.log("Recursion result:", await res.json());
}

testPistonRecursion().catch(console.error);
