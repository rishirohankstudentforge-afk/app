import { NextResponse } from "next/server";
import { wrapCodeForPiston } from "@/lib/code-wrappers";

const VERSIONS: Record<string, string> = {
  python: "3.10.0",
  javascript: "18.15.0",
  typescript: "5.0.3",
  java: "15.0.2",
  c: "10.2.0",
  cpp: "10.2.0",
  sql: "3.36.0"
};

// The public API (emkc.org) is now whitelist-only. 
// You MUST set this to your own self-hosted Piston URL in Vercel.
const rawUrl = process.env.PISTON_URL || "http://16.170.166.176:2000/api/v2/execute";
let PISTON_URL = rawUrl.replace(/^["'\s\\]+|["'\s\\]+$/g, '');
// If the user accidentally included /piston/ in their environment variable URL, remove it:
PISTON_URL = PISTON_URL.replace("/api/v2/piston/execute", "/api/v2/execute");

export async function POST(req: Request) {
  try {
    const { language, code, testCases } = await req.json();

    if (!language || !code || !testCases) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const wrappedCode = wrapCodeForPiston(language, code, testCases);
    const version = VERSIONS[language] || "*";
    let pistonLang = language;
    if (language === "sql") pistonLang = "python";
    if (language === "javascript") pistonLang = "typescript";

    // For Python, JS, SQL, TS we run the wrapper once
    if (["python", "javascript", "typescript", "sql"].includes(language)) {
      const response = await fetch(PISTON_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: pistonLang,
          version: pistonLang === "typescript" || language === "sql" ? "*" : version,
          files: [{ content: wrappedCode }],
          compile_timeout: 10000,
          run_timeout: 3000,
          compile_memory_limit: -1,
          run_memory_limit: -1
        })
      });

      const resData = await response.json();
      if (resData.compile && resData.compile.code !== 0) {
        return NextResponse.json({
          success: true,
          data: [{ caseIndex: 1, status: "fail", error: "Compile Error:\\n" + resData.compile.output }]
        });
      }
      
      const out = resData.run?.stdout?.trim() || "";
      const err = resData.run?.stderr?.trim() || "";

      if (resData.run?.code !== 0 && !out) {
        return NextResponse.json({
          success: true,
          data: [{ caseIndex: 1, status: "fail", error: "Execution Error:\\n" + err, debug: resData }]
        });
      }

      try {
        const parsed = JSON.parse(out);
        const mapped = Array.isArray(parsed) ? parsed.map((r: any) => ({
          caseIndex: r.c,
          status: r.s === 1 ? "pass" : "fail",
          error: r.err,
          expected: r.e,
          actual: r.a
        })) : parsed;
        return NextResponse.json({ success: true, data: mapped });
      } catch (e) {
        return NextResponse.json({
          success: true,
          data: [{ caseIndex: 1, status: "fail", error: "Execution Error:\\n" + (err || out) }]
        });
      }
    } 
    // For Java, C, and C++ we use Standard I/O loop
    else if (["java", "cpp", "c"].includes(language)) {
      const results = [];
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        
        // For Java, C, and C++, inputs are usually space-separated and without brackets/commas/quotes in standard CP platforms.
        // We strip commas, square brackets, and double quotes to make it easier for them to use Scanner / cin.
        let sanitizedStdin = tc.cppInput;
        if (!sanitizedStdin) {
          sanitizedStdin = typeof tc.input === 'string'
            ? tc.input.replace(/[,\[\]"]/g, ' ')
            : tc.input;
        }

        const response = await fetch(PISTON_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: pistonLang,
            version,
            files: [{ 
              name: language === "java" ? "Main.java" : language === "cpp" ? "main.cpp" : language === "c" ? "main.c" : undefined,
              content: wrappedCode 
            }],
            stdin: String(sanitizedStdin),
            compile_timeout: 10000,
            run_timeout: 3000
          })
        });

        const resData = await response.json();
        
        if (resData.compile && resData.compile.code !== 0) {
          results.push({ caseIndex: i + 1, status: "fail", error: "Compile Error:\\n" + resData.compile.output });
          continue;
        }

        const out = resData.run?.stdout?.trim() || "";
        const err = resData.run?.stderr?.trim() || "";

        if (resData.run?.code !== 0 && !out) {
           results.push({ caseIndex: i + 1, status: "fail", error: "Execution Error:\\n" + err });
        } else {
           const actual = out;
           const expected = String(tc.expectedOutput).trim();
           if (actual === expected || actual === '"' + expected + '"' || '"' + actual + '"' === expected) {
             results.push({ caseIndex: i + 1, status: "pass", expected, actual });
           } else {
             results.push({ caseIndex: i + 1, status: "fail", expected, actual });
           }
        }
      }
      return NextResponse.json({ success: true, data: results });
    }

  } catch (error: any) {
    console.error("Execute API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
