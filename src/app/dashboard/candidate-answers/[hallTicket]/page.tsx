"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/app/exam-session/questions";
import { TRAINING01_QUESTIONS } from "@/app/exam-session/training01Questions";
import { PHASE02_QUESTIONS } from "@/app/exam-session/phase02Questions";
import { TECHNICAL_QUESTIONS } from "@/app/exam-session/technicalQuestions";
import { TECHNICAL_ANSWER_KEY } from "@/app/exam-session/technicalAnswerKey";
import { BUSINESS_ANALYSIS_QUESTIONS } from "@/app/exam-session/businessAnalysisQuestions";
import { BUSINESS_ANALYSIS_ANSWER_KEY } from "@/app/exam-session/businessAnalysisAnswerKey";
import { SALES_MARKETING_QUESTIONS } from "@/app/exam-session/salesMarketingQuestions";
import { SALES_MARKETING_ANSWER_KEY } from "@/app/exam-session/salesMarketingAnswerKey";
import { UIUX_QUESTIONS } from "@/app/exam-session/uiuxQuestions";
import { UIUX_ANSWER_KEY } from "@/app/exam-session/uiuxAnswerKey";
import { MARKETING_QUESTIONS } from "@/app/exam-session/marketingQuestions";
import { MARKETING_ANSWER_KEY } from "@/app/exam-session/marketingAnswerKey";
import { ANALYTICS_QUESTIONS } from "@/app/exam-session/analyticsQuestions";
import { ANALYTICS_ANSWER_KEY } from "@/app/exam-session/analyticsAnswerKey";


interface Registration {
  id: string;
  candidate_name: string;
  hall_ticket_number: string;
  registration_number: string;
  email: string;
  phone: string;
  college: string;
  exam_id: number;
  answers: Record<string | number, string>;
  created_at?: string;
  exam?: {
    id: number;
    name: string;
  };
}

export default function CandidateAnswersPage({
  params,
}: {
  params: Promise<{ hallTicket: string }>;
}) {
  const resolvedParams = use(params);
  const hallTicket = decodeURIComponent(resolvedParams.hallTicket);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<Registration | null>(null);
  const [examName, setExamName] = useState<string>("Wing Examination 2026");
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect" | "unattempted">("all");
  const [enableNegativeMarking, setEnableNegativeMarking] = useState<boolean>(true);
  const [negativeMarkValue, setNegativeMarkValue] = useState<number>(0.5);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch candidate details & answers
        const res = await fetch(`/api/results`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const found = json.data.find(
              (r: any) =>
                r.hallTicketNumber?.trim().toLowerCase() === hallTicket.trim().toLowerCase() ||
                r.id?.toString() === hallTicket.trim()
            );

            if (found) {
              setCandidate({
                id: found.id?.toString() || hallTicket,
                candidate_name: found.candidateName || found.candidate_name,
                hall_ticket_number: found.hallTicketNumber || found.hall_ticket_number,
                registration_number: found.registrationNumber || found.registration_number,
                email: found.email || "",
                phone: found.phone || "",
                college: found.college || "",
                exam_id: Number(found.examId || found.exam_id || 6),
                answers: found.answers || {},
                created_at: found.createdAt || found.created_at,
              });

              if (found.examName) {
                setExamName(found.examName);
              }
            }
          }
        }

        // If not found in results, fallback to direct save-answers fetch
        if (!candidate) {
          const saRes = await fetch(`/api/exam/save-answers?hallTicketNumber=${encodeURIComponent(hallTicket)}`);
          if (saRes.ok) {
            const saJson = await saRes.json();
            if (saJson.success && saJson.answers) {
              setCandidate((prev) =>
                prev
                  ? { ...prev, answers: saJson.answers }
                  : {
                      id: hallTicket,
                      candidate_name: "Candidate " + hallTicket,
                      hall_ticket_number: hallTicket,
                      registration_number: "SF-2026",
                      email: "",
                      phone: "",
                      college: "",
                      exam_id: 6,
                      answers: saJson.answers,
                    }
              );
            }
          }
        }
      } catch (err) {
        console.error("Failed to load candidate evaluation data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (hallTicket) {
      loadData();
    }
  }, [hallTicket]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-zinc-700">Loading candidate evaluation...</p>
        <p className="text-xs text-zinc-400 mt-1">Hall Ticket: {hallTicket}</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 border border-zinc-200 rounded-xl shadow-xs">
          <span className="material-symbols-outlined text-4xl text-zinc-400">person_off</span>
          <h2 className="text-base font-bold text-zinc-900 mt-2">Candidate Not Found</h2>
          <p className="text-xs text-zinc-500 mt-1">
            No evaluation record was found for Hall Ticket <span className="font-mono font-bold text-zinc-700">{hallTicket}</span>.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Determine Question Bank & Answer Key ──────────────────────────────────
  const examId = candidate.exam_id;
  const examLower = examName.toLowerCase();

  const isTechnicalExam = examId === 5 || examLower.includes("technical");
  const isBusinessAnalysisExam = examId === 6 || examLower.includes("business") || examLower.includes("bussiness");
  const isSalesMarketingExam = examId === 7 || examLower.includes("sales");
  const isUIUXExam = examId === 8 || examLower.includes("ui") || examLower.includes("ux");
  const isMarketingExam = examId === 9 || (examLower.includes("marketing") && !isSalesMarketingExam);
  const isAnalyticsExam = examId === 10 || examLower.includes("analytics");

  let candidateQuestions = QUESTIONS.map((q) => ({ ...q }));

  if (isTechnicalExam) {
    candidateQuestions = TECHNICAL_QUESTIONS.map((q) => ({ ...q }));
  } else if (isBusinessAnalysisExam) {
    candidateQuestions = BUSINESS_ANALYSIS_QUESTIONS.map((q) => ({ ...q }));
  } else if (isSalesMarketingExam) {
    candidateQuestions = SALES_MARKETING_QUESTIONS.map((q) => ({ ...q }));
  } else if (isUIUXExam) {
    candidateQuestions = UIUX_QUESTIONS.map((q) => ({ ...q }));
  } else if (isMarketingExam) {
    candidateQuestions = MARKETING_QUESTIONS.map((q) => ({ ...q }));
  } else if (isAnalyticsExam) {
    candidateQuestions = ANALYTICS_QUESTIONS.map((q) => ({ ...q }));
  }

  const mcqQuestions = candidateQuestions.filter((q) => q.type === "mcq");
  const codingQuestions = candidateQuestions.filter((q) => q.type === "coding" || q.type === "open");

  const isQuestionAttempted = (q: typeof QUESTIONS[0]) => {
    const ans = candidate.answers?.[q.id];
    if (!ans || ans.toString().trim() === "") return false;
    if (q.type === "coding" && q.starterCode) {
      return ans.toString().trim() !== q.starterCode.trim();
    }
    return true;
  };

  const getCorrectLetter = (qId: number) => {
    if (isBusinessAnalysisExam) return BUSINESS_ANALYSIS_ANSWER_KEY[qId];
    if (isSalesMarketingExam) return SALES_MARKETING_ANSWER_KEY[qId];
    if (isTechnicalExam) return TECHNICAL_ANSWER_KEY[qId];
    if (isUIUXExam) return UIUX_ANSWER_KEY[qId];
    if (isMarketingExam) return MARKETING_ANSWER_KEY[qId];
    if (isAnalyticsExam) return ANALYTICS_ANSWER_KEY[qId];
    return null;
  };

  // ── Compute Metrics ───────────────────────────────────────────────────────
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalSkipped = 0;

  mcqQuestions.forEach((q) => {
    const rawAns = candidate.answers?.[q.id];
    const selected = rawAns ? rawAns.toString().trim().charAt(0).toUpperCase() : "";
    const attempted = isQuestionAttempted(q);
    const key = getCorrectLetter(q.id);

    if (!attempted) {
      totalSkipped++;
    } else if (key && selected === key) {
      totalCorrect++;
    } else if (key && selected && selected !== key) {
      totalIncorrect++;
    } else {
      totalSkipped++;
    }
  });

  const totalAttempted = mcqQuestions.filter(isQuestionAttempted).length;
  const marksPerCorrect = 2.0;
  const grossMarks = totalCorrect * marksPerCorrect;
  const totalPenalty = enableNegativeMarking ? totalIncorrect * negativeMarkValue : 0;
  const netMarks = Math.max(0, grossMarks - totalPenalty);
  const totalMaxMarks = mcqQuestions.length * 2 + (codingQuestions.length > 0 ? codingQuestions.length * 10 : 0);
  const netPercentage = totalMaxMarks > 0 ? ((netMarks / totalMaxMarks) * 100).toFixed(1) : "0.0";
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
  const isPassed = Number(netPercentage) >= 40.0;

  // ── Filter Questions ──────────────────────────────────────────────────────
  const filteredQuestions = mcqQuestions.filter((q) => {
    const rawAns = candidate.answers?.[q.id];
    const selected = rawAns ? rawAns.toString().trim().charAt(0).toUpperCase() : "";
    const attempted = isQuestionAttempted(q);
    const key = getCorrectLetter(q.id);

    if (filter === "correct" && (!attempted || !key || selected !== key)) return false;
    if (filter === "incorrect" && (!attempted || !key || !selected || selected === key)) return false;
    if (filter === "unattempted" && attempted) return false;

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      const matchQ = q.questionText.toLowerCase().includes(term);
      const matchOpt = q.options?.some((o) => o.toLowerCase().includes(term));
      if (!matchQ && !matchOpt) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-50/60 text-zinc-900 select-text pb-16 font-sans">
      
      {/* ── Top Sticky App Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-sm leading-none">arrow_back</span>
              <span>Dashboard</span>
            </Link>

            <span className="text-zinc-300 hidden sm:inline">|</span>

            <div>
              <h1 className="text-sm sm:text-base font-bold text-zinc-900 leading-tight flex items-center gap-2">
                <span>{candidate.candidate_name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Evaluation Report
                </span>
              </h1>
              <p className="text-[11px] text-zinc-500 font-mono leading-none mt-0.5">
                HT: <span className="font-bold text-zinc-800">{candidate.hall_ticket_number}</span> • Exam: <span className="font-sans text-zinc-700">{examName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (candidate.hall_ticket_number) {
                  navigator.clipboard.writeText(candidate.hall_ticket_number);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-zinc-500 leading-none">
                {copied ? "check" : "content_copy"}
              </span>
              <span>{copied ? "Copied" : "Copy HT"}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-zinc-500 leading-none">print</span>
              <span className="hidden sm:inline">Print Report</span>
            </button>
          </div>

        </div>
      </header>

      {/* ── Main Container ───────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* ── Candidate Information Card ─────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 font-extrabold flex items-center justify-center text-base shrink-0">
              {candidate.candidate_name ? candidate.candidate_name.substring(0, 2).toUpperCase() : "ST"}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                {candidate.candidate_name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap font-mono">
                <span>HT: <strong className="text-zinc-800">{candidate.hall_ticket_number}</strong></span>
                <span className="text-zinc-300">•</span>
                <span>Reg ID: <strong className="text-zinc-800">{candidate.registration_number || "SF-2026"}</strong></span>
                {candidate.college && (
                  <>
                    <span className="text-zinc-300">•</span>
                    <span className="font-sans text-zinc-600 truncate max-w-xs">{candidate.college}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-100">
            <div className="text-left md:text-right">
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Assessment Status</p>
              <p className="text-xs font-semibold text-zinc-700 mt-0.5">
                {totalAttempted > 0 ? "Completed & Submitted" : "Pending Submission"}
              </p>
            </div>
          </div>
        </section>

        {/* ── Scorecard & Negative Marking Metrics ────────────────────────── */}
        <section className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Performance Scorecard</h3>
              <p className="text-xs text-zinc-500">Auto-evaluated against official wing answer key</p>
            </div>

            {/* Negative Marking Toggle */}
            <div className="flex items-center gap-3 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-zinc-800">
                <input
                  type="checkbox"
                  checked={enableNegativeMarking}
                  onChange={(e) => setEnableNegativeMarking(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-zinc-300 cursor-pointer accent-orange-600"
                />
                <span>Negative Marking</span>
              </label>

              {enableNegativeMarking && (
                <select
                  value={negativeMarkValue}
                  onChange={(e) => setNegativeMarkValue(Number(e.target.value))}
                  className="bg-white border border-zinc-300 rounded px-2 py-1 text-xs font-semibold text-zinc-800 outline-none cursor-pointer"
                >
                  <option value={0.5}>-0.50 (25% / 1/4th)</option>
                  <option value={0.66}>-0.66 (33% / 1/3rd)</option>
                  <option value={1.0}>-1.00 (50% / 1/2)</option>
                  <option value={0.25}>-0.25 (12.5% / 1/8th)</option>
                </select>
              )}
            </div>
          </div>

          {/* 6 Clean Metric Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* Net Marks */}
            <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {enableNegativeMarking ? "Net Score" : "Gross Score"}
              </p>
              <p className="text-xl font-extrabold text-zinc-900 mt-1 leading-none">
                {netMarks.toFixed(1)} <span className="text-xs font-semibold text-zinc-400">/ {totalMaxMarks}</span>
              </p>
              <p className="text-[10px] font-medium text-zinc-500 mt-1">
                {netPercentage}% Final Percentage
              </p>
            </div>

            {/* Correct Answers */}
            <div className="bg-emerald-50/70 p-3.5 rounded-lg border border-emerald-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Correct
              </p>
              <p className="text-xl font-extrabold text-emerald-700 mt-1 leading-none">
                {totalCorrect} <span className="text-xs font-semibold text-emerald-600/70">/ {mcqQuestions.length}</span>
              </p>
              <p className="text-[10px] font-bold text-emerald-700 mt-1">
                +{grossMarks.toFixed(1)} Marks ({totalCorrect} × 2.0)
              </p>
            </div>

            {/* Incorrect Answers */}
            <div className="bg-rose-50/70 p-3.5 rounded-lg border border-rose-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                Incorrect
              </p>
              <p className="text-xl font-extrabold text-rose-700 mt-1 leading-none">
                {totalIncorrect} <span className="text-xs font-semibold text-rose-600/70">/ {mcqQuestions.length}</span>
              </p>
              <p className="text-[10px] font-bold text-rose-700 mt-1">
                {enableNegativeMarking ? `-${totalPenalty.toFixed(1)} Marks Penalty` : "0.0 Penalty"}
              </p>
            </div>

            {/* Skipped */}
            <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                Skipped
              </p>
              <p className="text-xl font-extrabold text-zinc-700 mt-1 leading-none">
                {totalSkipped} <span className="text-xs font-semibold text-zinc-400">/ {mcqQuestions.length}</span>
              </p>
              <p className="text-[10px] font-medium text-zinc-500 mt-1">
                0.0 Marks Impact
              </p>
            </div>

            {/* Accuracy */}
            <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Accuracy
              </p>
              <p className="text-xl font-extrabold text-indigo-700 mt-1 leading-none">
                {accuracy}%
              </p>
              <p className="text-[10px] font-medium text-zinc-500 mt-1">
                {totalCorrect} of {totalAttempted} Attempted
              </p>
            </div>

            {/* Result Status */}
            <div className={`p-3.5 rounded-lg border ${
              isPassed 
                ? "bg-emerald-50 border-emerald-300 text-emerald-900" 
                : "bg-rose-50 border-rose-300 text-rose-900"
            }`}>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                Result Status
              </p>
              <p className="text-xl font-black mt-1 leading-none tracking-wide">
                {isPassed ? "PASSED" : "FAILED"}
              </p>
              <p className="text-[10px] font-semibold opacity-80 mt-1">
                Cut-off: 40% (40/100)
              </p>
            </div>

          </div>

          {/* Detailed Calculation Formula Preview */}
          <div className="text-xs font-mono text-zinc-600 bg-zinc-50 px-3.5 py-2 rounded-lg border border-zinc-200 flex items-center justify-between flex-wrap gap-2">
            <div>
              Calculation: <span className="text-emerald-700 font-bold">({totalCorrect} Correct × 2.0)</span>
              {enableNegativeMarking ? (
                <> - <span className="text-rose-700 font-bold">({totalIncorrect} Wrong × {negativeMarkValue})</span> = <strong className="text-zinc-900 font-bold">{netMarks.toFixed(1)} Marks</strong></>
              ) : (
                <> = <strong className="text-zinc-900 font-bold">{grossMarks.toFixed(1)} Marks (No Negative Marking)</strong></>
              )}
            </div>
            <div className="text-zinc-500">
              Cut-off Benchmark: <strong>40.0 Marks (40%)</strong>
            </div>
          </div>

        </section>

        {/* ── Filter Controls & Search ────────────────────────────────────── */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                filter === "all"
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              All ({mcqQuestions.length})
            </button>
            <button
              onClick={() => setFilter("correct")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                filter === "correct"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              ✓ Correct ({totalCorrect})
            </button>
            <button
              onClick={() => setFilter("incorrect")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                filter === "incorrect"
                  ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                  : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
              }`}
            >
              ✗ Incorrect ({totalIncorrect})
            </button>
            <button
              onClick={() => setFilter("unattempted")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                filter === "unattempted"
                  ? "bg-zinc-700 text-white border-zinc-700 shadow-xs"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              ○ Skipped ({totalSkipped})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Search question text or options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 text-zinc-800"
            />
          </div>

        </section>

        {/* ── Question & Answers Breakdown ────────────────────────────────── */}
        <section className="space-y-4">
          
          {filteredQuestions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-zinc-200 shadow-xs">
              <span className="material-symbols-outlined text-4xl text-zinc-400">filter_alt_off</span>
              <p className="text-sm font-bold text-zinc-800 mt-2">No matching questions</p>
              <p className="text-xs text-zinc-500 mt-1">Try resetting your filter or search query.</p>
              <button
                onClick={() => {
                  setFilter("all");
                  setSearchTerm("");
                }}
                className="mt-4 px-4 py-1.5 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer border-none"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const rawAns = candidate.answers?.[q.id];
              const selectedLetter = rawAns ? rawAns.toString().trim().charAt(0).toUpperCase() : "";
              const attempted = isQuestionAttempted(q);
              const correctLetter = getCorrectLetter(q.id);
              const isCorrect = correctLetter && selectedLetter && selectedLetter === correctLetter;
              const isWrong = attempted && correctLetter && selectedLetter && selectedLetter !== correctLetter;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
                    isCorrect
                      ? "border-emerald-200"
                      : isWrong
                      ? "border-rose-200"
                      : "border-zinc-200"
                  }`}
                >
                  
                  {/* Question Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-extrabold font-mono bg-zinc-900 text-white">
                        Q{q.number}
                      </span>
                      <span className="text-xs font-semibold text-zinc-500">
                        {q.section ? `Section ${q.section}` : "Multiple Choice"}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-2">
                      {isCorrect && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span>✓ Correct</span>
                          <span className="font-mono font-black">+2.00 Marks</span>
                        </span>
                      )}

                      {isWrong && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <span>✗ Incorrect</span>
                          <span className="font-mono font-black">
                            {enableNegativeMarking ? `-${negativeMarkValue.toFixed(2)} Penalty` : "0.00 Marks"}
                          </span>
                        </span>
                      )}

                      {!attempted && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                          <span>○ Skipped</span>
                          <span className="font-mono">0.00 Marks</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="py-3">
                    <p className="text-sm font-semibold text-zinc-900 leading-relaxed whitespace-pre-wrap">
                      {q.questionText}
                    </p>
                  </div>

                  {/* 4 Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                    {q.options?.map((opt) => {
                      const letter = opt.substring(0, 1).toUpperCase();
                      const isSelected = selectedLetter === letter;
                      const isThisCorrect = correctLetter === letter;

                      let cardStyle = "bg-zinc-50/70 border-zinc-200 text-zinc-700";
                      let badgeStyle = "bg-white text-zinc-600 border-zinc-300";

                      if (isSelected && isThisCorrect) {
                        cardStyle = "bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-400/40";
                        badgeStyle = "bg-emerald-600 text-white border-emerald-600";
                      } else if (isSelected && !isThisCorrect) {
                        cardStyle = "bg-rose-50 border-rose-300 text-rose-950 font-semibold ring-1 ring-rose-300/40";
                        badgeStyle = "bg-rose-600 text-white border-rose-600";
                      } else if (isThisCorrect) {
                        cardStyle = "bg-emerald-50/40 border-emerald-300 border-dashed text-emerald-900 font-medium";
                        badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-300";
                      }

                      return (
                        <div
                          key={opt}
                          className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 transition-all ${cardStyle}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0 ${badgeStyle}`}>
                              {letter}
                            </span>
                            <span className="leading-relaxed truncate">{opt.substring(3)}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isSelected && (
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                isThisCorrect
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-rose-600 text-white border-rose-600"
                              }`}>
                                {isThisCorrect ? "✓ Candidate (Correct)" : "✗ Candidate Choice"}
                              </span>
                            )}

                            {!isSelected && isThisCorrect && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ★ Correct Key
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })
          )}

        </section>

        {/* ── Section B / Coding (if present) ─────────────────────────────── */}
        {codingQuestions.length > 0 && (
          <section className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">
              Section B: Coding & Open-Ended Challenges ({codingQuestions.length})
            </h3>
            <div className="space-y-4">
              {codingQuestions.map((q) => {
                const solutionCode = candidate.answers?.[q.id];
                const attempted = isQuestionAttempted(q);

                return (
                  <div key={q.id} className="p-4 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-2.5">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-xs font-bold text-zinc-900 leading-relaxed">
                        Task {q.number}: <span className="font-normal text-zinc-700">{q.questionText.split("\n")[0]}</span>
                      </h4>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${
                        attempted 
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                          : "bg-zinc-100 text-zinc-500 border-zinc-200"
                      }`}>
                        {attempted ? "Submitted" : "Not Attempted"}
                      </span>
                    </div>

                    {attempted && solutionCode ? (
                      <pre className="bg-zinc-900 text-zinc-200 font-mono text-xs p-3.5 rounded-lg border border-zinc-800 overflow-x-auto whitespace-pre max-h-72">
                        {solutionCode}
                      </pre>
                    ) : (
                      <div className="p-3 bg-white rounded-lg border border-zinc-200 text-zinc-400 text-xs italic">
                        No solution submitted.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>

    </div>
  );
}
