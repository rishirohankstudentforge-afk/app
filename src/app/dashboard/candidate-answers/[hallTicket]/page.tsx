"use client";

import React, { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

interface RegistrationDetails {
  id: string | number;
  candidate_name: string;
  hall_ticket_number: string;
  registration_number?: string;
  email?: string;
  phone?: string;
  college?: string;
  department?: string;
  year_of_study?: string;
  photo_url?: string;
  created_at?: string;
  exam_id: number;
  exam?: {
    id: number;
    name: string;
    date?: string;
    time?: string;
    company_name?: string;
    total_qns?: number;
    types_of_qns?: string;
  } | null;
  answers: Record<string | number, string>;
}

export default function CandidateAnswersPage({
  params,
}: {
  params: Promise<{ hallTicket: string }>;
}) {
  const resolvedParams = use(params);
  const hallTicket = decodeURIComponent(resolvedParams.hallTicket);
  const reportRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [candidate, setCandidate] = useState<RegistrationDetails | null>(null);
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
        // 1. Try fetching detailed candidate answers via resource=answers
        const ansRes = await fetch(`/api/results?resource=answers&hallTicket=${encodeURIComponent(hallTicket)}`);
        if (ansRes.ok) {
          const ansJson = await ansRes.json();
          if (ansJson.success && ansJson.data) {
            const d = ansJson.data;
            setCandidate({
              id: d.id || hallTicket,
              candidate_name: d.candidate_name || "Candidate",
              hall_ticket_number: d.hall_ticket_number || hallTicket,
              registration_number: d.registration_number || "SF-2026",
              email: d.email || "",
              phone: d.phone || "",
              college: d.college || "",
              department: d.department || "",
              year_of_study: d.year_of_study || "",
              photo_url: d.photo_url || "",
              created_at: d.created_at || "",
              exam_id: Number(d.exam_id || 6),
              exam: d.exam || null,
              answers: d.answers || {},
            });

            if (d.exam?.name) {
              setExamName(d.exam.name);
            }
            setLoading(false);
            return;
          }
        }

        // 2. Fallback to /api/results list
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
                department: found.department || "",
                year_of_study: found.yearOfStudy || found.year_of_study || "",
                photo_url: found.photoUrl || found.photo_url || "",
                exam_id: Number(found.examId || found.exam_id || 6),
                answers: found.answers || {},
                created_at: found.createdAt || found.created_at,
              });

              if (found.examName) {
                setExamName(found.examName);
              }
              setLoading(false);
              return;
            }
          }
        }

        // 3. Fallback to save-answers API
        const saRes = await fetch(`/api/exam/save-answers?hallTicketNumber=${encodeURIComponent(hallTicket)}`);
        if (saRes.ok) {
          const saJson = await saRes.json();
          if (saJson.success && saJson.answers) {
            setCandidate({
              id: hallTicket,
              candidate_name: "Candidate " + hallTicket,
              hall_ticket_number: hallTicket,
              registration_number: "SF-2026",
              email: "",
              phone: "",
              college: "",
              department: "",
              year_of_study: "",
              exam_id: 6,
              answers: saJson.answers,
            });
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

  // ── Determine Question Bank & Answer Key ──────────────────────────────────
  const examId = candidate?.exam_id ?? 6;
  const examLower = (candidate?.exam?.name || examName).toLowerCase();

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
    const ans = candidate?.answers?.[q.id];
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
    const rawAns = candidate?.answers?.[q.id];
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
    const rawAns = candidate?.answers?.[q.id];
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

  // ── Export High-Quality PDF Report ─────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!reportRef.current || !candidate) return;
    setDownloadingPdf(true);

    try {
      // Create clean canvas of the report
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `Assessment_Report_${candidate.hall_ticket_number}_${candidate.candidate_name.replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF generation failed, falling back to window.print():", error);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-7 h-7 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-zinc-700">Loading candidate evaluation report...</p>
        <p className="text-[11px] text-zinc-400 mt-1 font-mono">{hallTicket}</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 border border-zinc-200 rounded-xl bg-white">
          <span className="material-symbols-outlined text-4xl text-zinc-400">person_off</span>
          <h2 className="text-base font-semibold text-zinc-900 mt-3">Candidate Record Not Found</h2>
          <p className="text-xs text-zinc-500 mt-1">
            No evaluation record exists for Hall Ticket <span className="font-mono font-semibold text-zinc-800">{hallTicket}</span>.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex px-4 py-2 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const wingTitle = candidate.exam?.name || examName;

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-sans antialiased pb-20 selection:bg-zinc-200">
      
      {/* ── Minimal Navigation Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-sm leading-none">arrow_back</span>
              <span>Dashboard</span>
            </Link>

            <span className="text-zinc-300">/</span>

            <div className="truncate">
              <span className="text-xs font-semibold text-zinc-900 truncate">
                {candidate.candidate_name}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono ml-2 hidden sm:inline">
                ({candidate.hall_ticket_number})
              </span>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-zinc-500 leading-none">
                {copied ? "check" : "content_copy"}
              </span>
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy HT"}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer disabled:opacity-70"
            >
              {downloadingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-sm leading-none">picture_as_pdf</span>
              )}
              <span>{downloadingPdf ? "Generating PDF..." : "Download PDF"}</span>
            </button>
          </div>

        </div>
      </header>

      {/* ── Main Printable Report Container ───────────────────────────────── */}
      <main ref={reportRef} className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* ── Comprehensive Candidate Profile Card ────────────────────────── */}
        <section className="bg-white rounded-xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-semibold flex items-center justify-center text-sm shrink-0">
                {candidate.candidate_name ? candidate.candidate_name.substring(0, 2).toUpperCase() : "ST"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-semibold text-zinc-900">
                    {candidate.candidate_name}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                    Candidate Evaluation
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {wingTitle} • Verified Assessment Report
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                isPassed 
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}>
                {isPassed ? "PASSED (≥40%)" : "FAILED (<40%)"}
              </div>
            </div>
          </div>

          {/* Granular Candidate Meta Fields Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 text-xs">
            <div>
              <span className="text-[11px] text-zinc-400 font-medium block">Hall Ticket Number</span>
              <span className="font-mono font-semibold text-zinc-800 mt-0.5 block">{candidate.hall_ticket_number}</span>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 font-medium block">Registration ID</span>
              <span className="font-mono font-semibold text-zinc-800 mt-0.5 block">{candidate.registration_number || "SF-2026"}</span>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 font-medium block">Email Address</span>
              <span className="text-zinc-800 mt-0.5 block truncate">{candidate.email || "Not Provided"}</span>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 font-medium block">Phone Number</span>
              <span className="font-mono text-zinc-800 mt-0.5 block">{candidate.phone || "Not Provided"}</span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[11px] text-zinc-400 font-medium block">College / Institute</span>
              <span className="text-zinc-800 mt-0.5 block truncate">{candidate.college || "Student Forge Technical Hub"}</span>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 font-medium block">Department / Branch</span>
              <span className="text-zinc-800 mt-0.5 block truncate">{candidate.department || "Computer Science / Engineering"}</span>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 font-medium block">Submission Timestamp</span>
              <span className="text-zinc-800 mt-0.5 block">
                {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "August 2026"}
              </span>
            </div>
          </div>

        </section>

        {/* ── Clean Scorecard & Negative Marking ──────────────────────────── */}
        <section className="bg-white rounded-xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Performance Scorecard</h2>
              <p className="text-xs text-zinc-500">Official wing evaluation matrix</p>
            </div>

            {/* Minimal Negative Marking Toggle */}
            <div className="flex items-center gap-2.5 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={enableNegativeMarking}
                  onChange={(e) => setEnableNegativeMarking(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-zinc-900 border-zinc-300 cursor-pointer accent-zinc-900"
                />
                <span>Negative Marking</span>
              </label>

              {enableNegativeMarking && (
                <select
                  value={negativeMarkValue}
                  onChange={(e) => setNegativeMarkValue(Number(e.target.value))}
                  className="bg-white border border-zinc-200 rounded px-2 py-0.5 text-xs text-zinc-800 outline-none cursor-pointer"
                >
                  <option value={0.5}>-0.50 (1/4th)</option>
                  <option value={0.66}>-0.66 (1/3rd)</option>
                  <option value={1.0}>-1.00 (1/2)</option>
                  <option value={0.25}>-0.25 (1/8th)</option>
                </select>
              )}
            </div>
          </div>

          {/* Minimal Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* Net Score */}
            <div className="p-3.5 rounded-lg bg-zinc-50/70 border border-zinc-200/70">
              <span className="text-[11px] font-medium text-zinc-500 block">
                {enableNegativeMarking ? "Net Score" : "Gross Score"}
              </span>
              <p className="text-xl font-bold text-zinc-900 mt-1 leading-none">
                {netMarks.toFixed(1)} <span className="text-xs font-normal text-zinc-400">/ {totalMaxMarks}</span>
              </p>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                {netPercentage}% Final
              </span>
            </div>

            {/* Correct */}
            <div className="p-3.5 rounded-lg bg-zinc-50/70 border border-zinc-200/70">
              <span className="text-[11px] font-medium text-zinc-500 block">
                Correct Answers
              </span>
              <p className="text-xl font-bold text-zinc-900 mt-1 leading-none">
                {totalCorrect} <span className="text-xs font-normal text-zinc-400">/ {mcqQuestions.length}</span>
              </p>
              <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
                +{grossMarks.toFixed(1)} Marks
              </span>
            </div>

            {/* Incorrect */}
            <div className="p-3.5 rounded-lg bg-zinc-50/70 border border-zinc-200/70">
              <span className="text-[11px] font-medium text-zinc-500 block">
                Incorrect Answers
              </span>
              <p className="text-xl font-bold text-zinc-900 mt-1 leading-none">
                {totalIncorrect} <span className="text-xs font-normal text-zinc-400">/ {mcqQuestions.length}</span>
              </p>
              <span className="text-[11px] text-rose-700 font-medium mt-1 block">
                {enableNegativeMarking ? `-${totalPenalty.toFixed(1)} Penalty` : "0.0 Penalty"}
              </span>
            </div>

            {/* Skipped */}
            <div className="p-3.5 rounded-lg bg-zinc-50/70 border border-zinc-200/70">
              <span className="text-[11px] font-medium text-zinc-500 block">
                Skipped
              </span>
              <p className="text-xl font-bold text-zinc-700 mt-1 leading-none">
                {totalSkipped} <span className="text-xs font-normal text-zinc-400">/ {mcqQuestions.length}</span>
              </p>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                0.0 Marks
              </span>
            </div>

            {/* Accuracy */}
            <div className="p-3.5 rounded-lg bg-zinc-50/70 border border-zinc-200/70">
              <span className="text-[11px] font-medium text-zinc-500 block">
                Accuracy
              </span>
              <p className="text-xl font-bold text-zinc-900 mt-1 leading-none">
                {accuracy}%
              </p>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                {totalCorrect} of {totalAttempted} Attempted
              </span>
            </div>

            {/* Result Status */}
            <div className="p-3.5 rounded-lg bg-zinc-50/70 border border-zinc-200/70">
              <span className="text-[11px] font-medium text-zinc-500 block">
                Status
              </span>
              <p className={`text-base font-bold mt-1 leading-tight ${isPassed ? "text-emerald-700" : "text-rose-700"}`}>
                {isPassed ? "PASSED" : "FAILED"}
              </p>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Cut-off: 40%
              </span>
            </div>

          </div>

          {/* Minimal Formula Line */}
          <div className="text-xs text-zinc-600 bg-zinc-50 px-3.5 py-2 rounded-lg border border-zinc-200/70 flex items-center justify-between flex-wrap gap-2">
            <span>
              Evaluation: <strong>({totalCorrect} Correct × 2.0)</strong>
              {enableNegativeMarking ? (
                <> - <strong>({totalIncorrect} Wrong × {negativeMarkValue})</strong> = <strong className="text-zinc-900">{netMarks.toFixed(1)} Net Marks</strong></>
              ) : (
                <> = <strong className="text-zinc-900">{grossMarks.toFixed(1)} Gross Marks</strong></>
              )}
            </span>
            <span className="text-zinc-400 text-[11px]">
              Minimum Qualifying Marks: 40.0 / 100
            </span>
          </div>

        </section>

        {/* ── Search & Filter Tabs ────────────────────────────────────────── */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                filter === "all"
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              All ({mcqQuestions.length})
            </button>

            <button
              onClick={() => setFilter("correct")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                filter === "correct"
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              Correct ({totalCorrect})
            </button>

            <button
              onClick={() => setFilter("incorrect")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                filter === "incorrect"
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              Incorrect ({totalIncorrect})
            </button>

            <button
              onClick={() => setFilter("unattempted")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                filter === "unattempted"
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              Skipped ({totalSkipped})
            </button>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Search question text or options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-60 pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 text-zinc-800"
            />
          </div>

        </section>

        {/* ── Question & Answers Breakdown ────────────────────────────────── */}
        <section className="space-y-3">
          
          {filteredQuestions.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-xl border border-zinc-200/80 shadow-xs">
              <span className="material-symbols-outlined text-3xl text-zinc-400">filter_alt_off</span>
              <p className="text-xs font-semibold text-zinc-800 mt-2">No matching questions found</p>
              <button
                onClick={() => {
                  setFilter("all");
                  setSearchTerm("");
                }}
                className="mt-3 px-3 py-1 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 cursor-pointer border-none"
              >
                Reset Filter
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
                  className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs transition-all space-y-3"
                >
                  
                  {/* Clean Question Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-900">
                        Question {q.number}
                      </span>
                      {q.section && (
                        <span className="text-[11px] text-zinc-400">
                          • Section {q.section}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCorrect && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span>✓ Correct</span>
                          <span className="font-semibold">+2.00</span>
                        </span>
                      )}

                      {isWrong && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
                          <span>✗ Incorrect</span>
                          <span className="font-semibold">
                            {enableNegativeMarking ? `-${negativeMarkValue.toFixed(2)}` : "0.00"}
                          </span>
                        </span>
                      )}

                      {!attempted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                          <span>Skipped</span>
                          <span>0.00</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-xs sm:text-sm font-normal text-zinc-900 leading-relaxed whitespace-pre-wrap">
                    {q.questionText}
                  </p>

                  {/* 4 Clean Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    {q.options?.map((opt) => {
                      const letter = opt.substring(0, 1).toUpperCase();
                      const isSelected = selectedLetter === letter;
                      const isThisCorrect = correctLetter === letter;

                      let cardStyle = "bg-white border-zinc-200/80 text-zinc-700";
                      let letterBadge = "bg-zinc-100 text-zinc-600 border-zinc-200";

                      if (isSelected && isThisCorrect) {
                        cardStyle = "bg-emerald-50/40 border-emerald-300 text-emerald-950 font-medium";
                        letterBadge = "bg-emerald-600 text-white border-emerald-600";
                      } else if (isSelected && !isThisCorrect) {
                        cardStyle = "bg-rose-50/40 border-rose-300 text-rose-950 font-medium";
                        letterBadge = "bg-rose-600 text-white border-rose-600";
                      } else if (isThisCorrect) {
                        cardStyle = "bg-emerald-50/20 border-dashed border-emerald-300 text-emerald-900";
                        letterBadge = "bg-emerald-100 text-emerald-800 border-emerald-200";
                      }

                      return (
                        <div
                          key={opt}
                          className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 transition-colors ${cardStyle}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold border shrink-0 ${letterBadge}`}>
                              {letter}
                            </span>
                            <span className="truncate">{opt.substring(3)}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isSelected && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                isThisCorrect
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-rose-100 text-rose-800 border-rose-200"
                              }`}>
                                {isThisCorrect ? "Your Choice (Correct)" : "Your Choice (Incorrect)"}
                              </span>
                            )}

                            {!isSelected && isThisCorrect && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Correct Answer
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

        {/* ── Section B: Coding Responses (if present) ────────────────────── */}
        {codingQuestions.length > 0 && (
          <section className="bg-white rounded-xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
              Section B: Technical Responses ({codingQuestions.length})
            </h3>
            <div className="space-y-3">
              {codingQuestions.map((q) => {
                const solutionCode = candidate.answers?.[q.id];
                const attempted = isQuestionAttempted(q);

                return (
                  <div key={q.id} className="p-4 rounded-lg border border-zinc-200/80 bg-zinc-50/50 space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-xs font-semibold text-zinc-900 leading-relaxed">
                        Task {q.number}: <span className="font-normal text-zinc-700">{q.questionText.split("\n")[0]}</span>
                      </h4>
                      <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded border ${
                        attempted 
                          ? "bg-zinc-100 text-zinc-800 border-zinc-300" 
                          : "bg-zinc-50 text-zinc-400 border-zinc-200"
                      }`}>
                        {attempted ? "Submitted" : "Skipped"}
                      </span>
                    </div>

                    {attempted && solutionCode ? (
                      <pre className="bg-zinc-900 text-zinc-100 font-mono text-xs p-3.5 rounded-lg border border-zinc-800 overflow-x-auto whitespace-pre max-h-72">
                        {solutionCode}
                      </pre>
                    ) : (
                      <div className="p-3 bg-white rounded-lg border border-zinc-200/70 text-zinc-400 text-xs italic">
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
