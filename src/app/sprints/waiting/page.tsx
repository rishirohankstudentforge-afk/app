"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Users, Clock, Globe, Flag, List, Info, ShieldCheck, CheckCircle2, MonitorCheck, Wifi, Hourglass } from "lucide-react";

function SprintWaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

  const [sprint, setSprint] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [hardwareChecked, setHardwareChecked] = useState(false);
  const [hardwareChecking, setHardwareChecking] = useState(false);
  const [hardwareError, setHardwareError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Floating Emojis State
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string, emoji: string, left: number }[]>([]);

  const triggerEmoji = (emoji: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const left = 10 + Math.random() * 80; // Random horizontal position 10% to 90%
    setFloatingEmojis(prev => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 2000); // 2 second animation
  };

  // 1. Fetch Sprint Details initially
  useEffect(() => {
    if (!code) {
      setErrorMsg("Missing room join code.");
      setLoading(false);
      return;
    }

    const fetchSprintDetails = async () => {
      try {
        const res = await fetch(`/api/sprints/status?code=${code}`);
        const data = await res.json();
        if (data.success) {
          setSprint(data.data);
        } else {
          setErrorMsg(data.error || "Sprint room not found.");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to fetch sprint details.");
      } finally {
        setLoading(false);
      }
    };

    fetchSprintDetails();
  }, [code]);

  // Handle hardware validation and device ID generation
  const performHardwareCheck = async () => {
    setHardwareChecking(true);
    setHardwareError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const fpPromise = import('@fingerprintjs/fingerprintjs').then(FingerprintJS => FingerprintJS.load());
      const fp = await fpPromise;
      const result = await fp.get();
      const deviceId = result.visitorId;
      localStorage.setItem("candidate_device_id", deviceId);

      const email = localStorage.getItem("candidate_email") || "";
      const syncRes = await fetch("/api/sprints/participants/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintCode: code, email, deviceId })
      });
      const syncData = await syncRes.json();

      if (!syncData.success) {
        throw new Error(syncData.message || "Failed to sync device signature.");
      }
      
      setTimeout(() => {
        setHardwareChecked(true);
        setHardwareChecking(false);
        if (sprint?.isStarted) {
          router.push(`/sprints/active?code=${code}`);
        }
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setHardwareError("Please allow Camera and Microphone permissions to proceed. " + (err.message || ""));
      setHardwareChecking(false);
    }
  };

  // 2. Poll sprint status (isStarted) and participants list every 3 seconds
  useEffect(() => {
    if (!code || !sprint || !hardwareChecked) return;

    const pollStatusAndParticipants = async () => {
      try {
        const statusRes = await fetch(`/api/sprints/status?code=${code}`);
        const statusData = await statusRes.json();
        if (statusData.success && statusData.data.isStarted) {
          router.push(`/sprints/active?code=${code}`);
          return;
        }

        const participantsRes = await fetch(`/api/sprints/participants?code=${code}`);
        const participantsData = await participantsRes.json();
        if (participantsData.success && Array.isArray(participantsData.data)) {
          setParticipants(participantsData.data);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const interval = setInterval(pollStatusAndParticipants, 3000);
    return () => clearInterval(interval);
  }, [code, sprint, hardwareChecked, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#E61E32] mb-4" />
        <p className="text-xs text-zinc-500 font-medium">Authenticating & Entering Lobby...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white border border-zinc-200 p-8 rounded-2xl max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-50 text-[#E61E32] flex items-center justify-center mx-auto border border-red-100">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-zinc-900 tracking-tight">Access Denied</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{errorMsg}</p>
          </div>
          <button
            onClick={() => router.push("/candidate-dashboard")}
            className="w-full bg-[#E61E32] hover:bg-[#c8102e] text-white text-sm font-medium py-3 rounded-lg cursor-pointer transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // HARDWARE CHECK SCREEN
  if (!hardwareChecked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-zinc-200 p-8 rounded-2xl max-w-lg w-full space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-medium text-zinc-900 tracking-tight">System Verification</h2>
            <p className="text-sm text-zinc-500">
              This is a proctored exam. Your camera, microphone, and device signature must be verified before entering the lobby.
            </p>
          </div>
          
          <div className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            {!videoRef.current?.srcObject && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-xs font-medium uppercase">
                Camera Feed Offline
              </div>
            )}
          </div>

          {hardwareError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium text-center">
              {hardwareError}
            </div>
          )}

          <button
            onClick={performHardwareCheck}
            disabled={hardwareChecking}
            className="w-full bg-[#E61E32] hover:bg-[#c8102e] active:bg-[#b81223] text-white text-sm font-medium py-3 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            {hardwareChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Enable Camera"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#FBFBFB] flex flex-col font-sans text-zinc-900 relative overflow-hidden">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-80px) scale(1); opacity: 0; }
        }
        .animate-float-up {
          animation: floatUp 2s ease-out forwards;
        }
        
        @keyframes clock-tick {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes bounce-people {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}} />

      {/* Top Header */}
      <header className="bg-white py-5 px-8 md:px-12 flex items-center justify-between shrink-0 border-b border-zinc-100 relative z-20">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E61E32] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E61E32]"></span>
          </span>
          <span className="text-[13px] font-semibold text-zinc-800">Live Connection</span>
        </div>
        
        <div className="flex items-center gap-2 text-zinc-800">
          <ShieldCheck className="w-[18px] h-[18px] text-[#E61E32] stroke-[1.5]" />
          <span className="text-[13px] font-semibold">Secure Connection</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1300px] mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-10 relative z-10 items-center justify-center overflow-hidden">
        
        {/* Left Section */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full overflow-hidden">
          
          {/* Animated Graphic */}
          <div className="relative w-[220px] h-[220px] mb-12 flex items-center justify-center">
            {/* Dashed outer ring */}
            <div className="absolute inset-0 rounded-full border-[2.5px] border-dashed border-red-200 animate-[spin_40s_linear_infinite]" style={{ animationPlayState: 'running' }}></div>
            
            {/* Clock icon top right */}
            <div className="absolute top-2 right-2 bg-white rounded-full p-2.5 border-[2.5px] border-[#E61E32] shadow-sm z-10">
              <Clock className="w-5 h-5 text-[#E61E32] stroke-[2]" style={{ animation: 'clock-tick 8s linear infinite' }} />
            </div>

            {/* People Icon Center */}
            <div className="text-[#E61E32]" style={{ animation: 'bounce-people 3s ease-in-out infinite' }}>
              <Users className="w-24 h-24 stroke-[1.5]" />
            </div>
          </div>

          <div className="text-center space-y-3 max-w-lg mb-8">
            <h1 className="text-4xl md:text-[42px] font-light text-zinc-800 tracking-tight leading-tight">
              Waiting for Organizer <br/>
              <span className="text-[#E61E32] font-light">to Start the Sprint</span>
            </h1>
            
            {/* Loading Dots */}
            <div className="flex justify-center gap-2 py-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E61E32]/40 animate-pulse" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#E61E32] animate-pulse" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#E61E32]/40 animate-pulse" style={{ animationDelay: '300ms' }}></div>
            </div>

            <p className="text-[15px] md:text-[16px] text-zinc-500 font-medium leading-relaxed mt-2">
              Your connection is verified and secured.<br/>
              You will automatically enter the coding environment<br/>
              the moment the sprint goes live.
            </p>
          </div>

          {/* Warning Box */}
          <div className="bg-white border border-zinc-100 rounded-xl px-6 py-4 flex items-center gap-4 w-full max-w-md shadow-sm mb-8">
            <div className="w-6 h-6 rounded-full border-[1.5px] border-[#E61E32] flex items-center justify-center shrink-0">
              <Info className="w-3.5 h-3.5 text-[#E61E32]" />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-semibold text-zinc-800">Please stay on this page.</p>
              <p className="text-[13px] text-zinc-500">Do not close or refresh your browser.</p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex justify-between w-full max-w-xl px-2">
            <div className="flex flex-col items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-[#E61E32] stroke-[1.5]" />
              <div className="text-center">
                <p className="text-[13px] font-semibold text-zinc-800 mb-0.5">Connection</p>
                <p className="text-[13px] font-medium text-[#E61E32]">Verified</p>
              </div>
            </div>
            
            <div className="w-px h-10 bg-zinc-200 mt-2 hidden sm:block"></div>
            
            <div className="flex flex-col items-center gap-3">
              <MonitorCheck className="w-7 h-7 text-[#E61E32] stroke-[1.5]" />
              <div className="text-center">
                <p className="text-[13px] font-semibold text-zinc-800 mb-0.5">System Check</p>
                <p className="text-[13px] font-medium text-[#E61E32]">Passed</p>
              </div>
            </div>

            <div className="w-px h-10 bg-zinc-200 mt-2 hidden sm:block"></div>

            <div className="flex flex-col items-center gap-3">
              <Wifi className="w-7 h-7 text-[#E61E32] stroke-[1.5]" />
              <div className="text-center">
                <p className="text-[13px] font-semibold text-zinc-800 mb-0.5">Network</p>
                <p className="text-[13px] font-medium text-[#E61E32]">Stable</p>
              </div>
            </div>

            <div className="w-px h-10 bg-zinc-200 mt-2 hidden sm:block"></div>

            <div className="flex flex-col items-center gap-3">
              <Clock className="w-7 h-7 text-[#E61E32] stroke-[1.5]" />
              <div className="text-center">
                <p className="text-[13px] font-semibold text-zinc-800 mb-0.5">Status</p>
                <p className="text-[13px] font-medium text-[#E61E32]">Waiting</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Section */}
        <div className="w-full lg:w-[420px] flex flex-col gap-4 shrink-0 pt-4 lg:pt-0 h-full overflow-hidden">
          
          {/* Sprint Details */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-6">
              <List className="w-[18px] h-[18px] text-zinc-700 stroke-[2]" />
              <h3 className="text-[13px] font-semibold text-zinc-700 tracking-wide">SPRINT DETAILS</h3>
            </div>
            
            <div className="space-y-0 divide-y divide-zinc-100">
              <div className="py-4 flex items-start gap-4">
                <Clock className="w-5 h-5 text-zinc-700 stroke-[1.5] mt-0.5" />
                <div>
                  <p className="text-[11px] text-zinc-500 font-semibold mb-1 uppercase tracking-wider">TIME LIMIT</p>
                  <p className="text-[14px] font-medium text-zinc-900">
                    {sprint?.endDate ? Math.ceil((new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) / 60000) : 60} Minutes
                  </p>
                </div>
              </div>
              
              <div className="py-4 flex items-start gap-4">
                <Globe className="w-5 h-5 text-zinc-700 stroke-[1.5] mt-0.5" />
                <div>
                  <p className="text-[11px] text-zinc-500 font-semibold mb-1 uppercase tracking-wider">ENVIRONMENT</p>
                  <p className="text-[14px] font-medium text-zinc-900">
                    {sprint?.location || "Online"} ({sprint?.type || "Sprint"})
                  </p>
                </div>
              </div>

              <div className="py-4 flex items-start gap-4">
                <Flag className="w-5 h-5 text-zinc-700 stroke-[1.5] mt-0.5" />
                <div>
                  <p className="text-[11px] text-zinc-500 font-semibold mb-1 uppercase tracking-wider">START TYPE</p>
                  <p className="text-[14px] font-medium text-zinc-900">Strict Start</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lobby Feed */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col flex-1 min-h-0">
            <div className="border-b border-zinc-100 pb-4 mb-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <Users className="w-[18px] h-[18px] text-zinc-700 stroke-[2]" />
                <h3 className="text-[13px] font-semibold text-zinc-700 tracking-wide">LOBBY FEED</h3>
              </div>
              <span className="text-[11px] font-bold text-[#E61E32] bg-white border border-red-200 px-3 py-1 rounded-full uppercase tracking-wide">
                {participants.length} Ready
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-0 divide-y divide-zinc-100
              [&::-webkit-scrollbar]:w-1 
              [&::-webkit-scrollbar-track]:bg-transparent 
              [&::-webkit-scrollbar-thumb]:bg-zinc-200 
              [&::-webkit-scrollbar-thumb]:rounded-full">
              
              {participants.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-sm font-medium pt-8">
                  Waiting for candidates...
                </div>
              ) : (
                participants.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-50 text-[#E61E32] text-sm font-semibold flex items-center justify-center border border-red-100 shrink-0">
                        {(p.name || p.email || "C").charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[14px] font-medium text-zinc-900 mb-0.5 truncate">{p.name || "Candidate"}</p>
                        <p className="text-[12px] text-zinc-500 truncate max-w-[140px]">{p.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-4 h-4 rounded-full border border-[#E61E32] flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-[#E61E32] stroke-[3]" />
                      </div>
                      <span className="text-[13px] font-medium text-zinc-700">Ready</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reaction Bar */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between relative mt-1">
             <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 w-full h-0 z-50 flex justify-center mb-2">
               {floatingEmojis.map((e) => (
                 <div
                   key={e.id}
                   className="absolute bottom-0"
                   style={{ left: `calc(${e.left}%)` }}
                 >
                   <div className="text-3xl animate-float-up drop-shadow-md">
                     {e.emoji}
                   </div>
                 </div>
               ))}
             </div>

             {[
               { emoji: '❤️', label: '12' },
               { emoji: '👍', label: '8' },
               { emoji: '😂', label: '6' },
               { emoji: '😮', label: '4' },
               { emoji: '😢', label: '3' },
               { emoji: '🎉', label: '2' },
             ].map((item, idx) => (
               <button 
                 key={idx} 
                 onClick={() => triggerEmoji(item.emoji)}
                 className="flex items-center justify-center text-zinc-700 hover:bg-zinc-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
               >
                 <span className="text-xl hover:scale-125 transition-transform">{item.emoji}</span>
               </button>
             ))}
          </div>

        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="py-6 flex items-center justify-center gap-2 text-zinc-600 bg-[#FBFBFB] relative z-20 pb-8">
        <ShieldCheck className="w-[18px] h-[18px]" />
        <span className="text-[13px] font-medium">Secure. Verified. Ready when you are.</span>
      </footer>

    </div>
  );
}

export default function SprintWaitingRoom() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#E61E32] mb-4" />
        <p className="text-xs text-zinc-500 font-medium">Loading Lobby Framework...</p>
      </div>
    }>
      <SprintWaitingContent />
    </Suspense>
  );
}
