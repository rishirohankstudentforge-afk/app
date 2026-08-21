const testCasesJsonQ1 = `[{"input":"\\"abab\\", 2","expectedOutput":"\\"baab\\"","caseIndex":1}]`;
const testCasesJsonQ2 = `[{"input":"728468, [[500568, 42]]","expectedOutput":"\\"71747\\"","caseIndex":1}]`;

async function runLang(lang, userCode, testCases) {
  let wrapped = userCode;
  if (lang === "python") {
    wrapped = `
import json, sys
# --- USER CODE START ---
${userCode}
# --- USER CODE END ---
def _run_tests():
    try:
        test_cases = json.loads(r"""${testCases}""")
    except Exception as e:
        print(json.dumps([{"c": 1, "s": 0, "err": "Parse error"}]))
        return

    results = []
    for tc in test_cases:
        try:
            eval_str = "(" + tc['input'] + ",)"
            args = eval(eval_str)
            actual = solution(*args)
            actual_json = json.dumps(actual)
            expected_str = tc['expectedOutput']
            try:
                v_actual = json.loads(actual_json)
                v_expected = json.loads(expected_str)
                passed = (v_actual == v_expected) or (str(v_actual).lower() == str(v_expected).lower())
            except:
                passed = (actual_json == expected_str) or ('"' + actual_json + '"' == expected_str) or (actual_json == '"' + expected_str + '"')
            
            res_obj = {
                "c": tc['caseIndex'],
                "s": 1 if passed else 0
            }
            if not passed:
                res_obj["e"] = str(expected_str)[:30]
                res_obj["a"] = str(actual_json)[:30]
            results.append(res_obj)
        except Exception as e:
            results.append({
                "c": tc['caseIndex'],
                "s": 0,
                "err": str(e)[:20]
            })
            
    print(json.dumps(results))
_run_tests()
`;
  } else if (lang === "typescript") {
    wrapped = `
function _runTests() {
    let results = [];
    let testCases;
    try { testCases = JSON.parse(\`${testCases}\`); } catch(e) { return; }
    let solution = undefined;
    try { eval(\`${userCode}\`); } catch(err) { return; }
    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        try {
            let args = [];
            eval("args = [" + tc.input + "];");
            let actual = solution.apply(null, args);
            let actualJson = JSON.stringify(actual);
            results.push({ c: tc.caseIndex, s: 0, e: String(tc.expectedOutput).substring(0, 30), a: String(actualJson).substring(0, 30) });
        } catch(err) {
            results.push({ c: tc.caseIndex, s: 0, err: err.toString().substring(0, 20) });
        }
    }
    console.log(JSON.stringify(results));
}
_runTests();
`;
  }

  let res = await fetch("http://16.170.166.176:2000/api/v2/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: lang,
      version: "*",
      files: [{ content: wrapped }],
      compile_timeout: 10000,
      run_timeout: 3000,
      compile_memory_limit: -1,
      run_memory_limit: -1
    })
  });
  console.log(`--- ${lang} ---`);
  console.log(await res.json());
}

async function main() {
  await runLang("python", "def solution(s, k):\n    return s", testCasesJsonQ1);
  await runLang("typescript", "function solution(n, operations) {\n    return n;\n}", testCasesJsonQ2);
}
main();
