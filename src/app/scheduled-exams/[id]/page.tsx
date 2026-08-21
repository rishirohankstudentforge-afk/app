"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { encodeExamId } from "@/utils/secureId";
import { isExamRegistrationClosed } from "@/utils/examDates";

interface Exam {
  id: number;
  name: string;
  date: string;
  time: string;
  description: string;
  total_qns: number;
  types_of_qns: string;
  company_name: string;
  custom_fields: Record<string, string>;
  show_login?: boolean;
  registration_closed?: boolean;
  is_started?: boolean;
}

export default function ExamDetailPage() {
  const { id: rawParam } = useParams<{ id: string }>();
  const supabase = createClient();

  const [exam, setExam] = useState<Exam | null>(null);
  const [regCount, setRegCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!exam) return;
    const link = window.location.origin + "/scheduled-exams/" + encodeExamId(exam.id);
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  useEffect(() => {
    if (!rawParam) return;
    const fetchExam = async () => {
      try {
        const [examsRes, countsRes] = await Promise.all([
          supabase.from("exams").select().order("id", { ascending: false }),
          fetch("/api/exam/registrations-count")
            .then((r) => (r.ok ? r.json() : { success: false, counts: {} }))
            .catch(() => ({ success: false, counts: {} })),
        ]);

        if (examsRes.error || !examsRes.data) {
          setNotFound(true);
          return;
        }

        const allExams: Exam[] = examsRes.data;
        let targetExam = allExams.find((e) => encodeExamId(e.id) === rawParam);
        if (!targetExam && /^\d+$/.test(rawParam)) {
          const numId = parseInt(rawParam, 10);
          targetExam = allExams.find((e) => e.id === numId);
        }

        if (!targetExam) {
          setNotFound(true);
        } else {
          setExam(targetExam);
          if (countsRes && countsRes.success && countsRes.counts) {
            setRegCount(countsRes.counts[targetExam.id] ?? 0);
          }
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [rawParam]);

  const name = (exam?.name || "").toLowerCase();
  const coverSrc =
    (exam as any)?.company_logo && (exam as any).company_logo.startsWith("http")
      ? (exam as any).company_logo
      : name.includes("business") || name.includes("bussiness")
      ? "https://ik.imagekit.io/dypkhqxip/bussiness%20analysis.png"
      : name.includes("sales")
      ? "https://ik.imagekit.io/dypkhqxip/Sales%20and%20Marketing.png"
      : name.includes("technical")
      ? "https://ik.imagekit.io/dypkhqxip/technical%20Wing.png"
      : name.includes("marketing")
      ? "https://ik.imagekit.io/dypkhqxip/marketing%20Wing.png"
      : name.includes("analytics")
      ? "https://ik.imagekit.io/dypkhqxip/Data%20Analytics%20Wing.png"
      : name.includes("ui") || name.includes("ux")
      ? "https://ik.imagekit.io/dypkhqxip/UI%20and%20UX%20Wing.png"
      : "/exam-cover.png";

  // Parse syllabus bullet points if available
  const descriptionLines = (exam?.description || "").split("\n");
  const syllabusItems = descriptionLines
    .filter((line) => line.trim().startsWith("•") || line.trim().startsWith("-"))
    .map((line) => line.replace(/^[•\-]\s*/, "").trim());

  return (
    <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900 flex flex-col selection:bg-[#E61E32]/10 selection:text-[#E61E32]">
      {/* Redlix Header */}
      <header className="sticky top-0 z-50 bg-[#E61E32] border-b border-[#d01729] py-3 px-6 md:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="https://ik.imagekit.io/dypkhqxip/logotraining?updatedAt=1783099023149"
              alt="Redlix Logo"
              className="h-7 md:h-7.5 w-auto object-contain shrink-0"
            />
            <div className="flex items-center gap-2 border-l border-white/20 pl-3">
              <span className="font-semibold text-xs text-white font-inter tracking-wide">Exam Specification</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Container - 2 Column Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-t-[#E61E32] border-r-zinc-200 border-b-zinc-200 border-l-zinc-200 animate-spin mb-3" />
            <p className="text-zinc-500 text-xs font-medium">Loading exam specification...</p>
          </div>
        ) : notFound || !exam ? (
          <div className="py-20 text-center bg-white border border-zinc-200/80 rounded-xl p-8 shadow-xs">
            <p className="text-zinc-800 font-semibold text-sm mb-1">Exam record not found</p>
            <p className="text-zinc-400 text-xs mb-4">The requested exam identifier does not exist or has been archived.</p>
            <Link
              href="/scheduled-exams"
              className="inline-flex items-center text-xs font-semibold text-white bg-[#E61E32] hover:bg-[#d01729] px-4 py-2 rounded-md transition-all"
            >
              ← Back to Scheduled Exams
            </Link>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Breadcrumb Navigation & Token */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <Link href="/scheduled-exams" className="hover:text-zinc-900 transition-colors">Scheduled Exams</Link>
                <span>/</span>
                <span className="font-semibold text-zinc-900 truncate max-w-[280px] sm:max-w-none">{exam.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-semibold text-zinc-700 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-zinc-200 shadow-2xs select-none">
                  TOKEN: {encodeExamId(exam.id)}
                </span>
                {isExamRegistrationClosed(exam) ? (
                  <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200 select-none">
                    Closed
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-zinc-900 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-zinc-200 shadow-2xs select-none">
                    Open
                  </span>
                )}
              </div>
            </div>

            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (Details - 7/12 cols) */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Header Title Card */}
                <div className="bg-white border border-zinc-200/90 rounded-md p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#E61E32] bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      {exam.company_name}
                    </span>
                    <span className="text-xs text-zinc-600 font-medium">
                      <strong className="text-zinc-900">{regCount}</strong> Candidates Registered
                    </span>
                  </div>
                  <h1 className="text-lg md:text-xl font-bold text-zinc-900 font-inter leading-snug">
                    {(() => {
                      const parts = exam.name.split(" ");
                      const wingIdx = parts.findIndex((p) => p.toLowerCase() === "wing");
                      if (wingIdx > 0) {
                        const mainWord = parts.slice(0, wingIdx).join(" ");
                        const rest = parts.slice(wingIdx).join(" ");
                        return (
                          <>
                            <span className="text-[#E61E32]">{mainWord}</span> {rest}
                          </>
                        );
                      }
                      return (
                        <>
                          <span className="text-[#E61E32]">{parts[0]}</span> {parts.slice(1).join(" ")}
                        </>
                      );
                    })()}
                  </h1>
                  <p className="text-xs text-zinc-500 font-normal">Official Proctored Assessment for {exam.company_name} Candidates</p>
                </div>

                {/* Description & Syllabus Card */}
                {exam.description && (
                  <div className="bg-white border border-zinc-200/90 rounded-md p-6 shadow-xs space-y-4">
                    <div className="border-b border-zinc-100 pb-2.5">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Exam Synopsis &amp; Syllabus</h2>
                    </div>

                    <p className="text-xs text-zinc-700 leading-relaxed font-normal whitespace-pre-line">
                      {exam.description.split("Syllabus:")[0].trim()}
                    </p>

                    {/* Syllabus Tags */}
                    {syllabusItems.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-zinc-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Covered Modules &amp; Topics</p>
                        <div className="flex flex-wrap gap-1.5">
                          {syllabusItems.map((topic, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Rules & Guidelines Table */}
                {Object.keys(exam.custom_fields || {}).length > 0 && (
                  <div className="bg-white border border-zinc-200/90 rounded-md overflow-hidden shadow-xs">
                    <div className="px-6 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Instructions &amp; Regulations</h2>
                      <span className="text-[10px] font-medium text-zinc-400">{Object.keys(exam.custom_fields).length} Guidelines</span>
                    </div>
                    <div className="divide-y divide-zinc-100 text-xs">
                      {Object.entries(exam.custom_fields).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center px-6 py-3 hover:bg-zinc-50/50 transition-colors">
                          <span className="text-zinc-500 font-normal">{key}</span>
                          <span className="text-zinc-900 font-semibold text-right ml-4">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column (Sidebar with Banner Image & Clean Action Suite - 5/12 cols) */}
              <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
                
                {/* Banner & Action Card */}
                <div className="bg-white border border-zinc-200/90 rounded-md p-4 shadow-xs space-y-3">
                  {/* High Resolution Cover Image */}
                  <div
                    className="w-full aspect-square rounded-md overflow-hidden border border-zinc-200/80 bg-zinc-900 shadow-xs relative group cursor-pointer"
                    onClick={() => window.open(coverSrc, "_blank")}
                    title="Click to view full banner"
                  >
                    <img
                      src={coverSrc}
                      alt={exam.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://ik.imagekit.io/dypkhqxip/technical%20Wing.png";
                      }}
                    />
                  </div>

                  {/* Clean Action Suite Under Banner */}
                  <div className="space-y-2 pt-0.5">
                    {/* Primary Registration Action */}
                    {isExamRegistrationClosed(exam) ? (
                      <div className="w-full py-2.5 px-4 bg-zinc-100 border border-zinc-300 text-zinc-500 font-semibold text-xs rounded-md text-center">
                        Registration Closed
                      </div>
                    ) : (
                      <Link
                        href={`/register?examId=${exam.id}`}
                        className="w-full py-2.5 px-4 bg-[#E61E32] hover:bg-[#c91527] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-md shadow-xs transition-all flex items-center justify-center cursor-pointer text-center"
                      >
                        Register for Exam
                      </Link>
                    )}

                    {/* Enter Exam Portal (if login allowed) */}
                    {exam.show_login && (
                      <Link
                        href={`/exam-login?examId=${exam.id}`}
                        className="w-full py-2 px-4 bg-white border border-[#E61E32] text-[#E61E32] hover:bg-red-50 active:scale-[0.99] font-semibold text-xs rounded-md shadow-2xs transition-all flex items-center justify-center cursor-pointer text-center"
                      >
                        Enter Exam Portal
                      </Link>
                    )}

                    {/* Sub Actions: Edit Details & Copy Link */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/register/edit"
                        className="py-2 px-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 text-xs font-semibold rounded-md transition-all flex items-center justify-center cursor-pointer text-center"
                      >
                        Edit Details
                      </Link>

                      <button
                        onClick={handleCopyLink}
                        className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center"
                      >
                        {copied ? (
                          <span className="text-emerald-400">Copied!</span>
                        ) : (
                          <span>Copy Link</span>
                        )}
                      </button>
                    </div>

                    {/* Clean Notice */}
                    <p className="text-[11px] text-zinc-500 font-normal text-center pt-0.5">
                      {isExamRegistrationClosed(exam)
                        ? "Registration window has concluded for this examination"
                        : "Proctored Assessment • Instant Hall Ticket Issued"}
                    </p>
                  </div>
                </div>

                {/* Key Metrics Stack Card */}
                <div className="bg-white border border-zinc-200/90 rounded-md p-5 shadow-xs space-y-3.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2">
                    Assessment Parameters
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "Schedule Date", value: exam.date },
                      { label: "Start Time", value: exam.time },
                      { label: "Total Questions", value: `${exam.total_qns} Questions` },
                      { label: "Question Format", value: exam.types_of_qns || "Multiple Choice Questions (MCQs)" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-2 px-3 rounded bg-zinc-50 border border-zinc-100">
                        <span className="text-xs text-zinc-500 font-normal">{label}</span>
                        <span className="text-xs font-semibold text-zinc-900 text-right ml-3">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Return Link */}
                <div className="pt-0.5">
                  <Link
                    href="/scheduled-exams"
                    className="text-xs text-zinc-500 hover:text-zinc-900 font-medium inline-flex items-center transition-colors"
                  >
                    ← Return to Scheduled Exams Directory
                  </Link>
                </div>

              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  );
}
