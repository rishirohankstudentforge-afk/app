const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/sprints/active/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Inject calculateAndSaveProgress
const calcFunction = `
  const calculateAndSaveProgress = async (currentResults, currentDrafts) => {
    let finalScore = 0;
    Object.keys(currentResults).forEach(idx => {
      const results = currentResults[Number(idx)];
      if (results && Array.isArray(results)) {
        finalScore += (results.filter((r) => r.status === "pass").length * 10);
      }
    });

    try {
      if (!participantId) return;
      await fetch(\`/api/sprints/participants\`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: participantId, 
          score: finalScore,
          answers: JSON.stringify(currentDrafts)
        })
      });
    } catch(e) {}
  };
`;
content = content.replace('const runCodeCompile = async (qIdx: number) => {', calcFunction + '\n  const runCodeCompile = async (qIdx: number) => {');

// 2. HTML dynamic checker
const oldHtmlCheck = `    if (selectedLang.id === "html") {
      setTimeout(() => {
        const passedId = src.includes("id=\\"login-btn\\"") || src.includes("id='login-btn'");
        const passedText = src.includes("Login to Redlix");
        const passedColor = src.includes("background-color") && src.includes("red");
        const allPassed = passedId && passedText && passedColor;
        setCompileResults({ ...compileResults, [qIdx]: [{
           caseIndex: 1, 
           status: allPassed ? "pass" : "fail", 
           expected: "DOM requirements met", 
           actual: allPassed ? "Requirements met" : "Missing ID, Text, or Red Background" 
        }] });
        setCompiling(false);
      }, 500);
      return;
    }`;

const newHtmlCheck = `    if (selectedLang.id === "html") {
      setTimeout(() => {
        let allPassed = false;
        let expected = "";
        let actual = "";

        if (q.title.toLowerCase().includes("warning")) {
           const passedId = src.includes("id=\\"warning-alert\\"") || src.includes("id='warning-alert'");
           const passedText = src.includes("Warning");
           const passedColor = src.includes("background-color") && src.includes("orange");
           allPassed = passedId && passedText && passedColor;
           expected = "DOM requirements met (ID warning-alert, Warning text, Orange)";
           actual = allPassed ? "Requirements met" : "Missing ID, Text, or Orange Background";
        } else {
           const passedId = src.includes("id=\\"login-btn\\"") || src.includes("id='login-btn'");
           const passedText = src.includes("Login to Redlix");
           const passedColor = src.includes("background-color") && src.includes("red");
           allPassed = passedId && passedText && passedColor;
           expected = "DOM requirements met (ID login-btn, text, red)";
           actual = allPassed ? "Requirements met" : "Missing ID, Text, or Red Background";
        }

        const newRes = { ...compileResults, [qIdx]: [{
           caseIndex: 1, 
           status: allPassed ? "pass" : "fail", 
           expected: expected, 
           actual: actual 
        }] };
        setCompileResults(newRes);
        calculateAndSaveProgress(newRes, codeDrafts);
        setCompiling(false);
      }, 500);
      return;
    }`;

content = content.replace(oldHtmlCheck, newHtmlCheck);

// 3. Piston API autosave
const oldPiston = `      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Execution failed");
      setCompileResults({ ...compileResults, [qIdx]: data.data });`;

const newPiston = `      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Execution failed");
      const newRes = { ...compileResults, [qIdx]: data.data };
      setCompileResults(newRes);
      calculateAndSaveProgress(newRes, codeDrafts);`;

content = content.replace(oldPiston, newPiston);

// 4. Load drafts on mount
const oldLoad = `            if (p.isLocked) {
              setIsLocked(true);
              setWarningReason("Exam Terminated. Awaiting Organizer action.");
              setShowWarningOverlay(true);
            }`;

const newLoad = `
            if (p.answers) {
              try {
                const savedDrafts = JSON.parse(p.answers);
                if (Object.keys(savedDrafts).length > 0) {
                  setCodeDrafts(prev => ({ ...prev, ...savedDrafts }));
                }
              } catch(e) {}
            }
            if (p.isLocked) {
              setIsLocked(true);
              setWarningReason("Exam Terminated. Awaiting Organizer action.");
              setShowWarningOverlay(true);
            }`;

content = content.replace(oldLoad, newLoad);

// 5. Code draft manual changes need to auto-save?
// Usually run tests is enough, or we can trigger auto-save every X seconds if we wanted. But the prompt just said "when we click run tests". The prompt says "I have completed one code ... score and code need to be saved". Running tests gives score and saves code.
// To be safe, let's also hook the draft update. But that might spam the API. We'll just rely on calculateAndSaveProgress from runCodeCompile. 

fs.writeFileSync(targetPath, content);
console.log('Update complete.');
