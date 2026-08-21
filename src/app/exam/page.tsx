"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface ExamData {
  id: number;
  name: string;
  company_name: string;
  company_logo?: string;
  date: string;
  time: string;
  description: string;
  total_qns: number;
  types_of_qns: string;
}

interface ExamSession {
  candidateName: string;
  hallTicketNumber: string;
  registrationNumber: string;
  photoUrl: string;
  exam: ExamData;
}


function parseExamDateTime(date: string, time: string): Date | null {
  try {
    const rawStart = date.split("·")[0].split(/\s+(?:to|-)\s+/i)[0].trim().split("T")[0];
    const ddmmyyyy = rawStart.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
    const dateStr = ddmmyyyy
      ? `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`
      : rawStart;
    const combined = `${dateStr}T${to24h(time)}:00`;
    const d = new Date(combined);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

function to24h(t: string): string {
  const match = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return t;
  let h = parseInt(match[1]);
  const m = match[2];
  const period = match[3]?.toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "00")}:${m}`;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return { h: "00", m: "00", s: "00", total: 0 };
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
    total,
  };
}

const POLL_INTERVAL = 5; // seconds

export default function ExamPage() {
  const router = useRouter();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);

  const [countdown, setCountdown] = useState({ h: "00", m: "00", s: "00", total: -1 });
  const examTarget = useRef<Date | null>(null);

  const [isStarted, setIsStarted] = useState(false);
  const [nextCheck, setNextCheck] = useState(POLL_INTERVAL);
  const [isChecking, setIsChecking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load session from storage and verify with server
  useEffect(() => {
    const raw = sessionStorage.getItem("exam_session");
    if (!raw) { router.replace("/exam-login"); return; }
    
    let isMounted = true;
    
    const verifySession = async () => {
      try {
        const parsed: ExamSession = JSON.parse(raw);
        if (!parsed.hallTicketNumber) throw new Error("Invalid session");

        // Verify with the server to check if candidate is blocked
        const res = await fetch("/api/exam/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hallTicketNumber: parsed.hallTicketNumber,
            candidateName: parsed.candidateName,
            examId: parsed.exam?.id,
          }),
        });
        
        const data = await res.json();
        
        if (!isMounted) return;
        
        if (!data.success && data.error === "blocked") {
          router.replace("/exam-session");
          return;
        }

        setSession(parsed);
        examTarget.current = parseExamDateTime(parsed.exam.date, parsed.exam.time);
      } catch {
        if (isMounted) router.replace("/exam-login");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    verifySession();
    
    return () => { isMounted = false; };
  }, [router]);

  // Countdown to exam scheduled time
  useEffect(() => {
    if (!session) return;
    const tick = () => {
      if (!examTarget.current) return;
      const diff = examTarget.current.getTime() - Date.now();
      setCountdown(formatCountdown(diff));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session]);

  // Poll /api/exam/status every 5 seconds
  useEffect(() => {
    if (!session) return;

    const checkStatus = async () => {
      setIsChecking(true);
      try {
        const res = await fetch(`/api/exam/status?examId=${session.exam.id}`);
        const data = await res.json();
        if (data.success) {
          setIsStarted(data.isStarted ?? false);
        }
      } catch {
        // Network error — silently retry next cycle
      } finally {
        setIsChecking(false);
        setNextCheck(POLL_INTERVAL);
      }
    };

    // Run immediately on mount
    checkStatus();

    // Poll every 5 seconds
    pollRef.current = setInterval(checkStatus, POLL_INTERVAL * 1000);

    // Tick down the "next check in Xs" counter every second
    tickRef.current = setInterval(() => {
      setNextCheck((prev) => (prev <= 1 ? POLL_INTERVAL : prev - 1));
    }, 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [session]);

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-sans">
      <div className="w-10 h-10 rounded-full border-2 border-t-orange-500 border-r-zinc-200 border-b-zinc-200 border-l-zinc-200 animate-spin" />
    </div>
  );
  if (!session) return null;

  const { exam, candidateName, hallTicketNumber, registrationNumber, photoUrl } = session;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col">

      {/* Top Header */}
      <header className="bg-[#E61E32] border-b border-[#d01729] shadow-xs shrink-0">
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo & Exam Title */}
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src="https://ik.imagekit.io/dypkhqxip/logotraining?updatedAt=1783099023149"
              alt="Redlix Secure"
              className="h-8 w-auto object-contain shrink-0"
            />
            <div className="min-w-0 border-l border-white/20 pl-3">
              <p className="text-white font-semibold text-base font-inter leading-tight truncate">{exam.name}</p>
              <p className="text-white/80 text-xs font-medium truncate mt-0.5">{exam.company_name}</p>
            </div>
          </div>

          {/* Real-time Status Badge */}
          <div className="shrink-0 text-right">
            {isStarted ? (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs border border-white/30 px-3 py-1 rounded-full text-white text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Exam Open</span>
              </div>
            ) : !isStarted && countdown.total > 0 ? (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs border border-white/30 px-3 py-1 rounded-full text-white text-xs font-semibold shadow-xs">
                <span className="text-white/80 text-[11px] font-normal">Starts in</span>
                <span className="tabular-nums font-mono font-bold tracking-tight">
                  {countdown.h}:{countdown.m}:{countdown.s}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs border border-white/30 px-3 py-1 rounded-full text-white text-xs font-semibold shadow-xs">
                <span className={`w-2 h-2 rounded-full ${isChecking ? "bg-amber-300 animate-ping" : "bg-amber-300 animate-pulse"}`} />
                <span>Waiting for Admin</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 md:py-10 flex flex-col gap-5">

        {/* Candidate Profile Card */}
        <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xs p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-6">
          {photoUrl ? (
            <img src={photoUrl} alt={candidateName} className="w-18 h-18 aspect-square object-cover rounded-xl border border-zinc-200/90 shrink-0 shadow-xs" />
          ) : (
            <div className="w-18 h-18 aspect-square rounded-xl bg-zinc-50 border border-zinc-200/90 flex items-center justify-center shrink-0 shadow-xs p-2.5">
              <img src="https://ik.imagekit.io/dypkhqxip/redlix%20new?updatedAt=1781042212493" alt="Candidate Logo" className="w-11 h-11 object-contain" />
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4 flex-1">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Candidate Name</p>
              <p className="text-sm font-semibold text-zinc-900 font-inter mt-1">{candidateName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hall Ticket No.</p>
              <p className="text-sm font-mono font-semibold text-zinc-900 mt-1">{hallTicketNumber}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Registration No.</p>
              <p className="text-sm font-mono font-semibold text-zinc-900 mt-1">{registrationNumber}</p>
            </div>
          </div>
        </div>

        {/* Exam Action Banner */}
        {isStarted ? (
          <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xs py-3.5 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div>
                <p className="text-xs font-semibold text-zinc-900 font-inter">Exam is now open</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">The administrator has enabled access. Click below to enter the verification lobby.</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/exam-ready")}
              className="px-5 py-2 bg-[#E61E32] hover:bg-[#d01729] text-white font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer shrink-0 border-none flex items-center justify-center gap-1.5"
            >
              <span>Start Exam</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xs py-6 px-8 text-center space-y-3 flex flex-col items-center">
            <div className="flex justify-center -my-3">
              <iframe
                src="https://lottie.host/embed/857b77fd-0d14-403a-bdce-4cd63b7b1a56/ZOSbtwaL5v.lottie"
                style={{ width: "220px", height: "220px", border: "none", overflow: "hidden" }}
                title="Waiting for Administrator Access Animation"
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-900 font-inter">Waiting for Administrator Access</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                Your hall ticket is verified. Please keep this window open; exam access will be automatically unlocked when the administrator enables the test.
              </p>
            </div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-zinc-500 bg-zinc-50 px-3 py-1 rounded-full border border-zinc-200/80">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{isChecking ? "Checking server status..." : `Checking status automatically in ${nextCheck}s`}</span>
              </span>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/90 bg-zinc-100 py-3.5 px-6 shrink-0 text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="font-medium text-xs">Powered by <span className="font-semibold text-zinc-800">Redlix Secure</span></p>
          <p className="font-mono text-xs text-zinc-500">{hallTicketNumber}</p>
        </div>
      </footer>
    </div>
  );
}
