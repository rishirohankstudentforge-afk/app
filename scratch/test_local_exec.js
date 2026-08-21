const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const code = `
import json, sys

def solution(s): return s[::-1]

def _run_tests():
    test_cases = json.loads(r"""[{"input":"\\"hello\\"","expectedOutput":"\\"olleh\\"","caseIndex":1}]""")
    results = []
    for tc in test_cases:
        args = eval("(" + tc['input'] + ",)")
        actual = solution(*args)
        actual_json = json.dumps(actual)
        passed = (actual_json == tc['expectedOutput'])
        results.append({
            "caseIndex": tc['caseIndex'],
            "status": "pass" if passed else "fail",
            "expected": tc['expectedOutput'],
            "actual": actual_json
        })
    print(json.dumps(results))

if __name__ == '__main__':
    _run_tests()
`;

const tmpFile = path.join(os.tmpdir(), "test_run.py");
fs.writeFileSync(tmpFile, code);

exec(`python "${tmpFile}"`, (error, stdout, stderr) => {
    console.log("Error:", error);
    console.log("Stdout:", stdout);
    console.log("Stderr:", stderr);
});
