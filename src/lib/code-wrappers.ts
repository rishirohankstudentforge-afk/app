export function wrapCodeForPiston(language: string, userCode: string, testCases: any[]): string {
  // Normalize test cases to ensure they have caseIndex
  const normalizedCases = testCases.map((tc, idx) => ({
    ...tc,
    caseIndex: tc.caseIndex || idx + 1
  }));

  const testCasesJson = JSON.stringify(normalizedCases);

  if (language === "python") {
    return `
import json, sys

# --- USER CODE START ---
${userCode}
# --- USER CODE END ---

def _run_tests():
    try:
        test_cases = json.loads(r"""${testCasesJson}""")
    except Exception as e:
        print(json.dumps([{"caseIndex": 1, "status": "fail", "error": "Failed to parse test cases: " + str(e)}]))
        return

    results = []
    for tc in test_cases:
        try:
            # We wrap the input in a tuple to unpack it as arguments
            eval_str = "(" + tc['input'] + ",)"
            args = eval(eval_str)
            actual = solution(*args)
            
            # If actual is already a string, json.dumps adds quotes, which matches our JSON expected format
            actual_json = json.dumps(actual)
            
            # expectedOutput is stored as a JSON string, e.g. '"olleh"'
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
                res_obj["e"] = expected_str
                res_obj["a"] = actual_json
            results.append(res_obj)
        except Exception as e:
            results.append({
                "c": tc['caseIndex'],
                "s": 0,
                "err": str(e)
            })
            
    print(json.dumps(results))

if __name__ == '__main__':
    _run_tests()
`;
  }

  if (language === "javascript" || language === "typescript") {
    return `// @ts-nocheck
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
            passed = (actualJson === normalizedExpected) || (actualJson === tc.expectedOutput) || ('"' + actualJson + '"' === tc.expectedOutput) || (actualJson === '"' + tc.expectedOutput + '"');
        } catch(e) {
            passed = (actualJson === tc.expectedOutput) || ('"' + actualJson + '"' === tc.expectedOutput) || (actualJson === '"' + tc.expectedOutput + '"');
        }
        
        const resObj = {
            c: tc.caseIndex,
            s: passed ? 1 : 0
        };
        if (!passed) {
            resObj.e = tc.expectedOutput;
            resObj.a = actualJson;
        }
        results.push(resObj);
    } catch(err) {
        results.push({
            c: tc.caseIndex,
            s: 0,
            err: err.toString()
        });
    }
}

console.log(JSON.stringify(results));
`;
  }

  if (language === "java" || language === "cpp" || language === "c") {
    // For Java, C, and C++, we use Standard I/O (CP style).
    // No wrapper is added; the user writes the entire program including main().
    return userCode;
  }

  if (language === "sql") {
    return `
import json, sys, sqlite3

def _run_tests():
    try:
        test_cases = json.loads(r"""${testCasesJson}""")
    except Exception as e:
        print(json.dumps([{"caseIndex": 1, "status": "fail", "error": "Failed to parse test cases: " + str(e)}]))
        return

    results = []
    
    for tc in test_cases:
        try:
            conn = sqlite3.connect(':memory:')
            cursor = conn.cursor()
            
            # Run setup SQL (from testcase input)
            setup_sql = tc.get('input', '')
            if setup_sql:
                cursor.executescript(setup_sql)
            
            # Execute Candidate Query
            cursor.execute("""${userCode}""")
            
            # Format output as JSON
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            actual_output = [dict(zip(columns, row)) for row in rows] if columns else rows
            actual_json = json.dumps(actual_output)
            
            expected_str = tc.get('expectedOutput', '')
            try:
                passed = (json.loads(actual_json) == json.loads(expected_str))
            except:
                passed = (actual_json == expected_str)
            
            res_obj = {
                "c": tc['caseIndex'],
                "s": 1 if passed else 0
            }
            if not passed:
                res_obj["e"] = expected_str
                res_obj["a"] = actual_json
            results.append(res_obj)
            
            conn.close()
        except Exception as e:
            results.append({
                "c": tc['caseIndex'],
                "s": 0,
                "err": str(e)
            })
            
    print(json.dumps(results))

if __name__ == '__main__':
    _run_tests()
`;
  }

  throw new Error("Unsupported language: " + language);
}
