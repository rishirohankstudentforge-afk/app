"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Users, 
  Loader2, 
  AlertCircle,
  X,
  Search,
  ExternalLink,
  CheckCircle2,
  DollarSign,
  Filter,
  Shield,
  Clock,
  ArrowRight,
  FolderOpen,
  UploadCloud,
  Copy,
  Check,
  MapPin,
  Activity
} from "lucide-react";

interface Hackathon {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  teamSize: number;
  type: string;
  phases: string | null;
  image: string | null;
  prizeFirst: string | null;
  prizeSecond: string | null;
  prizeThird: string | null;
  perks: string | null;
  registrationFee: number;
  hasFee: boolean;
  createdAt: string;
  joinCode?: string | null;
  isStarted?: boolean;
  parentHackathonId?: string | null;
  questions?: string | null;
  logoUrl?: string | null;
  location?: string | null;
}

interface Team {
  id: string;
  name: string;
  hackathonId: string;
  createdAt?: string;
}

export default function AdminHackathonsPage() {
  const router = useRouter();

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [sprints, setSprints] = useState<Hackathon[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "create" | "create-sprint" | "list" | "teams">("overview");

  // Sprint Wizard states
  const [sprintStep, setSprintStep] = useState<1 | 2 | 3>(1);
  const [sprintTitle, setSprintTitle] = useState("");
  const [sprintDescription, setSprintDescription] = useState("");
  const [sprintDuration, setSprintDuration] = useState("60"); // duration in mins
  const [sprintType, setSprintType] = useState("Online"); // Online, In-Person, Hybrid
  const [sprintLocation, setSprintLocation] = useState(""); // URL or address
  const [sprintLogo, setSprintLogo] = useState<string>(""); // base64 logo representation
  const [sprintParentHackathon, setSprintParentHackathon] = useState("");
  const [logoDimensionsError, setLogoDimensionsError] = useState("");

  // Question feeding states
  const [questionType, setQuestionType] = useState<"coding" | "frontend" | "sql" | "quiz">("coding");
  
  // MCQ Questions array
  const [mcqQuestions, setMcqQuestions] = useState<Array<{
    questionText: string;
    options: { A: string; B: string; C: string; D: string };
    correctOption: "A" | "B" | "C" | "D";
  }>>([]);

  // Coding Questions array
  const [codingQuestions, setCodingQuestions] = useState<Array<{
    title: string;
    problemDescription: string;
    codeTemplate: string;
    testCases: Array<{ input: string; expectedOutput: string }>;
    languageCategory?: "coding" | "frontend" | "sql";
  }>>([]);

  // New MCQ temporary inputs
  const [tempMcqText, setTempMcqText] = useState("");
  const [tempMcqA, setTempMcqA] = useState("");
  const [tempMcqB, setTempMcqB] = useState("");
  const [tempMcqC, setTempMcqC] = useState("");
  const [tempMcqD, setTempMcqD] = useState("");
  const [tempMcqCorrect, setTempMcqCorrect] = useState<"A" | "B" | "C" | "D">("A");

  // New Coding temporary inputs
  const [tempCodeTitle, setTempCodeTitle] = useState("");
  const [tempCodeDesc, setTempCodeDesc] = useState("");
  const [tempCodeTemplate, setTempCodeTemplate] = useState("function solution() {\n  // Write your code here\n}");
  const [tempTestInput1, setTempTestInput1] = useState("");
  const [tempTestOutput1, setTempTestOutput1] = useState("");
  const [tempTestInput2, setTempTestInput2] = useState("");
  const [tempTestOutput2, setTempTestOutput2] = useState("");

  // Resulting Room details after submission
  const [createdSprint, setCreatedSprint] = useState<any>(null);
  const [lobbyParticipants, setLobbyParticipants] = useState<any[]>([]);

  // Real-time Clock
  const [clockTime, setClockTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [teamSize, setTeamSize] = useState(4);
  const [type, setType] = useState("Online");
  const [phases, setPhases] = useState("");
  const [image, setImage] = useState("");
  const [prizeFirst, setPrizeFirst] = useState("");
  const [prizeSecond, setPrizeSecond] = useState("");
  const [prizeThird, setPrizeThird] = useState("");
  const [perks, setPerks] = useState("");
  const [registrationFee, setRegistrationFee] = useState(0);
  const [hasFee, setHasFee] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Edit Modal State
  const [editingHackathon, setEditingHackathon] = useState<Hackathon | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSprintDuration, setEditSprintDuration] = useState("60");

  // Sprint Wizard helper functions
  const handleLogoUpload = (file: File) => {
    setLogoDimensionsError("");
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };

    img.onload = () => {
      if (img.width !== 1200 || img.height !== 1200) {
        setLogoDimensionsError(`Invalid dimensions: ${img.width}x${img.height}px. Logo must be exactly 1200 x 1200 pixels.`);
        setSprintLogo("");
      } else {
        setSprintLogo(img.src);
        setLogoDimensionsError("");
      }
    };

    reader.readAsDataURL(file);
  };

  const resetSprintForm = () => {
    setSprintStep(1);
    setSprintTitle("");
    setSprintDescription("");
    setSprintDuration("60");
    setSprintType("Online");
    setSprintLocation("");
    setSprintLogo("");
    setSprintParentHackathon("");
    setLogoDimensionsError("");
    setMcqQuestions([]);
    setCodingQuestions([]);
    setTempMcqText("");
    setTempMcqA("");
    setTempMcqB("");
    setTempMcqC("");
    setTempMcqD("");
    setTempMcqCorrect("A");
    setTempCodeTitle("");
    setTempCodeDesc("");
    setTempCodeTemplate("function solution() {\n  // Write your code here\n}");
    setTempTestInput1("");
    setTempTestOutput1("");
    setTempTestInput2("");
    setTempTestOutput2("");
    setCreatedSprint(null);
    setLobbyParticipants([]);
  };

  const handleSprintSubmit = async () => {
    if (!sprintTitle) {
      alert("Sprint Name is required.");
      return;
    }
    
    if (!sprintParentHackathon) {
      alert("Please select an Associated Hackathon.");
      return;
    }

    const payload = {
      title: sprintTitle,
      description: sprintDescription,
      startDate: new Date(),
      endDate: new Date(Date.now() + parseInt(sprintDuration) * 60 * 1000),
      teamSize: 1, // Individual candidate
      logoUrl: sprintLogo,
      location: sprintLocation,
      type: sprintType,
      parentHackathonId: sprintParentHackathon,
      questions: {
        type: questionType,
        list: questionType === "coding" ? codingQuestions : mcqQuestions
      }
    };

    try {
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setCreatedSprint(data.data);
        setSprintStep(3);
        // Refresh local list of hackathons/sprints
        fetchData();
      } else {
        alert(data.error || "Failed to create sprint.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting sprint.");
    }
  };

  const handleStartSprint = async () => {
    if (!createdSprint) return;
    try {
      const res = await fetch(`/api/sprints/${createdSprint.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarted: true })
      });
      const data = await res.json();
      if (data.success) {
        setCreatedSprint(data.data);
        alert("Sprint has been started successfully! Waiting room candidates will be auto-redirected.");
      } else {
        alert("Failed to start sprint: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error starting sprint.");
    }
  };

  const handleStopSprint = async () => {
    if (!createdSprint) return;
    if (!confirm("Are you sure you want to STOP this sprint? Active participants will be kicked to the waiting room.")) return;
    try {
      const res = await fetch(`/api/sprints/${createdSprint.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarted: false })
      });
      const data = await res.json();
      if (data.success) {
        setCreatedSprint(data.data);
        alert("Sprint has been stopped. Active candidates are being redirected.");
      } else {
        alert("Failed to stop sprint: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error stopping sprint.");
    }
  };

  // Lobby Polling Effect
  useEffect(() => {
    if (activeTab !== "create-sprint" || sprintStep !== 3 || !createdSprint) return;
    
    const pollParticipants = async () => {
      try {
        const res = await fetch(`/api/sprints/participants?sprintId=${createdSprint.id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setLobbyParticipants(data.data);
        }
      } catch (err) {
        console.error("Lobby polling error:", err);
      }
    };

    pollParticipants();
    const interval = setInterval(pollParticipants, 3000);
    return () => clearInterval(interval);
  }, [activeTab, sprintStep, createdSprint]);

  // Fetch real data from database (No mock/dummy fallback)
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Hackathons (non-sprints only)
      const hRes = await fetch("/api/hackathons");
      const hText = await hRes.text();
      let hJson;
      try { hJson = JSON.parse(hText); } catch { hJson = { success: true, data: [] }; }
      if (hJson && hJson.success && Array.isArray(hJson.data)) {
        setHackathons(hJson.data);
      } else {
        setHackathons([]);
      }

      // Fetch all Sprints separately
      const sRes = await fetch("/api/sprints");
      const sText = await sRes.text();
      let sJson;
      try { sJson = JSON.parse(sText); } catch { sJson = { success: true, data: [] }; }
      if (sJson && sJson.success && Array.isArray(sJson.data)) {
        setSprints(sJson.data);
      } else {
        setSprints([]);
      }

      // Fetch Registered Teams
      const tRes = await fetch("/api/teams");
      const tText = await tRes.text();
      let tJson;
      try { tJson = JSON.parse(tText); } catch { tJson = { success: true, data: [] }; }
      if (tJson && tJson.success && Array.isArray(tJson.data)) {
        setTeams(tJson.data);
      } else {
        setTeams([]);
      }
    } catch (err) {
      console.error("Error fetching organizer data:", err);
      setHackathons([]);
      setSprints([]);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    document.cookie = "organizer_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/organizer-login");
  };

  const handleCreateHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) {
      setErrorMsg("Title, start date, and end date are required.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      startDate,
      endDate,
      teamSize: Number(teamSize) || 4,
      type,
      phases: phases.trim() || null,
      image: image.trim() || null,
      prizeFirst: prizeFirst.trim() || null,
      prizeSecond: prizeSecond.trim() || null,
      prizeThird: prizeThird.trim() || null,
      perks: perks.trim() || null,
      registrationFee: Number(registrationFee) || 0,
      hasFee,
    };

    try {
      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { json = { success: true }; }

      if (json && json.success) {
        setSuccessMsg("Hackathon created and published successfully!");
        setTitle("");
        setDescription("");
        setStartDate("");
        setEndDate("");
        setPhases("");
        setImage("");
        setPrizeFirst("");
        setPrizeSecond("");
        setPrizeThird("");
        setPerks("");
        fetchData();
        setActiveTab("overview");
      } else {
        setErrorMsg(json.error || "Failed to create hackathon.");
      }
    } catch {
      setErrorMsg("Network error. Failed to publish hackathon.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHackathon) return;

    setSaving(true);
    setErrorMsg("");

    const payload = {
      title,
      description: description.trim() || null,
      startDate,
      endDate,
      teamSize: Number(teamSize) || 4,
      type,
      phases: phases.trim() || null,
      image: image.trim() || null,
      prizeFirst: prizeFirst.trim() || null,
      prizeSecond: prizeSecond.trim() || null,
      prizeThird: prizeThird.trim() || null,
      perks: perks.trim() || null,
      registrationFee: Number(registrationFee) || 0,
      hasFee,
    };

    if (editingHackathon.parentHackathonId) {
      const dur = Number(editSprintDuration);
      if (!isNaN(dur)) {
        payload.startDate = new Date(editingHackathon.startDate).toISOString();
        payload.endDate = new Date(new Date(editingHackathon.startDate).getTime() + dur * 60 * 1000).toISOString();
      }
    }

    try {
      const res = await fetch(`/api/hackathons/${editingHackathon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { json = { success: true }; }

      if (json && json.success) {
        setIsEditModalOpen(false);
        fetchData();
      } else {
        setErrorMsg(json.error || "Failed to update hackathon");
      }
    } catch {
      setErrorMsg("Network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hackathon?")) return;

    try {
      setHackathons(prev => prev.filter(h => h.id !== id));
      await fetch(`/api/hackathons/${id}`, { method: "DELETE" });
      fetchData();
    } catch {
      fetchData();
    }
  };

  const openEditModal = (h: Hackathon) => {
    setEditingHackathon(h);
    setTitle(h.title);
    setDescription(h.description || "");
    try {
      setStartDate(new Date(h.startDate).toISOString().split("T")[0]);
      setEndDate(new Date(h.endDate).toISOString().split("T")[0]);
      
      // Calculate duration for sprint edit
      if (h.parentHackathonId) {
        const diff = Math.ceil((new Date(h.endDate).getTime() - new Date(h.startDate).getTime()) / 60000);
        setEditSprintDuration(diff.toString());
      }
    } catch {
      setStartDate("");
      setEndDate("");
      setEditSprintDuration("60");
    }
    setTeamSize(h.teamSize);
    setType(h.type || "Online");
    setPhases(h.phases || "");
    setImage(h.image || "");
    setPrizeFirst(h.prizeFirst || "");
    setPrizeSecond(h.prizeSecond || "");
    setPrizeThird(h.prizeThird || "");
    setPerks(h.perks || "");
    setRegistrationFee(h.registrationFee || 0);
    setHasFee(!!h.hasFee);
    setErrorMsg("");
    setIsEditModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Compute total prize sum from real database records
  const calculateTotalPrizes = () => {
    let total = 0;
    hackathons.forEach(h => {
      [h.prizeFirst, h.prizeSecond, h.prizeThird].forEach(p => {
        if (p) {
          const num = parseInt(p.replace(/[^0-9]/g, ""), 10);
          if (!isNaN(num)) total += num;
        }
      });
    });
    return total > 0 ? `₹${total.toLocaleString("en-IN")}` : "₹0";
  };

  const filteredHackathons = hackathons.filter(h =>
    h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 flex flex-col font-sans">
      
      {/* TOP HEADER (Matching Exam Controller Dashboard) */}
      <header className="bg-white border-b border-zinc-200 px-4 md:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <img
            src="https://ik.imagekit.io/dypkhqxip/redlix%20new?updatedAt=1781042212493"
            alt="Redlix Logo"
            className="h-9 w-auto object-contain shrink-0"
          />
          <div className="flex items-center gap-2 border-l border-zinc-200 pl-3">
            <span className="font-semibold text-sm text-zinc-900 tracking-tight font-inter">Organizer Console</span>
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

          <Link
            href="/hackathons"
            className="hidden md:flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Catalog</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-[#E61E32] hover:bg-[#d01729] active:bg-[#b81223] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* RED SUB-NAVBAR (Matching Exam Controller Dashboard) */}
      <div className="bg-[#E61E32] text-white shadow-md px-4 md:px-8 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1">
            {[
              { id: "overview", label: "Overview", icon: "grid_view" },
              { id: "create", label: "Create Hackathon", icon: "add_task" },
              { id: "create-sprint", label: "Create Sprint", icon: "timer" },
              { id: "list", label: "All Sprints & Events", icon: "folder_open" },
              { id: "teams", label: "Registered Teams", icon: "groups" },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
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

      {/* MAIN BODY */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-100">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-t-[#E61E32] border-r-zinc-200 border-b-zinc-200 border-l-zinc-200 animate-spin mb-4" />
            <p className="text-zinc-500 text-xs font-medium">Fetching real organizer database records...</p>
          </div>
        ) : activeTab === "overview" ? (
          /* TAB 1: OVERVIEW */
          <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
            
            {/* 4 STATS CARDS (NO MOCK DATA) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white py-3 px-4 border border-zinc-200/80 rounded-xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-[105px]">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Total Hackathons</span>
                    <div className="text-xl md:text-2xl font-semibold text-zinc-900 font-inter mt-0.5">{hackathons.length}</div>
                  </div>
                  <div className="p-1.5 bg-[#E61E32]/10 text-[#E61E32] border border-[#E61E32]/20 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">folder_open</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">Real events published in database</p>
              </div>

              <div className="bg-white py-3 px-4 border border-zinc-200/80 rounded-xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-[105px]">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Registered Teams</span>
                    <div className="text-xl md:text-2xl font-semibold text-zinc-900 font-inter mt-0.5">{teams.length}</div>
                  </div>
                  <div className="p-1.5 bg-blue-50 text-blue-600 border border-blue-200/80 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">groups</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">Actual registered participant teams</p>
              </div>

              <div className="bg-white py-3 px-4 border border-zinc-200/80 rounded-xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-[105px]">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Total Prize Pool</span>
                    <div className="text-xl md:text-2xl font-semibold text-zinc-900 font-inter mt-0.5">{calculateTotalPrizes()}</div>
                  </div>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200/80 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">payments</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">Calculated from event rewards</p>
              </div>

              <div className="bg-white py-3 px-4 border border-zinc-200/80 rounded-xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-[105px]">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Evaluation Engine</span>
                    <div className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                    </div>
                  </div>
                  <div className="p-1.5 bg-purple-50 text-purple-600 border border-purple-200/80 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">shield</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">Ready to accept team code</p>
              </div>

            </div>

            {/* HACKATHONS LIST / EMPTY STATE */}
            {hackathons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 max-w-4xl mx-auto text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-zinc-900 font-inter">No active events created yet</h2>
                  <p className="text-xs text-zinc-500 max-w-md">
                    Get started by setting up coding challenges or quizzes for your candidates.
                  </p>
                </div>

                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white border border-zinc-200/80 rounded-2xl shadow-md hover:shadow-xl transition-all text-left flex flex-col md:flex-row max-w-2xl w-full overflow-hidden group"
                >
                  {/* Left content block */}
                  <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
                    <div>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-100 uppercase inline-block w-fit mb-3">
                        Sprint Engine
                      </span>
                      <h3 className="text-lg font-black text-zinc-900 leading-snug">
                        Host Coding Challenges &amp; Quizzes
                      </h3>
                      <p className="text-xs text-zinc-500 mt-2 leading-relaxed font-normal">
                        Deploy automated code compilers, design custom programming challenges with hidden test cases, and publish online multiple-choice quizzes.
                      </p>

                      <ul className="mt-5 space-y-2.5 text-[11px] font-semibold text-zinc-650">
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Automated Code Compile &amp; Run</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Hidden Test Case Validation</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Multiple Choice Question Assessments</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-zinc-100">
                      <button
                        onClick={() => {
                          setType("Online");
                          setTeamSize(1);
                          setTitle("");
                          setDescription("");
                          setActiveTab("create-sprint");
                        }}
                        className="w-full md:w-auto bg-[#E61E32] hover:bg-[#d01729] active:bg-[#b81223] text-white text-xs font-extrabold py-2.5 px-5 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <span>Initialize Sprint</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Right illustration block */}
                  <div className="md:w-72 shrink-0 h-48 md:h-auto relative overflow-hidden bg-zinc-900">
                    <img
                      src="/coding_sprint.jpg"
                      alt="Coding Sprint Illustration"
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-white via-transparent to-transparent opacity-10 md:opacity-20 pointer-events-none" />
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
                <div className="p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-zinc-900">Published Hackathons</h2>
                    <p className="text-xs text-zinc-500">Live events stored in your organizer database</p>
                  </div>

                  <button
                    onClick={() => setActiveTab("create-sprint")}
                    className="bg-[#E61E32] hover:bg-[#d01729] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Create Sprint</span>
                  </button>
                </div>

                <div className="divide-y divide-zinc-200">
                  {hackathons.filter(h => !h.joinCode).map((h) => (
                    <div key={h.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50/80 transition-colors">
                      <div className="flex items-start gap-4">
                        <img
                          src={h.image || "https://ik.imagekit.io/dypkhqxip/technical%20Wing.png"}
                          alt={h.title}
                          className="w-16 h-16 rounded-lg object-cover border border-zinc-200 shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-red-50 text-[#E61E32] text-[10px] font-bold rounded-md border border-red-100 uppercase">
                              {h.type || "Online"}
                            </span>
                            <span className="text-xs text-zinc-500 font-medium">
                              Team Size: {h.teamSize}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-zinc-900 leading-snug">{h.title}</h3>
                          <p className="text-xs text-zinc-500 line-clamp-1">{h.description || "No description."}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        <div className="text-right text-xs text-zinc-500 hidden md:block">
                          <div>Starts: {formatDate(h.startDate)}</div>
                          <div>Ends: {formatDate(h.endDate)}</div>
                        </div>

                        <button
                          onClick={() => openEditModal(h)}
                          className="p-2 text-zinc-600 hover:text-[#E61E32] hover:bg-zinc-100 rounded-lg transition-all cursor-pointer border border-zinc-200"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(h.id)}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer border border-zinc-200"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : activeTab === "create-sprint" ? (
          /* TAB: CREATE SPRINT WIZARD */
          <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
            {/* WIZARD STEP HEADER */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <h2 className="text-lg font-black text-zinc-900 font-inter tracking-tight">Create Sprint Room</h2>
                <p className="text-xs text-zinc-550">Configure parameters, feed coding or MCQ questions, and launch real-time waiting rooms.</p>
              </div>
              
              {/* Stepper progress indicator */}
              <div className="flex items-center gap-2 md:gap-4 select-none">
                {[
                  { step: 1, label: "Setup Details" },
                  { step: 2, label: "Feed Questions" },
                  { step: 3, label: "Live Lobby" }
                ].map((item, idx) => {
                  const isActive = sprintStep === item.step;
                  const isCompleted = sprintStep > item.step;
                  return (
                    <div key={item.step} className="flex items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                          isActive 
                            ? "bg-[#E61E32] text-white shadow-sm scale-110" 
                            : isCompleted 
                              ? "bg-emerald-500 text-white" 
                              : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                        }`}>
                          {isCompleted ? "✓" : item.step}
                        </div>
                        <span className={`text-xs font-bold transition-all ${
                          isActive 
                            ? "text-[#E61E32] font-extrabold" 
                            : isCompleted 
                              ? "text-emerald-600 font-extrabold" 
                              : "text-zinc-550"
                        }`}>
                          {item.label}
                        </span>
                      </div>
                      {idx < 2 && (
                        <div className={`h-[2px] w-6 md:w-10 ml-2 md:ml-4 rounded ${
                          sprintStep > item.step ? "bg-emerald-400" : "bg-zinc-200"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {sprintStep === 1 ? (
              /* STEP 1: SPRINT DETAILS */
              <div className="bg-white border border-zinc-200 rounded-xl shadow-xs p-6 md:p-8 space-y-6">
                <div className="border-b border-zinc-200 pb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900 font-inter">Configure Sprint Profile</h3>
                    <p className="text-[11px] text-zinc-550">Provide basic meta parameters and room banner logo.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Logo & Type */}
                  <div className="space-y-5">
                    {/* Logo Dropzone */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">Sprint Logo (1200 x 1200 px) *</label>
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                        onClick={() => document.getElementById("sprint-logo-input")?.click()}
                        className="border-dashed border-2 border-zinc-200 hover:border-emerald-500/80 rounded-xl py-12 px-8 text-center cursor-pointer transition-all bg-zinc-50/30 hover:bg-zinc-100/40 flex flex-col items-center justify-center space-y-3 group h-48"
                      >
                        <input 
                          id="sprint-logo-input" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file);
                          }}
                        />
                        {sprintLogo ? (
                          <div className="space-y-2 flex flex-col items-center">
                            <img src={sprintLogo} alt="Logo preview" className="w-24 h-24 object-contain rounded-lg border border-zinc-200 shadow-sm" />
                            <span className="text-[11px] font-bold text-emerald-600">Logo loaded successfully</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-zinc-100 group-hover:bg-emerald-50 text-zinc-455 group-hover:text-emerald-600 flex items-center justify-center transition-all border border-zinc-200/50 shadow-2xs">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-zinc-800">Drag &amp; drop logo here, or click to browse</p>
                              <p className="text-[10px] text-zinc-500">Image size must be exactly 1200 x 1200 pixels</p>
                            </div>
                          </>
                        )}
                      </div>
                      {logoDimensionsError && (
                        <p className="text-xs font-bold text-red-650 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{logoDimensionsError}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">Type of Sprint *</label>
                      <select
                        value={sprintType}
                        onChange={(e) => setSprintType(e.target.value)}
                        className="w-full text-xs py-2.5 px-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32] focus:ring-1 focus:ring-[#E61E32]/20 hover:border-zinc-450 transition-all cursor-pointer font-medium"
                      >
                        <option value="Online">Online Sprints &amp; Tests</option>
                        <option value="In-Person">In-Person Coding Room</option>
                        <option value="Hybrid">Hybrid Event</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column: Meta details */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">Associated Hackathon *</label>
                      <div className="relative rounded-lg shadow-2xs">
                        <select
                          required
                          value={sprintParentHackathon}
                          onChange={(e) => setSprintParentHackathon(e.target.value)}
                          className="w-full text-xs py-2.5 pl-3 pr-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32] focus:ring-1 focus:ring-[#E61E32]/20 hover:border-zinc-450 transition-all font-medium appearance-none"
                        >
                          <option value="" disabled>Select a Hackathon</option>
                          {hackathons.map((h) => (
                            <option key={h.id} value={h.id}>{h.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">Sprint Title / Name *</label>
                      <div className="relative rounded-lg shadow-2xs">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Speedrun Code Sprint 2026"
                          value={sprintTitle}
                          onChange={(e) => setSprintTitle(e.target.value)}
                          className="w-full text-xs py-2.5 pl-9 pr-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32] focus:ring-1 focus:ring-[#E61E32]/20 hover:border-zinc-450 transition-all font-medium"
                        />
                        <FolderOpen className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">Description</label>
                      <textarea
                        rows={3}
                        placeholder="Describe the challenge goals and programming topics..."
                        value={sprintDescription}
                        onChange={(e) => setSprintDescription(e.target.value)}
                        className="w-full text-xs p-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32] focus:ring-1 focus:ring-[#E61E32]/20 hover:border-zinc-455 transition-all resize-none font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">Duration (Minutes)</label>
                        <div className="relative rounded-lg shadow-2xs">
                          <input
                            type="number"
                            value={sprintDuration}
                            onChange={(e) => setSprintDuration(e.target.value)}
                            className="w-full text-xs py-2.5 pl-9 pr-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32] focus:ring-1 focus:ring-[#E61E32]/20 hover:border-zinc-455 transition-all font-medium"
                          />
                          <Clock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">Location / Room URL</label>
                        <div className="relative rounded-lg shadow-2xs">
                          <input
                            type="text"
                            placeholder="e.g. Room A-2 or Zoom URL"
                            value={sprintLocation}
                            onChange={(e) => setSprintLocation(e.target.value)}
                            className="w-full text-xs py-2.5 pl-9 pr-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32] focus:ring-1 focus:ring-[#E61E32]/20 hover:border-zinc-455 transition-all font-medium"
                          />
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 flex justify-end">
                  <button
                    onClick={() => {
                      if (!sprintTitle) {
                        alert("Please fill in the Sprint Title.");
                        return;
                      }
                      setSprintStep(2);
                    }}
                    className="bg-[#E61E32] hover:bg-[#d01729] active:bg-[#b81223] text-white text-xs font-black py-2.5 px-5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:shadow-md hover:scale-[1.01]"
                  >
                    <span>Continue to Feed Questions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : sprintStep === 2 ? (
              /* STEP 2: FEED QUESTIONS */
              <div className="bg-white border border-zinc-200 rounded-xl shadow-xs p-6 md:p-8 space-y-6">
                <div className="border-b border-zinc-200 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Step 2: Feed Room Questions</h3>
                    <p className="text-xs text-zinc-500">Provide programming test cases or multiple choice question details.</p>
                  </div>
                  <button
                    onClick={() => setSprintStep(1)}
                    className="text-xs font-bold text-zinc-650 hover:text-zinc-950 border border-zinc-350 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Back to Details
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 max-w-xs">
                    <label className="block text-xs font-bold text-zinc-700 uppercase">Question Format *</label>
                      <select
                        value={questionType}
                        onChange={(e) => {
                          setQuestionType(e.target.value as "coding" | "frontend" | "sql" | "quiz");
                          setCodingQuestions([]);
                          setMcqQuestions([]);
                        }}
                        className="w-full text-xs py-2.5 px-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32]"
                      >
                        <option value="coding">Algorithmic (C/C++/Python/Java/JS)</option>
                        <option value="frontend">Frontend Web (HTML/CSS/JS)</option>
                        <option value="sql">Database Query (SQL)</option>
                        <option value="quiz">Multiple Choice Quiz (MCQ)</option>
                      </select>
                  </div>

                  {["coding", "frontend", "sql"].includes(questionType) ? (
                    /* CODING QUESTION SETUP */
                    <div className="space-y-4 border border-zinc-200/80 rounded-xl p-5 bg-zinc-50/50">
                      <h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
                        Add {questionType === "frontend" ? "Frontend" : questionType === "sql" ? "SQL" : "Coding"} Question
                      </h4>
                      
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-650">Question Title *</label>
                        <input
                          type="text"
                          placeholder="e.g. Reverse String"
                          value={tempCodeTitle}
                          onChange={(e) => setTempCodeTitle(e.target.value)}
                          className="w-full text-xs py-2.5 px-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-650">Problem Description *</label>
                        <textarea
                          rows={3}
                          placeholder="Provide input limits, instructions, and examples..."
                          value={tempCodeDesc}
                          onChange={(e) => setTempCodeDesc(e.target.value)}
                          className="w-full text-xs p-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-650">Initial Starter Template Code *</label>
                        <textarea
                          rows={4}
                          value={tempCodeTemplate}
                          onChange={(e) => setTempCodeTemplate(e.target.value)}
                          className="w-full text-xs p-3 font-mono border border-zinc-300 rounded-lg bg-zinc-950 text-emerald-400 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-zinc-200 rounded-lg p-3 bg-white space-y-2">
                          <span className="text-[10px] font-extrabold text-[#E61E32] uppercase">
                            {questionType === "frontend" ? "Test Case 1 (e.g. DOM query)" : "Test Case 1"}
                          </span>
                          <input
                            type="text"
                            placeholder={questionType === "frontend" ? "Selector (e.g. 'button.submit')" : "Input (e.g. 'hello')"}
                            value={tempTestInput1}
                            onChange={(e) => setTempTestInput1(e.target.value)}
                            className="w-full text-xs py-1.5 px-2 border border-zinc-200 rounded"
                          />
                          <input
                            type="text"
                            placeholder={questionType === "frontend" ? "Expected Check (e.g. 'exists')" : "Expected Output (e.g. 'olleh')"}
                            value={tempTestOutput1}
                            onChange={(e) => setTempTestOutput1(e.target.value)}
                            className="w-full text-xs py-1.5 px-2 border border-zinc-200 rounded"
                          />
                        </div>

                        <div className="border border-zinc-200 rounded-lg p-3 bg-white space-y-2">
                          <span className="text-[10px] font-extrabold text-[#E61E32] uppercase">
                            {questionType === "frontend" ? "Test Case 2 (Hidden)" : "Test Case 2 (Hidden)"}
                          </span>
                          <input
                            type="text"
                            placeholder={questionType === "frontend" ? "Selector (e.g. '.error-text')" : "Input (e.g. 'sprint')"}
                            value={tempTestInput2}
                            onChange={(e) => setTempTestInput2(e.target.value)}
                            className="w-full text-xs py-1.5 px-2 border border-zinc-200 rounded"
                          />
                          <input
                            type="text"
                            placeholder={questionType === "frontend" ? "Expected Check (e.g. 'color: red')" : "Expected Output (e.g. 'tnirps')"}
                            value={tempTestOutput2}
                            onChange={(e) => setTempTestOutput2(e.target.value)}
                            className="w-full text-xs py-1.5 px-2 border border-zinc-200 rounded"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!tempCodeTitle || !tempCodeDesc || !tempTestOutput1) {
                            alert("Please fill in the question title, description, and test case expected outputs.");
                            return;
                          }
                          setCodingQuestions([...codingQuestions, {
                            title: tempCodeTitle,
                            problemDescription: tempCodeDesc,
                            codeTemplate: tempCodeTemplate,
                            languageCategory: questionType as "coding" | "frontend" | "sql",
                            testCases: [
                              { input: tempTestInput1, expectedOutput: tempTestOutput1 },
                              { input: tempTestInput2, expectedOutput: tempTestOutput2 }
                            ]
                          }]);
                          setTempCodeTitle("");
                          setTempCodeDesc("");
                          setTempCodeTemplate(
                            questionType === "frontend" ? "<!-- Write HTML/CSS/JS here -->\n<div></div>" :
                            questionType === "sql" ? "-- Write your SQL query here\nSELECT * FROM table;" :
                            "function solution() {\n  // Write your code here\n}"
                          );
                          setTempTestInput1("");
                          setTempTestOutput1("");
                          setTempTestInput2("");
                          setTempTestOutput2("");
                        }}
                        className="bg-[#E61E32] hover:bg-[#d01729] text-white text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
                      >
                        Add to Question List
                      </button>
                    </div>
                  ) : (
                    /* MCQ QUESTION SETUP */
                    <div className="space-y-4 border border-zinc-200/80 rounded-xl p-5 bg-zinc-50/50">
                      <h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">Add MCQ Quiz Question</h4>
                      
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-650">Question Text *</label>
                        <input
                          type="text"
                          placeholder="e.g. Which keyword is used to define a constant variable in ES6?"
                          value={tempMcqText}
                          onChange={(e) => setTempMcqText(e.target.value)}
                          className="w-full text-xs py-2.5 px-3 border border-zinc-300 rounded-lg bg-white focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-500">Option A *</label>
                          <input type="text" value={tempMcqA} onChange={(e) => setTempMcqA(e.target.value)} className="w-full text-xs py-2 px-3 border border-zinc-200 rounded-lg" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-500">Option B *</label>
                          <input type="text" value={tempMcqB} onChange={(e) => setTempMcqB(e.target.value)} className="w-full text-xs py-2 px-3 border border-zinc-200 rounded-lg" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-500">Option C *</label>
                          <input type="text" value={tempMcqC} onChange={(e) => setTempMcqC(e.target.value)} className="w-full text-xs py-2 px-3 border border-zinc-200 rounded-lg" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-500">Option D *</label>
                          <input type="text" value={tempMcqD} onChange={(e) => setTempMcqD(e.target.value)} className="w-full text-xs py-2 px-3 border border-zinc-200 rounded-lg" />
                        </div>
                      </div>

                      <div className="space-y-1.5 max-w-xs">
                        <label className="block text-xs font-bold text-zinc-700 uppercase">Correct Option *</label>
                        <select
                          value={tempMcqCorrect}
                          onChange={(e) => setTempMcqCorrect(e.target.value as any)}
                          className="w-full text-xs py-2 px-3 border border-zinc-300 rounded-lg bg-white"
                        >
                          <option value="A">Option A</option>
                          <option value="B">Option B</option>
                          <option value="C">Option C</option>
                          <option value="D">Option D</option>
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          if (!tempMcqText || !tempMcqA || !tempMcqB) {
                            alert("Please fill in the question text and options A and B.");
                            return;
                          }
                          setMcqQuestions([...mcqQuestions, {
                            questionText: tempMcqText,
                            options: { A: tempMcqA, B: tempMcqB, C: tempMcqC, D: tempMcqD },
                            correctOption: tempMcqCorrect
                          }]);
                          setTempMcqText("");
                          setTempMcqA("");
                          setTempMcqB("");
                          setTempMcqC("");
                          setTempMcqD("");
                          setTempMcqCorrect("A");
                        }}
                        className="bg-[#E61E32] hover:bg-[#d01729] text-white text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
                      >
                        Add to Question List
                      </button>
                    </div>
                  )}

                  {/* RENDER CURRENT FEED OF QUESTIONS */}
                  <div className="space-y-3 pt-4">
                    <h4 className="text-xs font-extrabold text-zinc-900 uppercase">Feed Preview ({questionType === "coding" ? codingQuestions.length : mcqQuestions.length} Questions added)</h4>
                    {questionType === "coding" && codingQuestions.length === 0 && (
                      <p className="text-xs text-zinc-500 italic">No programming challenges added yet.</p>
                    )}
                    {questionType === "quiz" && mcqQuestions.length === 0 && (
                      <p className="text-xs text-zinc-500 italic">No multiple choice quiz questions added yet.</p>
                    )}

                    <div className="space-y-2">
                      {questionType === "coding" ? codingQuestions.map((q, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 border border-zinc-200 rounded-lg bg-white">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-500 mr-2">Q{idx+1}</span>
                            <span className="text-xs font-bold text-zinc-900">{q.title}</span>
                            <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{q.problemDescription}</p>
                          </div>
                          <button
                            onClick={() => setCodingQuestions(codingQuestions.filter((_, i) => i !== idx))}
                            className="p-1.5 text-zinc-400 hover:text-red-650 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )) : mcqQuestions.map((q, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 border border-zinc-200 rounded-lg bg-white">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-500 mr-2">Q{idx+1}</span>
                            <span className="text-xs font-bold text-zinc-900">{q.questionText}</span>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Correct: Option {q.correctOption}</p>
                          </div>
                          <button
                            onClick={() => setMcqQuestions(mcqQuestions.filter((_, i) => i !== idx))}
                            className="p-1.5 text-zinc-400 hover:text-red-650 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 flex justify-between">
                  <button
                    onClick={() => setSprintStep(1)}
                    className="text-xs font-bold text-zinc-650 hover:text-zinc-950 px-4 py-2 cursor-pointer"
                  >
                    Back to Details
                  </button>
                  <button
                    onClick={() => {
                      const len = questionType === "coding" ? codingQuestions.length : mcqQuestions.length;
                      if (len === 0) {
                        alert("Please add at least one question to the sprint feed.");
                        return;
                      }
                      handleSprintSubmit();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-6 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Publish &amp; Open Scanner Lobby</span>
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 3: SCANNER LOBBY VIEW */
              <div className="bg-white border border-zinc-200 rounded-xl shadow-xs p-6 md:p-8 space-y-8">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-250 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-650" />
                  </div>
                  <h3 className="text-base font-extrabold text-zinc-900">Sprint Room is Live</h3>
                  <p className="text-xs text-zinc-500">Organizer room successfully created. Candidates can now join the waiting room.</p>
                </div>

                {createdSprint && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left side: QR Code and join code */}
                    <div className="border border-zinc-200 rounded-2xl p-6 bg-zinc-50/50 flex flex-col items-center justify-center text-center space-y-5">
                      <div className="space-y-1 bg-white px-5 py-3 border border-zinc-200 rounded-xl shadow-xs w-full max-w-xs">
                        <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block">Room Access Code</span>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <h4 className="text-2xl font-black text-zinc-950 font-mono tracking-wider">{createdSprint.joinCode}</h4>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(createdSprint.joinCode);
                              alert("Room code copied to clipboard!");
                            }}
                            className="p-1.5 text-zinc-500 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-all cursor-pointer border border-zinc-200"
                            title="Copy Room Code"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Display QR code */}
                      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative group">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + "/sprints/join?code=" + createdSprint.joinCode)}`}
                          alt="Room Join QR Code"
                          className="w-44 h-44 object-contain"
                        />
                      </div>

                      <p className="text-[11px] text-zinc-505 max-w-xs leading-relaxed">
                        Instruct candidates to scan this QR code or visit <span className="font-semibold text-zinc-800">{window.location.origin + "/register"}</span> and enter code <span className="font-bold text-zinc-900 font-mono">{createdSprint.joinCode}</span>.
                      </p>
                    </div>

                    {/* Right side: Connected candidates list */}
                    <div className="border border-zinc-200 rounded-2xl p-6 bg-white flex flex-col justify-between h-[360px]">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-zinc-200 pb-2.5">
                          <h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">Candidates In Room ({lobbyParticipants.length})</h4>
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                        </div>

                        {lobbyParticipants.length === 0 ? (
                          <div className="text-center py-12 space-y-2">
                            <p className="text-xs text-zinc-500 italic">Waiting for candidates to join...</p>
                            <div className="w-5 h-5 rounded-full border-2 border-t-emerald-600 border-zinc-250 animate-spin mx-auto" />
                          </div>
                        ) : (
                          <div className="space-y-2 overflow-y-auto max-h-[220px] no-scrollbar pr-1">
                            {lobbyParticipants.map((p, idx) => (
                              <div key={idx} className="flex justify-between items-center p-2.5 border border-zinc-200 rounded-xl bg-zinc-50 hover:bg-zinc-100/50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full ${p.isLocked ? 'bg-red-100 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'} flex items-center justify-center text-xs font-bold shrink-0 uppercase`}>
                                    {p.name ? p.name.charAt(0).toUpperCase() : "C"}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-zinc-900 leading-snug">
                                      {p.name || "Candidate"}
                                      {p.warningsCount > 0 && !p.isLocked && <span className="ml-2 text-[10px] text-amber-600">({p.warningsCount} strikes)</span>}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5 leading-none">{p.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {p.isLocked ? (
                                    <button
                                      onClick={async () => {
                                        try {
                                          const res = await fetch("/api/sprints/participants/unlock", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ participantId: p.id })
                                          });
                                          const data = await res.json();
                                          if (data.success) {
                                            alert("Candidate unlocked successfully.");
                                            // The polling will automatically refresh the UI
                                          }
                                        } catch (e) {
                                          alert("Failed to unlock candidate.");
                                        }
                                      }}
                                      className="text-[9px] font-bold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded border border-red-700 uppercase tracking-wider cursor-pointer"
                                    >
                                      Unlock
                                    </button>
                                  ) : (
                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      <span>Joined</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Control Button */}
                      <div>
                        {createdSprint.isStarted ? (
                          <div className="space-y-3">
                            <div className="w-full py-3 bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs font-extrabold rounded-xl text-center">
                              Sprint Started! Candidates are playing.
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => router.push(`/admin/hackathons/${createdSprint.id}/live`)}
                                className="flex-1 bg-zinc-900 hover:bg-black text-white text-[10px] font-black py-3 rounded-xl shadow-xs transition-all cursor-pointer text-center uppercase tracking-wider flex items-center justify-center gap-1.5"
                              >
                                <Activity className="w-3.5 h-3.5" />
                                Live Analytics
                              </button>
                              <button
                                onClick={handleStopSprint}
                                className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-[10px] font-black py-3 rounded-xl shadow-xs transition-all cursor-pointer text-center uppercase tracking-wider"
                              >
                                Stop Sprint
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={handleStartSprint}
                            className="w-full bg-[#E61E32] hover:bg-[#d01729] active:bg-[#b81223] text-white text-xs font-black py-3 rounded-xl shadow-xs transition-all cursor-pointer text-center uppercase tracking-wider"
                          >
                            Start Sprint Event Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-200 flex justify-start">
                  <button
                    onClick={() => {
                      resetSprintForm();
                      setActiveTab("overview");
                    }}
                    className="text-xs font-bold text-zinc-650 hover:text-zinc-950 px-4 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    Close Lobby and Return to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "create" ? (
          /* TAB 2: CREATE HACKATHON FORM */
          <div className="flex-1 p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
            <div className="bg-white border border-zinc-200 rounded-xl shadow-xs p-6 md:p-8 space-y-6">
              
              <div className="border-b border-zinc-200 pb-4">
                <h2 className="text-lg font-bold text-zinc-900">Create &amp; Publish Hackathon</h2>
                <p className="text-xs text-zinc-500">Configure parameters for team registration and problem statement</p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-[#E61E32] text-xs font-medium rounded-lg">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateHackathon} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700 uppercase">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Redlix Full-Stack & AI Challenge 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs py-2.5 px-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700 uppercase">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe guidelines, objectives, and evaluation rules..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700 uppercase">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs py-2.5 px-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700 uppercase">End Date *</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs py-2.5 px-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700 uppercase">Max Team Size</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={teamSize}
                      onChange={(e) => setTeamSize(Number(e.target.value))}
                      className="w-full text-xs py-2.5 px-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700 uppercase">Event Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full text-xs py-2.5 px-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32]"
                    >
                      <option value="Online">Online Sprint</option>
                      <option value="In-Person">In-Person Challenge</option>
                      <option value="Hybrid">Hybrid Event</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700 uppercase">Banner Image URL</label>
                  <input
                    type="text"
                    placeholder="https://ik.imagekit.io/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full text-xs py-2.5 px-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase">1st Prize</label>
                    <input
                      type="text"
                      placeholder="₹25,000"
                      value={prizeFirst}
                      onChange={(e) => setPrizeFirst(e.target.value)}
                      className="w-full text-xs py-2 px-2.5 border border-zinc-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase">2nd Prize</label>
                    <input
                      type="text"
                      placeholder="₹15,000"
                      value={prizeSecond}
                      onChange={(e) => setPrizeSecond(e.target.value)}
                      className="w-full text-xs py-2 px-2.5 border border-zinc-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase">3rd Prize</label>
                    <input
                      type="text"
                      placeholder="₹10,000"
                      value={prizeThird}
                      onChange={(e) => setPrizeThird(e.target.value)}
                      className="w-full text-xs py-2 px-2.5 border border-zinc-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div className="flex items-center gap-2 py-2">
                    <input
                      id="createHasFee"
                      type="checkbox"
                      checked={hasFee}
                      onChange={(e) => setHasFee(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-[#E61E32] focus:ring-[#E61E32] accent-[#E61E32]"
                    />
                    <label htmlFor="createHasFee" className="text-xs font-bold text-zinc-700 uppercase cursor-pointer select-none">
                      Requires Entry Fee
                    </label>
                  </div>
                  {hasFee && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-zinc-700 uppercase">Registration Fee (₹)</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 500"
                        value={registrationFee}
                        onChange={(e) => setRegistrationFee(Number(e.target.value))}
                        className="w-full text-xs py-2.5 px-3 border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#E61E32]"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#E61E32] hover:bg-[#d01729] text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Publish Hackathon</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        ) : activeTab === "list" ? (
          /* TAB 3: ALL SPRINTS LIST */
          <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
            <div className="bg-white border border-zinc-200 rounded-xl shadow-xs p-5 flex items-center justify-between">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search sprints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-zinc-50 border border-zinc-200 pl-9 pr-3 py-2 rounded-lg outline-none focus:border-[#E61E32]"
                />
              </div>

              <button
                onClick={() => setActiveTab("create-sprint")}
                className="bg-[#E61E32] hover:bg-[#d01729] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Sprint</span>
              </button>
            </div>

            {/* Sprint list — sourced from dedicated /api/sprints endpoint */}
            {(() => {
              const filteredSprints = sprints.filter(h =>
                h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()))
              );
              const now = new Date();

              if (filteredSprints.length === 0) {
                return (
                  <div className="bg-white border border-zinc-200 rounded-xl shadow-xs p-12 text-center space-y-3">
                    <span className="material-symbols-outlined text-4xl text-zinc-300">timer</span>
                    <p className="text-sm font-bold text-zinc-600">No sprints created yet</p>
                    <p className="text-xs text-zinc-400">Create your first sprint to get started.</p>
                    <button
                      onClick={() => setActiveTab("create-sprint")}
                      className="mt-2 bg-[#E61E32] hover:bg-[#d01729] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Create Sprint
                    </button>
                  </div>
                );
              }

              return (
                <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
                  <div className="divide-y divide-zinc-100">
                    {filteredSprints.map((h) => {
                      const end = new Date(h.endDate);
                      const isCompleted = end < now;
                      const isLive = h.isStarted && !isCompleted;

                      let statusBadge;
                      if (isCompleted) {
                        statusBadge = (
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[9px] font-black rounded border border-zinc-200 uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                            Completed
                          </span>
                        );
                      } else if (isLive) {
                        statusBadge = (
                          <span className="px-2 py-0.5 bg-red-50 text-[#E61E32] text-[9px] font-black rounded border border-red-100 uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E61E32] animate-pulse" />
                            Live
                          </span>
                        );
                      } else {
                        statusBadge = (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded border border-amber-100 uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Upcoming
                          </span>
                        );
                      }

                      return (
                        <div
                          key={h.id}
                          className={`p-4 md:p-5 flex items-center justify-between gap-4 transition-colors ${isCompleted ? "opacity-80 hover:bg-zinc-50/60" : "hover:bg-zinc-50/80"} cursor-pointer`}
                          onClick={() => {
                            if (isCompleted) {
                              // Open archived analytics
                              router.push(`/admin/hackathons/${h.id}/live`);
                            } else {
                              // Open live lobby
                              setCreatedSprint(h);
                              setSprintStep(3);
                              setActiveTab("create-sprint");
                            }
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? "bg-zinc-100 border border-zinc-200" : isLive ? "bg-red-50 border border-red-100" : "bg-amber-50 border border-amber-100"}`}>
                              <span className={`material-symbols-outlined text-[18px] ${isCompleted ? "text-zinc-400" : isLive ? "text-[#E61E32]" : "text-amber-500"}`}>timer</span>
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-zinc-900 truncate">{h.title}</h4>
                                {statusBadge}
                              </div>
                              <p className="text-[10px] text-zinc-500 font-mono">
                                Room: {h.joinCode} · {formatDate(h.startDate)} → {formatDate(h.endDate)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {isCompleted ? (
                              <button
                                onClick={() => router.push(`/admin/hackathons/${h.id}/live`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border bg-zinc-900 text-white hover:bg-zinc-700 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">analytics</span>
                                View Results
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setCreatedSprint(h);
                                  setSprintStep(3);
                                  setActiveTab("create-sprint");
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
                                Open Lobby
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(h)}
                              className="p-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-500 cursor-pointer"
                              title="Edit sprint"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(h.id)}
                              className="p-2 border border-zinc-200 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
                              title="Delete sprint"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          /* TAB 4: REGISTERED TEAMS */
          <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
            <div className="bg-white border border-zinc-200 rounded-xl shadow-xs p-6 space-y-4">
              <div className="border-b border-zinc-200 pb-3">
                <h2 className="text-base font-bold text-zinc-900">Registered Teams</h2>
                <p className="text-xs text-zinc-500">Real participant team registrations stored in database</p>
              </div>

              {teams.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Users className="w-8 h-8 text-zinc-300 mx-auto" />
                  <p className="text-xs font-semibold text-zinc-600">No team registrations found</p>
                  <p className="text-[11px] text-zinc-400">Teams registering via public hackathon pages will appear here in real-time.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-200">
                  {teams.map((t) => (
                    <div key={t.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-zinc-900">{t.name}</p>
                        <p className="text-[10px] text-zinc-500">Hackathon ID: {t.hackathonId}</p>
                      </div>
                      <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md font-mono">
                        {t.id}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-sm font-bold text-zinc-900">Edit Hackathon Settings</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-zinc-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 border border-zinc-300 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs py-2 px-3 border border-zinc-300 rounded-lg bg-white"
                  />
                </div>
                {editingHackathon?.parentHackathonId ? (
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase">Duration (Minutes)</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={editSprintDuration}
                        onChange={(e) => setEditSprintDuration(e.target.value)}
                        className="w-full text-xs py-2 pl-8 pr-3 border border-zinc-300 rounded-lg bg-white"
                      />
                      <Clock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs py-2 px-3 border border-zinc-300 rounded-lg bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase">Max Team Size</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                    className="w-full text-xs py-2 px-3 border border-zinc-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase">Event Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-xs py-2 px-3 border border-zinc-300 rounded-lg bg-white"
                  >
                    <option value="Online">Online Sprint</option>
                    <option value="In-Person">In-Person Challenge</option>
                    <option value="Hybrid">Hybrid Event</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase">Banner Image URL</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-zinc-300 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase">1st Prize</label>
                  <input
                    type="text"
                    placeholder="₹25,000"
                    value={prizeFirst}
                    onChange={(e) => setPrizeFirst(e.target.value)}
                    className="w-full text-xs py-2 px-2.5 border border-zinc-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase">2nd Prize</label>
                  <input
                    type="text"
                    placeholder="₹15,000"
                    value={prizeSecond}
                    onChange={(e) => setPrizeSecond(e.target.value)}
                    className="w-full text-xs py-2 px-2.5 border border-zinc-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase">3rd Prize</label>
                  <input
                    type="text"
                    placeholder="₹10,000"
                    value={prizeThird}
                    onChange={(e) => setPrizeThird(e.target.value)}
                    className="w-full text-xs py-2 px-2.5 border border-zinc-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="flex items-center gap-2 py-2">
                  <input
                    id="editHasFee"
                    type="checkbox"
                    checked={hasFee}
                    onChange={(e) => setHasFee(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-[#E61E32] focus:ring-[#E61E32] accent-[#E61E32]"
                  />
                  <label htmlFor="editHasFee" className="text-[11px] font-bold text-zinc-700 uppercase cursor-pointer select-none">
                    Requires Entry Fee
                  </label>
                </div>
                {hasFee && (
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase">Registration Fee (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={registrationFee}
                      onChange={(e) => setRegistrationFee(Number(e.target.value))}
                      className="w-full text-xs py-2 px-3 border border-zinc-300 rounded-lg bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#E61E32] text-white text-xs font-bold px-4 py-2 rounded-lg"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-zinc-200 py-3 text-center text-xs text-zinc-400 font-normal">
        © 2026 Redlix Secure. Hackathon Organizer Management Suite.
      </footer>
    </div>
  );
}
