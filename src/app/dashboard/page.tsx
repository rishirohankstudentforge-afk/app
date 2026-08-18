"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { createClient } from "@/utils/supabase/client";
import { QUESTIONS } from "@/app/exam-session/questions";
import { TECHNICAL_QUESTIONS } from "@/app/exam-session/technicalQuestions";
import { TECHNICAL_ANSWER_KEY, gradeTechnicalFull } from "@/app/exam-session/technicalAnswerKey";
import { UIUX_QUESTIONS } from "@/app/exam-session/uiuxQuestions";
import { UIUX_ANSWER_KEY, gradeUIUXFull } from "@/app/exam-session/uiuxAnswerKey";
import { MARKETING_QUESTIONS } from "@/app/exam-session/marketingQuestions";
import { MARKETING_ANSWER_KEY, gradeMarketingFull } from "@/app/exam-session/marketingAnswerKey";
import { ANALYTICS_QUESTIONS } from "@/app/exam-session/analyticsQuestions";
import { ANALYTICS_ANSWER_KEY, gradeAnalyticsFull } from "@/app/exam-session/analyticsAnswerKey";
import { TRAINING01_QUESTIONS } from "@/app/exam-session/training01Questions";
import { gradeTraining01Full } from "@/app/exam-session/training01AnswerKey";
import { PHASE02_QUESTIONS } from "@/app/exam-session/phase02Questions";
import { gradePhase02Full } from "@/app/exam-session/phase02AnswerKey";
import { BUSINESS_ANALYSIS_QUESTIONS } from "@/app/exam-session/businessAnalysisQuestions";
import { BUSINESS_ANALYSIS_ANSWER_KEY, gradeBusinessAnalysisFull } from "@/app/exam-session/businessAnalysisAnswerKey";
import { SALES_MARKETING_QUESTIONS } from "@/app/exam-session/salesMarketingQuestions";
import { SALES_MARKETING_ANSWER_KEY, gradeSalesMarketingFull } from "@/app/exam-session/salesMarketingAnswerKey";

interface Session {
  id: string;
  student: string;
  email: string;
  exam: string;
  flagsCount: number;
  integrityScore: number;
  lastFlagType: string;
  severity: "Critical" | "Warning" | "Normal";
  timestamp: string;
  avatar: string;
  liveFeed?: string;
}

interface Exam {
  id: number;
  name: string;
  date: string;
  time: string;
  description: string;
  total_qns: number;
  types_of_qns: string;
  company_name: string;
  company_logo?: string;
  custom_fields: Record<string, string>;
  is_started?: boolean;
  show_login?: boolean;
  submit_code?: string | null;
}

interface Registration {
  id: number;
  exam_id: number;
  candidate_name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year_of_study: string;
  photo_url: string;
  created_at: string;
  registration_number?: string;
  hall_ticket_number?: string;
  answers?: Record<string | number, string>;
  blocked?: boolean;
}

interface SecurityLog {
  id: number;
  session_id: string;
  visitor_id: string;
  event_type: string;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

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

export default function Dashboard() {
  const router = useRouter();

  const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_SUPABASE_TOKEN ?? "redlix-secure-admin-token-2026";

  const adminFetch = async (method: "GET" | "POST", params?: Record<string, string>, body?: object) => {
    const url = method === "GET"
      ? `/api/admin?${new URLSearchParams(params ?? {}).toString()}`
      : "/api/admin";
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": ADMIN_TOKEN,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return res.json();
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineStudents, setOnlineStudents] = useState<Set<string>>(new Set());
  const [selectedSeverity, setSelectedSeverity] = useState<string>("All");
  const [activeTab, setActiveTab] = useState("overview");

  
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStreamSession, setActiveStreamSession] = useState<Session | null>(null);

  
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [totalQns, setTotalQns] = useState("");
  const [typesOfQns, setTypesOfQns] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [examDuration, setExamDuration] = useState("");
  const [typesOfQnsList, setTypesOfQnsList] = useState<string[]>([""]);
  const [descriptionsList, setDescriptionsList] = useState<string[]>([""]);
  
  
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [clockTime, setClockTime] = useState("2026-06-05 20:15 IST");

  
  const [exams, setExams] = useState<Exam[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedExamForCandidates, setSelectedExamForCandidates] = useState<Exam | null>(null);
  const [selectedCandidateForAnswers, setSelectedCandidateForAnswers] = useState<Registration | null>(null);
  const [loadingExamsTab, setLoadingExamsTab] = useState(false);

  const fetchExamsAndRegistrations = async () => {
    setLoadingExamsTab(true);
    try {
      const [examsRes, regsRes] = await Promise.all([
        adminFetch("GET", { resource: "exams" }),
        adminFetch("GET", { resource: "registrations" }),
      ]);
      if (examsRes.success) setExams(examsRes.data);
      if (regsRes.success) setRegistrations(regsRes.data);
    } catch (err) {
      console.error("Error loading exams and registrations:", err);
    } finally {
      setLoadingExamsTab(false);
    }
  };

  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loadingSecurityLogs, setLoadingSecurityLogs] = useState(false);
  const [reEnablingId, setReEnablingId] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    ai_audio_detection: true,
    webcam_face_recognition: true,
    tab_switch_lockout: true,
    fullscreen_enforcement: true,
    auto_incident_logging: true,
    email_proctor_alerts: false,
    public_registration_open: true,
    auto_release_results: false,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettingKey, setSavingSettingKey] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await adminFetch("GET", { resource: "settings" });
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleToggleSetting = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));
    setSavingSettingKey(key as string);

    try {
      const res = await adminFetch("POST", undefined, {
        action: "update_settings",
        settingsData: { [key]: newValue },
      });
      if (!res.success) {
        setSettings((prev) => ({ ...prev, [key]: !newValue }));
      }
    } catch (err) {
      console.error("Failed to update setting:", err);
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
    } finally {
      setSavingSettingKey(null);
    }
  };

  const fetchSecurityLogs = async () => {
    setLoadingSecurityLogs(true);
    try {
      const res = await adminFetch("GET", { resource: "security_logs" });
      if (res.success) {
        setSecurityLogs(res.data);
      }
    } catch (err) {
      console.error("Error loading security logs:", err);
    } finally {
      setLoadingSecurityLogs(false);
    }
  };

  const handleReEnableExam = async (hallTicketNumber: string) => {
    setReEnablingId(hallTicketNumber);
    try {
      const res = await adminFetch("POST", undefined, {
        action: "re_enable_exam",
        hallTicketNumber,
      });
      if (res.success) {
        await Promise.all([fetchSecurityLogs(), fetchExamsAndRegistrations()]);
        alert(`Successfully re-enabled exam for candidate with Hall Ticket: ${hallTicketNumber}`);
      } else {
        alert("Failed to re-enable the exam: " + (res.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Failed to re-enable exam:", err);
      alert("Unexpected error occurred while re-enabling exam.");
    } finally {
      setReEnablingId(null);
    }
  };


  const toggleExamStarted = async (exam: Exam) => {
    const newValue = !exam.is_started;
    // Optimistic update
    setExams((prev) => prev.map((e) => (e.id === exam.id ? { ...e, is_started: newValue } : e)));
    const res = await adminFetch("POST", undefined, { action: "toggle_started", examId: exam.id, value: newValue });
    if (!res.success) {
      // Revert on failure
      setExams((prev) => prev.map((e) => (e.id === exam.id ? { ...e, is_started: !newValue } : e)));
      console.error("Failed to toggle exam started:", res.error);
    }
  };

  const toggleExamShowLogin = async (exam: Exam) => {
    const newValue = !exam.show_login;
    // Optimistic update
    setExams((prev) => prev.map((e) => (e.id === exam.id ? { ...e, show_login: newValue } : e)));
    const res = await adminFetch("POST", undefined, { action: "toggle_show_login", examId: exam.id, value: newValue });
    if (!res.success) {
      // Revert on failure
      setExams((prev) => prev.map((e) => (e.id === exam.id ? { ...e, show_login: !newValue } : e)));
      console.error("Failed to toggle show login:", res.error);
    }
  };

  const [generatingCodeId, setGeneratingCodeId] = useState<number | null>(null);

  const handleGenerateCode = async (exam: Exam) => {
    setGeneratingCodeId(exam.id);
    try {
      const res = await adminFetch("POST", undefined, { action: "generate_submit_code", examId: exam.id });
      if (res.success) {
        setExams((prev) => prev.map((e) => (e.id === exam.id ? { ...e, submit_code: res.code } : e)));
      } else {
        alert("Failed to generate code: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      alert("Unexpected error generating code.");
    } finally {
      setGeneratingCodeId(null);
    }
  };

  const handleClearCode = async (exam: Exam) => {
    if (!confirm("Remove the submit code? Candidates will be able to submit without a code.")) return;
    try {
      const res = await adminFetch("POST", undefined, { action: "clear_submit_code", examId: exam.id });
      if (res.success) {
        setExams((prev) => prev.map((e) => (e.id === exam.id ? { ...e, submit_code: null } : e)));
      } else {
        alert("Failed to clear code: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      alert("Unexpected error clearing code.");
    }
  };


  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await adminFetch("GET", { resource: "exams" });
        if (!res.success && res.error === "Unauthorized") {
          localStorage.removeItem("is_authenticated");
          router.push("/admin");
        } else {
          setIsAuthenticated(true);
          const email = localStorage.getItem("user_email") || "admin@redlixsecure.com";
          setUserEmail(email);
        }
      } catch (err) {
        localStorage.removeItem("is_authenticated");
        router.push("/admin");
      }
    };
    checkAuth();
  }, [router]);

  
  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      const formatted = d.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      try {
        const [datePart, timePart] = formatted.split(", ");
        const [month, day, year] = datePart.split("/");
        setClockTime(`${year}-${month}-${day} ${timePart} IST`);
      } catch (e) {
        setClockTime("2026-06-05 20:15 IST");
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  
  const fetchSessions = async () => {
    try {
      const res = await adminFetch("GET", { resource: "sessions" });
      if (res.success && res.data) {
        const mapped: Session[] = res.data.map((item: any) => ({
          id: item.id,
          student: item.student,
          email: item.email,
          exam: item.exam,
          flagsCount: item.flags_count,
          integrityScore: item.integrity_score,
          lastFlagType: item.last_flag_type,
          severity: item.severity as Session["severity"],
          timestamp: item.timestamp,
          avatar: item.avatar,
          liveFeed: item.live_feed,
        }));
        setSessions(mapped);
      }
    } catch (err) {
      console.error("Error loading proctoring sessions:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!isAuthenticated) return;
    fetchSessions();

    const supabase = createClient();
    const channel = supabase
      .channel("sessions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new;
            const mappedNew: Session = {
              id: newItem.id,
              student: newItem.student,
              email: newItem.email,
              exam: newItem.exam,
              flagsCount: newItem.flags_count,
              integrityScore: newItem.integrity_score,
              lastFlagType: newItem.last_flag_type,
              severity: newItem.severity as Session["severity"],
              timestamp: newItem.timestamp,
              avatar: newItem.avatar,
              liveFeed: newItem.live_feed,
            };
            setSessions((prev) => {
              if (prev.some((s) => s.id === mappedNew.id)) return prev;
              return [...prev, mappedNew];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new;
            const mappedUpdated: Partial<Session> = {
              id: updatedItem.id,
              student: updatedItem.student,
              email: updatedItem.email,
              exam: updatedItem.exam,
              flagsCount: updatedItem.flags_count,
              integrityScore: updatedItem.integrity_score,
              lastFlagType: updatedItem.last_flag_type,
              severity: updatedItem.severity as Session["severity"],
              timestamp: updatedItem.timestamp,
              avatar: updatedItem.avatar,
              liveFeed: updatedItem.live_feed,
            };
            setSessions((prev) =>
              prev.map((s) => (s.id === mappedUpdated.id ? { ...s, ...mappedUpdated } : s))
            );
            setActiveStreamSession((prev) => {
              if (prev && prev.id === updatedItem.id) {
                return { ...prev, ...mappedUpdated };
              }
              return prev;
            });
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setSessions((prev) => prev.filter((s) => s.id !== deletedId));
            setActiveStreamSession((prev) => (prev && prev.id === deletedId ? null : prev));
          }
        }
      )
      .subscribe();

    // Direct real-time live webcam frame broadcast channel (0-latency)
    const streamChannel = supabase
      .channel("live-proctoring-stream")
      .on("broadcast", { event: "live_frame" }, ({ payload }: any) => {
        if (!payload?.sessionId || !payload?.liveFeed) return;
        const sId = payload.sessionId.toString().trim().toLowerCase();
        const feed = payload.liveFeed;
        setSessions((prev) =>
          prev.map((s) => (s.id.toLowerCase() === sId ? { ...s, liveFeed: feed } : s))
        );
        setActiveStreamSession((prev) =>
          prev && prev.id.toLowerCase() === sId ? { ...prev, liveFeed: feed } : prev
        );
      })
      .subscribe();

    const presenceChannel = supabase.channel("exam-presence-global");
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.student_id) {
              onlineIds.add(presence.student_id);
            }
          });
        });
        setOnlineStudents(onlineIds);
      })
      .subscribe();

    // Auto-refresh sessions every 4 seconds to guarantee feeds load reliably
    const refreshInterval = setInterval(() => {
      fetchSessions();
    }, 4000);

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
      supabase.removeChannel(streamChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if ((activeTab === "exams-list" || activeTab === "overview") && isAuthenticated) {
      fetchExamsAndRegistrations();
      setSelectedExamForCandidates(null);
    }
    if (activeTab === "settings" && isAuthenticated) {
      fetchSettings();
      fetchExamsAndRegistrations();
    }
    if (activeTab === "security-logs" && isAuthenticated) {
      fetchSecurityLogs();
      fetchExamsAndRegistrations();
    }
  }, [activeTab, isAuthenticated]);

  const handleLogout = async () => {
    try {
      await adminFetch("POST", undefined, { action: "logout" });
    } catch (err) {
      console.error("Failed to logout on server:", err);
    }
    localStorage.removeItem("is_authenticated");
    localStorage.removeItem("user_email");
    router.push("/admin");
  };

  const handleResolve = async (id: string) => {
    // Optimistic update
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, flagsCount: 0, integrityScore: 100, severity: "Normal", lastFlagType: "None (Resolved)" } : s
      )
    );
    await adminFetch("POST", undefined, { action: "resolve_session", sessionId: id });
    if (activeStreamSession?.id === id) setActiveStreamSession(null);
  };

  const handleDismiss = async (id: string) => {
    // Optimistic update
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await adminFetch("POST", undefined, { action: "dismiss_session", sessionId: id });
    if (activeStreamSession?.id === id) setActiveStreamSession(null);
  };


  
  const addCustomField = () => {
    setCustomFields([...customFields, { key: "", value: "" }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, idx) => idx !== index));
  };

  const updateCustomField = (index: number, field: "key" | "value", value: string) => {
    setCustomFields(
      customFields.map((cf, idx) => (idx === index ? { ...cf, [field]: value } : cf))
    );
  };

  const handlePublishExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTypes = typesOfQnsList.filter(t => t.trim()).join(", ");
    const finalDescription = descriptionsList.filter(d => d.trim()).join("\n\n");

    if (!examName || !examDate || !examTime || !totalQns || !finalTypes || !companyName) {
      setPublishError("Please fill out all required fields.");
      return;
    }

    setIsPublishing(true);
    setPublishError("");
    setPublishSuccess(false);

    try {
      const customFieldsObj: Record<string, string> = {};
      customFields.forEach((cf) => {
        if (cf.key.trim()) customFieldsObj[cf.key.trim()] = cf.value;
      });
      if (examDuration.trim()) customFieldsObj["Duration"] = `${examDuration.trim()} minutes`;

      const res = await adminFetch("POST", undefined, {
        action: "create_exam",
        examData: {
          name: examName,
          date: examDate,
          time: examTime,
          description: finalDescription,
          total_qns: Number(totalQns),
          types_of_qns: finalTypes,
          company_name: companyName,
          company_logo: companyLogo,
          custom_fields: customFieldsObj,
        },
      });

      if (!res.success) {
        setPublishError(res.error || "Failed to publish exam.");
      } else {
        setPublishSuccess(true);
        setExamName(""); setExamDate(""); setExamTime(""); setExamDescription("");
        setTotalQns(""); setTypesOfQns(""); setCompanyName(""); setCompanyLogo("");
        setExamDuration(""); setTypesOfQnsList([""]); setDescriptionsList([""]); setCustomFields([]);
      }
    } catch (err: any) {
      setPublishError(err.message || "An unexpected error occurred.");
    } finally {
      setIsPublishing(false);
    }
  };


  
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.exam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lastFlagType.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (selectedSeverity === "All") return matchesSearch;
    return matchesSearch && s.severity === selectedSeverity;
  });

  const totalFlags = sessions.reduce((sum, s) => sum + s.flagsCount, 0);

  const getPercentage = (keyword: string) => {
    if (totalFlags === 0) return 0;
    const count = sessions
      .filter((s) => s.lastFlagType.toLowerCase().includes(keyword.toLowerCase()))
      .reduce((sum, s) => sum + s.flagsCount, 0);
    return Math.round((count / totalFlags) * 100);
  };

  const tabPct = getPercentage("tab");
  const gazePct = getPercentage("gaze");
  const facePct = getPercentage("face") + getPercentage("absent");
  const audioPct = getPercentage("audio");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center font-sans text-zinc-900">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border-2 border-t-orange-500 border-r-zinc-300 border-b-zinc-300 border-l-zinc-300 animate-spin mb-4" />
          <p className="text-zinc-500 text-xs">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="bg-white border-b border-zinc-200 px-4 md:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <img
            src="https://ik.imagekit.io/dypkhqxip/redlix%20new?updatedAt=1781042212493"
            alt="Redlix Logo"
            className="h-9 w-auto object-contain shrink-0"
          />
          <div className="flex items-center gap-2 border-l border-zinc-200 pl-3">
            <span className="font-semibold text-sm text-zinc-900 tracking-tight font-inter">Admin Console</span>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] text-emerald-700 font-semibold border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Connected
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-zinc-600 font-sans font-normal hidden md:block border-r border-zinc-200 pr-4">
            Clock: <span className="text-zinc-800 font-medium">{clockTime}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-[#E61E32] hover:bg-[#d01729] active:bg-[#b81223] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-sm shrink-0">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Red Sub-Navbar */}
      <div className="bg-[#E61E32] text-white shadow-md px-4 md:px-8 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1">
            {[
              { id: "overview", label: "Overview", icon: "grid_view" },
              { id: "create-exam", label: "Create Exam", icon: "add_task" },
              { id: "exams-list", label: "All Exams", icon: "folder_open" },
              { id: "settings", label: "Settings", icon: "tune" },
              { id: "security-logs", label: "Security Logs", icon: "shield" },
              { id: "profile", label: "Profile", icon: "account_circle" },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap select-none ${
                    isActive ? "text-[#E61E32] font-bold" : "text-white/85 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSubnavPill"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm z-0"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="material-symbols-outlined text-sm shrink-0 relative z-10">{item.icon}</span>
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-100">

        {loading ? (
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-t-orange-500 border-r-zinc-200 border-b-zinc-200 border-l-zinc-200 animate-spin mb-4" />
            <p className="text-zinc-500 text-xs">Loading database records...</p>
          </div>
        ) : activeTab === "overview" ? (
          <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto bg-zinc-50/60">
            
            {/* Top row: 4 Premium Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Total Exams */}
              <div className="bg-white p-5 border border-zinc-200/80 rounded-xl shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Exams</span>
                    <div className="text-2xl md:text-3xl font-semibold text-zinc-900 font-inter mt-1">{exams.length}</div>
                  </div>
                  <div className="p-2.5 bg-[#E61E32]/10 text-[#E61E32] border border-[#E61E32]/20 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">folder_open</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 font-medium">
                  <span className="text-emerald-700 font-semibold">{exams.filter(e => e.is_started).length}</span> exams open & active
                </p>
              </div>

              {/* Card 2: Candidate Registrations */}
              <div className="bg-white p-5 border border-zinc-200/80 rounded-xl shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Registered Students</span>
                    <div className="text-2xl md:text-3xl font-semibold text-zinc-900 font-inter mt-1">{registrations.length}</div>
                  </div>
                  <div className="p-2.5 bg-[#E61E32]/10 text-[#E61E32] border border-[#E61E32]/20 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">groups</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 font-medium">
                  Verified student signups
                </p>
              </div>

              {/* Card 3: Live Session Room Connections */}
              <div className="bg-white p-5 border border-zinc-200/80 rounded-xl shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Students</span>
                    <div className="text-2xl md:text-3xl font-semibold text-zinc-900 font-inter mt-1">{sessions.length}</div>
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse mr-1" />
                    <span className="text-xs font-bold">Live</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 font-medium">
                  Students taking an exam now
                </p>
              </div>

              {/* Card 4: System Average Integrity */}
              <div className="bg-white p-5 border border-zinc-200/80 rounded-xl shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Trust Score</span>
                    <div className="text-2xl md:text-3xl font-semibold text-zinc-900 font-inter mt-1">
                      {sessions.length > 0
                        ? `${Math.round(sessions.reduce((acc, curr) => acc + curr.integrityScore, 0) / sessions.length)}%`
                        : "100%"
                      }
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#E61E32]/10 text-[#E61E32] border border-[#E61E32]/20 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">verified</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 font-medium">
                  <span className="text-[#E61E32] font-semibold">{sessions.filter(s => s.severity === "Critical").length}</span> urgent warnings
                </p>
              </div>

            </div>

            {/* Bottom Row: Quick Live Candidate Feed */}
            <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
              <div className="p-5 md:p-6 border-b border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 font-inter">Live Exam Activity</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Real-time overview of students currently taking exams</p>
                </div>
                {sessions.length > 0 && (
                  <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
                    <span>Live Stream</span>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200/80 bg-zinc-50/80 font-semibold text-zinc-600 uppercase tracking-wider text-[11px]">
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">Exam</th>
                      <th className="px-6 py-3.5 text-center">Alerts</th>
                      <th className="px-6 py-3.5 text-center">Trust Score</th>
                      <th className="px-6 py-3.5">Recent Alert</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 text-xs">
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 font-medium italic">
                          No candidate is currently taking an exam. Real-time proctor stream is idle.
                        </td>
                      </tr>
                    ) : (
                      sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-zinc-50/80 text-zinc-700 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#E61E32]/10 border border-[#E61E32]/20 flex items-center justify-center font-bold text-xs text-[#E61E32]">
                                {session.avatar}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-zinc-900">{session.student}</p>
                                  {onlineStudents.has(session.id) ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200 font-semibold rounded-full shrink-0">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                      Online
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-700 px-2 py-0.5 border border-red-200 font-semibold rounded-full shrink-0">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                      Offline
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-500">{session.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-zinc-800">{session.exam}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full font-semibold text-[11px] ${
                              session.flagsCount > 3 
                                ? "bg-red-50 text-red-700 border border-red-200" 
                                : session.flagsCount > 0 
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                            }`}>
                              {session.flagsCount} flags
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-mono font-semibold text-sm ${
                              session.integrityScore > 85 
                                ? "text-emerald-600" 
                                : session.integrityScore > 60 
                                ? "text-amber-600" 
                                : "text-red-600"
                            }`}>
                              {session.integrityScore}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {session.severity === "Critical" ? (
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                              ) : session.severity === "Warning" ? (
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              )}
                              <span className="text-zinc-800 font-medium">{session.lastFlagType}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setActiveStreamSession(session);
                                }}
                                className="px-3 py-1.5 bg-[#E61E32] hover:bg-[#d01729] text-white font-semibold text-xs rounded-lg cursor-pointer shadow-xs transition-all border-none flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">videocam</span>
                                <span>Watch Feed</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to terminate/remove the session for ${session.student}?`)) {
                                    handleDismiss(session.id);
                                  }
                                }}
                                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs rounded-lg cursor-pointer shadow-xs transition-all border border-zinc-200"
                              >
                                Terminate
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Real-time Webcam Stream Grid */}
            <div className="bg-white border border-zinc-200 shadow-sm overflow-hidden mt-6">
              <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold normal-case text-zinc-800">Simultaneous Live Webcam Feeds</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">Real-time simultaneous view of all active candidate screens/webcams</p>
                </div>
                {sessions.length > 0 && (
                  <span className="text-[10px] font-bold text-orange-600 uppercase bg-orange-50 border border-orange-200 px-2 py-0.5">
                    {sessions.length} Active Stream{sessions.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              
              {sessions.length === 0 ? (
                <div className="p-10 text-center text-zinc-400 font-semibold italic text-xs">
                  No active streams to show.
                </div>
              ) : (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {sessions.map((session) => (
                    <div key={session.id} className="border border-zinc-200 bg-white shadow-sm flex flex-col">
                      <div className="bg-zinc-800 px-3 py-2 text-white flex items-center justify-between">
                        <div className="truncate pr-2">
                          <span className="font-semibold text-xs">{session.student}</span>
                          <span className="text-[9px] text-zinc-400 block font-mono leading-none mt-0.5 truncate">{session.id}</span>
                        </div>
                        {onlineStudents.has(session.id) ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Offline" />
                        )}
                      </div>
                      
                      <div className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-200">
                        {session.liveFeed ? (
                          <img 
                            src={session.liveFeed} 
                            alt={session.student} 
                            className="w-full h-full object-cover scale-x-[-1]" 
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 p-2 text-center bg-zinc-900">
                            <span className="material-symbols-outlined text-lg mb-1 animate-pulse">videocam_off</span>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Waiting for feed...</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 text-[9px] text-zinc-350 font-mono rounded">
                          Integrity: {session.integrityScore}%
                        </div>
                      </div>
                      
                       <div className="p-3 bg-zinc-50 text-[10px] flex justify-between items-center text-zinc-650 font-sans">
                        <span>Anomalies: <span className="font-semibold">{session.flagsCount}</span></span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setActiveStreamSession(session);
                            }}
                            className="text-[9px] font-bold text-orange-600 hover:text-orange-700 bg-transparent border-none cursor-pointer uppercase tracking-wider"
                          >
                            View Detail
                          </button>
                          <span className="text-zinc-350">|</span>
                          <button
                            onClick={() => {
                              if (confirm(`Terminate session for ${session.student}?`)) {
                                handleDismiss(session.id);
                              }
                            }}
                            className="text-[9px] font-bold text-red-600 hover:text-red-700 bg-transparent border-none cursor-pointer uppercase tracking-wider"
                          >
                            Terminate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : activeTab === "settings" ? (
          <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto bg-zinc-50/60">
            {/* Settings Header */}
            <div className="bg-white p-6 border border-zinc-200/80 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 font-inter">System Settings & Controls</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Configure exam security, proctoring rules, and system behavior in real time.</p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Live Database Sync</span>
              </div>
            </div>

            {/* Toggle Switch Groups */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Box 1: Exam Security & Monitoring */}
              <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs p-6 space-y-5">
                <div className="border-b border-zinc-100 pb-3 flex items-center gap-2">
                  <div className="p-2 bg-[#E61E32]/10 text-[#E61E32] rounded-lg">
                    <span className="material-symbols-outlined text-base">shield</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 font-inter">Exam Security & Monitoring</h4>
                    <p className="text-xs text-zinc-500">Manage real-time candidate proctoring filters</p>
                  </div>
                </div>

                <div className="space-y-4">
                  
                  {/* Toggle 1: AI Audio Detection */}
                  <div className="flex items-center justify-between gap-4 p-3.5 bg-zinc-50/70 border border-zinc-200/60 rounded-xl hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">AI Audio & Voice Detection</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Flag speaking voices or loud background noise</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting("ai_audio_detection")}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer relative shrink-0 border-none ${
                        settings.ai_audio_detection ? "bg-[#E61E32]" : "bg-zinc-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                        settings.ai_audio_detection ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 2: Webcam Face Recognition */}
                  <div className="flex items-center justify-between gap-4 p-3.5 bg-zinc-50/70 border border-zinc-200/60 rounded-xl hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">Webcam Face Detection</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Verify face posture and flag multiple persons in frame</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting("webcam_face_recognition")}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer relative shrink-0 border-none ${
                        settings.webcam_face_recognition ? "bg-[#E61E32]" : "bg-zinc-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                        settings.webcam_face_recognition ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 3: Tab Switch Lockout */}
                  <div className="flex items-center justify-between gap-4 p-3.5 bg-zinc-50/70 border border-zinc-200/60 rounded-xl hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">Tab Switch & Focus Lockout</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Block student exam access if browser tab loses focus</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting("tab_switch_lockout")}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer relative shrink-0 border-none ${
                        settings.tab_switch_lockout ? "bg-[#E61E32]" : "bg-zinc-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                        settings.tab_switch_lockout ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 4: Fullscreen Enforcement */}
                  <div className="flex items-center justify-between gap-4 p-3.5 bg-zinc-50/70 border border-zinc-200/60 rounded-xl hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">Fullscreen Requirement</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Enforce fullscreen mode throughout the examination session</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting("fullscreen_enforcement")}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer relative shrink-0 border-none ${
                        settings.fullscreen_enforcement ? "bg-[#E61E32]" : "bg-zinc-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                        settings.fullscreen_enforcement ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                </div>
              </div>

              {/* Box 2: Workflows & Notifications */}
              <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs p-6 space-y-5">
                <div className="border-b border-zinc-100 pb-3 flex items-center gap-2">
                  <div className="p-2 bg-[#E61E32]/10 text-[#E61E32] rounded-lg">
                    <span className="material-symbols-outlined text-base">tune</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 font-inter">Automation & Workflows</h4>
                    <p className="text-xs text-zinc-500">Configure notifications and candidate access rules</p>
                  </div>
                </div>

                <div className="space-y-4">

                  {/* Toggle 5: Auto Incident Logging */}
                  <div className="flex items-center justify-between gap-4 p-3.5 bg-zinc-50/70 border border-zinc-200/60 rounded-xl hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">Automatic Alert Logging</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Record security violations directly into database logs</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting("auto_incident_logging")}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer relative shrink-0 border-none ${
                        settings.auto_incident_logging ? "bg-[#E61E32]" : "bg-zinc-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                        settings.auto_incident_logging ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 6: Email Proctor Alerts */}
                  <div className="flex items-center justify-between gap-4 p-3.5 bg-zinc-50/70 border border-zinc-200/60 rounded-xl hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">Email Proctor Alerts</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Send instant email alerts to admins on critical incidents</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting("email_proctor_alerts")}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer relative shrink-0 border-none ${
                        settings.email_proctor_alerts ? "bg-[#E61E32]" : "bg-zinc-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                        settings.email_proctor_alerts ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 7: Public Registration Open */}
                  <div className="flex items-center justify-between gap-4 p-3.5 bg-zinc-50/70 border border-zinc-200/60 rounded-xl hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">Public Student Signups</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Allow candidates to register for upcoming scheduled exams</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting("public_registration_open")}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer relative shrink-0 border-none ${
                        settings.public_registration_open ? "bg-[#E61E32]" : "bg-zinc-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                        settings.public_registration_open ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 8: Auto Release Results */}
                  <div className="flex items-center justify-between gap-4 p-3.5 bg-zinc-50/70 border border-zinc-200/60 rounded-xl hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">Instant Score Release</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Automatically show test results upon exam completion</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting("auto_release_results")}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer relative shrink-0 border-none ${
                        settings.auto_release_results ? "bg-[#E61E32]" : "bg-zinc-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                        settings.auto_release_results ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                </div>
              </div>

            </div>

            {/* Diagnostic & Database Status Cards */}
            <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs p-6 space-y-4">
              <h4 className="text-sm font-semibold text-zinc-900 font-inter">System Health & Diagnostics</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-zinc-50/80 border border-zinc-200/70 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-600">Database Engine</span>
                    <span className="text-xs font-bold text-emerald-600">Connected</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">PostgreSQL (Supabase Pooler)</p>
                </div>

                <div className="p-4 bg-zinc-50/80 border border-zinc-200/70 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-600">Security Schema</span>
                    <span className="text-xs font-bold text-emerald-600">In Sync</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">SystemSettings table verified</p>
                </div>

                <div className="p-4 bg-zinc-50/80 border border-zinc-200/70 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-600">Media Pipe</span>
                    <span className="text-xs font-bold text-emerald-600">Active</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">WebRTC Live Stream Pipe</p>
                </div>

                <div className="p-4 bg-zinc-50/80 border border-zinc-200/70 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-600">Admin Session</span>
                    <span className="text-xs font-bold text-emerald-600">Verified</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">Redlix Token Active</p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "create-exam" ? (
          
          <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto bg-zinc-50/60">
            <div className="max-w-3xl bg-white rounded-xl border border-zinc-200/80 shadow-xs p-6 md:p-8 space-y-6 ml-0">
              
              <div className="border-b border-zinc-200/80 pb-4">
                <h2 className="text-xl font-semibold text-zinc-900 font-inter">Create New Exam</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Fill in the assessment details below to publish a new exam for students.</p>
              </div>

              {publishSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>Exam published successfully! It is now live in the exams list.</span>
                </div>
              )}

              {publishError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{publishError}</span>
                </div>
              )}

              <form onSubmit={handlePublishExam} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Exam Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Computer Science Midterm"
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      className="text-xs w-full py-2.5 px-3.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#E61E32]/20 focus:border-[#E61E32] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Conducting Organization *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Redlix Academy"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="text-xs w-full py-2.5 px-3.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#E61E32]/20 focus:border-[#E61E32] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Organization Logo</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-zinc-50/80 border border-zinc-200/80 rounded-xl">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-zinc-200 shrink-0 relative shadow-xs">
                      {companyLogo ? (
                        <img src={companyLogo} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="material-symbols-outlined text-zinc-400 text-lg">image</span>
                      )}
                    </div>
                    <div className="space-y-2 flex-1 w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCompanyLogo(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="text-xs file:mr-3 file:py-1.5 file:px-3 file:border-0 file:rounded-lg file:text-xs file:font-semibold file:bg-white file:text-zinc-700 hover:file:bg-zinc-100 cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="Or paste direct image URL"
                        value={companyLogo}
                        onChange={(e) => setCompanyLogo(e.target.value)}
                        className="text-xs w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:border-[#E61E32]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Date *</label>
                    <input
                      type="date"
                      required
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="text-xs w-full py-2.5 px-3.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#E61E32]/20 focus:border-[#E61E32] transition-all font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Time *</label>
                    <input
                      type="time"
                      required
                      value={examTime}
                      onChange={(e) => setExamTime(e.target.value)}
                      className="text-xs w-full py-2.5 px-3.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#E61E32]/20 focus:border-[#E61E32] transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Total Questions *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g., 50"
                      value={totalQns}
                      onChange={(e) => setTotalQns(e.target.value)}
                      className="text-xs w-full py-2.5 px-3.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#E61E32]/20 focus:border-[#E61E32] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Duration (Minutes)</label>
                    <input
                      type="number"
                      placeholder="e.g., 120"
                      value={examDuration}
                      onChange={(e) => setExamDuration(e.target.value)}
                      className="text-xs w-full py-2.5 px-3.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#E61E32]/20 focus:border-[#E61E32] transition-all"
                    />
                  </div>
                </div>

                {/* Question Types */}
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-zinc-700">Question Types *</label>
                    <button
                      type="button"
                      onClick={() => setTypesOfQnsList([...typesOfQnsList, ""])}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all border-none flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Add Type</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {typesOfQnsList.map((tq, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          required
                          placeholder="e.g., Multiple Choice, Coding, Essay"
                          value={tq}
                          onChange={(e) => {
                            const updated = [...typesOfQnsList];
                            updated[idx] = e.target.value;
                            setTypesOfQnsList(updated);
                          }}
                          className="text-xs flex-1 py-2 px-3 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:border-[#E61E32]"
                        />
                        {typesOfQnsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setTypesOfQnsList(typesOfQnsList.filter((_, i) => i !== idx))}
                            className="px-2 py-1.5 text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description Sections */}
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-zinc-700">Exam Instructions & Rules *</label>
                    <button
                      type="button"
                      onClick={() => setDescriptionsList([...descriptionsList, ""])}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all border-none flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Add Rule Section</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {descriptionsList.map((desc, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <textarea
                          rows={2}
                          required
                          placeholder="Provide a section of exam guidelines or rules..."
                          value={desc}
                          onChange={(e) => {
                            const updated = [...descriptionsList];
                            updated[idx] = e.target.value;
                            setDescriptionsList(updated);
                          }}
                          className="text-xs flex-1 py-2 px-3 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:border-[#E61E32]"
                        />
                        {descriptionsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setDescriptionsList(descriptionsList.filter((_, i) => i !== idx))}
                            className="px-2 py-1.5 text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer pt-2"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Fields */}
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-zinc-700">Custom Fields</span>
                    <button
                      type="button"
                      onClick={addCustomField}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all border-none flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Add Custom Field</span>
                    </button>
                  </div>

                  {customFields.length > 0 && (
                    <div className="space-y-2">
                      {customFields.map((cf, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Field Label (e.g. Pass Mark)"
                            required
                            value={cf.key}
                            onChange={(e) => updateCustomField(idx, "key", e.target.value)}
                            className="text-xs w-1/3 py-2 px-3 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:border-[#E61E32]"
                          />
                          <input
                            type="text"
                            placeholder="Field Value (e.g. 60%)"
                            required
                            value={cf.value}
                            onChange={(e) => updateCustomField(idx, "value", e.target.value)}
                            className="text-xs w-1/2 py-2 px-3 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:border-[#E61E32]"
                          />
                          <button
                            type="button"
                            onClick={() => removeCustomField(idx)}
                            className="px-2 py-1.5 text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-6 border-t border-zinc-200/80">
                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="px-6 py-2.5 bg-[#E61E32] hover:bg-[#d01729] active:bg-[#b81223] text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:bg-zinc-300 disabled:cursor-not-allowed border-none flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">publish</span>
                    <span>{isPublishing ? "Publishing Exam..." : "Publish Exam"}</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        ) : activeTab === "exams-list" ? (
          <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto bg-zinc-50/60">
            {loadingExamsTab ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-t-[#E61E32] border-r-zinc-200 border-b-zinc-200 border-l-zinc-200 animate-spin mb-4" />
                <p className="text-zinc-500 text-xs font-semibold">Loading exams directory...</p>
              </div>
            ) : selectedExamForCandidates ? (
              
              <div className="space-y-6">
                <div className="flex items-center gap-3 bg-white p-5 border border-zinc-200/80 rounded-xl shadow-xs">
                  <button
                    onClick={() => setSelectedExamForCandidates(null)}
                    className="flex items-center justify-center p-2 rounded-xl border border-zinc-200/80 bg-white hover:bg-zinc-100 text-zinc-700 cursor-pointer shadow-xs transition-all"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                  </button>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900 font-inter">{selectedExamForCandidates.name}</h2>
                    <p className="text-xs text-zinc-500">Registered Students for <span className="font-semibold text-zinc-800">{selectedExamForCandidates.company_name}</span> Evaluation</p>
                  </div>
                </div>

                {registrations.filter((r) => r.exam_id === selectedExamForCandidates.id).length === 0 ? (
                  <div className="py-16 text-center bg-white border border-zinc-200/80 rounded-xl shadow-xs p-8">
                    <p className="text-zinc-500 text-sm font-medium">No students registered for this exam yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {registrations
                      .filter((r) => r.exam_id === selectedExamForCandidates.id)
                      .map((candidate) => (
                        <div key={candidate.id} className="bg-white border border-zinc-200/80 rounded-xl shadow-xs p-5 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-all">
                          <div className="w-20 h-20 bg-zinc-100 rounded-xl border border-zinc-200/80 overflow-hidden shrink-0">
                            {candidate.photo_url ? (
                              <img src={candidate.photo_url} alt={candidate.candidate_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                                <span className="material-symbols-outlined text-2xl text-zinc-400">person</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2.5 flex-1 min-w-0">
                            <div>
                              <h4 className="text-sm font-semibold text-zinc-900 truncate leading-snug font-inter">{candidate.candidate_name}</h4>
                              <p className="text-xs text-zinc-500 font-medium mt-0.5">{candidate.year_of_study} • {candidate.department}</p>
                            </div>
                            
                            <div className="text-xs text-zinc-600 space-y-1 pt-2 border-t border-zinc-100 font-normal">
                              {candidate.registration_number && (
                                <p className="font-mono"><span className="text-zinc-400 font-sans">Reg No:</span> {candidate.registration_number}</p>
                              )}
                              {candidate.hall_ticket_number && (
                                <p className="font-mono"><span className="text-zinc-400 font-sans">Hall Ticket:</span> {candidate.hall_ticket_number}</p>
                              )}
                              <p className="truncate"><span className="text-zinc-400">Email:</span> {candidate.email}</p>
                              <p className="truncate"><span className="text-zinc-400">Phone:</span> {candidate.phone}</p>
                              <p className="truncate"><span className="text-zinc-400">College:</span> {candidate.college}</p>
                            </div>
                            <div className="pt-2.5 border-t border-zinc-100 flex justify-between items-center">
                              <span className="text-xs font-semibold text-zinc-500 font-mono">
                                {Object.keys(candidate.answers ?? {}).length} Saved Answers
                              </span>
                              <button
                                onClick={() => setSelectedCandidateForAnswers(candidate)}
                                className="px-3.5 py-1.5 bg-[#E61E32] hover:bg-[#d01729] text-white font-semibold text-xs rounded-lg cursor-pointer border-none transition-all flex items-center gap-1 shadow-xs"
                              >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                                <span>Show Answers</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              
              <div className="space-y-6">
                <div className="bg-white p-6 border border-zinc-200/80 rounded-xl shadow-xs">
                  <h3 className="text-base font-semibold text-zinc-900 font-inter">All Exams Directory</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Manage exam instances, toggle student access, and view registered student profiles</p>
                </div>

                {exams.length === 0 ? (
                  <div className="py-16 text-center bg-white border border-zinc-200/80 rounded-xl shadow-xs p-8">
                    <p className="text-zinc-500 text-sm font-medium">No published exams found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {exams.map((exam) => {
                      const regsCount = registrations.filter((r) => r.exam_id === exam.id).length;
                      return (
                        <div 
                          key={exam.id} 
                          className="bg-white border border-zinc-200/80 rounded-xl shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200"
                        >
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="text-xs font-semibold bg-[#E61E32]/10 text-[#E61E32] border border-[#E61E32]/20 px-2.5 py-1 rounded-lg">
                                  {exam.company_name}
                                </span>
                                <h3 className="text-base font-semibold text-zinc-900 font-inter mt-3 leading-snug">
                                  {exam.name}
                                </h3>
                              </div>
                              {exam.company_logo && (
                                <img src={exam.company_logo} alt={exam.company_name} className="w-10 h-10 object-contain shrink-0" />
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-3 border-y border-zinc-100 text-xs font-medium text-zinc-600">
                              <div>
                                <p className="text-xs text-zinc-400 mb-0.5">Schedule</p>
                                <p className="text-zinc-800 font-semibold">{exam.date}</p>
                                <p className="text-zinc-500 font-normal">{exam.time}</p>
                              </div>
                              <div>
                                <p className="text-xs text-zinc-400 mb-0.5">Details</p>
                                <p className="text-zinc-800 font-semibold">{exam.total_qns} Qns • {exam.types_of_qns}</p>
                                <p className="text-[#E61E32] font-semibold text-xs mt-0.5">
                                  {regsCount} {regsCount === 1 ? "Student Registered" : "Students Registered"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-zinc-100 space-y-4">
                            {/* Submit Code Section */}
                            <div className="flex items-center justify-between gap-3 bg-zinc-50/80 p-3 rounded-xl border border-zinc-200/60">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-zinc-500">Submit Code</span>
                                {exam.submit_code ? (
                                  <span className="font-mono text-sm font-bold tracking-[0.2em] text-[#E61E32] bg-red-50 border border-red-200 px-3 py-0.5 rounded-lg">
                                    {exam.submit_code}
                                  </span>
                                ) : (
                                  <span className="text-xs text-zinc-400 italic">No code set</span>
                                )}
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleGenerateCode(exam)}
                                  disabled={generatingCodeId === exam.id}
                                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-semibold text-xs rounded-lg cursor-pointer border-none transition-all shadow-xs"
                                >
                                  {generatingCodeId === exam.id ? "..." : exam.submit_code ? "Regenerate" : "Generate Code"}
                                </button>
                                {exam.submit_code && (
                                  <button
                                    onClick={() => handleClearCode(exam)}
                                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs rounded-lg cursor-pointer border-none transition-all"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Status badges + action buttons */}
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex gap-2">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                  exam.is_started
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-zinc-50 text-zinc-500 border-zinc-200"
                                }`}>
                                  {exam.is_started ? "Exam Active" : "Not Started"}
                                </span>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                  exam.show_login
                                    ? "bg-red-50 text-[#E61E32] border-red-200"
                                    : "bg-zinc-50 text-zinc-500 border-zinc-200"
                                }`}>
                                  {exam.show_login ? "Entry Open" : "Entry Closed"}
                                </span>
                              </div>

                              <div className="flex gap-2 flex-wrap">
                                <button
                                  onClick={() => toggleExamShowLogin(exam)}
                                  className={`px-3 py-1.5 font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer border-none ${
                                    exam.show_login
                                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                                      : "bg-[#E61E32] hover:bg-[#d01729] text-white"
                                  }`}
                                >
                                  {exam.show_login ? "Hide Entry" : "Show Entry"}
                                </button>
                                <button
                                  onClick={() => toggleExamStarted(exam)}
                                  className={`px-3 py-1.5 font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer border-none ${
                                    exam.is_started
                                      ? "bg-zinc-800 hover:bg-zinc-900 text-white"
                                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  }`}
                                >
                                  {exam.is_started ? "Disable Exam" : "Enable Exam"}
                                </button>
                                <button
                                  onClick={() => setSelectedExamForCandidates(exam)}
                                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer border-none flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-sm">groups</span>
                                  <span>Students ({regsCount})</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeTab === "security-logs" ? (
          <div className="space-y-6 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-zinc-200/80 rounded-xl shadow-xs">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 font-inter">Security Logs & Alerts</h3>
                <p className="text-xs text-zinc-500 mt-0.5">View student security alerts, login details, and manage exam access</p>
              </div>
              <button
                onClick={fetchSecurityLogs}
                className="px-4 py-2 bg-[#E61E32] hover:bg-[#d01729] text-white font-semibold text-xs rounded-lg cursor-pointer transition-all border-none shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span>Refresh Logs</span>
              </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Alerts Logged</p>
                <p className="text-2xl font-semibold text-zinc-900 font-inter mt-1">{securityLogs.length}</p>
              </div>
              <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Blocked Students</p>
                <p className="text-2xl font-semibold text-[#E61E32] font-inter mt-1">
                  {registrations.filter((r) => r.blocked).length} Students Blocked
                </p>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200/80 font-semibold text-zinc-600 uppercase tracking-wider text-[11px]">
                      <th className="px-6 py-3.5">Time</th>
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">Network & Device</th>
                      <th className="px-6 py-3.5">Alert Type</th>
                      <th className="px-6 py-3.5">Alert Details</th>
                      <th className="px-6 py-3.5 text-right">Status & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {/* Blocked candidates always shown at top */}
                    {registrations.filter((r) => r.blocked).map((reg) => (
                      <tr key={`blocked-${reg.id}`} className="bg-red-50/40 hover:bg-red-50/70">
                        <td className="px-6 py-3.5 whitespace-nowrap text-zinc-400 font-mono text-[10px]">—</td>
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-zinc-900">{reg.candidate_name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono leading-tight">{reg.hall_ticket_number}</p>
                        </td>
                        <td className="px-6 py-3.5 text-zinc-400 text-[10px]">—</td>
                        <td className="px-6 py-3.5">
                          <span className="px-2 py-0.5 font-bold tracking-wider text-[9px] border uppercase rounded-lg bg-red-50 text-red-700 border-red-200">
                            BLOCKED
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-zinc-500 text-[10px]">Candidate access has been revoked</td>
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleReEnableExam(reg.hall_ticket_number ?? "")}
                            disabled={reEnablingId === reg.hall_ticket_number}
                            className="px-2.5 py-1 bg-[#E61E32] hover:bg-[#d01729] text-white font-semibold text-[10px] rounded-lg cursor-pointer border-none transition-all disabled:opacity-50"
                          >
                            {reEnablingId === reg.hall_ticket_number ? "Unblocking..." : "Unblock"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {loadingSecurityLogs ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 italic">
                          Querying security logs database records, please wait...
                        </td>
                      </tr>
                    ) : securityLogs.length === 0 && registrations.filter((r) => r.blocked).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 italic">
                          No security events or violations logged in the database.
                        </td>
                      </tr>
                    ) : (
                      securityLogs.map((log) => {
                        const candidate = registrations.find(
                          (r) => r.hall_ticket_number?.toLowerCase() === log.session_id?.toLowerCase()
                        );
                        const isCandidateBlocked = candidate?.blocked ?? false;

                        return (
                          <tr key={log.id} className="hover:bg-zinc-50/50">
                            <td className="px-6 py-3.5 whitespace-nowrap text-zinc-500 font-mono text-[10px]">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-3.5">
                              {candidate ? (
                                <div>
                                  <p className="font-semibold text-zinc-900">{candidate.candidate_name}</p>
                                  <p className="text-[10px] text-zinc-400 font-mono leading-tight">{log.session_id}</p>
                                </div>
                              ) : (
                                <p className="font-mono text-zinc-750">{log.session_id}</p>
                              )}
                            </td>
                            <td className="px-6 py-3.5">
                              <p className="font-mono text-zinc-805">{log.ip_address}</p>
                              <p className="text-[9px] text-zinc-400 truncate max-w-[180px]" title={log.user_agent}>
                                {log.user_agent}
                              </p>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className={`px-2 py-0.5 font-bold tracking-wider text-[9px] border uppercase rounded-lg ${
                                log.event_type === "PROCTORING_VIOLATION"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-zinc-100 text-zinc-700 border-zinc-200"
                              }`}>
                                {log.event_type}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-zinc-700 max-w-[200px] truncate" title={log.details}>
                              {log.details || "None"}
                            </td>
                            <td className="px-6 py-3.5 text-right whitespace-nowrap">
                              {isCandidateBlocked ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[9px] font-bold border border-red-200 uppercase rounded-lg">
                                    Locked
                                  </span>
                                  <button
                                    onClick={() => handleReEnableExam(log.session_id)}
                                    disabled={reEnablingId === log.session_id}
                                    className="px-2.5 py-1 bg-[#E61E32] hover:bg-[#d01729] text-white font-semibold text-[10px] rounded-lg cursor-pointer border-none transition-all uppercase tracking-wider disabled:opacity-50"
                                  >
                                    {reEnablingId === log.session_id ? "Re-enabling..." : "Re-enable Exam"}
                                  </button>
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200 uppercase rounded-lg">
                                  Allowed
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === "profile" ? (
          <div className="space-y-6 p-6 max-w-4xl">
            <div className="bg-white border border-zinc-200/80 rounded-xl p-6 md:p-8 shadow-xs">
              <div className="flex items-center gap-4 border-b border-zinc-200/80 pb-6 mb-6">
                <div className="w-14 h-14 rounded-xl bg-[#E61E32]/10 border border-[#E61E32]/20 flex items-center justify-center font-bold text-lg text-[#E61E32]">
                  AD
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 font-inter">Administrator Profile</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Manage your administrative credentials, security parameters, and session privileges.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Account Information</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-zinc-200/60">
                      <span className="text-zinc-500">Email Address</span>
                      <span className="font-semibold text-zinc-900">{userEmail || "admin@redlixsecure.com"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-200/60">
                      <span className="text-zinc-500">System Role</span>
                      <span className="font-semibold text-[#E61E32]">Super Administrator</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-500">Access Level</span>
                      <span className="font-semibold text-emerald-700">Full Proctoring & Control</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Active Session Security</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-zinc-200/60">
                      <span className="text-zinc-500">Authentication Token</span>
                      <span className="font-mono text-zinc-700">Active (Verified)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-200/60">
                      <span className="text-zinc-500">Turnstile Protection</span>
                      <span className="font-semibold text-emerald-700 font-mono">Passed</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-500">Session Status</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Live Encrypted
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

      </main>

      {}
  {activeStreamSession && (() => {
    const currentStream = sessions.find((s) => s.id === activeStreamSession.id) || activeStreamSession;
    return (
      <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        
        <div className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-none overflow-hidden shadow-2xl">
          
          {}
          <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                {onlineStudents.has(currentStream.id) ? (
                  <>
                    <span className="w-2 h-2 rounded-none bg-emerald-600 animate-pulse" />
                    Active Stream: {currentStream.student} (Online)
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-none bg-red-600 animate-pulse" />
                    Active Stream: {currentStream.student} (Offline)
                  </>
                )}
              </h3>
              <p className="text-[10px] text-zinc-500">{currentStream.exam} • ID: {currentStream.id}</p>
            </div>
            <button onClick={() => setActiveStreamSession(null)} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"><span className="material-symbols-outlined text-md">close</span></button>
          </div>

          {}
          <div className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-200">
            {currentStream.liveFeed ? (
              <img 
                src={currentStream.liveFeed} 
                alt="Candidate webcam stream" 
                className="w-full h-full object-cover scale-x-[-1]" 
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
                
                {}
                <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border border-orange-500/30 rounded-none flex items-center justify-center">
                  <div className="absolute inset-0 bg-orange-500/5 animate-pulse" />
                  
                  {}
                  <div className="w-4 h-4 border-t border-l border-orange-400 absolute top-0 left-0" />
                  <div className="w-4 h-4 border-t border-r border-orange-400 absolute top-0 right-0" />
                  <div className="w-4 h-4 border-b border-l border-orange-400 absolute bottom-0 left-0" />
                  <div className="w-4 h-4 border-b border-r border-orange-400 absolute bottom-0 right-0" />
                  
                  <span className="text-[10px] font-mono text-orange-400 normal-case font-semibold animate-pulse">
                    Waiting for Feed...
                  </span>
                </div>

                {}
                <svg className="absolute inset-0 w-full h-full text-orange-500/30" viewBox="0 0 400 225">
                  <path d="M 200,80 L 175,110 L 185,150 L 200,165 L 215,150 L 225,110 Z" fill="none" stroke="currentColor" strokeWidth={1.5} className="animate-pulse" />
                  <circle cx={185} cy={105} r={3} fill="currentColor" />
                  <circle cx={215} cy={105} r={3} fill="currentColor" />
                  <path d="M 180,135 Q 200,145 220,135" fill="none" stroke="currentColor" strokeWidth={1.5} />
                </svg>
              </>
            )}

            <div className="absolute bottom-4 left-4 p-2 bg-black/70 rounded-none border border-zinc-700 text-[10px] font-mono space-y-1 z-10">
              <p className="text-zinc-300">Status: <span className={currentStream.liveFeed ? "text-emerald-400 font-bold" : "text-amber-400 font-bold animate-pulse"}>{currentStream.liveFeed ? "Live streaming" : "Waiting for feed"}</span></p>
              <p className="text-zinc-300">Gaze state: <span className="text-emerald-400 font-bold">Stable</span></p>
            </div>

            <div className="absolute bottom-4 right-4 p-2 bg-black/70 rounded-none border border-zinc-700 text-[10px] font-mono z-10">
              <span className={`px-1.5 py-0.5 rounded-none font-bold normal-case ${
                currentStream.severity === "Critical"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}>
                {currentStream.lastFlagType}
              </span>
            </div>

          </div>

            {}
            <div className="p-4 bg-zinc-50 flex justify-between gap-3 border-t border-zinc-200">
              <span className="text-xs text-zinc-500 flex items-center">
                Total flags: {currentStream.flagsCount}
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleResolve(currentStream.id)}
                  disabled={currentStream.severity === "Normal"}
                  className={`px-3 py-1.5 rounded-none text-xs font-semibold border transition-all ${
                    currentStream.severity === "Normal"
                      ? "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 border-transparent text-white cursor-pointer"
                  }`}
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => handleDismiss(currentStream.id)}
                  className="px-3 py-1.5 rounded-none bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-zinc-900 text-xs font-semibold transition-all cursor-pointer"
                >
                  Dismiss Alert
                </button>
              </div>
            </div>

          </div>
        </div>
      );
    })()}

    {selectedCandidateForAnswers && (() => {
      const candidate = selectedCandidateForAnswers;
      const exam = exams.find((e) => e.id === candidate.exam_id);
      
      let candidateQuestions = QUESTIONS.map((q) => ({ ...q }));

      // ── Exam Type & Grading ──────────────────────────────
      const examName = exam ? exam.name.toLowerCase() : "";
      const isTechnicalExam = exam && examName.includes("technical");
      const isBusinessAnalysisExam = exam && (examName.includes("business") || examName.includes("bussiness") || candidate.exam_id === 6);
      const isSalesMarketingExam = exam && (examName.includes("sales") || candidate.exam_id === 7);
      const isUIUXExam = exam && (examName.includes("ui") || examName.includes("ux"));
      const isMarketingExam = exam && examName.includes("marketing") && !isSalesMarketingExam;
      const isAnalyticsExam = exam && examName.includes("analytics");
      const isTraining01Exam = exam && examName.includes("redlix training exam 01");
      const isPhase02Exam = exam && (examName.includes("redlix phase - 02") || examName.includes("final phase"));

      let technicalGrade: ReturnType<typeof gradeTechnicalFull> | null = null;
      let businessAnalysisGrade: ReturnType<typeof gradeBusinessAnalysisFull> | null = null;
      let salesMarketingGrade: ReturnType<typeof gradeSalesMarketingFull> | null = null;
      let uiuxGrade: ReturnType<typeof gradeUIUXFull> | null = null;
      let marketingGrade: ReturnType<typeof gradeMarketingFull> | null = null;
      let analyticsGrade: ReturnType<typeof gradeAnalyticsFull> | null = null;
      let training01Grade: ReturnType<typeof gradeTraining01Full> | null = null;
      let phase02Grade: ReturnType<typeof gradePhase02Full> | null = null;

      if (isTechnicalExam) {
        candidateQuestions = TECHNICAL_QUESTIONS.map((q) => ({ ...q }));
        if (candidate.answers) {
          technicalGrade = gradeTechnicalFull(candidate.answers as Record<string | number, string>);
        }
      } else if (isBusinessAnalysisExam) {
        candidateQuestions = BUSINESS_ANALYSIS_QUESTIONS.map((q) => ({ ...q }));
        if (candidate.answers) {
          businessAnalysisGrade = gradeBusinessAnalysisFull(candidate.answers as Record<string | number, string>);
        }
      } else if (isSalesMarketingExam) {
        candidateQuestions = SALES_MARKETING_QUESTIONS.map((q) => ({ ...q }));
        if (candidate.answers) {
          salesMarketingGrade = gradeSalesMarketingFull(candidate.answers as Record<string | number, string>);
        }
      } else if (isUIUXExam) {
        candidateQuestions = UIUX_QUESTIONS.map((q) => ({ ...q }));
        if (candidate.answers) {
          uiuxGrade = gradeUIUXFull(candidate.answers as Record<string | number, string>);
        }
      } else if (isMarketingExam) {
        candidateQuestions = MARKETING_QUESTIONS.map((q) => ({ ...q }));
        if (candidate.answers) {
          marketingGrade = gradeMarketingFull(candidate.answers as Record<string | number, string>);
        }
      } else if (isAnalyticsExam) {
        candidateQuestions = ANALYTICS_QUESTIONS.map((q) => ({ ...q }));
        if (candidate.answers) {
          analyticsGrade = gradeAnalyticsFull(candidate.answers as Record<string | number, string>);
        }
      } else if (isTraining01Exam) {
        candidateQuestions = TRAINING01_QUESTIONS.map((q) => ({ ...q }));
        if (candidate.answers) {
          training01Grade = gradeTraining01Full(candidate.answers as Record<string | number, string>);
        }
      } else if (isPhase02Exam) {
        candidateQuestions = PHASE02_QUESTIONS.map((q) => ({ ...q }));
        if (candidate.answers) {
          phase02Grade = gradePhase02Full(candidate.answers as Record<string | number, string>);
        }
      } else if (candidate.exam_id === 4 || (exam && exam.name.toLowerCase().includes("student forge"))) {
        const sectionA = candidateQuestions.filter((q) => q.section === "A");
        const sectionB = candidateQuestions.filter((q) => q.section === "B");
        if (candidate.hall_ticket_number) {
          const shuffledA = shuffleQuestions(sectionA, candidate.hall_ticket_number).slice(0, 30);
          const shuffledB = shuffleQuestions(sectionB, candidate.hall_ticket_number + "-B");
          shuffledA.forEach((q, idx) => {
            q.number = idx + 1;
          });
          shuffledB.forEach((q, idx) => {
            q.number = idx + 1;
          });
          candidateQuestions = [...shuffledA, ...shuffledB];
        }
      }

      const mcqQuestions = candidateQuestions.filter(q => q.type === "mcq");
      const codingQuestions = candidateQuestions.filter(q => q.type === "coding" || q.type === "open");

      const isQuestionAttempted = (q: typeof QUESTIONS[0]) => {
        const ans = candidate.answers?.[q.id];
        if (!ans || ans.trim() === "") return false;
        if (q.type === "coding" && q.starterCode) {
          return ans.trim() !== q.starterCode.trim();
        }
        return true;
      };

      const mcqAttempted = mcqQuestions.filter(isQuestionAttempted).length;
      const codingAttempted = codingQuestions.filter(isQuestionAttempted).length;

      return (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in select-text">
          <div className="relative w-full max-w-4xl bg-white border border-zinc-250 rounded-none overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-600 leading-none">assignment_ind</span>
                  Answers Review: {candidate.candidate_name}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Hall Ticket: <span className="font-mono font-bold text-zinc-700">{candidate.hall_ticket_number}</span> • Exam: <span className="font-semibold text-zinc-700">{exam?.name || "Technical Assessment"}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedCandidateForAnswers(null)} 
                className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined text-md">close</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 border-b border-zinc-200 bg-zinc-50/50 shrink-0 divide-x divide-zinc-200 text-center py-2.5">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Total Progress</p>
                <p className="text-sm font-bold text-zinc-800 mt-0.5">
                  {mcqAttempted + codingAttempted} / {candidateQuestions.length} Attempted
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase font-bold">MCQs Section</p>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">
                  {mcqAttempted} / {mcqQuestions.length} Answered
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase font-bold">{isPhase02Exam ? "Scenarios" : codingQuestions.length > 0 ? "Coding Tasks" : "Evaluation"}</p>
                <p className="text-sm font-bold text-indigo-600 mt-0.5">
                  {codingAttempted} / {codingQuestions.length} {isPhase02Exam ? "Answered" : "Attempted"}
                </p>
              </div>
            </div>

            {/* Technical Wing — Score Banner */}
            {isTechnicalExam && technicalGrade && (
              <div className="px-5 py-3 border-b border-zinc-200 bg-orange-50/60 shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-orange-700 mb-2">
                  🔒 Technical Wing Auto-Graded Score (Admin View Only)
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white border border-orange-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Sec A MCQs</p>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">{technicalGrade.secAMarks} / 30</p>
                    <p className="text-[9px] text-zinc-400">{technicalGrade.secACorrect} / 15 correct</p>
                  </div>
                  <div className="bg-white border border-orange-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Sec B MCQs</p>
                    <p className="text-sm font-bold text-blue-700 mt-0.5">{technicalGrade.secBMarks} / 20</p>
                    <p className="text-[9px] text-zinc-400">{technicalGrade.secBCorrect} / 10 correct</p>
                  </div>
                  <div className="bg-white border border-orange-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Total Marks</p>
                    <p className="text-sm font-bold text-zinc-900 mt-0.5">{technicalGrade.totalMarks} / 50</p>
                    <p className="text-[9px] text-zinc-400">{technicalGrade.percentage}%</p>
                  </div>
                  <div className={`border p-2 text-center ${technicalGrade.isPass ? "bg-emerald-500 border-emerald-600 text-white" : "bg-red-500 border-red-600 text-white"}`}>
                    <p className="text-[9px] uppercase font-bold opacity-80">Status</p>
                    <p className="text-sm font-bold mt-0.5">{technicalGrade.isPass ? "PASSED" : "FAILED"}</p>
                    <p className="text-[9px] opacity-80">Cut-off: 40% (20/50)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Business Analysis Wing — Score Banner */}
            {isBusinessAnalysisExam && businessAnalysisGrade && (
              <div className="px-5 py-3 border-b border-zinc-200 bg-sky-50/60 shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-sky-700 mb-2">
                  🔒 Business Analysis Wing Auto-Graded Score (Admin View Only)
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white border border-sky-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Attempted</p>
                    <p className="text-sm font-bold text-zinc-800 mt-0.5">{businessAnalysisGrade.totalAttempted} / 50</p>
                  </div>
                  <div className="bg-white border border-sky-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Correct Answers</p>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">{businessAnalysisGrade.totalCorrect} / 50</p>
                  </div>
                  <div className="bg-white border border-sky-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Total Marks</p>
                    <p className="text-sm font-bold text-sky-900 mt-0.5">{businessAnalysisGrade.totalMarks} / 100</p>
                    <p className="text-[9px] text-zinc-400">{businessAnalysisGrade.percentage}%</p>
                  </div>
                  <div className={`border p-2 text-center ${businessAnalysisGrade.isPass ? "bg-emerald-500 border-emerald-600 text-white" : "bg-red-500 border-red-600 text-white"}`}>
                    <p className="text-[9px] uppercase font-bold opacity-80">Status</p>
                    <p className="text-sm font-bold mt-0.5">{businessAnalysisGrade.isPass ? "PASSED" : "FAILED"}</p>
                    <p className="text-[9px] opacity-80">Cut-off: 40% (40/100)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sales and Marketing Wing — Score Banner */}
            {isSalesMarketingExam && salesMarketingGrade && (
              <div className="px-5 py-3 border-b border-zinc-200 bg-amber-50/60 shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-700 mb-2">
                  🔒 Sales and Marketing Wing Auto-Graded Score (Admin View Only)
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white border border-amber-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Attempted</p>
                    <p className="text-sm font-bold text-zinc-800 mt-0.5">{salesMarketingGrade.totalAttempted} / 50</p>
                  </div>
                  <div className="bg-white border border-amber-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Correct Answers</p>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">{salesMarketingGrade.totalCorrect} / 50</p>
                  </div>
                  <div className="bg-white border border-amber-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Total Marks</p>
                    <p className="text-sm font-bold text-amber-900 mt-0.5">{salesMarketingGrade.totalMarks} / 100</p>
                    <p className="text-[9px] text-zinc-400">{salesMarketingGrade.percentage}%</p>
                  </div>
                  <div className={`border p-2 text-center ${salesMarketingGrade.isPass ? "bg-emerald-500 border-emerald-600 text-white" : "bg-red-500 border-red-600 text-white"}`}>
                    <p className="text-[9px] uppercase font-bold opacity-80">Status</p>
                    <p className="text-sm font-bold mt-0.5">{salesMarketingGrade.isPass ? "PASSED" : "FAILED"}</p>
                    <p className="text-[9px] opacity-80">Cut-off: 40% (40/100)</p>
                  </div>
                </div>
              </div>
            )}

            {/* UI & UX Wing — Score Banner */}
            {isUIUXExam && uiuxGrade && (
              <div className="px-5 py-3 border-b border-zinc-200 bg-purple-50/60 shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-purple-700 mb-2">
                  🔒 UI & UX Wing Auto-Graded Score (Admin View Only)
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white border border-purple-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Attempted</p>
                    <p className="text-sm font-bold text-zinc-800 mt-0.5">{uiuxGrade.totalAttempted} / 50</p>
                  </div>
                  <div className="bg-white border border-purple-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Correct Answers</p>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">{uiuxGrade.totalCorrect} / 50</p>
                  </div>
                  <div className="bg-white border border-purple-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Total Marks</p>
                    <p className="text-sm font-bold text-purple-900 mt-0.5">{uiuxGrade.totalMarks} / 100</p>
                    <p className="text-[9px] text-zinc-400">{uiuxGrade.percentage}%</p>
                  </div>
                  <div className={`border p-2 text-center ${uiuxGrade.isPass ? "bg-emerald-500 border-emerald-600 text-white" : "bg-red-500 border-red-600 text-white"}`}>
                    <p className="text-[9px] uppercase font-bold opacity-80">Status</p>
                    <p className="text-sm font-bold mt-0.5">{uiuxGrade.isPass ? "PASSED" : "FAILED"}</p>
                    <p className="text-[9px] opacity-80">Cut-off: 40%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Marketing Wing — Score Banner */}
            {isMarketingExam && marketingGrade && (
              <div className="px-5 py-3 border-b border-zinc-200 bg-blue-50/60 shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-700 mb-2">
                  🔒 Marketing Wing Auto-Graded Score (Admin View Only)
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white border border-blue-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Attempted</p>
                    <p className="text-sm font-bold text-zinc-800 mt-0.5">{marketingGrade.totalAttempted} / 50</p>
                  </div>
                  <div className="bg-white border border-blue-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Correct Answers</p>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">{marketingGrade.totalCorrect} / 50</p>
                  </div>
                  <div className="bg-white border border-blue-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Total Marks</p>
                    <p className="text-sm font-bold text-blue-900 mt-0.5">{marketingGrade.totalMarks} / 100</p>
                    <p className="text-[9px] text-zinc-400">{marketingGrade.percentage}%</p>
                  </div>
                  <div className={`border p-2 text-center ${marketingGrade.isPass ? "bg-emerald-500 border-emerald-600 text-white" : "bg-red-500 border-red-600 text-white"}`}>
                    <p className="text-[9px] uppercase font-bold opacity-80">Status</p>
                    <p className="text-sm font-bold mt-0.5">{marketingGrade.isPass ? "PASSED" : "FAILED"}</p>
                    <p className="text-[9px] opacity-80">Cut-off: 40%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Data Analytics Wing — Score Banner */}
            {isAnalyticsExam && analyticsGrade && (
              <div className="px-5 py-3 border-b border-zinc-200 bg-emerald-50/60 shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-700 mb-2">
                  🔒 Data Analytics Wing Auto-Graded Score (Admin View Only)
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white border border-emerald-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Attempted</p>
                    <p className="text-sm font-bold text-zinc-800 mt-0.5">{analyticsGrade.totalAttempted} / 50</p>
                  </div>
                  <div className="bg-white border border-emerald-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Correct Answers</p>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">{analyticsGrade.totalCorrect} / 50</p>
                  </div>
                  <div className="bg-white border border-emerald-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Total Marks</p>
                    <p className="text-sm font-bold text-emerald-900 mt-0.5">{analyticsGrade.totalMarks} / 100</p>
                    <p className="text-[9px] text-zinc-400">{analyticsGrade.percentage}%</p>
                  </div>
                  <div className={`border p-2 text-center ${analyticsGrade.isPass ? "bg-emerald-500 border-emerald-600 text-white" : "bg-red-500 border-red-600 text-white"}`}>
                    <p className="text-[9px] uppercase font-bold opacity-80">Status</p>
                    <p className="text-sm font-bold mt-0.5">{analyticsGrade.isPass ? "PASSED" : "FAILED"}</p>
                    <p className="text-[9px] opacity-80">Cut-off: 40%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Training Exam 01 — Auto-Grade Score Banner (Admin Only, NEVER shown to candidate) */}
            {isTraining01Exam && training01Grade && (
              <div className="px-5 py-3 border-b border-zinc-200 bg-orange-50/60 shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-orange-700 mb-2">
                  🔒 Auto-Graded Score — Redlix Training Exam 01 (Admin View Only — Not Shown to Candidate)
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white border border-orange-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Sec A MCQ</p>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">
                      {training01Grade.mcq.marksObtained} / 15
                    </p>
                    <p className="text-[9px] text-zinc-400">{training01Grade.mcq.correct} correct</p>
                  </div>
                  <div className="bg-white border border-orange-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Sec B Scenario</p>
                    <p className="text-sm font-bold text-blue-700 mt-0.5">
                      {training01Grade.scenario.marksObtained} / 10
                    </p>
                    <p className="text-[9px] text-zinc-400">MCQ auto-score</p>
                  </div>
                  <div className="bg-white border border-orange-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Sec C Coding</p>
                    <p className="text-sm font-bold text-indigo-700 mt-0.5">
                      {training01Grade.coding.marksObtained} / 40
                    </p>
                    <p className="text-[9px] text-zinc-400">{training01Grade.coding.attempted}/4 submitted</p>
                  </div>
                  <div className="bg-orange-500 border border-orange-600 p-2 text-center">
                    <p className="text-[9px] text-orange-100 uppercase font-bold">Total Auto</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {training01Grade.totalAutoMarks} / 65
                    </p>
                    <p className="text-[9px] text-orange-200">Manual review needed</p>
                  </div>
                </div>
              </div>
            )}

            {/* Phase 02 — Auto-Grade Score Banner (Admin Only, NEVER shown to candidate) */}
            {isPhase02Exam && phase02Grade && (
              <div className="px-5 py-3 border-b border-zinc-200 bg-orange-50/60 shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-orange-700 mb-2">
                  🔒 Auto-Graded Score — Redlix Phase - 02 (Final Phase) (Admin View Only)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white border border-orange-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Sec A MCQ</p>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">
                      {phase02Grade.mcq.marksObtained} / 76
                    </p>
                    <p className="text-[9px] text-zinc-400">{phase02Grade.mcq.correct} / 19 correct</p>
                  </div>
                  <div className="bg-white border border-orange-200 p-2 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Sec B Scenarios</p>
                    <p className="text-sm font-bold text-blue-700 mt-0.5">
                      {phase02Grade.open.attempted} / 8
                    </p>
                    <p className="text-[9px] text-zinc-400">Manual review required</p>
                  </div>
                  <div className="bg-orange-500 border border-orange-600 p-2 text-center flex flex-col justify-center">
                    <p className="text-[9px] text-orange-100 uppercase font-bold">Total Auto Marks</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {phase02Grade.totalAutoMarks} / 156
                    </p>
                  </div>
                </div>
              </div>
            )}

            {}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-orange-600 border-b border-zinc-200 pb-1 flex items-center justify-between">
                  <span>Section A: Multiple Choice Questions ({mcqQuestions.length})</span>
                  <span className="text-[10px] text-zinc-400 normal-case font-normal">{isTraining01Exam ? "(Fixed order — Redlix Training Exam 01)" : isPhase02Exam ? "(Fixed order — Redlix Phase - 02)" : "(Shuffled in student's view)"}</span>
                </h4>
                <div className="space-y-3">
                  {mcqQuestions.map((q) => {
                    const rawAns = candidate.answers?.[q.id];
                    const selectedLetter = rawAns ? rawAns.toString().trim().charAt(0).toUpperCase() : "";
                    const attempted = isQuestionAttempted(q);

                    const correctLetter = 
                      isBusinessAnalysisExam ? BUSINESS_ANALYSIS_ANSWER_KEY[q.id] :
                      isSalesMarketingExam ? SALES_MARKETING_ANSWER_KEY[q.id] :
                      isTechnicalExam ? TECHNICAL_ANSWER_KEY[q.id] :
                      isUIUXExam ? UIUX_ANSWER_KEY[q.id] :
                      isMarketingExam ? MARKETING_ANSWER_KEY[q.id] :
                      isAnalyticsExam ? ANALYTICS_ANSWER_KEY[q.id] :
                      null;

                    const isCorrect = correctLetter && selectedLetter ? selectedLetter === correctLetter : false;

                    return (
                      <div key={q.id} className="p-3.5 border border-zinc-200 bg-white space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <h5 className="text-xs font-bold text-zinc-800 leading-relaxed">
                            Question {q.number}: <span className="font-normal text-zinc-650 whitespace-pre-wrap">{q.questionText}</span>
                          </h5>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {correctLetter && attempted && (
                              <span className={`text-[9px] font-bold px-2 py-0.5 border ${
                                isCorrect 
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300" 
                                  : "bg-red-100 text-red-800 border-red-300"
                              }`}>
                                {isCorrect ? "✓ Correct (+2)" : "✗ Incorrect (0)"}
                              </span>
                            )}
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 border ${
                              attempted 
                                ? "bg-zinc-100 text-zinc-700 border-zinc-300" 
                                : "bg-zinc-50 text-zinc-400 border-zinc-200"
                            }`}>
                              {attempted ? "Attempted" : "Not Attempted"}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-3">
                          {q.options?.map((opt) => {
                            const letter = opt.substring(0, 1).toUpperCase();
                            const isSelected = selectedLetter === letter;
                            const isThisCorrect = correctLetter === letter;

                            return (
                              <div 
                                key={opt}
                                className={`p-2 border text-xs flex items-center justify-between gap-2 ${
                                  isSelected && isThisCorrect
                                    ? "bg-emerald-50 border-emerald-400 font-semibold text-emerald-950"
                                    : isSelected && !isThisCorrect
                                    ? "bg-red-50 border-red-300 font-semibold text-red-950"
                                    : isThisCorrect
                                    ? "bg-emerald-50/50 border-emerald-300/80 font-medium text-emerald-900 border-dashed"
                                    : "bg-zinc-50 border-zinc-200 text-zinc-600"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-4 h-4 flex items-center justify-center text-[9px] font-bold border rounded-full ${
                                    isSelected && isThisCorrect
                                      ? "bg-emerald-600 border-emerald-600 text-white"
                                      : isSelected && !isThisCorrect
                                      ? "bg-red-600 border-red-600 text-white"
                                      : isThisCorrect
                                      ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                                      : "border-zinc-300 text-zinc-400 bg-white"
                                  }`}>
                                    {letter}
                                  </span>
                                  <span className="font-sans leading-none">{opt.substring(3)}</span>
                                </div>
                                {isSelected && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 bg-white/80 rounded border border-zinc-200">
                                    Candidate
                                  </span>
                                )}
                                {!isSelected && isThisCorrect && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                                    Key
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 border-b border-zinc-200 pb-1 flex items-center justify-between">
                  <span>Section B: {codingQuestions.some(q => q.type === "open") ? "Scenario-Based / Open-Ended" : "Coding Challenges"} ({codingQuestions.length})</span>
                  <span className="text-[10px] text-zinc-400 normal-case font-normal">(Shuffled in student's view)</span>
                </h4>
                <div className="space-y-4">
                  {codingQuestions.map((q) => {
                    const solutionCode = candidate.answers?.[q.id];
                    const attempted = isQuestionAttempted(q);

                    return (
                      <div key={q.id} className="p-3.5 border border-zinc-200 bg-white space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <h5 className="text-xs font-bold text-zinc-800 leading-relaxed">
                            {q.type === "open" ? "Open-Ended Question" : "Coding Challenge"} {q.number}: <span className="font-normal text-zinc-650">{q.questionText.split("\n")[0]}</span>
                          </h5>
                          <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 border ${
                            attempted 
                              ? "bg-indigo-50 text-indigo-700 border-indigo-250" 
                              : "bg-red-50 text-red-700 border-red-250"
                          }`}>
                            {attempted ? "Attempted" : "Not Attempted"}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 font-mono">Candidate Submission</p>
                          {attempted && solutionCode ? (
                            <pre className="bg-zinc-950 text-zinc-300 font-mono text-[11px] p-3.5 border border-zinc-800 overflow-x-auto whitespace-pre rounded-none max-h-72">
                              {solutionCode}
                            </pre>
                          ) : (
                            <div className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-400 text-xs italic font-sans">
                              No solution submitted for this challenge.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCandidateForAnswers(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-none cursor-pointer border-none transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      );
    })()}

    </div>
  );
}
