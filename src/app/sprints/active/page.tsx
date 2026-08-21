"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, ChevronRight, Play, AlertCircle, Maximize, Minimize, AlertTriangle } from "lucide-react";
import Editor from "@monaco-editor/react";

// ---------- Language config ----------
const LANGUAGES = [
  { id: "javascript", label: "JavaScript", ext: "js", monoLabel: "javascript" },
  { id: "python", label: "Python 3", ext: "py", monoLabel: "python" },
  { id: "java", label: "Java", ext: "java", monoLabel: "java" },
  { id: "cpp", label: "C++", ext: "cpp", monoLabel: "cpp" },
  { id: "typescript", label: "TypeScript", ext: "ts", monoLabel: "typescript" },
  { id: "sql", label: "SQL", ext: "sql", monoLabel: "sql" },
  { id: "html", label: "HTML/Frontend", ext: "html", monoLabel: "html" },
];

const generateArgsString = (testCases: any[]) => {
  if (!testCases || testCases.length === 0) return "";
  const firstInput = testCases[0].input;
  if (!firstInput) return "";
  try {
    const lines = String(firstInput).split("\\n").filter(l => l.trim().length > 0);
    return lines.map((_, i) => `arg${i + 1}`).join(", ");
  } catch(e) {
    return "arg1";
  }
};

const getTemplate = (lang: string, argsStr: string) => {
  if (lang === "javascript") return `function solution(${argsStr}) {\n  // Write your code here\n  \n}`;
  if (lang === "python") return `def solution(${argsStr}):\n    # Write your code here\n    pass\n`;
  if (lang === "java") return `public class Solution {\n    public static Object solution(${argsStr}) {\n        // Write your code here\n        return null;\n    }\n}`;
  if (lang === "cpp") return `#include <bits/stdc++.h>\nusing namespace std;\n\nauto solution(${argsStr}) {\n    // Write your code here\n}`;
  if (lang === "typescript") return `function solution(${argsStr}): any {\n  // Write your code here\n  \n}`;
  if (lang === "sql") return `-- Write your SQL query here\nSELECT * FROM table_name;\n`;
  if (lang === "html") return `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    /* CSS here */\n  </style>\n</head>\n<body>\n  <!-- HTML here -->\n\n  <script>\n    // JS here\n  </script>\n</body>\n</html>`;
  return "";
};

function SprintActiveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

  const [sprint, setSprint] = useState<any>(null);
  const [questionType, setQuestionType] = useState<"coding" | "quiz">("coding");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});

  const [activeCodeQIndex, setActiveCodeQIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>({});
  const [compileResults, setCompileResults] = useState<Record<number, any[]>>({});
  const [compiling, setCompiling] = useState(false);

  const [timeLeftStr, setTimeLeftStr] = useState("00:00");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Participant Data
  const [participantId, setParticipantId] = useState("");
  const [visitedQs, setVisitedQs] = useState<Set<number>>(new Set([0]));

  // Anti-cheat & Fullscreen
  const [warnings, setWarnings] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [showWarningOverlay, setShowWarningOverlay] = useState(false);
  const [warningReason, setWarningReason] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProctorToast, setShowProctorToast] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const draftKey = (qIdx: number, langId: string) => `${qIdx}_${langId}`;

  useEffect(() => {
    if (!code) {
      setErrorMsg("Missing room join code.");
      setLoading(false); return;
    }
    const load = async () => {
      try {
        const statusRes = await fetch(`/api/sprints/status?code=${code}`);
        const statusData = await statusRes.json();
        if (!statusData.success) {
          setErrorMsg(statusData.error || "Room not found."); return;
        }
        const sprintId = statusData.data.id;
        const detailsRes = await fetch(`/api/sprints/${sprintId}`);
        const detailsData = await detailsRes.json();
        if (!detailsData.success) {
          setErrorMsg(detailsData.error || "Failed to load sprint."); return;
        }
        const fullSprint = detailsData.data;
        setSprint(fullSprint);

        if (fullSprint.questions) {
          let parsed = fullSprint.questions;
          if (typeof parsed === "string") parsed = JSON.parse(parsed);
          if (typeof parsed === "string") parsed = JSON.parse(parsed);
          const type = parsed.type || "coding";
          setQuestionType(type);
          const list = parsed.list || [];
          setQuestions(list);

          if (type === "coding") {
            const drafts: Record<string, string> = {};
            list.forEach((q: any, idx: number) => {
              const argsStr = generateArgsString(q.testCases || []);
              LANGUAGES.forEach(lang => {
                drafts[draftKey(idx, lang.id)] = lang.id === "javascript" && q.codeTemplate ? q.codeTemplate : getTemplate(lang.id, argsStr);
              });
            });
            setCodeDrafts(drafts);
          }
        }

        const email = localStorage.getItem("candidate_email");
        if (email) {
          const partRes = await fetch(`/api/sprints/participants?sprintId=${sprintId}&email=${email}`);
          const partData = await partRes.json();
          if (partData.success && partData.data.length > 0) {
            const p = partData.data[0];
            setParticipantId(p.id);
            setWarnings(p.warningsCount || 0);

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
            }
            if (p.isSubmitted) setIsSubmitted(true);
          }
        }
      } catch (err) {
        setErrorMsg("Failed to load workspace.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [code]);

  // Admin Action Poller (Resets strikes if Admin un-terminates)
  useEffect(() => {
    if (isSubmitted || !sprint || !participantId) return;
    const poll = setInterval(async () => {
      try {
        const email = localStorage.getItem("candidate_email");
        const res = await fetch(`/api/sprints/participants?sprintId=${sprint.id}&email=${email}`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const p = data.data[0];
          
          if (p.isLocked) {
            setIsLocked(true);
            setWarnings(p.warningsCount || 0);
          } else if (isLocked) {
            // Admin unlocked them! Drop the overlay and sync strikes
            setIsLocked(false);
            setWarnings(p.warningsCount || 0);
            setShowWarningOverlay(false);
          }
        }
      } catch (e) {}
    }, 5000);
    return () => clearInterval(poll);
  }, [sprint, isSubmitted, participantId, isLocked]);

  // Sprint Status Poller
  useEffect(() => {
    if (isSubmitted || !code) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/sprints/status?code=${code}`);
        const data = await res.json();
        if (data.success && data.data) {
          if (!data.data.isStarted) {
            alert("The sprint has been stopped by the organizer.");
            router.push(`/sprints/waiting?code=${code}`);
          } else {
            setIsPaused(data.data.isPaused || false);
            // Sync updated sprint data in case endDate was extended after pause
            setSprint((prev: any) => prev ? { ...prev, endDate: data.data.endDate } : null);
          }
        }
      } catch (e) {}
    }, 5000);
    return () => clearInterval(poll);
  }, [code, isSubmitted, router]);

  useEffect(() => {
    if (!sprint || !sprint.isStarted || isLocked || isSubmitted) return;
    if (isPaused) {
      setTimeLeftStr("PAUSED");
      return;
    }
    const end = sprint.endDate ? new Date(sprint.endDate).getTime() : Date.now() + 180 * 60000;
    const timer = setInterval(() => {
      const diff = end - Date.now();
      if (diff <= 0) {
        setTimeLeftStr("00:00:00");
        clearInterval(timer);
        handleSubmit();
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeftStr(`${h > 0 ? h.toString().padStart(2, "0") + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sprint, isLocked, isSubmitted, isPaused]);

  // Redundant fullscreen listener removed

  const issueWarning = async (reason: string, forceLock = false) => {
    if (isLocked || isSubmitted || !sprint || !participantId) return;
    try {
      const email = localStorage.getItem("candidate_email");
      const partRes = await fetch(`/api/sprints/participants?sprintId=${sprint.id}&email=${email}`);
      const partData = await partRes.json();
      if (partData.success && partData.data.length > 0) {
        const p = partData.data[0];
        const newWarnings = forceLock ? 3 : (p.warningsCount + 1);
        await fetch(`/api/sprints/participants`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id: p.id, 
            warningsCount: newWarnings, 
            isLocked: newWarnings >= 3 || forceLock,
            cheatingLogs: {
              time: new Date().toISOString(),
              reason: reason,
              strike: forceLock ? "TERMINATED" : newWarnings
            }
          })
        });
        setWarnings(newWarnings);
        setWarningReason(reason);
        setShowWarningOverlay(true);
        if (newWarnings >= 3 || forceLock) setIsLocked(true);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      const handleFsChange = () => {
        const isFs = !!document.fullscreenElement;
        setIsFullscreen(isFs);
        if (!isFs && !isLocked && !isSubmitted) {
          issueWarning("Candidate exited fullscreen mode.");
          if (!fsTimeoutRef.current) {
            fsTimeoutRef.current = setTimeout(() => {
              issueWarning("Fullscreen absence exceeded 30 seconds. Exam terminated.", true);
            }, 30000);
          }
        } else if (isFs) {
          if (fsTimeoutRef.current) {
            clearTimeout(fsTimeoutRef.current);
            fsTimeoutRef.current = null;
          }
        }
      };
      document.addEventListener("fullscreenchange", handleFsChange);
      return () => {
        document.removeEventListener("fullscreenchange", handleFsChange);
        if (fsTimeoutRef.current) clearTimeout(fsTimeoutRef.current);
      };
    }
  }, [isLocked, isSubmitted, sprint, participantId]);

  useEffect(() => {
    if (isLocked || isSubmitted || !sprint || !participantId) return;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.error("Camera access denied or failed:", e);
      }
    };
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isLocked, isSubmitted, sprint, participantId]);

  // Auto-select language based on question title
  useEffect(() => {
    if (questions[activeCodeQIndex]) {
      const title = questions[activeCodeQIndex].title.toLowerCase();
      if (title.includes("frontend") || title.includes("html")) {
        setSelectedLang(LANGUAGES.find(l => l.id === "html")!);
      } else if (title.includes("sql")) {
        setSelectedLang(LANGUAGES.find(l => l.id === "sql")!);
      } else if (selectedLang.id === "html" || selectedLang.id === "sql") {
        setSelectedLang(LANGUAGES.find(l => l.id === "javascript")!);
      }
    }
  }, [activeCodeQIndex, questions]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setShowProctorToast(true);
      setTimeout(() => setShowProctorToast(false), 3000);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  
  const calculateAndSaveProgress = async (
    currentResults: Record<number, any>,
    currentDrafts: Record<number, string>
  ) => {
    let finalScore = 0;
    Object.keys(currentResults).forEach((idx) => {
      const results = currentResults[Number(idx)];
      if (results && Array.isArray(results)) {
        finalScore += (results.filter((r) => r.status === "pass").length * 10);
      }
    });

    try {
      if (!participantId) return;
      await fetch(`/api/sprints/participants`, {
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

  const runCodeCompile = async (qIdx: number) => {
    setCompiling(true);
    const key = draftKey(qIdx, selectedLang.id);
    const src = codeDrafts[key] || "";
    const q = questions[qIdx];
    const tcs = q.testCases || [];

    if (selectedLang.id === "html") {
      setTimeout(() => {
        let allPassed = false;
        let expected = "";
        let actual = "";

        if (q.title.toLowerCase().includes("warning")) {
           const passedId = src.includes("id=\"warning-alert\"") || src.includes("id='warning-alert'");
           const passedText = src.includes("Warning");
           const passedColor = src.includes("background-color") && src.includes("orange");
           allPassed = passedId && passedText && passedColor;
           expected = "DOM requirements met (ID warning-alert, Warning text, Orange)";
           actual = allPassed ? "Requirements met" : "Missing ID, Text, or Orange Background";
        } else {
           const passedId = src.includes("id=\"login-btn\"") || src.includes("id='login-btn'");
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
    }

    try {
      const res = await fetch("/api/sprints/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: selectedLang.id, code: src, testCases: tcs })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Execution failed");
      const newRes = { ...compileResults, [qIdx]: data.data };
      setCompileResults(newRes);
      calculateAndSaveProgress(newRes, codeDrafts);
    } catch (e: any) {
      setCompileResults({ ...compileResults, [qIdx]: [{ caseIndex: 1, status: "error", error: e.message }] });
    } finally {
      setCompiling(false);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit your exam? This action cannot be undone.")) {
      return;
    }
    
    let finalScore = 0;
    if (questionType === "coding") {
      Object.keys(compileResults).forEach(qIdx => {
        const results = compileResults[Number(qIdx)];
        if (results && Array.isArray(results)) {
          finalScore += (results.filter((r: any) => r.status === "pass").length * 10);
        }
      });
    }
    try {
      const email = localStorage.getItem("candidate_email") || "";
      const partRes = await fetch(`/api/sprints/participants?sprintId=${sprint.id}&email=${email}`);
      const partData = await partRes.json();
      if (partData.success && partData.data.length > 0) {
        const updateRes = await fetch(`/api/sprints/participants`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: partData.data[0].id, score: finalScore, isSubmitted: true, codeDrafts: questionType === "coding" ? codeDrafts : quizAnswers })
        });
        const updateData = await updateRes.json();
        if (updateData.success) {
          setIsSubmitted(true);
        } else {
          console.error("Submit failed:", updateData.error);
          alert("Failed to submit exam: " + updateData.error);
        }
      } else {
        alert("Could not find your participant record.");
      }
    } catch (e: any) {
      console.error(e);
      alert("Network error while submitting.");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-50"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (errorMsg) return <div className="flex h-screen items-center justify-center bg-zinc-50">{errorMsg}</div>;

  if (isSubmitted) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 font-sans p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-8 border-4 border-emerald-50">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-black text-zinc-900 uppercase tracking-tight mb-4">Exam Completed</h1>
        <p className="text-zinc-600 max-w-md mx-auto leading-relaxed text-sm mb-8">
          Your answers have been successfully submitted. You can safely close this window. Your results will be evaluated by the organizers.
        </p>
        <button
          onClick={() => router.push("/candidate-dashboard")}
          className="bg-[#E61E32] hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-colors flex items-center gap-2"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-50 font-sans overflow-hidden" ref={containerRef}>
      {showProctorToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] bg-zinc-900 shadow-2xl rounded-xl px-5 py-3 flex items-center gap-3 animate-bounce-once">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-sm font-bold text-white tracking-wide">Proctoring Active</p>
        </div>
      )}

      {showWarningOverlay && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-red-500">
            <h2 className="text-2xl font-black text-red-600 uppercase">⚠ Warning {warnings}/3</h2>
            <p className="text-zinc-700 mt-2">{warningReason}</p>
            <p className="text-xs text-zinc-500 mt-2">{isLocked ? "Exam Terminated." : "Acknowledge to resume."}</p>
            {!isLocked && (
              <button onClick={() => setShowWarningOverlay(false)} className="mt-6 w-full bg-red-600 text-white font-black py-3 rounded-xl">Resume</button>
            )}
          </div>
        </div>
      )}

      {isPaused && (
        <div className="fixed inset-0 bg-zinc-950/95 z-[150] flex flex-col items-center justify-center p-6 backdrop-blur-xl">
          <div className="w-20 h-20 bg-amber-500/20 border border-amber-500/50 rounded-full flex items-center justify-center animate-pulse mb-6">
             <div className="w-8 h-8 bg-amber-500 rounded-sm" />
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-4">Sprint Paused</h2>
          <p className="text-zinc-400 text-center max-w-lg text-sm">
            The organizer has paused the sprint. Don't worry, your progress is saved and your countdown timer has been stopped. Please wait for the organizer to resume the session.
          </p>
        </div>
      )}

      {!isFullscreen && !isLocked && (
        <div className="absolute inset-0 z-[100] bg-red-50/95 backdrop-blur-md flex items-center justify-center p-4" onClick={toggleFullscreen}>
          <div className="bg-white p-10 rounded-3xl shadow-[0_0_50px_rgba(230,30,50,0.1)] border border-red-200 max-w-lg w-full text-center space-y-6 cursor-pointer hover:border-emerald-700 transition-all">
            <Maximize className="w-20 h-20 text-red-600 mx-auto animate-pulse" />
            <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Fullscreen Required</h2>
            <p className="text-zinc-400 font-medium text-sm px-4">You must remain in fullscreen mode during the entirety of the assessment. Leaving fullscreen will result in a strike.</p>
            <button className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 px-6 rounded-2xl uppercase tracking-widest transition-all">Click Anywhere to Resume</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white text-zinc-900 border-b border-red-100 py-3 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">S</div>
          <div><h1 className="text-sm font-black">{sprint?.title || "Sprint"}</h1><p className="text-[10px] text-zinc-500">Technical Assessment</p></div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-black font-mono text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">{timeLeftStr}</span>
          <button onClick={handleSubmit} className="bg-[#E61E32] hover:bg-red-500 transition-colors text-white text-xs font-black py-2 px-5 rounded-lg tracking-wide shadow-[0_0_15px_rgba(230,30,50,0.3)]">Submit Exam</button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {questionType === "coding" ? (
          <>
            {/* Left Sidebar Layout */}
            <div className="w-[500px] shrink-0 bg-red-50 border-r border-red-200 flex relative text-zinc-800">
              
              {/* Vertical Question List */}
              <div className="w-20 shrink-0 bg-white border-r border-red-200 flex flex-col items-center py-6 gap-3 overflow-y-auto hide-scrollbar z-10 relative">
                {questions.map((q: any, idx: number) => {
                  const solved = compileResults[idx] && compileResults[idx].length > 0 && compileResults[idx].every((r: any) => r.status === "pass");
                  const visited = visitedQs.has(idx);
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveCodeQIndex(idx);
                        setVisitedQs(new Set(visitedQs).add(idx));
                      }}
                      className={`relative flex items-center justify-center w-14 h-10 rounded-xl transition-all font-sans font-black text-sm tracking-wide ${
                        activeCodeQIndex === idx 
                          ? "bg-red-600 shadow-lg scale-110 z-10 text-white border border-red-700" 
                          : solved
                            ? "bg-green-50 text-green-600 border border-green-300 hover:bg-green-100"
                            : visited
                              ? "bg-zinc-100 text-zinc-600 border border-zinc-300 hover:bg-zinc-200"
                              : "bg-white text-zinc-500 border border-zinc-200 hover:text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      Q{idx + 1}
                      {solved && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-sm" />}
                    </button>
                  );
                })}
              </div>

              {/* Question Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {questions[activeCodeQIndex] && (
                  <>
                    <div className="space-y-4 border-b border-red-200 pb-5">
                      <h3 className="text-2xl font-black text-zinc-900">{questions[activeCodeQIndex].title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded text-[10px] font-black uppercase bg-green-100 text-green-700 border border-green-300">{questions[activeCodeQIndex].difficulty || "Easy"}</span>
                        <span className="px-3 py-1 rounded text-[10px] font-black uppercase bg-red-100 text-red-700">{questions[activeCodeQIndex].timeLimit || 15} mins</span>
                      </div>
                    </div>
                    <div className="text-[14px] text-zinc-700 leading-relaxed font-medium whitespace-pre-wrap font-sans">
                      {questions[activeCodeQIndex].description || questions[activeCodeQIndex].problemDescription}
                    </div>
                    
                    <div className="space-y-6 mt-8">
                      {questions[activeCodeQIndex].testCases?.slice(0, 2).map((tc: any, i: number) => (
                        <div key={i} className="space-y-2">
                          <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Sample Input {i}</h4>
                          <div className="p-4 bg-white rounded-lg border border-red-200 font-mono text-[12px] text-zinc-800 whitespace-pre-wrap">{tc.input}</div>
                          <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mt-4">Sample Output {i}</h4>
                          <div className="p-4 bg-white rounded-lg border border-red-200 font-mono text-[12px] text-zinc-800 whitespace-pre-wrap">{tc.expectedOutput}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border border-zinc-700 shadow-2xl z-50 bg-white">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-white flex items-center gap-1 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> REC
                </div>
              </div>

            </div>

            {/* Right Editor */}
            <div className="flex-1 flex flex-col bg-white">
              <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-b border-red-200">
                <div className="flex items-center gap-3">
                   <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Language</div>
                   <select
                     value={selectedLang.id}
                     onChange={(e) => setSelectedLang(LANGUAGES.find(l => l.id === e.target.value)!)}
                     className="bg-white text-red-600 font-bold text-xs px-3 py-1.5 rounded border border-red-200 outline-none focus:border-red-500 cursor-pointer"
                   >
                     {LANGUAGES.map(lang => (
                       <option key={lang.id} value={lang.id}>{lang.label}</option>
                     ))}
                   </select>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <Editor
                  height="100%"
                  language={selectedLang.monoLabel}
                  theme="light"
                  value={codeDrafts[draftKey(activeCodeQIndex, selectedLang.id)] || ""}
                  onChange={(val) => setCodeDrafts({ ...codeDrafts, [draftKey(activeCodeQIndex, selectedLang.id)]: val || "" })}
                  options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on" }}
                />
              </div>

              {selectedLang.id === "html" ? (
                <div className="h-64 bg-white border-t border-zinc-300 shrink-0 flex flex-col">
                  <div className="p-3 border-b bg-zinc-50 text-[10px] font-black uppercase text-zinc-500 flex justify-between items-center">
                    <span>Live Preview</span>
                    <button onClick={() => runCodeCompile(activeCodeQIndex)} disabled={compiling} className="bg-red-600 text-white text-[11px] font-extrabold py-1 px-3 rounded flex items-center gap-1 hover:bg-red-500">
                      {compiling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Run Tests
                    </button>
                  </div>
                  <iframe srcDoc={codeDrafts[draftKey(activeCodeQIndex, selectedLang.id)]} className="flex-1 w-full bg-white border-none" />
                </div>
              ) : (
                <div className="h-56 bg-white border-t border-red-200 flex flex-col">
                  <div className="p-3 border-b border-red-200 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-zinc-600 uppercase">Test Suite Output</span>
                    <button onClick={() => runCodeCompile(activeCodeQIndex)} disabled={compiling} className="bg-red-600 text-white text-[11px] font-extrabold py-1 px-3 rounded flex items-center gap-1 hover:bg-red-500">
                      {compiling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Run Tests
                    </button>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto text-zinc-800 font-mono text-[11px]">
                    {!compileResults[activeCodeQIndex] ? (
                      <div className="text-zinc-500 flex justify-center mt-4">Run tests to evaluate solution.</div>
                    ) : (
                      compileResults[activeCodeQIndex].map((res, i) => (
                        <div key={i} className="mb-4">
                          <div className="font-bold mb-1">Case {res.caseIndex}: <span className={res.status === "pass" ? "text-green-600" : "text-red-600"}>{res.status}</span></div>
                          {res.error ? <div className="text-red-600">{res.error}</div> : <><div>Expected: {res.expected}</div><div>Actual: {res.actual}</div></>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 p-8 overflow-y-auto bg-zinc-50">
            {/* Quiz UI omitted for brevity */}
            <h2 className="text-2xl font-black">Quiz Mode</h2>
            <button onClick={handleSubmit} className="mt-4 bg-emerald-600 text-white font-bold py-2 px-4 rounded">Submit Quiz</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SprintActivePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <SprintActiveContent />
    </Suspense>
  );
}
