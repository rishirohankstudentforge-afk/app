"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutGrid,
  User,
  LogOut,
  Menu,
  X,
  BookOpen,
  Mail,
  Phone,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Award,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  PlayCircle,
  MessageCircle,
  Key,
  CheckCircle2,
  Lock,
  Loader2,
  Zap,
  ClipboardList,
  Code2,
  Bell,
  Users
} from "lucide-react";

interface ExamDetails {
  id: number;
  name: string;
  company_name: string;
  company_logo?: string;
  date: string;
  time: string;
  description: string;
  total_qns: number;
  types_of_qns: string;
  is_started: boolean;
  show_login: boolean;
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
  registration_number: string | null;
  hall_ticket_number: string | null;
  created_at: string;
  blocked: boolean | null;
  exams: ExamDetails;
}

interface Candidate {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  college: string | null;
  department: string | null;
  created_at: string;
}

export default function CandidateDashboard() {
  const router = useRouter();
  
  // Sidebar navigation tabs
  const [activeTab, setActiveTab] = useState<"overview" | "exams" | "sprints" | "messages" | "invitations" | "profile">("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sprint Lobby Join states
  const [lobbyCode, setLobbyCode] = useState("");
  const [joiningLobby, setJoiningLobby] = useState(false);
  const [lobbyError, setLobbyError] = useState("");
  const [lobbySuccess, setLobbySuccess] = useState("");

  // Community: co-registrants for the same exams
  const [community, setCommunity] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [communitySearch, setCommunitySearch] = useState("");
  const [communityLoading, setCommunityLoading] = useState(false);

  // Friend connection + chat state
  const [connectionStatus, setConnectionStatus] = useState<{id?: string; status: string; direction: string}>({ status: "none", direction: "none" });
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);

  // Invitations page state
  const [invitations, setInvitations] = useState<{ sent: any[]; received: any[] }>({ sent: [], received: [] });
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [openChatConnectionId, setOpenChatConnectionId] = useState<string | null>(null);
  const [openChatMessages, setOpenChatMessages] = useState<any[]>([]);
  const [openChatInput, setOpenChatInput] = useState("");
  const [openChatSending, setOpenChatSending] = useState(false);

  // Profile update form states
  const [phoneVal, setPhoneVal] = useState("");
  const [collegeVal, setCollegeVal] = useState("");
  const [deptVal, setDeptVal] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const getExamCardImage = (examName: string) => {
    const nameLower = (examName || "").toLowerCase();
    if (nameLower.includes("business") || nameLower.includes("bussiness")) {
      return "https://ik.imagekit.io/dypkhqxip/bussiness%20analysis.png";
    } else if (nameLower.includes("sales")) {
      return "https://ik.imagekit.io/dypkhqxip/Sales%20and%20Marketing.png";
    } else if (nameLower.includes("technical")) {
      return "https://ik.imagekit.io/dypkhqxip/technical%20Wing.png";
    } else if (nameLower.includes("marketing")) {
      return "https://ik.imagekit.io/dypkhqxip/marketing%20Wing.png";
    } else if (nameLower.includes("analytics")) {
      return "https://ik.imagekit.io/dypkhqxip/Data%20Analytics%20Wing.png";
    } else if (nameLower.includes("ui") || nameLower.includes("ux")) {
      return "https://ik.imagekit.io/dypkhqxip/UI%20and%20UX%20Wing.png";
    }
    return "https://ik.imagekit.io/dypkhqxip/technical%20Wing.png"; // fallback
  };

  const fetchProfile = async () => {
    try {
      setErrorMsg("");
      const res = await fetch("/api/candidate/profile");
      const data = await res.json();

      if (!res.ok || !data.success) {
        localStorage.removeItem("candidate_authenticated");
        localStorage.removeItem("candidate_email");
        router.push("/candidate-login");
        return;
      }

      setCandidate(data.candidate);
      setRegistrations(data.registrations || []);
      setHackathons(data.hackathons || []);
      
      // Initialize form values
      if (data.candidate) {
        setPhoneVal(data.candidate.phone || "");
        setCollegeVal(data.candidate.college || "");
        setDeptVal(data.candidate.department || "");
      }
    } catch (err) {
      setErrorMsg("Failed to connect to profile server.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const auth = localStorage.getItem("candidate_authenticated");
    if (auth !== "true") {
      router.push("/candidate-login");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["overview", "exams", "sprints", "messages", "profile"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    fetchProfile();
    fetchCommunity();
  }, [router]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProfile();
  };

  const fetchCommunity = async () => {
    setCommunityLoading(true);
    try {
      const res = await fetch("/api/candidate/community");
      const data = await res.json();
      if (data.success) setCommunity(data.community || []);
    } catch (_) {}
    finally { setCommunityLoading(false); }
  };

  const fetchInvitations = async () => {
    setInvitationsLoading(true);
    try {
      const res = await fetch("/api/candidate/connections");
      const data = await res.json();
      if (data.success) setInvitations({ sent: data.sent || [], received: data.received || [] });
    } catch (_) {}
    finally { setInvitationsLoading(false); }
  };

  useEffect(() => {
    if (activeTab === "invitations") fetchInvitations();
  }, [activeTab]);

  // Load connection status + chat messages when selected person changes
  useEffect(() => {
    if (!selectedPerson) return;
    setChatOpen(false);
    setChatMessages([]);
    setConnectionStatus({ status: "none", direction: "none" });
    setConnectionLoading(true);
    fetch(`/api/candidate/connection?with=${selectedPerson.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.connection) {
          setConnectionStatus({ id: data.connection.id, status: data.connection.status, direction: data.direction });
          // Pre-load chat if already accepted
          if (data.connection.status === "accepted") {
            fetch(`/api/candidate/chat?connection=${data.connection.id}`)
              .then(r => r.json())
              .then(d => { if (d.success) setChatMessages(d.messages || []); });
          }
        }
      })
      .finally(() => setConnectionLoading(false));
  }, [selectedPerson?.id]);

  const handleSignOut = async () => {
    document.cookie = "candidate_session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("candidate_authenticated");
    localStorage.removeItem("candidate_email");
    localStorage.removeItem("candidate_name");
    try {
      await fetch("/api/candidate/logout", { method: "POST" });
    } catch (err) {}
    router.push("/candidate-login");
  };

  const handleJoinSprintLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lobbyCode.length !== 6) {
      setLobbyError("Please enter a valid 6-digit room code.");
      return;
    }

    setJoiningLobby(true);
    setLobbyError("");
    setLobbySuccess("");

    try {
      // 1. Fetch Sprint room status to confirm it exists
      const statusRes = await fetch(`/api/sprints/status?code=${lobbyCode}`);
      const statusData = await statusRes.json();
      if (!statusData.success) {
        setLobbyError(statusData.error || "Failed to find active sprint room.");
        setJoiningLobby(false);
        return;
      }

      const sprint = statusData.data;

      // 2. Register candidate in the lobby
      const registerRes = await fetch("/api/sprints/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprintId: sprint.id,
          name: candidate?.full_name || "Candidate",
          email: candidate?.email || localStorage.getItem("candidate_email") || ""
        })
      });

      const registerData = await registerRes.json();
      if (!registerData.success) {
        setLobbyError(registerData.error || "Failed to register inside the lobby.");
        setJoiningLobby(false);
        return;
      }

      setLobbySuccess("Verification success! Redirecting to wait room...");
      
      setTimeout(() => {
        router.push(`/sprints/waiting?code=${lobbyCode}`);
      }, 800);
    } catch (err) {
      setLobbyError("Failed to enter lobby room.");
      setJoiningLobby(false);
    }
  };

  const handleQuickJoin = async (code: string) => {
    setLobbyCode(code);
    setJoiningLobby(true);
    setLobbyError("");
    setLobbySuccess("");

    try {
      const statusRes = await fetch(`/api/sprints/status?code=${code}`);
      const statusData = await statusRes.json();
      if (!statusData.success) {
        setLobbyError(statusData.error || "Failed to find active sprint room.");
        setJoiningLobby(false);
        return;
      }

      const sprint = statusData.data;

      const registerRes = await fetch("/api/sprints/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprintId: sprint.id,
          name: candidate?.full_name || "Candidate",
          email: candidate?.email || localStorage.getItem("candidate_email") || ""
        })
      });

      const registerData = await registerRes.json();
      if (!registerData.success) {
        setLobbyError(registerData.error || "Failed to register inside the lobby.");
        setJoiningLobby(false);
        return;
      }

      setLobbySuccess("Verification success! Redirecting to wait room...");
      
      setTimeout(() => {
        router.push(`/sprints/waiting?code=${code}`);
      }, 800);
    } catch (err) {
      setLobbyError("Failed to enter lobby room.");
      setJoiningLobby(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateSuccess(false);
    setUpdateError("");

    try {
      await fetch("/api/register/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: registrations[0]?.id || 1,
          candidate_name: candidate?.full_name || "",
          email: candidate?.email || "",
          phone: phoneVal.trim(),
          college: collegeVal.trim(),
          department: deptVal.trim(),
          year_of_study: registrations[0]?.year_of_study || "Final Year",
          photo_url: registrations[0]?.photo_url || "https://ik.imagekit.io/dypkhqxip/redlix%20new?updatedAt=1781042212493",
          turnstileToken: "LOCALHOST_BYPASS_TOKEN"
        })
      });

      setTimeout(() => {
        setIsUpdating(false);
        setUpdateSuccess(true);
        if (candidate) {
          setCandidate({
            ...candidate,
            phone: phoneVal,
            college: collegeVal,
            department: deptVal
          });
        }
      }, 1000);
    } catch {
      setUpdateError("Failed to update profile details.");
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center font-sans text-zinc-900">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-[#E61E32] border-r-zinc-200 border-b-zinc-200 border-l-zinc-200 animate-spin mx-auto" />
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Loading Dashboard Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900 flex flex-col md:flex-row">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-zinc-900 border-b border-zinc-800 text-white p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img
            src="https://ik.imagekit.io/dypkhqxip/redlix%20new?updatedAt=1781042212493"
            alt="Redlix Logo"
            className="w-6 h-6 object-contain"
          />
          <span className="font-bold text-xs tracking-wider uppercase">Redlix Candidate</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-zinc-400 hover:text-white focus:outline-none"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`bg-zinc-900 border-r border-zinc-800 text-white w-64 shrink-0 flex flex-col fixed md:sticky inset-y-0 left-0 z-30 transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-3 pb-1 space-y-0 flex-1 flex flex-col min-h-0">
          {/* Logo Brand */}
          <div className="flex items-center justify-center border-b border-zinc-800 pb-0 pt-0">
            <img
              src="https://ik.imagekit.io/dypkhqxip/redlix%20new?updatedAt=1781042212493"
              alt="Redlix Logo"
              className="w-24 h-24 object-contain -mt-3 -mb-3"
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 pt-0 -mt-1.5">
            <button
              onClick={() => { setActiveTab("overview"); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all text-left cursor-pointer ${
                activeTab === "overview"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" strokeWidth={1.8} />
              Overview
            </button>
            <button
              onClick={() => { setActiveTab("exams"); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all text-left cursor-pointer ${
                activeTab === "exams"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" strokeWidth={1.8} />
              Registered Exams
            </button>
            <button
              onClick={() => { setActiveTab("sprints"); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all text-left cursor-pointer ${
                activeTab === "sprints"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4 shrink-0" strokeWidth={1.8} />
              Sprints Lobby
            </button>
            <button
              onClick={() => { setActiveTab("messages"); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all text-left cursor-pointer ${
                activeTab === "messages"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              }`}
            >
              <MessageCircle className="w-4 h-4 shrink-0" strokeWidth={1.8} />
              Community
            </button>
            <button
              onClick={() => { setActiveTab("invitations"); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all text-left cursor-pointer ${
                activeTab === "invitations"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" strokeWidth={1.8} />
              Invitations
              {invitations.received.filter(r => r.status === "pending").length > 0 && (
                <span className="ml-auto bg-[#E61E32] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {invitations.received.filter(r => r.status === "pending").length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("profile"); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all text-left cursor-pointer ${
                activeTab === "profile"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              }`}
            >
              <User className="w-4 h-4 shrink-0" strokeWidth={1.8} />
              Profile Details
            </button>
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-zinc-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-[#E61E32] uppercase rounded-full">
              {candidate?.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-zinc-200 truncate leading-none mb-1">{candidate?.full_name}</span>
              <span className="text-[10px] text-zinc-500 truncate">{candidate?.email}</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#E61E32] hover:bg-[#d01729] active:bg-[#b81223] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border-none shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-hidden flex flex-col ${activeTab !== "messages" ? "max-w-7xl w-full mx-auto" : "w-full"}`}>
        

        {/* Active Tab Content */}
        <div className={activeTab === "messages" ? "flex-1 flex flex-col min-h-0" : "p-6 md:p-10 space-y-6"}>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-[#E61E32] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Tab content renders */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Welcome banner + Overlapping Stats container */}
            <div className="relative pb-4">
              {/* Welcome banner */}
              <div className="bg-gradient-to-r from-[#E61E32] to-[#c8102e] text-white p-6 md:p-8 pb-16 md:pb-20 rounded-2xl flex flex-col justify-between items-start gap-6 relative overflow-hidden shadow-sm">
                <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial-gradient from-red-650/10 to-transparent pointer-events-none" />
                <div className="space-y-2 relative z-10 max-w-2xl">
                  <span className="text-[10px] font-semibold text-white tracking-wider bg-white/20 px-2 py-0.5 border border-white/10 rounded-md">Proctored Node Active</span>
                  <h2 className="text-2xl font-semibold tracking-tight mt-1 text-white">Welcome Back, {candidate?.full_name}!</h2>
                  <p className="text-xs text-white/80 font-normal leading-relaxed">
                    Your playground console is fully configured. Enter a sprint join code to enter the waiting room or view active evaluation sessions.
                  </p>
                </div>
              </div>

              {/* Overlapping Quick Metrics card grid */}
              <div className="relative z-20 -mt-10 px-6 max-w-4xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Stat 1 */}
                  <div className="bg-white p-5 border border-zinc-200/80 shadow-md rounded-xl flex items-center justify-between transition-transform hover:scale-[1.01]">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-zinc-400">Registered Events</p>
                      <p className="text-3xl font-semibold text-zinc-900 tracking-tight mt-1">{registrations.length + hackathons.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 text-[#E61E32] flex items-center justify-center rounded-xl">
                      <ClipboardList className="w-6 h-6" strokeWidth={1.8} />
                    </div>
                  </div>

                  {/* Stat 2 */}
                  <div className="bg-white p-5 border border-zinc-200/80 shadow-md rounded-xl flex items-center justify-between transition-transform hover:scale-[1.01]">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[#E61E32]">Sprints Active</p>
                      <p className="text-3xl font-semibold text-zinc-900 tracking-tight mt-1">
                        {hackathons.reduce((acc, h) => acc + (h.sprints?.filter((s: any) => s.isStarted).length || 0), 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-xl">
                      <Code2 className="w-6 h-6" strokeWidth={1.8} />
                    </div>
                  </div>

                  {/* Stat 3 */}
                  <div className="bg-white p-5 border border-zinc-200/80 shadow-md rounded-xl flex items-center justify-between transition-transform hover:scale-[1.01]">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-zinc-400">Candidates</p>
                      <p className="text-3xl font-semibold text-zinc-900 tracking-tight mt-1">{community.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 flex items-center justify-center rounded-xl">
                      <Bell className="w-6 h-6" strokeWidth={1.8} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main content split */}
            <div className="flex flex-col gap-6 font-normal">
              
              {/* Active Exams */}
              <div className="space-y-6">

                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-zinc-500">My Hackathons & Live Sprints</h3>
                  {hackathons.length === 0 ? (
                    <div className="bg-white border border-zinc-200 p-8 text-center text-xs text-zinc-500 font-semibold rounded-xl">
                      No registered hackathons.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {hackathons.map((h) => {
                        return (
                          <div key={h.id} className="bg-white border border-zinc-200 flex flex-col shadow-2xs rounded-xl overflow-hidden transition-all hover:border-zinc-300">
                            {/* Clickable Header */}
                            <div 
                              onClick={() => router.push(`/hackathons/${h.id}`)}
                              className="p-4 cursor-pointer hover:bg-zinc-50 transition-colors flex justify-between items-center group"
                            >
                              <div className="flex items-center gap-3">
                                {h.image ? (
                                  <img src={h.image} className="w-10 h-10 rounded-lg object-cover border border-zinc-200 shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 bg-zinc-100 border border-zinc-200 rounded-lg flex items-center justify-center text-sm font-bold text-zinc-500 shrink-0">
                                    H
                                  </div>
                                )}
                                <div>
                                  <h4 className="text-xs font-bold text-zinc-800 line-clamp-1">{h.title}</h4>
                                  <span className="text-[10px] font-semibold text-zinc-500">{h.sprints?.length || 0} Sprints</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-zinc-400 transition-transform duration-200 group-hover:translate-x-1" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Exams Roster */}
        {activeTab === "exams" && (
          <div className="space-y-4 font-normal">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Active Registrations</h3>
            </div>

            {registrations.length === 0 && hackathons.length === 0 ? (
              <div className="bg-white border border-zinc-200 shadow-sm p-12 text-center rounded-xl">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">No Registrations Found</p>
                <p className="text-zinc-400 text-xs mb-6 max-w-sm mx-auto leading-relaxed">
                  You have not registered for any hackathons or evaluations.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 max-w-3xl">
                {/* Hackathons Loop */}
                {hackathons.map((h) => (
                  <div key={h.id} className="bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden hover:border-orange-500/20 transition-all flex flex-row">
                    <div className="w-[180px] h-[180px] shrink-0 border-r border-zinc-200 overflow-hidden bg-zinc-50">
                      {h.image ? (
                        <img
                          src={h.image}
                          alt="Hackathon Banner"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <Code2 className="w-12 h-12 text-zinc-300 mb-2" />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hackathon</span>
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-zinc-950 tracking-tight leading-snug">{h.title}</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{h.description || "No description provided."}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-auto">
                        <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
                          {h.sprints && h.sprints.some((s: any) => s.isStarted) ? "Sprint Live" : "Waiting for Sprints"}
                        </span>
                        <Link
                          href={`/hackathons/${h.id}`}
                          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm inline-flex items-center gap-1 cursor-pointer"
                        >
                          View Details <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Sprints Lobby */}
        {activeTab === "sprints" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Code inputs to Join */}
              <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5 h-fit">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-900">Join Waiting Room</h3>
                  <p className="text-xs text-zinc-500 leading-normal">Enter the 6-digit lobby code given by the organizer to enter the waiting room.</p>
                </div>

                <form onSubmit={handleJoinSprintLobby} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Sprint Lobby Code</label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 365421"
                        value={lobbyCode}
                        onChange={(e) => setLobbyCode(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full text-xs py-2.5 pl-9 pr-3 border border-zinc-300 rounded-lg focus:outline-none focus:border-[#E61E32] font-mono tracking-widest font-bold"
                      />
                      <Key className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={joiningLobby}
                    className="w-full bg-[#E61E32] hover:bg-[#d01729] active:bg-[#b81223] text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {joiningLobby ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Room Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Join Wait Lobby</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {lobbyError && (
                  <p className="text-xs font-semibold text-red-500 flex items-center gap-1 bg-red-50 p-2.5 rounded-lg border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{lobbyError}</span>
                  </p>
                )}
                {lobbySuccess && (
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{lobbySuccess}</span>
                  </p>
                )}
              </div>

              {/* Right Column: Empty state — no dummy data */}
              <div className="lg:col-span-8">
                <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-4 min-h-[260px]">
                  <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center">
                    <Code2 className="w-7 h-7 text-zinc-400" strokeWidth={1.6} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-700">No Active Sprints</p>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                      You haven&apos;t joined any sprint rooms yet. Enter a lobby code to get started.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Community — all co-registered candidates */}
        {activeTab === "messages" && (
          <div className="flex-1 flex min-h-0 bg-white border border-zinc-200 shadow-sm overflow-hidden">
            {/* Left: Candidate list */}
            <div className="w-72 shrink-0 border-r border-zinc-200 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-zinc-200 bg-zinc-50 shrink-0 space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Registered Candidates</p>
                <input
                  type="text"
                  placeholder="Search by name or college..."
                  value={communitySearch}
                  onChange={(e) => setCommunitySearch(e.target.value)}
                  className="w-full text-xs py-1.5 px-3 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#E61E32] bg-white"
                />
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
                {communityLoading ? (
                  <div className="flex items-center justify-center h-32 text-xs text-zinc-400">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
                  </div>
                ) : community.filter(p =>
                  !communitySearch ||
                  p.name?.toLowerCase().includes(communitySearch.toLowerCase()) ||
                  p.college?.toLowerCase().includes(communitySearch.toLowerCase())
                ).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-xs text-zinc-400 gap-1">
                    <Users className="w-6 h-6 text-zinc-300" />
                    <span>No candidates found</span>
                  </div>
                ) : (
                  community
                    .filter(p =>
                      !communitySearch ||
                      p.name?.toLowerCase().includes(communitySearch.toLowerCase()) ||
                      p.college?.toLowerCase().includes(communitySearch.toLowerCase())
                    )
                    .map((person) => (
                      <button
                        key={person.id}
                        onClick={() => setSelectedPerson(person)}
                        className={`w-full text-left px-4 py-3 transition-all flex items-center gap-3 cursor-pointer ${
                          selectedPerson?.id === person.id ? "bg-zinc-100" : "hover:bg-zinc-50 bg-white"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0 uppercase">
                          {person.name?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 truncate">{person.name}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{person.college || "—"}</p>
                        </div>
                      </button>
                    ))
                )}
              </div>
              <div className="p-3 border-t border-zinc-200 bg-zinc-50 text-[10px] text-zinc-400 text-center">
                {community.length} candidate{community.length !== 1 ? "s" : ""} registered
              </div>
            </div>

            {/* Right: Candidate profile detail */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {selectedPerson ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Scrollable profile section */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Banner */}
                    <div className="h-24 bg-gradient-to-r from-[#E61E32] to-[#c8102e] relative">
                      {/* Connection action button floating on top-right of banner */}
                      <div className="absolute top-4 right-4 z-10">
                        {connectionLoading ? (
                          <div className="flex items-center gap-1.5 text-xs text-white bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-lg">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...
                          </div>
                        ) : connectionStatus.status === "accepted" ? (
                          <button
                            onClick={() => { setChatOpen(o => !o); }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-md cursor-pointer transition-all border-none"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            {chatOpen ? "Close Chat" : "Open Chat"}
                          </button>
                        ) : connectionStatus.status === "pending" && connectionStatus.direction === "sent" ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-xs text-white text-xs font-semibold rounded-lg border border-white/30">
                            <Clock className="w-3.5 h-3.5" /> Request Sent
                          </span>
                        ) : connectionStatus.status === "pending" && connectionStatus.direction === "received" ? (
                          <button
                            onClick={async () => {
                              setConnectionLoading(true);
                              await fetch("/api/candidate/connection", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ connection_id: connectionStatus.id, action: "accepted", my_name: candidate?.full_name }),
                              });
                              setConnectionStatus({ ...connectionStatus, status: "accepted" });
                              setConnectionLoading(false);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-semibold rounded-lg shadow-md cursor-pointer transition-all border-none"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accept Request
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              setConnectionLoading(true);
                              const res = await fetch("/api/candidate/connection", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ to_registration_id: selectedPerson.id, from_name: candidate?.full_name }),
                              });
                              if (res.ok) setConnectionStatus({ status: "pending", direction: "sent" });
                              setConnectionLoading(false);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-semibold rounded-lg shadow-md cursor-pointer transition-all border-none"
                          >
                            <User className="w-3.5 h-3.5" /> Add Friend
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="px-8 pb-6 -mt-10 relative">
                      <div className="flex items-end justify-between mb-3">
                        <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center text-2xl font-bold text-[#E61E32] uppercase">
                          {selectedPerson.name?.charAt(0) || "?"}
                        </div>
                      </div>

                      <h2 className="text-lg font-semibold text-zinc-900">{selectedPerson.name}</h2>
                      <p className="text-xs text-zinc-500 mt-0.5">{selectedPerson.department || "—"}{selectedPerson.year_of_study ? ` · Year ${selectedPerson.year_of_study}` : ""}</p>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-1">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">College</p>
                          <p className="text-sm font-semibold text-zinc-800">{selectedPerson.college || "Not specified"}</p>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-1">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Department</p>
                          <p className="text-sm font-semibold text-zinc-800">{selectedPerson.department || "Not specified"}</p>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-1">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Registered Exam</p>
                          <p className="text-sm font-semibold text-zinc-800">{selectedPerson.exam_name || "—"}</p>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-1">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Organizer</p>
                          <p className="text-sm font-semibold text-zinc-800">{selectedPerson.company_name || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat panel — shown only when connection is accepted and chat is open */}
                  {connectionStatus.status === "accepted" && chatOpen && (
                    <div className="h-72 border-t border-zinc-200 flex flex-col bg-white shrink-0">
                      <div className="px-4 py-2 border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Chat with {selectedPerson.name}
                      </div>
                      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                        {chatMessages.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-xs text-zinc-400">No messages yet. Say hi!</div>
                        ) : chatMessages.map((m) => (
                          <div key={m.id} className={`flex ${m.sender_email === candidate?.email ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                              m.sender_email === candidate?.email
                                ? "bg-[#E61E32] text-white rounded-br-none"
                                : "bg-zinc-100 text-zinc-800 rounded-bl-none"
                            }`}>
                              {m.message}
                            </div>
                          </div>
                        ))}
                      </div>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!chatInput.trim() || !connectionStatus.id) return;
                          setChatSending(true);
                          const res = await fetch("/api/candidate/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ connection_id: connectionStatus.id, message: chatInput, sender_name: candidate?.full_name }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setChatMessages(prev => [...prev, data.message]);
                            setChatInput("");
                          }
                          setChatSending(false);
                        }}
                        className="flex items-center gap-2 px-4 py-3 border-t border-zinc-100"
                      >
                        <input
                          type="text"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#E61E32] bg-zinc-50"
                        />
                        <button
                          type="submit"
                          disabled={chatSending || !chatInput.trim()}
                          className="px-3 py-2 bg-[#E61E32] hover:bg-[#d01729] disabled:bg-zinc-300 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          {chatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-3">
                  <Users className="w-10 h-10 text-zinc-300" strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-zinc-500">Select a candidate</p>
                  <p className="text-xs text-zinc-400 max-w-xs text-center leading-relaxed">
                    Choose someone from the list to view their profile and connect.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Invitations */}
        {activeTab === "invitations" && (
          <div className="space-y-8 max-w-3xl">
            {invitationsLoading ? (
              <div className="flex items-center justify-center h-40 text-xs text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading invitations...
              </div>
            ) : (
              <>
                {/* Received Pending Invitations */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2">
                    Received ({invitations.received.filter(r => r.status === "pending").length})
                  </h3>
                  {invitations.received.filter(r => r.status === "pending").length === 0 ? (
                    <p className="text-xs text-zinc-400 py-4">No pending invitations.</p>
                  ) : invitations.received.filter(r => r.status === "pending").map((inv) => (
                    <div key={inv.id} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center text-sm font-bold text-zinc-600 uppercase">
                          {inv.from_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{inv.from_name}</p>
                          <p className="text-[10px] text-zinc-400">Wants to connect with you</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            await fetch("/api/candidate/connection", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ connection_id: inv.id, action: "accepted", my_name: candidate?.full_name }),
                            });
                            fetchInvitations();
                          }}
                          className="px-3 py-1.5 bg-[#E61E32] hover:bg-[#d01729] text-white text-xs font-semibold rounded-lg cursor-pointer transition-all"
                        >
                          Accept
                        </button>
                        <button
                          onClick={async () => {
                            await fetch("/api/candidate/connection", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ connection_id: inv.id, action: "rejected", my_name: candidate?.full_name }),
                            });
                            fetchInvitations();
                          }}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-semibold rounded-lg cursor-pointer transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Accepted Connections — Friends */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2">
                    Friends ({[...invitations.sent, ...invitations.received].filter(r => r.status === "accepted").length})
                  </h3>
                  {[...invitations.sent, ...invitations.received].filter(r => r.status === "accepted").length === 0 ? (
                    <p className="text-xs text-zinc-400 py-4">No accepted connections yet.</p>
                  ) : [...invitations.sent, ...invitations.received].filter(r => r.status === "accepted").map((inv) => {
                    const friendName = inv.from_email === candidate?.email ? inv.to_name : inv.from_name;
                    return (
                      <div key={inv.id} className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-sm font-bold text-emerald-700 uppercase">
                              {friendName?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">{friendName}</p>
                              <p className="text-[10px] text-emerald-600 font-semibold">Connected</p>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (openChatConnectionId === inv.id) {
                                setOpenChatConnectionId(null);
                              } else {
                                setOpenChatConnectionId(inv.id);
                                setOpenChatMessages([]);
                                const r = await fetch(`/api/candidate/chat?connection=${inv.id}`);
                                const d = await r.json();
                                if (d.success) setOpenChatMessages(d.messages || []);
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            {openChatConnectionId === inv.id ? "Close Chat" : "Chat"}
                          </button>
                        </div>
                        {/* Inline chat panel */}
                        {openChatConnectionId === inv.id && (
                          <div className="border-t border-zinc-200 flex flex-col h-64 bg-zinc-50">
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                              {openChatMessages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-xs text-zinc-400">No messages yet. Say hi!</div>
                              ) : openChatMessages.map((m) => (
                                <div key={m.id} className={`flex ${m.sender_email === candidate?.email ? "justify-end" : "justify-start"}`}>
                                  <div className={`max-w-[70%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                                    m.sender_email === candidate?.email
                                      ? "bg-[#E61E32] text-white rounded-br-none"
                                      : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-none"
                                  }`}>
                                    {m.message}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                if (!openChatInput.trim()) return;
                                setOpenChatSending(true);
                                const res = await fetch("/api/candidate/chat", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ connection_id: inv.id, message: openChatInput, sender_name: candidate?.full_name }),
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setOpenChatMessages(prev => [...prev, data.message]);
                                  setOpenChatInput("");
                                }
                                setOpenChatSending(false);
                              }}
                              className="flex items-center gap-2 px-4 py-3 border-t border-zinc-200 bg-white"
                            >
                              <input
                                type="text"
                                value={openChatInput}
                                onChange={e => setOpenChatInput(e.target.value)}
                                placeholder={`Message ${friendName}...`}
                                className="flex-1 text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#E61E32] bg-zinc-50"
                              />
                              <button
                                type="submit"
                                disabled={openChatSending || !openChatInput.trim()}
                                className="px-3 py-2 bg-[#E61E32] hover:bg-[#d01729] disabled:bg-zinc-200 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all"
                              >
                                {openChatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Sent Pending Requests */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2">
                    Sent Requests ({invitations.sent.filter(r => r.status === "pending").length})
                  </h3>
                  {invitations.sent.filter(r => r.status === "pending").length === 0 ? (
                    <p className="text-xs text-zinc-400 py-4">No pending sent requests.</p>
                  ) : invitations.sent.filter(r => r.status === "pending").map((inv) => (
                    <div key={inv.id} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-500 uppercase">
                          {inv.to_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{inv.to_name || "Candidate"}</p>
                          <p className="text-[10px] text-zinc-400">Request pending</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg">
                        <Clock className="w-3.5 h-3.5" /> Awaiting response
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Profile settings */}
        {activeTab === "profile" && (
          <div className="space-y-6 font-normal">
            <div className="bg-white border border-zinc-200/80 shadow-xs p-6 sm:p-8 rounded-xl max-w-2xl">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-3.5 mb-6">Profile Settings</h3>
              
              {updateSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-850 text-xs font-semibold mb-5 rounded-lg flex items-center gap-1.5 border-l-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  Your candidate profile details have been successfully modified.
                </div>
              )}

              {updateError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold mb-5 rounded-lg">
                  {updateError}
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-5">
                {/* Name & Email (Disabled) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      type="text"
                      disabled
                      value={candidate?.full_name}
                      className="text-xs w-full py-2 px-3 border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-500 font-medium cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={candidate?.email}
                      className="text-xs w-full py-2 px-3 border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-500 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Phone contact */}
                <div>
                  <label htmlFor="edit-phone" className="block text-xs font-semibold text-zinc-750 mb-1.5">Phone Number *</label>
                  <input
                    id="edit-phone"
                    type="tel"
                    required
                    value={phoneVal}
                    onChange={(e) => setPhoneVal(e.target.value)}
                    className="text-xs w-full py-2.5 px-3.5 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:outline-none focus:border-[#E61E32] transition-colors"
                  />
                </div>

                {/* College & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-college" className="block text-xs font-semibold text-zinc-750 mb-1.5">College Name</label>
                    <input
                      id="edit-college"
                      type="text"
                      value={collegeVal}
                      onChange={(e) => setCollegeVal(e.target.value)}
                      className="text-xs w-full py-2.5 px-3.5 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:outline-none focus:border-[#E61E32] transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-dept" className="block text-xs font-semibold text-zinc-755 mb-1.5">Department / Branch</label>
                    <input
                      id="edit-dept"
                      type="text"
                      value={deptVal}
                      onChange={(e) => setDeptVal(e.target.value)}
                      className="text-xs w-full py-2.5 px-3.5 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:outline-none focus:border-[#E61E32] transition-colors"
                    />
                  </div>
                </div>

                {/* Submit actions */}
                <div className="pt-4 border-t border-zinc-150 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold text-xs uppercase tracking-wider rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 bg-[#E61E32] hover:bg-[#d01729] disabled:bg-zinc-400 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-xs cursor-pointer border-none"
                  >
                    {isUpdating ? "Saving..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        </div>

      </main>

    </div>
  );
}
