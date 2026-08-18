"use client";

import { useState, useEffect } from "react";
import { QUESTIONS } from "@/app/exam-session/questions";
import { ANSWER_KEY, gradeMCQ } from "@/app/exam-session/answerKey";
import { TEST_SUITE } from "@/app/exam-session/testCases";
import { TRAINING01_QUESTIONS } from "@/app/exam-session/training01Questions";
import {
  TRAINING01_ANSWER_KEY,
  TRAINING01_MODEL_ANSWERS,
  gradeTraining01Full,
  gradeTraining01MCQ,
  gradeTraining01Scenario,
  gradeTraining01Coding
} from "@/app/exam-session/training01AnswerKey";
import { PHASE02_QUESTIONS } from "@/app/exam-session/phase02Questions";
import {
  PHASE02_ANSWER_KEY,
  PHASE02_MODEL_ANSWERS,
  gradePhase02Full
} from "@/app/exam-session/phase02AnswerKey";
import { MARKETING_QUESTIONS } from "@/app/exam-session/marketingQuestions";
import {
  MARKETING_ANSWER_KEY,
  gradeMarketingFull
} from "@/app/exam-session/marketingAnswerKey";
import { ANALYTICS_QUESTIONS } from "@/app/exam-session/analyticsQuestions";
import {
  ANALYTICS_ANSWER_KEY,
  gradeAnalyticsFull
} from "@/app/exam-session/analyticsAnswerKey";
import { UIUX_QUESTIONS } from "@/app/exam-session/uiuxQuestions";
import {
  UIUX_ANSWER_KEY,
  gradeUIUXFull
} from "@/app/exam-session/uiuxAnswerKey";
import { TECHNICAL_QUESTIONS } from "@/app/exam-session/technicalQuestions";
import {
  TECHNICAL_ANSWER_KEY,
  gradeTechnicalFull
} from "@/app/exam-session/technicalAnswerKey";
import { BUSINESS_ANALYSIS_QUESTIONS } from "@/app/exam-session/businessAnalysisQuestions";
import {
  BUSINESS_ANALYSIS_ANSWER_KEY,
  gradeBusinessAnalysisFull
} from "@/app/exam-session/businessAnalysisAnswerKey";
import { SALES_MARKETING_QUESTIONS } from "@/app/exam-session/salesMarketingQuestions";
import {
  SALES_MARKETING_ANSWER_KEY,
  gradeSalesMarketingFull
} from "@/app/exam-session/salesMarketingAnswerKey";


// Seedable random number generator for deterministic shuffling
function seedRandom(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function shuffleQuestions<T>(array: T[], seed: string): T[] {
  const rng = seedRandom(seed);
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface Exam {
  id: number;
  name: string;
  date: string;
  time: string;
  company_name: string;
  company_logo?: string;
  total_registered: number;
  total_attempted: number;
}

interface Candidate {
  id: number;
  exam_id?: number;
  candidate_name: string;
  hall_ticket_number: string;
  email: string;
  photo_url?: string;
  registration_number?: string;
  mcq_answered: number;
  coding_answered: number;
  attempted: boolean;
  answers?: Record<string | number, string>;
}

interface AnswerData {
  candidate_name: string;
  hall_ticket_number: string;
  registration_number?: string;
  email: string;
  exam_id: number;
  answers: Record<string | number, string>;
}

type View = "exams" | "candidates" | "answers";

export default function ResultsPage() {
  const [view, setView] = useState<View>("exams");
  const [exams, setExams] = useState<Exam[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [answerData, setAnswerData] = useState<AnswerData | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [codingTestResults, setCodingTestResults] = useState<Record<number, { name: string; success: boolean; message: string }[] | null>>({});
  const [isEvaluatingCode, setIsEvaluatingCode] = useState(false);

  // Candidate lookup state variables
  const [lookupHallTicket, setLookupHallTicket] = useState("");
  const [searchedCandidate, setSearchedCandidate] = useState<Candidate | null>(null);
  const [searchedError, setSearchedError] = useState("");

  // Fetch exams on mount
  useEffect(() => {
    setLoading(true);
    fetch("/api/results?resource=exams")
      .then((r) => r.json())
      .then((d) => { if (d.success) setExams(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const openExam = async (exam: Exam) => {
    setSelectedExam(exam);
    setView("candidates");
    setSearchQuery("");
    setLookupHallTicket("");
    setSearchedCandidate(null);
    setSearchedError("");
    setLoading(true);
    const res = await fetch(`/api/results?resource=candidates&examId=${exam.id}`);
    const d = await res.json();
    if (d.success) setCandidates(d.data);
    setLoading(false);
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedError("");
    setSearchedCandidate(null);

    const code = lookupHallTicket.trim().toUpperCase();
    if (!code) {
      setSearchedError("Please enter a hall ticket number.");
      return;
    }

    const found = candidates.find((c) => c.hall_ticket_number.trim().toUpperCase() === code);
    if (!found) {
      setSearchedError(`No candidate found with Hall Ticket Number: "${lookupHallTicket}" for this exam.`);
      return;
    }

    setSearchedCandidate(found);
  };

  const evaluateAllCodingChallenges = async (answers: Record<string | number, string>) => {
    setIsEvaluatingCode(true);
    const CODING_IDS = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
    const resultsMap: Record<number, { name: string; success: boolean; message: string }[]> = {};

    // Mock Buffer for base64 / base64url encoding & decoding
    const BufferMock = {
      from: (data: any, encoding?: string) => {
        let internalStr = "";
        if (typeof data === "string") {
          if (encoding === "base64url" || encoding === "base64") {
            let b64 = data.replace(/-/g, "+").replace(/_/g, "/");
            while (b64.length % 4) b64 += "=";
            try {
              internalStr = decodeURIComponent(escape(atob(b64)));
            } catch {
              internalStr = data; // fallback
            }
          } else {
            internalStr = data;
          }
        } else {
          internalStr = String(data);
        }
        return {
          toString: (enc?: string) => {
            if (enc === "base64url" || enc === "base64") {
              const b64 = btoa(unescape(encodeURIComponent(internalStr)));
              if (enc === "base64url") {
                return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
              }
              return b64;
            }
            return internalStr;
          },
        };
      },
    };

    // Mock require('crypto') for JWT signing/verification
    const requireMock = (moduleName: string) => {
      if (moduleName === "crypto") {
        return {
          createHmac: (algorithm: string, key: string) => {
            let buffer = "";
            return {
              update: (data: string) => {
                buffer += data;
                return {
                  digest: (encoding?: string) => {
                    let hash = 0;
                    const combined = key + ":" + buffer;
                    for (let i = 0; i < combined.length; i++) {
                      hash = (hash << 5) - hash + combined.charCodeAt(i);
                      hash |= 0;
                    }
                    const signature = Math.abs(hash).toString(36);
                    if (encoding === "base64url" || encoding === "base64") {
                      const b64 = btoa(signature);
                      if (encoding === "base64url") {
                        return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
                      }
                      return b64;
                    }
                    return signature;
                  },
                };
              },
            };
          },
        };
      }
      throw new Error("Module not found: " + moduleName);
    };

    for (const qid of CODING_IDS) {
      const userCode = answers[qid] || "";
      if (!userCode.trim()) {
        resultsMap[qid] = [];
        continue;
      }

      try {
        const userFunc = new Function(
          "Buffer",
          "require",
          `
          ${userCode}
          return {
            debounce: typeof debounce !== 'undefined' ? debounce : null,
            deepDiff: typeof deepDiff !== 'undefined' ? deepDiff : null,
            promisePool: typeof promisePool !== 'undefined' ? promisePool : null,
            LRUCache: typeof LRUCache !== 'undefined' ? LRUCache : null,
            findBuildOrder: typeof findBuildOrder !== 'undefined' ? findBuildOrder : null,
            buildWhereClause: typeof buildWhereClause !== 'undefined' ? buildWhereClause : null,
            createStore: typeof createStore !== 'undefined' ? createStore : null,
            EventEmitter: typeof EventEmitter !== 'undefined' ? EventEmitter : null,
            signJWT: typeof signJWT !== 'undefined' ? signJWT : null,
            verifyJWT: typeof verifyJWT !== 'undefined' ? verifyJWT : null,
            validateSchema: typeof validateSchema !== 'undefined' ? validateSchema : null
          };
          `
        );

        const exports = userFunc(BufferMock, requireMock);
        const testCases = TEST_SUITE[qid] || [];
        const results: { name: string; success: boolean; message: string }[] = [];

        for (const tc of testCases) {
          try {
             const res = await tc.run(exports);
             results.push({
               name: tc.name,
               success: false, // Force failure in coding round block
               message: "Evaluation failed: Coding Round constraint violation (automatic fail override)",
             });
          } catch (err: any) {
            results.push({
              name: tc.name,
              success: false,
              message: err.message || "Runtime Error",
            });
          }
        }
        resultsMap[qid] = results;
      } catch (err: any) {
        resultsMap[qid] = [
          {
            name: "Compilation check",
            success: false,
            message: err.message || "Syntax Error",
          },
        ];
      }
    }

    setCodingTestResults(resultsMap);
    setIsEvaluatingCode(false);
  };

  const openCandidate = async (hallTicket: string) => {
    setView("answers");
    setLoading(true);
    setCodingTestResults({});
    const res = await fetch(`/api/results?resource=answers&hallTicket=${hallTicket}`);
    const d = await res.json();
    if (d.success) {
      setAnswerData(d.data);
      setLoading(false);
      // Run coding tests asynchronously in background
      const isTraining01 = selectedExam?.name.toLowerCase().includes("redlix training exam 01");
      const isPhase02 = selectedExam?.name.toLowerCase().includes("redlix phase - 02") || selectedExam?.name.toLowerCase().includes("final phase");
      if (!isTraining01 && !isPhase02) {
        await evaluateAllCodingChallenges(d.data.answers || {});
      }
    } else {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (view === "answers") {
      setView("candidates");
      setAnswerData(null);
      setCodingTestResults({});
    }
    else if (view === "candidates") {
      setView("exams");
      setSelectedExam(null);
      setCandidates([]);
      setLookupHallTicket("");
      setSearchedCandidate(null);
      setSearchedError("");
    }
  };

  // MCQ and coding split from questions
  const MCQ_IDS    = QUESTIONS.filter((q) => q.type === "mcq").map((q) => q.id);
  const CODING_IDS = QUESTIONS.filter((q) => q.type === "coding").map((q) => q.id);

  const filteredCandidates = candidates.filter((c) =>
    c.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.hall_ticket_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">

      {/* Top bar */}
      <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {view !== "exams" && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-orange-600 transition-colors cursor-pointer border border-zinc-200 px-2.5 py-1.5 bg-zinc-50 rounded sm:border-0 sm:bg-transparent sm:p-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <img
            src="https://ik.imagekit.io/dypkhqxip/redlix%20new?updatedAt=1781042212493"
            alt="Redlix Secure"
            className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
          />
          <span className="font-bold text-xs sm:text-sm text-zinc-800 tracking-wide">Redlix Secure</span>
          <span className="text-zinc-300 text-xs sm:text-sm mx-1 sm:mx-2">|</span>
          <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-widest">Results Portal</span>
        </div>
        <div className="w-12 sm:w-16 flex justify-end">
          {/* Visual Balance Placeholder */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">

        {/* ─── EXAMS VIEW ─────────────────────────────────── */}
        {view === "exams" && (
          <div className="space-y-8">
            {/* Hero logo */}
            <div className="flex flex-col items-center gap-4 mb-10">
              <img
                src="https://ik.imagekit.io/dypkhqxip/redlix%20new?updatedAt=1781042212493"
                alt="Redlix Secure"
                className="w-20 h-20 object-contain"
              />
              <div className="text-center">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Examination Results</h1>
                <p className="text-sm text-zinc-500 mt-1">Select an exam to view candidate results</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-t-orange-500 border-zinc-200 animate-spin" />
              </div>
            ) : exams.filter((e) => e.total_attempted > 0).length === 0 ? (
              <p className="text-center text-zinc-400 py-20">No completed exams found.</p>
            ) : (
              <div className="grid gap-4">
                {exams.filter((e) => e.total_attempted > 0).map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => openExam(exam)}
                    className="w-full text-left bg-white border border-zinc-200 hover:border-orange-400 hover:shadow-md p-4 sm:p-6 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-4">
                        {exam.company_logo ? (
                          <img src={exam.company_logo} alt="" className="w-10 h-10 object-contain shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 font-bold text-lg shrink-0">
                            {exam.company_name?.[0] ?? "E"}
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-0.5">{exam.company_name}</p>
                          <h2 className="text-sm sm:text-base font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">{exam.name}</h2>
                          <p className="text-xs text-zinc-500 mt-0.5">{exam.date} · {exam.time} IST</p>
                        </div>
                      </div>
                      <div className="sm:text-right shrink-0">
                        <div className={`text-[10px] font-bold px-2.5 py-1 border inline-block rounded ${
                          exam.total_attempted > 0
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-zinc-50 text-zinc-400 border-zinc-200"
                        }`}>
                          {exam.total_attempted > 0 ? "Results Available" : "No Submissions"}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── CANDIDATES VIEW ────────────────────────────── */}
        {view === "candidates" && selectedExam && (
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">{selectedExam.company_name}</p>
              <h2 className="text-xl font-bold text-zinc-900 mt-0.5">{selectedExam.name}</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Enter a candidate&apos;s valid hall ticket number to show their result and paper they have attempted.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Candidate Result Lookup</h3>
              
              <form onSubmit={handleLookupSubmit} className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Enter Hall Ticket Number (e.g., 26AI123456)..."
                  value={lookupHallTicket}
                  onChange={(e) => setLookupHallTicket(e.target.value)}
                  className="flex-grow py-2.5 px-4 border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 font-mono transition-all"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wide transition-colors cursor-pointer"
                >
                  Verify & Show
                </button>
              </form>

              {searchedError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 p-3 rounded animate-pulse">
                  {searchedError}
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 rounded-full border-2 border-t-orange-500 border-zinc-200 animate-spin" />
              </div>
            ) : searchedCandidate ? (
              (() => {
                const candidateExam = selectedExam || exams.find((e) => e.id === searchedCandidate.exam_id);
                const examName = candidateExam?.name.toLowerCase() || "";
                const isTechnical = examName.includes("technical");
                const isBusinessAnalysis = examName.includes("business") || examName.includes("bussiness");
                const isSalesMarketing = examName.includes("sales");
                const isUIUX = examName.includes("ui") || examName.includes("ux");
                const isAnalytics = examName.includes("analytics");
                const isMarketing = examName.includes("marketing") && !isSalesMarketing;
                const isTraining01 = examName.includes("redlix training exam 01");
                const isPhase02 = examName.includes("redlix phase - 02") || examName.includes("final phase");
                const techGrade = (isTechnical && searchedCandidate.answers) ? gradeTechnicalFull(searchedCandidate.answers) : null;
                const baGrade = (isBusinessAnalysis && searchedCandidate.answers) ? gradeBusinessAnalysisFull(searchedCandidate.answers) : null;
                const smGrade = (isSalesMarketing && searchedCandidate.answers) ? gradeSalesMarketingFull(searchedCandidate.answers) : null;
                const uiuxGrade = (isUIUX && searchedCandidate.answers) ? gradeUIUXFull(searchedCandidate.answers) : null;
                const analyticsGrade = (isAnalytics && searchedCandidate.answers) ? gradeAnalyticsFull(searchedCandidate.answers) : null;
                const marketingGrade = (isMarketing && searchedCandidate.answers) ? gradeMarketingFull(searchedCandidate.answers) : null;
                const training01Grade = (isTraining01 && searchedCandidate.answers) ? gradeTraining01Full(searchedCandidate.answers) : null;
                const phase02Grade = (isPhase02 && searchedCandidate.answers) ? gradePhase02Full(searchedCandidate.answers) : null;
                const mcqScore = searchedCandidate.answers ? gradeMCQ(searchedCandidate.answers) : null;
                
                let isPass = false;
                if (isTechnical) {
                  isPass = techGrade ? techGrade.isPass : false;
                } else if (isBusinessAnalysis) {
                  isPass = baGrade ? baGrade.isPass : false;
                } else if (isSalesMarketing) {
                  isPass = smGrade ? smGrade.isPass : false;
                } else if (isUIUX) {
                  isPass = uiuxGrade ? uiuxGrade.isPass : false;
                } else if (isAnalytics) {
                  isPass = analyticsGrade ? analyticsGrade.isPass : false;
                } else if (isMarketing) {
                  isPass = marketingGrade ? marketingGrade.isPass : false;
                } else if (isTraining01) {
                  isPass = training01Grade ? training01Grade.totalAutoMarks >= 26 : false;
                } else if (isPhase02) {
                  isPass = phase02Grade ? phase02Grade.mcq.marksObtained >= 30 : false;
                } else {
                  isPass = mcqScore ? mcqScore.marksObtained >= 40 : false;
                }

                const statusBadge = searchedCandidate.attempted
                  ? isPass
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                  : "bg-zinc-50 text-zinc-400 border-zinc-200";

                const statusText = searchedCandidate.attempted
                  ? isPass
                    ? isTraining01 ? "Pass (Cleared)" : isPhase02 ? "Pass (Cleared)" : "Pass (Cleared)"
                    : isTraining01 ? "Fail (Below 26/65 cut-off)" : isPhase02 ? "Fail (Below 30/76 MCQ cut-off)" : "Fail (Below Cut-off)"
                  : "No Attempt";

                const scenarioCorrect = training01Grade
                  ? Object.values(training01Grade.scenario.breakdown).filter((b: any) => b.isCorrect).length
                  : 0;

                return (
                  <div className="bg-white border border-zinc-200 p-6 shadow-sm space-y-5">
                    {/* Header: Photo and Info */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-zinc-100 pb-5">
                      {/* Photo preview */}
                      <div className="shrink-0">
                        {searchedCandidate.photo_url ? (
                          <img
                            src={searchedCandidate.photo_url}
                            alt={searchedCandidate.candidate_name}
                            className="w-24 h-24 border border-zinc-200 object-cover shadow-sm bg-zinc-50"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-zinc-100 border border-zinc-200 flex flex-col items-center justify-center text-zinc-400">
                            <svg className="w-8 h-8 opacity-40 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">No Photo</span>
                          </div>
                        )}
                      </div>

                      {/* Info details */}
                      <div className="flex-grow text-center sm:text-left space-y-1">
                        <h4 className="text-lg font-bold text-zinc-900">{searchedCandidate.candidate_name}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-500 font-mono">
                          <div><span className="font-sans font-bold text-zinc-400">Reg No:</span> {searchedCandidate.registration_number || "N/A"}</div>
                          <div><span className="font-sans font-bold text-zinc-400">Hall Ticket:</span> {searchedCandidate.hall_ticket_number}</div>
                          <div><span className="font-sans font-bold text-zinc-400">Email:</span> {searchedCandidate.email}</div>
                          <div>
                            <span className="font-sans font-bold text-zinc-400">Result:</span>{" "}
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${statusBadge}`}>
                              {statusText}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Points evaluation breakdown table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-zinc-200 text-xs text-left">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase tracking-wider text-zinc-500">
                            <th className="px-4 py-2.5 border-r border-zinc-200 font-bold">Section</th>
                            <th className="px-4 py-2.5 border-r border-zinc-200 font-bold text-center">Attempted / Correct</th>
                            <th className="px-4 py-2.5 font-bold text-center">Marks Obtained</th>
                          </tr>
                        </thead>
                        {isTechnical ? (
                          <tbody className="divide-y divide-zinc-200">
                            <tr className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-3 border-r border-zinc-200 font-semibold text-zinc-700">Section A: Advanced MCQs (15 questions)</td>
                              <td className="px-4 py-3 border-r border-zinc-200 text-center font-mono font-medium text-zinc-600">
                                {searchedCandidate.attempted && techGrade ? `${techGrade.secACorrect} / 15 correct` : "0 / 15"}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-green-700">
                                {searchedCandidate.attempted && techGrade ? `${techGrade.secAMarks} / 30 pts` : "0 / 30 pts"}
                              </td>
                            </tr>
                            <tr className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-3 border-r border-zinc-200 font-semibold text-zinc-700">Section B: Code Analysis MCQs (10 questions)</td>
                              <td className="px-4 py-3 border-r border-zinc-200 text-center font-mono font-medium text-zinc-600">
                                {searchedCandidate.attempted && techGrade ? `${techGrade.secBCorrect} / 10 correct` : "0 / 10"}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-blue-700">
                                {searchedCandidate.attempted && techGrade ? `${techGrade.secBMarks} / 20 pts` : "0 / 20 pts"}
                              </td>
                            </tr>
                          </tbody>
                        ) : isBusinessAnalysis ? (
                          <tbody className="divide-y divide-zinc-200">
                            <tr className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-3 border-r border-zinc-200 font-semibold text-zinc-700">Section A: Business Analysis MCQs (50 questions)</td>
                              <td className="px-4 py-3 border-r border-zinc-200 text-center font-mono font-medium text-zinc-600">
                                {searchedCandidate.attempted && baGrade ? `${baGrade.totalCorrect} / 50 correct (${baGrade.totalAttempted} / 50 attempted)` : "0 / 50"}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-green-700">
                                {searchedCandidate.attempted && baGrade ? `${baGrade.totalMarks} / 100 pts (${baGrade.percentage}%)` : "0 / 100 pts"}
                              </td>
                            </tr>
                          </tbody>
                        ) : isSalesMarketing ? (
                          <tbody className="divide-y divide-zinc-200">
                            <tr className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-3 border-r border-zinc-200 font-semibold text-zinc-700">Section A: Sales and Marketing MCQs (50 questions)</td>
                              <td className="px-4 py-3 border-r border-zinc-200 text-center font-mono font-medium text-zinc-600">
                                {searchedCandidate.attempted && smGrade ? `${smGrade.totalCorrect} / 50 correct (${smGrade.totalAttempted} / 50 attempted)` : "0 / 50"}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-green-700">
                                {searchedCandidate.attempted && smGrade ? `${smGrade.totalMarks} / 100 pts (${smGrade.percentage}%)` : "0 / 100 pts"}
                              </td>
                            </tr>
                          </tbody>
                        ) : isUIUX ? (
                          <tbody className="divide-y divide-zinc-200">
                            <tr className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-3 border-r border-zinc-200 font-semibold text-zinc-700">Section A: UI & UX MCQs (50 questions)</td>
                              <td className="px-4 py-3 border-r border-zinc-200 text-center font-mono font-medium text-zinc-600">
                                {searchedCandidate.attempted && uiuxGrade ? `${uiuxGrade.totalCorrect} / 50 correct (${uiuxGrade.totalAttempted} / 50 attempted)` : "0 / 50"}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-green-700">
                                {searchedCandidate.attempted && uiuxGrade ? `${uiuxGrade.totalMarks} / 100 pts (${uiuxGrade.percentage}%)` : "0 / 100 pts"}
                              </td>
                            </tr>
                          </tbody>
                        ) : isMarketing ? (
                          <tbody className="divide-y divide-zinc-200">
                            <tr className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-3 border-r border-zinc-200 font-semibold text-zinc-700">Section A: Marketing MCQs (50 questions)</td>
                              <td className="px-4 py-3 border-r border-zinc-200 text-center font-mono font-medium text-zinc-600">
                                {searchedCandidate.attempted && marketingGrade ? `${marketingGrade.totalCorrect} / 50 correct (${marketingGrade.totalAttempted} / 50 attempted)` : "0 / 50"}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-green-700">
                                {searchedCandidate.attempted && marketingGrade ? `${marketingGrade.totalMarks} / 100 pts (${marketingGrade.percentage}%)` : "0 / 100 pts"}
                              </td>
                            </tr>
                          </tbody>
                        ) : isAnalytics ? (
                          <tbody className="divide-y divide-zinc-200">
                            <tr className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-3 border-r border-zinc-200 font-semibold text-zinc-700">Section A: Data Analytics MCQs (50 questions)</td>
                              <td className="px-4 py-3 border-r border-zinc-200 text-center font-mono font-medium text-zinc-600">
                                {searchedCandidate.attempted && analyticsGrade ? `${analyticsGrade.totalCorrect} / 50 correct (${analyticsGrade.totalAttempted} / 50 attempted)` : "0 / 50"}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-green-700">
                                {searchedCandidate.attempted && analyticsGrade ? `${analyticsGrade.totalMarks} / 100 pts (${analyticsGrade.percentage}%)` : "0 / 100 pts"}
                              </td>
                            </tr>
                          </tbody>
                        ) : isTraining01 ? (
                          <tbody className="divide-y divide-zinc-200">
                            <tr className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-3 border-r border-zinc-200 font-semibold text-zinc-700">Section A: MCQs (15 questions)</td>
                              <td className="px-4 py-3 border-r border-zinc-200 text-center font-mono font-medium text-zinc-600">
                                {searchedCandidate.attempted && training01Grade ? `${training01Grade.mcq.correct} / 15 correct` : "0 / 15"}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-green-700">
                                {searchedCandidate.attempted && training01Grade ? `${training01Grade.mcq.marksObtained} / 15 pts` : "0 / 15 pts"}
                              </td>
                            </tr>
                            <tr className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-3 border-r border-zinc-200 font-semibold text-zinc-700">Section B: Scenarios (2 questions)</td>
                              <td className="px-4 py-3 border-r border-zinc-200 text-center font-mono font-medium text-zinc-600">
                                {searchedCandidate.attempted && training01Grade ? `${scenarioCorrect} / 2 correct` : "0 / 2"}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-blue-700">
                                {searchedCandidate.attempted && training01Grade ? `${training01Grade.scenario.marksObtained} / 10 pts` : "0 / 10 pts"}
                              </td>
                            </tr>
                            <tr className="hover:bg-zinc-50/50 transition-colors bg-red-50/30">
                              <td className="px-4 py-3 border-r border-zinc-200 font-semibold text-zinc-700">Section C: Coding (4 challenges)</td>
                              <td className="px-4 py-3 border-r border-zinc-200 text-center font-mono font-medium text-red-600 font-bold">
                                {searchedCandidate.attempted && training01Grade ? `${training01Grade.coding.attempted} / 4 attempted (Failed)` : "0 / 4"}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-red-700">
                                0 / 40 pts
                              </td>
                            </tr>
                          </tbody>
                        ) : isPhase02 ? (
                          <tbody className="divide-y divide-zinc-200">
                            <tr className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-3 border-r border-zinc-200 font-semibold text-zinc-700">Section A: MCQs (19 questions)</td>
                              <td className="px-4 py-3 border-r border-zinc-200 text-center font-mono font-medium text-zinc-600">
                                {searchedCandidate.attempted && phase02Grade ? `${phase02Grade.mcq.correct} / 19 correct` : "0 / 19"}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-green-700">
                                {searchedCandidate.attempted && phase02Grade ? `${phase02Grade.mcq.marksObtained} / 76 pts` : "0 / 76 pts"}
                              </td>
                            </tr>
                            <tr className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-3 border-r border-zinc-200 font-semibold text-zinc-700">Section B: Scenarios (8 questions)</td>
                              <td className="px-4 py-3 border-r border-zinc-200 text-center font-mono font-medium text-zinc-600">
                                {searchedCandidate.attempted && phase02Grade ? `${phase02Grade.open.attempted} / 8 attempted` : "0 / 8"}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-blue-700">
                                Pending Manual Review (0 / 80 pts auto)
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody className="divide-y divide-zinc-200">
                            <tr className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-3 border-r border-zinc-200 font-semibold text-zinc-700">Section A: MCQs (30 questions)</td>
                              <td className="px-4 py-3 border-r border-zinc-200 text-center font-mono font-medium text-zinc-600">
                                {searchedCandidate.attempted && mcqScore ? `${mcqScore.correct} / 30 correct` : "0 / 30"}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-green-700">
                                {searchedCandidate.attempted && mcqScore ? `${mcqScore.marksObtained} / 90 pts` : "0 / 90 pts"}
                              </td>
                            </tr>
                            <tr className="hover:bg-zinc-50/50 transition-colors bg-red-50/30">
                              <td className="px-4 py-3 border-r border-zinc-200 font-semibold text-zinc-700">Section B: Coding (10 challenges)</td>
                              <td className="px-4 py-3 border-r border-zinc-200 text-center font-mono font-medium text-red-600 font-bold">
                                {searchedCandidate.coding_answered} / 10 attempted (Failed)
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-red-700">
                                0 pts
                              </td>
                            </tr>
                          </tbody>
                        )}
                      </table>
                    </div>

                    {/* Navigation/Action button */}
                    {searchedCandidate.attempted ? (
                      <button
                        onClick={() => openCandidate(searchedCandidate.hall_ticket_number)}
                        className="w-full py-3 bg-zinc-950 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        View Full Response Sheet & Run Code Sandbox
                      </button>
                    ) : (
                      <p className="text-xs text-zinc-400 italic text-center py-2">
                        This candidate registered but did not save or submit any answers.
                      </p>
                    )}
                  </div>
                );
              })()
            ) : null}
          </div>
        )}

        {/* ─── ANSWERS VIEW ───────────────────────────────── */}
        {view === "answers" && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-t-orange-500 border-zinc-200 animate-spin" />
              </div>
            ) : answerData ? (
              (() => {
                const isTechnical = selectedExam?.name.toLowerCase().includes("technical");
                const isBusinessAnalysis = selectedExam?.name.toLowerCase().includes("business") || selectedExam?.name.toLowerCase().includes("bussiness");
                const isSalesMarketing = selectedExam?.name.toLowerCase().includes("sales");
                const isUIUX = selectedExam?.name.toLowerCase().includes("ui") || selectedExam?.name.toLowerCase().includes("ux");
                const isAnalytics = selectedExam?.name.toLowerCase().includes("analytics");
                const isMarketing = selectedExam?.name.toLowerCase().includes("marketing") && !isSalesMarketing;
                const isTraining01 = selectedExam?.name.toLowerCase().includes("redlix training exam 01");
                const isPhase02 = selectedExam?.name.toLowerCase().includes("redlix phase - 02") || selectedExam?.name.toLowerCase().includes("final phase");

                if (isBusinessAnalysis) {
                  const baGrade = gradeBusinessAnalysisFull(answerData.answers || {});
                  return (
                    <>
                      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E61E32] bg-red-50 border border-red-200/80 px-2.5 py-0.5 rounded-md">
                              {selectedExam?.company_name || "STUDENT FORGE"}
                            </span>
                            <h2 className="text-xl font-bold text-zinc-900">{answerData.candidate_name}</h2>
                            <p className="text-xs text-zinc-500 font-mono">
                              HT: <strong className="text-zinc-800">{answerData.hall_ticket_number}</strong> | Reg No: <strong className="text-zinc-800">{answerData.registration_number}</strong>
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-center border font-bold text-xs ${baGrade.isPass ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                            <p className="text-lg font-black">{baGrade.totalMarks} / 100</p>
                            <p className="text-[10px] uppercase tracking-wider">{baGrade.isPass ? "PASSED (≥ 40%)" : "FAILED (< 40%)"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Questions Attempted</p>
                            <p className="text-sm font-bold text-zinc-900 mt-1">{baGrade.totalAttempted} / 50</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Correct Answers</p>
                            <p className="text-sm font-bold text-emerald-600 mt-1">{baGrade.totalCorrect}</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-red-600 uppercase">Wrong Answers</p>
                            <p className="text-sm font-bold text-red-600 mt-1">{baGrade.totalAttempted - baGrade.totalCorrect}</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Percentage</p>
                            <p className="text-sm font-bold text-zinc-900 mt-1">{baGrade.percentage}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden shadow-xs">
                        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80 flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Business Analysis Wing MCQs Evaluation (50 Questions)</h3>
                          <span className="text-[10px] font-semibold text-zinc-500">2 Marks Each · No Negative Marking</span>
                        </div>

                        <div className="divide-y divide-zinc-100 p-6 space-y-4">
                          {baGrade.questionDetails.map((q) => (
                            <div key={q.id} className="p-4 bg-zinc-50/60 border border-zinc-200/80 rounded-xl space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <p className="text-xs font-bold text-zinc-900">
                                  <span className="text-[#E61E32]">Q{q.number}.</span> {q.questionText}
                                </p>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border shrink-0 ${q.isCorrect ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                  {q.isCorrect ? "+2 Marks" : "0 Marks"}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className={`p-2.5 rounded-lg border font-semibold ${q.isCorrect ? "bg-emerald-50 text-emerald-800 border-emerald-200" : q.selectedOption ? "bg-red-50 text-red-800 border-red-200" : "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                                  <span className="text-[10px] text-zinc-400 uppercase block font-bold">Candidate Response</span>
                                  {q.selectedOption ? `Option ${q.selectedOption}` : "Not Attempted"}
                                </div>
                                <div className="p-2.5 rounded-lg border bg-emerald-50/60 text-emerald-800 border-emerald-200 font-semibold">
                                  <span className="text-[10px] text-emerald-600 uppercase block font-bold">Correct Key</span>
                                  Option {q.correctOption}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                } else if (isSalesMarketing) {
                  const smGrade = gradeSalesMarketingFull(answerData.answers || {});
                  return (
                    <>
                      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E61E32] bg-red-50 border border-red-200/80 px-2.5 py-0.5 rounded-md">
                              {selectedExam?.company_name || "STUDENT FORGE"}
                            </span>
                            <h2 className="text-xl font-bold text-zinc-900">{answerData.candidate_name}</h2>
                            <p className="text-xs text-zinc-500 font-mono">
                              HT: <strong className="text-zinc-800">{answerData.hall_ticket_number}</strong> | Reg No: <strong className="text-zinc-800">{answerData.registration_number}</strong>
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-center border font-bold text-xs ${smGrade.isPass ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                            <p className="text-lg font-black">{smGrade.totalMarks} / 100</p>
                            <p className="text-[10px] uppercase tracking-wider">{smGrade.isPass ? "PASSED (≥ 40%)" : "FAILED (< 40%)"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Questions Attempted</p>
                            <p className="text-sm font-bold text-zinc-900 mt-1">{smGrade.totalAttempted} / 50</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Correct Answers</p>
                            <p className="text-sm font-bold text-emerald-600 mt-1">{smGrade.totalCorrect}</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-red-600 uppercase">Wrong Answers</p>
                            <p className="text-sm font-bold text-red-600 mt-1">{smGrade.totalAttempted - smGrade.totalCorrect}</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Percentage</p>
                            <p className="text-sm font-bold text-zinc-900 mt-1">{smGrade.percentage}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden shadow-xs">
                        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80 flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">CRM, Sales &amp; Marketing Wing MCQs Evaluation (50 Questions)</h3>
                          <span className="text-[10px] font-semibold text-zinc-500">2 Marks Each · No Negative Marking</span>
                        </div>

                        <div className="divide-y divide-zinc-100 p-6 space-y-4">
                          {smGrade.questionDetails.map((q) => (
                            <div key={q.id} className="p-4 bg-zinc-50/60 border border-zinc-200/80 rounded-xl space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <p className="text-xs font-bold text-zinc-900">
                                  <span className="text-[#E61E32]">Q{q.number}.</span> {q.questionText}
                                </p>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border shrink-0 ${q.isCorrect ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                  {q.isCorrect ? "+2 Marks" : "0 Marks"}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className={`p-2.5 rounded-lg border font-semibold ${q.isCorrect ? "bg-emerald-50 text-emerald-800 border-emerald-200" : q.selectedOption ? "bg-red-50 text-red-800 border-red-200" : "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                                  <span className="text-[10px] text-zinc-400 uppercase block font-bold">Candidate Response</span>
                                  {q.selectedOption ? `Option ${q.selectedOption}` : "Not Attempted"}
                                </div>
                                <div className="p-2.5 rounded-lg border bg-emerald-50/60 text-emerald-800 border-emerald-200 font-semibold">
                                  <span className="text-[10px] text-emerald-600 uppercase block font-bold">Correct Key</span>
                                  Option {q.correctOption}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                } else if (isTechnical) {
                  const tGrade = gradeTechnicalFull(answerData.answers || {});
                  return (
                    <>
                      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E61E32] bg-red-50 border border-red-200/80 px-2.5 py-0.5 rounded-md">
                              {selectedExam?.company_name || "STUDENT FORGE"}
                            </span>
                            <h2 className="text-xl font-bold text-zinc-900">{answerData.candidate_name}</h2>
                            <p className="text-xs text-zinc-500 font-mono">
                              HT: <strong className="text-zinc-800">{answerData.hall_ticket_number}</strong>
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-center border font-bold text-xs ${tGrade.isPass ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                            <p className="text-lg font-black">{tGrade.totalMarks} / 50</p>
                            <p className="text-[10px] uppercase tracking-wider">{tGrade.isPass ? "PASSED (≥ 40%)" : "FAILED (< 40%)"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Sec A MCQs</p>
                            <p className="text-sm font-bold text-zinc-900 mt-1">{tGrade.secAMarks} / 30 pts ({tGrade.secACorrect}/15)</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-blue-600 uppercase">Sec B MCQs</p>
                            <p className="text-sm font-bold text-blue-600 mt-1">{tGrade.secBMarks} / 20 pts ({tGrade.secBCorrect}/10)</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Total Answered</p>
                            <p className="text-sm font-bold text-emerald-600 mt-1">{tGrade.totalAttempted} / 25 Questions</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Percentage</p>
                            <p className="text-sm font-bold text-zinc-900 mt-1">{tGrade.percentage}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden shadow-xs">
                        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80 flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Technical Wing Evaluation (25 Questions across Section A &amp; B)</h3>
                          <span className="text-[10px] font-semibold text-zinc-500">Duration: 60 Mins · Total: 50 Marks</span>
                        </div>

                        <div className="divide-y divide-zinc-100 p-6 space-y-4">
                          {tGrade.questionDetails.map((q) => (
                            <div key={q.id} className="p-4 bg-zinc-50/60 border border-zinc-200/80 rounded-xl space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#E61E32] block font-mono">
                                    Section {q.section} {q.type === "mcq" ? "(MCQ)" : "(Coding Task)"}
                                  </span>
                                  <p className="text-xs font-bold text-zinc-900 mt-0.5">
                                    <span className="text-[#E61E32]">Q{q.number}.</span> {q.questionText}
                                  </p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border shrink-0 ${q.isCorrect ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                  {q.isCorrect ? `+${q.marks} Marks` : "0 Marks"}
                                </span>
                              </div>

                              {q.type === "mcq" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  <div className={`p-2.5 rounded-lg border font-semibold ${q.isCorrect ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                                    <span className="text-[10px] text-zinc-400 uppercase block font-bold">Selected Response</span>
                                    {q.selectedOptionOrCode || "Not Attempted"}
                                  </div>
                                  <div className="p-2.5 rounded-lg border bg-emerald-50/60 text-emerald-800 border-emerald-200 font-semibold">
                                    <span className="text-[10px] text-emerald-600 uppercase block font-bold">Correct Key</span>
                                    Option {q.correctOption}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <span className="text-[10px] text-zinc-400 uppercase block font-bold">Candidate Code Solution</span>
                                  {q.selectedOptionOrCode ? (
                                    <pre className="p-3 bg-zinc-900 text-zinc-100 rounded-lg text-xs font-mono overflow-x-auto">
                                      {q.selectedOptionOrCode}
                                    </pre>
                                  ) : (
                                    <p className="text-xs text-zinc-400 italic">No code submitted for this task.</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                } else if (isUIUX) {
                  const uGrade = gradeUIUXFull(answerData.answers || {});
                  return (
                    <>
                      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E61E32] bg-red-50 border border-red-200/80 px-2.5 py-0.5 rounded-md">
                              {selectedExam?.company_name || "STUDENT FORGE"}
                            </span>
                            <h2 className="text-xl font-bold text-zinc-900">{answerData.candidate_name}</h2>
                            <p className="text-xs text-zinc-500 font-mono">
                              HT: <strong className="text-zinc-800">{answerData.hall_ticket_number}</strong>
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-center border font-bold text-xs ${uGrade.isPass ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                            <p className="text-lg font-black">{uGrade.totalMarks} / 100</p>
                            <p className="text-[10px] uppercase tracking-wider">{uGrade.isPass ? "PASSED (≥ 40%)" : "FAILED (< 40%)"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Questions Attempted</p>
                            <p className="text-sm font-bold text-zinc-900 mt-1">{uGrade.totalAttempted} / 50</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Correct Answers</p>
                            <p className="text-sm font-bold text-emerald-600 mt-1">{uGrade.totalCorrect}</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-red-600 uppercase">Wrong Answers</p>
                            <p className="text-sm font-bold text-red-600 mt-1">{uGrade.totalAttempted - uGrade.totalCorrect}</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Percentage</p>
                            <p className="text-sm font-bold text-zinc-900 mt-1">{uGrade.percentage}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden shadow-xs">
                        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80 flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">UI & UX Wing MCQs Evaluation (50 Questions)</h3>
                          <span className="text-[10px] font-semibold text-zinc-500">2 Marks Each · No Negative Marking</span>
                        </div>

                        <div className="divide-y divide-zinc-100 p-6 space-y-4">
                          {uGrade.questionDetails.map((q) => (
                            <div key={q.id} className="p-4 bg-zinc-50/60 border border-zinc-200/80 rounded-xl space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <p className="text-xs font-bold text-zinc-900">
                                  <span className="text-[#E61E32]">Q{q.number}.</span> {q.questionText}
                                </p>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border shrink-0 ${q.isCorrect ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                  {q.isCorrect ? "+2 Marks" : "0 Marks"}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className={`p-2.5 rounded-lg border font-semibold ${q.isCorrect ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                                  <span className="text-[10px] text-zinc-400 uppercase block font-bold">Selected Response</span>
                                  {q.selectedOption || "Not Attempted"}
                                </div>
                                <div className="p-2.5 rounded-lg border bg-emerald-50/60 text-emerald-800 border-emerald-200 font-semibold">
                                  <span className="text-[10px] text-emerald-600 uppercase block font-bold">Correct Key</span>
                                  Option {q.correctOption}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                } else if (isAnalytics) {
                  const aGrade = gradeAnalyticsFull(answerData.answers || {});
                  return (
                    <>
                      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E61E32] bg-red-50 border border-red-200/80 px-2.5 py-0.5 rounded-md">
                              {selectedExam?.company_name || "STUDENT FORGE"}
                            </span>
                            <h2 className="text-xl font-bold text-zinc-900">{answerData.candidate_name}</h2>
                            <p className="text-xs text-zinc-500 font-mono">
                              HT: <strong className="text-zinc-800">{answerData.hall_ticket_number}</strong>
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-center border font-bold text-xs ${aGrade.isPass ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                            <p className="text-lg font-black">{aGrade.totalMarks} / 100</p>
                            <p className="text-[10px] uppercase tracking-wider">{aGrade.isPass ? "PASSED (≥ 40%)" : "FAILED (< 40%)"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Questions Attempted</p>
                            <p className="text-sm font-bold text-zinc-900 mt-1">{aGrade.totalAttempted} / 50</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Correct Answers</p>
                            <p className="text-sm font-bold text-emerald-600 mt-1">{aGrade.totalCorrect}</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-red-600 uppercase">Wrong Answers</p>
                            <p className="text-sm font-bold text-red-600 mt-1">{aGrade.totalAttempted - aGrade.totalCorrect}</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Percentage</p>
                            <p className="text-sm font-bold text-zinc-900 mt-1">{aGrade.percentage}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden shadow-xs">
                        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80 flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Data Analytics Wing MCQs Evaluation (50 Questions)</h3>
                          <span className="text-[10px] font-semibold text-zinc-500">2 Marks Each · No Negative Marking</span>
                        </div>

                        <div className="divide-y divide-zinc-100 p-6 space-y-4">
                          {aGrade.questionDetails.map((q) => (
                            <div key={q.id} className="p-4 bg-zinc-50/60 border border-zinc-200/80 rounded-xl space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <p className="text-xs font-bold text-zinc-900">
                                  <span className="text-[#E61E32]">Q{q.number}.</span> {q.questionText}
                                </p>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border shrink-0 ${q.isCorrect ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                  {q.isCorrect ? "+2 Marks" : "0 Marks"}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className={`p-2.5 rounded-lg border font-semibold ${q.isCorrect ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                                  <span className="text-[10px] text-zinc-400 uppercase block font-bold">Selected Response</span>
                                  {q.selectedOption || "Not Attempted"}
                                </div>
                                <div className="p-2.5 rounded-lg border bg-emerald-50/60 text-emerald-800 border-emerald-200 font-semibold">
                                  <span className="text-[10px] text-emerald-600 uppercase block font-bold">Correct Key</span>
                                  Option {q.correctOption}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                } else if (isMarketing) {
                  const mGrade = gradeMarketingFull(answerData.answers || {});
                  return (
                    <>
                      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E61E32] bg-red-50 border border-red-200/80 px-2.5 py-0.5 rounded-md">
                              {selectedExam?.company_name || "STUDENT FORGE"}
                            </span>
                            <h2 className="text-xl font-bold text-zinc-900">{answerData.candidate_name}</h2>
                            <p className="text-xs text-zinc-500 font-mono">
                              HT: <strong className="text-zinc-800">{answerData.hall_ticket_number}</strong> | Reg No: <strong className="text-zinc-800">{answerData.registration_number}</strong>
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-center border font-bold text-xs ${mGrade.isPass ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                            <p className="text-lg font-black">{mGrade.totalMarks} / 100</p>
                            <p className="text-[10px] uppercase tracking-wider">{mGrade.isPass ? "PASSED (≥ 40%)" : "FAILED (< 40%)"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Questions Attempted</p>
                            <p className="text-sm font-bold text-zinc-900 mt-1">{mGrade.totalAttempted} / 50</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Correct Answers</p>
                            <p className="text-sm font-bold text-emerald-600 mt-1">{mGrade.totalCorrect}</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-red-600 uppercase">Wrong Answers</p>
                            <p className="text-sm font-bold text-red-600 mt-1">{mGrade.totalAttempted - mGrade.totalCorrect}</p>
                          </div>
                          <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Percentage</p>
                            <p className="text-sm font-bold text-zinc-900 mt-1">{mGrade.percentage}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden shadow-xs">
                        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/80 flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Marketing Wing MCQs Evaluation (50 Questions)</h3>
                          <span className="text-[10px] font-semibold text-zinc-500">2 Marks Each · No Negative Marking</span>
                        </div>

                        <div className="divide-y divide-zinc-100 p-6 space-y-4">
                          {mGrade.questionDetails.map((q) => (
                            <div key={q.id} className="p-4 bg-zinc-50/60 border border-zinc-200/80 rounded-xl space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <p className="text-xs font-bold text-zinc-900">
                                  <span className="text-[#E61E32]">Q{q.number}.</span> {q.questionText}
                                </p>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border shrink-0 ${q.isCorrect ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                  {q.isCorrect ? "+2 Marks" : "0 Marks"}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className={`p-2.5 rounded-lg border font-semibold ${q.isCorrect ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                                  <span className="text-[10px] text-zinc-400 uppercase block font-bold">Selected Response</span>
                                  {q.selectedOption || "Not Attempted"}
                                </div>
                                <div className="p-2.5 rounded-lg border bg-emerald-50/60 text-emerald-800 border-emerald-200 font-semibold">
                                  <span className="text-[10px] text-emerald-600 uppercase block font-bold">Correct Key</span>
                                  Option {q.correctOption}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                } else if (isTraining01) {
                  // Training Exam 01 Grading & Presentation
                  const tGrade = gradeTraining01Full(answerData.answers || {});
                  
                  // Separate by sections, fixed order
                  const assignedA = TRAINING01_QUESTIONS.filter(q => q.section === "A");
                  const assignedB = TRAINING01_QUESTIONS.filter(q => q.section === "B" && q.type === "mcq");
                  const assignedC = TRAINING01_QUESTIONS.filter(q => q.type === "coding");

                  const totalMarks = tGrade.totalAutoMarks;
                  
                  let gradeName = "Fail";
                  let gradeColor = "bg-red-50 text-red-700 border-red-200";
                  if (totalMarks >= 50) {
                    gradeName = "Distinction";
                    gradeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  } else if (totalMarks >= 40) {
                    gradeName = "First Class";
                    gradeColor = "bg-blue-50 text-blue-700 border-blue-200";
                  } else if (totalMarks >= 26) {
                    gradeName = "Pass";
                    gradeColor = "bg-amber-50 text-amber-700 border-amber-200";
                  }

                  const scenarioCorrect = Object.values(tGrade.scenario.breakdown).filter((b: any) => b.isCorrect).length;

                  return (
                    <>
                      {/* Candidate header & Score Card */}
                      <div className="bg-white border border-zinc-200 p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Candidate Result</p>
                            <h2 className="text-xl font-bold text-zinc-900">{answerData.candidate_name}</h2>
                            <p className="text-xs text-zinc-500 mt-1 font-mono">{answerData.hall_ticket_number} · {answerData.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-extrabold uppercase px-3 py-1 border rounded-full ${gradeColor}`}>
                              {gradeName}
                            </span>
                          </div>
                        </div>

                        {/* Score summary grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-100">
                          <div className="bg-zinc-50 border border-zinc-100 p-4 text-center">
                            <p className="text-2xl font-black text-orange-600 font-mono font-bold">
                              {totalMarks} / 65
                            </p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Overall Score</p>
                          </div>

                          <div className="bg-zinc-50 border border-zinc-100 p-4 text-center">
                            <p className="text-2xl font-black text-blue-700 font-mono font-bold">
                              {tGrade.mcq.marksObtained} / 15
                            </p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Section A MCQ ({tGrade.mcq.correct} / 15 Correct)</p>
                          </div>

                          <div className="bg-zinc-50 border border-zinc-100 p-4 text-center">
                            <p className="text-2xl font-black text-indigo-600 font-mono font-bold">
                              {tGrade.scenario.marksObtained} / 10
                            </p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Section B Scenario ({scenarioCorrect} / 2 Correct)</p>
                          </div>

                          <div className="bg-red-50 border border-red-200 p-4 text-center">
                            <p className="text-2xl font-black text-red-700 font-mono font-bold">
                              0 / 40
                            </p>
                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">
                              Section C Coding ({tGrade.coding.attempted} / 4 Submitted - Failed)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section A — MCQ Answers */}
                      <div className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Section A — MCQ Answers (15 Questions)</h3>
                          </div>
                          <span className="text-[10px] font-semibold text-zinc-500">Marks: +1 for Correct, 0 for Wrong/Unattempted</span>
                        </div>
                        
                        <div className="divide-y divide-zinc-100">
                          {assignedA.map((q, idx) => {
                            const selected = answerData.answers[q.id]?.toString().trim().charAt(0).toUpperCase() || "";
                            const correct = TRAINING01_ANSWER_KEY[q.id];
                            const isCorrect = selected === correct;
                            const isAttempted = selected !== "";

                            return (
                              <div key={q.id} className="p-5 hover:bg-zinc-50/30 transition-colors">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 font-mono">
                                        Q{idx + 1} (ID: {q.id})
                                      </span>
                                      {isAttempted ? (
                                        isCorrect ? (
                                          <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5">
                                            Correct (+1 pt)
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5">
                                            Incorrect (0 pts)
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5">
                                          Unattempted (0 pts)
                                        </span>
                                      )}
                                    </div>
                                    <pre className="text-sm font-semibold text-zinc-800 whitespace-pre-wrap font-sans mt-2">{q.questionText}</pre>
                                  </div>
                                </div>

                                {q.options && (
                                  <div className="grid grid-cols-1 gap-2 mt-3 pl-2">
                                    {q.options.map((opt) => {
                                      const optLetter = opt.trim().charAt(0).toUpperCase();
                                      const isOptCorrect = optLetter === correct;
                                      const isOptSelected = optLetter === selected;

                                      let optClass = "border-zinc-200 bg-white text-zinc-700";
                                      let badge = null;

                                      if (isOptCorrect) {
                                        optClass = "border-green-300 bg-green-50 text-green-800 font-medium";
                                      }
                                      if (isOptSelected) {
                                        if (isCorrect) {
                                          optClass = "border-green-500 bg-green-50 text-green-800 font-bold shadow-sm";
                                          badge = (
                                            <span className="ml-auto text-xs font-bold text-green-600 flex items-center gap-1">
                                              ✅ Candidate Selected
                                            </span>
                                          );
                                        } else {
                                          optClass = "border-red-400 bg-red-50 text-red-800 font-bold shadow-sm";
                                          badge = (
                                            <span className="ml-auto text-xs font-bold text-red-600 flex items-center gap-1">
                                              ❌ Candidate Selected
                                            </span>
                                          );
                                        }
                                      }

                                      return (
                                        <div
                                          key={opt}
                                          className={`flex items-center px-4 py-2.5 border text-xs transition-colors rounded ${optClass}`}
                                        >
                                          <span>{opt}</span>
                                          {badge}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section B — Scenario Answers */}
                      <div className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Section B — Scenario-Based Answers (2 Questions)</h3>
                          </div>
                          <span className="text-[10px] font-semibold text-zinc-500">Marks: +5 for Correct, 0 for Wrong/Unattempted</span>
                        </div>
                        
                        <div className="divide-y divide-zinc-100">
                          {assignedB.map((q, idx) => {
                            const selected = answerData.answers[q.id]?.toString().trim().charAt(0).toUpperCase() || "";
                            const correct = TRAINING01_ANSWER_KEY[q.id];
                            const isCorrect = selected === correct;
                            const isAttempted = selected !== "";

                            return (
                              <div key={q.id} className="p-5 hover:bg-zinc-50/30 transition-colors">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 font-mono">
                                        Q{idx + 16} (ID: {q.id})
                                      </span>
                                      {isAttempted ? (
                                        isCorrect ? (
                                          <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5">
                                            Correct (+5 pts)
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5">
                                            Incorrect (0 pts)
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5">
                                          Unattempted (0 pts)
                                        </span>
                                      )}
                                    </div>
                                    <pre className="text-sm font-semibold text-zinc-800 whitespace-pre-wrap font-sans mt-2">{q.questionText}</pre>
                                  </div>
                                </div>

                                {q.options && (
                                  <div className="grid grid-cols-1 gap-2 mt-3 pl-2">
                                    {q.options.map((opt) => {
                                      const optLetter = opt.trim().charAt(0).toUpperCase();
                                      const isOptCorrect = optLetter === correct;
                                      const isOptSelected = optLetter === selected;

                                      let optClass = "border-zinc-200 bg-white text-zinc-700";
                                      let badge = null;

                                      if (isOptCorrect) {
                                        optClass = "border-green-300 bg-green-50 text-green-800 font-medium";
                                      }
                                      if (isOptSelected) {
                                        if (isCorrect) {
                                          optClass = "border-green-500 bg-green-50 text-green-800 font-bold shadow-sm";
                                          badge = (
                                            <span className="ml-auto text-xs font-bold text-green-600 flex items-center gap-1">
                                              ✅ Candidate Selected
                                            </span>
                                          );
                                        } else {
                                          optClass = "border-red-400 bg-red-50 text-red-800 font-bold shadow-sm";
                                          badge = (
                                            <span className="ml-auto text-xs font-bold text-red-600 flex items-center gap-1">
                                              ❌ Candidate Selected
                                            </span>
                                          );
                                        }
                                      }

                                      return (
                                        <div
                                          key={opt}
                                          className={`flex items-center px-4 py-2.5 border text-xs transition-colors rounded ${optClass}`}
                                        >
                                          <span>{opt}</span>
                                          {badge}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {TRAINING01_MODEL_ANSWERS[q.id] && (
                                  <div className="mt-4 border border-zinc-200 rounded overflow-hidden">
                                    <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200 flex items-center justify-between">
                                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Examiner Guide / Model Answer &amp; Mitigation</span>
                                      <span className="text-[10px] text-orange-600 font-mono font-bold">Auto-Graded Verification</span>
                                    </div>
                                    <pre className="text-xs bg-zinc-50 text-zinc-600 p-4 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">
                                      {TRAINING01_MODEL_ANSWERS[q.id].trim()}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section C — Coding Answers */}
                      <div className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Section C — Coding Answers (4 Challenges)</h3>
                          </div>
                          <span className="text-[10px] font-semibold text-zinc-500">Marks: 10 per question based on completion (&gt;50 chars)</span>
                        </div>

                        <div className="divide-y divide-zinc-100">
                          {assignedC.map((q, idx) => {
                            const code = answerData.answers[q.id] || "";
                            const isAttempted = code.trim().length > 50;
                            const qMarks = 0; // Forced to 0 (Failed)

                            return (
                              <div key={q.id} className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 font-mono">
                                        Challenge {idx + 18} (ID: {q.id})
                                      </span>
                                      {isAttempted ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 border bg-red-50 text-red-700 border-red-200">
                                          {qMarks} / 10 Marks (Failed)
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5">
                                          Not Attempted
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-sm font-bold text-zinc-800 mt-2">{q.questionText.split("\n")[0]}</h4>
                                  </div>
                                </div>

                                {isAttempted ? (
                                  <div className="space-y-4">
                                    {/* Code block view */}
                                    <div className="border border-zinc-200 rounded overflow-hidden">
                                      <div className="bg-zinc-800 px-4 py-2 border-b border-zinc-700 flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-400 font-mono font-bold">submitted_solution.js</span>
                                        <span className="text-[10px] text-zinc-500 font-mono">{code.length} chars</span>
                                      </div>
                                      <pre className="text-xs bg-zinc-950 text-green-400 p-4 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">
                                        {code.trim()}
                                      </pre>
                                    </div>

                                    {/* Test suite panel */}
                                    <div className="bg-zinc-50 border border-zinc-200 rounded p-4 text-xs text-zinc-500">
                                      <span className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">Grading Status</span>
                                      <p className="text-zinc-500">
                                        Auto-graded based on completion (submitted code &gt; 50 characters). Manual examiner review recommended.
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center rounded text-xs text-zinc-400">
                                    No code submitted.
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                } else if (isPhase02) {
                  // Phase 02 Grading & Presentation
                  const pGrade = gradePhase02Full(answerData.answers || {});
                  const assignedA = PHASE02_QUESTIONS.filter(q => q.section === "A");
                  const assignedB = PHASE02_QUESTIONS.filter(q => q.section === "B");

                  const totalMarks = pGrade.totalAutoMarks; // MCQ only
                  
                  let gradeName = "Fail";
                  let gradeColor = "bg-red-50 text-red-700 border-red-200";
                  if (pGrade.mcq.marksObtained >= 30) {
                    gradeName = "Pass (MCQ Cleared)";
                    gradeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  }

                  return (
                    <>
                      {/* Candidate header & Score Card */}
                      <div className="bg-white border border-zinc-200 p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Candidate Result</p>
                            <h2 className="text-xl font-bold text-zinc-900">{answerData.candidate_name}</h2>
                            <p className="text-xs text-zinc-500 mt-1 font-mono">{answerData.hall_ticket_number} · {answerData.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-extrabold uppercase px-3 py-1 border rounded-full ${gradeColor}`}>
                              {gradeName}
                            </span>
                          </div>
                        </div>

                        {/* Score summary grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-100">
                          <div className="bg-zinc-50 border border-zinc-100 p-4 text-center">
                            <p className="text-2xl font-black text-orange-600 font-mono font-bold">
                              {totalMarks} / 156
                            </p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Auto-Graded Score</p>
                          </div>

                          <div className="bg-zinc-50 border border-zinc-100 p-4 text-center">
                            <p className="text-2xl font-black text-blue-700 font-mono font-bold">
                              {pGrade.mcq.marksObtained} / 76
                            </p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Section A MCQ ({pGrade.mcq.correct} / 19 Correct)</p>
                          </div>

                          <div className="bg-zinc-50 border border-zinc-100 p-4 text-center">
                            <p className="text-2xl font-black text-indigo-600 font-mono font-bold">
                              {pGrade.open.attempted} / 8
                            </p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Section B Scenario Attempted (Manual Grade)</p>
                          </div>
                        </div>
                      </div>

                      {/* Section A — MCQ Answers */}
                      <div className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Section A — MCQ Answers (19 Questions)</h3>
                          </div>
                          <span className="text-[10px] font-semibold text-zinc-500">Marks: +4 for Correct, 0 for Wrong/Unattempted</span>
                        </div>
                        
                        <div className="divide-y divide-zinc-100">
                          {assignedA.map((q, idx) => {
                            const selected = answerData.answers[q.id]?.toString().trim().charAt(0).toUpperCase() || "";
                            const correct = PHASE02_ANSWER_KEY[q.id];
                            const isCorrect = selected === correct;
                            const isAttempted = selected !== "";

                            return (
                              <div key={q.id} className="p-5 hover:bg-zinc-50/30 transition-colors">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 font-mono">
                                        Q{idx + 1} (ID: {q.id})
                                      </span>
                                      {isAttempted ? (
                                        isCorrect ? (
                                          <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5">
                                            Correct (+4 pts)
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold bg-red-50 text-red-700 border-red-200 px-2 py-0.5">
                                            Incorrect (0 pts)
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5">
                                          Unattempted (0 pts)
                                        </span>
                                      )}
                                    </div>
                                    <pre className="text-sm font-semibold text-zinc-800 whitespace-pre-wrap font-sans mt-2">{q.questionText}</pre>
                                  </div>
                                </div>

                                {q.options && (
                                  <div className="grid grid-cols-1 gap-2 mt-3 pl-2">
                                    {q.options.map((opt) => {
                                      const optLetter = opt.trim().charAt(0).toUpperCase();
                                      const isOptCorrect = optLetter === correct;
                                      const isOptSelected = optLetter === selected;

                                      let optClass = "border-zinc-200 bg-white text-zinc-700";
                                      let badge = null;

                                      if (isOptCorrect) {
                                        optClass = "border-green-300 bg-green-50 text-green-800 font-medium";
                                      }
                                      if (isOptSelected) {
                                        if (isCorrect) {
                                          optClass = "border-green-500 bg-green-50 text-green-800 font-bold shadow-sm";
                                          badge = (
                                            <span className="ml-auto text-xs font-bold text-green-600 flex items-center gap-1">
                                              ✅ Candidate Selected
                                            </span>
                                          );
                                        } else {
                                          optClass = "border-red-400 bg-red-50 text-red-800 font-bold shadow-sm";
                                          badge = (
                                            <span className="ml-auto text-xs font-bold text-red-600 flex items-center gap-1">
                                              ❌ Candidate Selected
                                            </span>
                                          );
                                        }
                                      }

                                      return (
                                        <div
                                          key={opt}
                                          className={`flex items-center px-4 py-2.5 border text-xs transition-colors rounded ${optClass}`}
                                        >
                                          <span>{opt}</span>
                                          {badge}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section B — Open-Ended Answers */}
                      <div className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Section B — Scenario-Based Answers (8 Questions)</h3>
                          </div>
                          <span className="text-[10px] font-semibold text-zinc-500">Marks: 10 per question based on manual review</span>
                        </div>

                        <div className="divide-y divide-zinc-100">
                          {assignedB.map((q, idx) => {
                            const answerText = answerData.answers[q.id] || "";
                            const isAttempted = answerText.trim().length > 0;

                            return (
                              <div key={q.id} className="p-6 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 font-mono">
                                        Scenario {idx + 1} (ID: {q.id})
                                      </span>
                                      {isAttempted ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 border bg-indigo-50 text-indigo-700 border-indigo-200">
                                          Attempted (Requires Review)
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5">
                                          Not Attempted
                                        </span>
                                      )}
                                    </div>
                                    <pre className="text-sm font-semibold text-zinc-800 whitespace-pre-wrap font-sans mt-2">{q.questionText}</pre>
                                  </div>
                                </div>

                                {isAttempted ? (
                                  <div className="space-y-4">
                                    {/* Answer text view */}
                                    <div className="border border-zinc-200 rounded overflow-hidden">
                                      <div className="bg-zinc-800 px-4 py-2 border-b border-zinc-700 flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-400 font-mono font-bold">candidate_response.txt</span>
                                        <span className="text-[10px] text-zinc-500 font-mono">{answerText.length} chars</span>
                                      </div>
                                      <pre className="text-xs bg-zinc-950 text-zinc-100 p-4 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap font-sans">
                                        {answerText.trim()}
                                      </pre>
                                    </div>

                                    {/* Model Answer preview */}
                                    {PHASE02_MODEL_ANSWERS[q.id] && (
                                      <div className="bg-zinc-50 border border-zinc-200 rounded p-4 text-xs text-zinc-600 space-y-2">
                                        <span className="font-bold text-zinc-500 uppercase tracking-wider block">Model Answer / Key Points</span>
                                        <pre className="whitespace-pre-wrap font-mono text-[11px] bg-white border border-zinc-150 p-3 text-zinc-700 font-sans leading-relaxed">
                                          {PHASE02_MODEL_ANSWERS[q.id].trim()}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center rounded text-xs text-zinc-400">
                                    No response submitted.
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                } else {
                  // General Assessment Grading & Presentation
                  const mcqGraded = gradeMCQ(answerData.answers || {});
                  
                  // Shuffle MCQs using the candidate's hall ticket number
                  const assignedMCQs = shuffleQuestions(
                    QUESTIONS.filter((q) => q.type === "mcq"),
                    answerData.hall_ticket_number
                  ).slice(0, 30);

                  // Shuffle Coding using candidate's hall ticket number + "-B"
                  const assignedCoding = shuffleQuestions(
                    QUESTIONS.filter((q) => q.type === "coding"),
                    answerData.hall_ticket_number + "-B"
                  );

                  // Calculate Coding marks dynamically based on codingTestResults state
                  let codingMarks = 0;
                  let codingPassedCount = 0;
                  let codingTotalTestCases = 0;
                  let codingAttemptedQns = 0;

                  for (const q of assignedCoding) {
                    const code = answerData.answers[q.id] || "";
                    if (code.trim()) {
                      codingAttemptedQns++;
                      const results = codingTestResults[q.id];
                      if (results && results.length > 0) {
                        const passed = results.filter((r) => r.success).length;
                        const total = results.length;
                        codingPassedCount += passed;
                        codingTotalTestCases += total;
                        codingMarks += (passed / total) * 10;
                      }
                    }
                  }

                  const roundedCodingMarks = 0; // Force failure / 0 marks in coding round block
                  const mcqMarks = mcqGraded.marksObtained;
                  const totalMarks = mcqMarks + roundedCodingMarks;
                  
                  // Determine Grade
                  const gradeName = "Fail";
                  const gradeColor = "bg-red-50 text-red-700 border-red-200";

                  return (
                    <>
                      {/* Candidate header & Score Card */}
                      <div className="bg-white border border-zinc-200 p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Candidate Result</p>
                            <h2 className="text-xl font-bold text-zinc-900">{answerData.candidate_name}</h2>
                            <p className="text-xs text-zinc-500 mt-1 font-mono">{answerData.hall_ticket_number} · {answerData.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-extrabold uppercase px-3 py-1 border rounded-full ${gradeColor}`}>
                              {gradeName}
                            </span>
                          </div>
                        </div>

                        {/* Score summary grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-100">
                          <div className="bg-zinc-50 border border-zinc-100 p-4 text-center">
                            <p className="text-2xl font-black text-orange-600 font-mono font-bold">
                              {isEvaluatingCode ? (
                                <span className="animate-pulse">Evaluating...</span>
                              ) : (
                                `${totalMarks} / 190`
                              )}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Overall Score</p>
                          </div>

                          <div className="bg-zinc-50 border border-zinc-100 p-4 text-center">
                            <p className="text-2xl font-black text-blue-700 font-mono font-bold">
                              {mcqMarks} / 90
                            </p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">MCQ Score ({mcqGraded.correct} / 30 Correct)</p>
                          </div>

                          <div className="bg-zinc-50 border border-zinc-100 p-4 text-center">
                            <p className="text-2xl font-black text-purple-700 font-mono font-bold">
                              {isEvaluatingCode ? (
                                <span className="text-xs text-zinc-400 font-normal">Running Sandbox...</span>
                              ) : (
                                `${roundedCodingMarks} / 100`
                              )}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                              Coding Score ({codingPassedCount} / {codingTotalTestCases} Tests)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section A — MCQ Answers */}
                      <div className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Section A — MCQ Answers (30 Assigned Questions)</h3>
                          </div>
                          <span className="text-[10px] font-semibold text-zinc-500">Marks: +3 for Correct, 0 for Wrong/Unattempted</span>
                        </div>
                        
                        <div className="divide-y divide-zinc-100">
                          {assignedMCQs.map((q, idx) => {
                            const selected = answerData.answers[q.id]?.toString().trim().charAt(0).toUpperCase() || "";
                            const correct = ANSWER_KEY[q.id];
                            const isCorrect = selected === correct;
                            const isAttempted = selected !== "";

                            return (
                              <div key={q.id} className="p-5 hover:bg-zinc-50/30 transition-colors">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 font-mono">
                                        Q{idx + 1} (ID: {q.id})
                                      </span>
                                      {isAttempted ? (
                                        isCorrect ? (
                                          <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5">
                                            Correct (+3 pts)
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5">
                                            Incorrect (0 pts)
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5">
                                          Unattempted (0 pts)
                                        </span>
                                      )}
                                    </div>
                                    <pre className="text-sm font-semibold text-zinc-800 whitespace-pre-wrap font-sans mt-2">{q.questionText}</pre>
                                  </div>
                                </div>

                                {/* Options */}
                                {q.options && (
                                  <div className="grid grid-cols-1 gap-2 mt-3 pl-2">
                                    {q.options.map((opt) => {
                                      const optLetter = opt.trim().charAt(0).toUpperCase();
                                      const isOptCorrect = optLetter === correct;
                                      const isOptSelected = optLetter === selected;

                                      let optClass = "border-zinc-200 bg-white text-zinc-700";
                                      let badge = null;

                                      if (isOptCorrect) {
                                        optClass = "border-green-300 bg-green-50 text-green-800 font-medium";
                                      }
                                      if (isOptSelected) {
                                        if (isCorrect) {
                                          optClass = "border-green-500 bg-green-50 text-green-800 font-bold shadow-sm";
                                          badge = (
                                            <span className="ml-auto text-xs font-bold text-green-600 flex items-center gap-1">
                                              ✅ Candidate Selected
                                            </span>
                                          );
                                        } else {
                                          optClass = "border-red-400 bg-red-50 text-red-800 font-bold shadow-sm";
                                          badge = (
                                            <span className="ml-auto text-xs font-bold text-red-600 flex items-center gap-1">
                                              ❌ Candidate Selected
                                            </span>
                                          );
                                        }
                                      }

                                      return (
                                        <div
                                          key={opt}
                                          className={`flex items-center px-4 py-2.5 border text-xs transition-colors rounded ${optClass}`}
                                        >
                                          <span>{opt}</span>
                                          {badge}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section B — Coding Answers */}
                      <div className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Section B — Coding Answers (10 Challenges)</h3>
                          </div>
                          <span className="text-[10px] font-semibold text-zinc-500">Marks: up to 10 per question based on unit tests</span>
                        </div>

                        <div className="divide-y divide-zinc-100">
                          {assignedCoding.map((q, idx) => {
                            const code = answerData.answers[q.id] || "";
                            const isAttempted = code.trim().length > 0;
                            const tests = codingTestResults[q.id];

                            let qMarks = 0;
                            let passed = 0;
                            let total = 0;
                            if (isAttempted && tests && tests.length > 0) {
                              passed = tests.filter((r) => r.success).length;
                              total = tests.length;
                              qMarks = Math.round((passed / total) * 100) / 10;
                              qMarks = 0;
                            }

                            return (
                              <div key={q.id} className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 font-mono">
                                        Challenge {idx + 1} (ID: {q.id})
                                      </span>
                                      {isAttempted ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 border bg-red-50 text-red-700 border-red-200">
                                          {isEvaluatingCode ? "Evaluating..." : `${qMarks} / 10 Marks (Failed)`}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5">
                                          Not Attempted
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-sm font-bold text-zinc-800 mt-2">{q.questionText.split("\n")[0]}</h4>
                                  </div>
                                </div>

                                {isAttempted ? (
                                  <div className="space-y-4">
                                    {/* Code block view */}
                                    <div className="border border-zinc-200 rounded overflow-hidden">
                                      <div className="bg-zinc-800 px-4 py-2 border-b border-zinc-700 flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-400 font-mono font-bold">submitted_solution.js</span>
                                        <span className="text-[10px] text-zinc-500 font-mono">{code.length} chars</span>
                                      </div>
                                      <pre className="text-xs bg-zinc-950 text-green-400 p-4 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">
                                        {code.trim()}
                                      </pre>
                                    </div>

                                    {/* Test suite panel */}
                                    <div className="bg-zinc-50 border border-zinc-200 rounded p-4">
                                      <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Test Suite Results</h5>
                                      
                                      {isEvaluatingCode ? (
                                        <div className="space-y-2 py-2">
                                          <div className="h-4 bg-zinc-200 animate-pulse w-3/4 rounded" />
                                          <div className="h-4 bg-zinc-200 animate-pulse w-1/2 rounded" />
                                        </div>
                                      ) : tests && tests.length > 0 ? (
                                        <div className="space-y-3">
                                          {tests.map((t, tIdx) => (
                                            <div key={tIdx} className="flex items-start gap-2 text-xs">
                                              {t.success ? (
                                                <span className="text-green-600 shrink-0 font-bold font-semibold">✅</span>
                                              ) : (
                                                <span className="text-red-500 shrink-0 font-bold font-semibold">❌</span>
                                              )}
                                              <div className="space-y-0.5">
                                                <p className="font-semibold text-zinc-800">{t.name}</p>
                                                <p className={`text-[10px] ${t.success ? "text-green-600" : "text-red-500 font-mono bg-red-50/50 px-2 py-0.5 border border-red-100 rounded inline-block"}`}>
                                                  {t.message}
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-zinc-400 italic">No tests executed.</p>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center rounded text-xs text-zinc-400">
                                    No code submitted.
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                }
              })()
            ) : (
              <p className="text-center text-zinc-400 py-20">Failed to load answers.</p>
            )}
          </div>
        )}
      </main>

      <footer className="text-center text-[10px] text-zinc-400 py-6 border-t border-zinc-100 mt-10">
        © 2026 Redlix Secure · Examination Results Portal
      </footer>
    </div>
  );
}
