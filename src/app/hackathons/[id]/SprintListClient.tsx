"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Code2, Play, CheckCircle2 } from "lucide-react";

export default function SprintListClient({ sprints }: { sprints: any[] }) {
  const [participations, setParticipations] = useState<Record<string, boolean>>({});
  const [activeSprintId, setActiveSprintId] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [codeError, setCodeError] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("candidate_email");
    if (!email) return;

    // Fetch participation status for each sprint
    sprints.forEach(async (sprint) => {
      try {
        const res = await fetch(`/api/sprints/participants?sprintId=${sprint.id}&email=${email}&t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const p = data.data[0];
          if (p.isSubmitted) {
            setParticipations((prev) => ({ ...prev, [sprint.id]: true }));
          }
        }
      } catch (e) {}
    });
  }, [sprints]);

  const handleJoinSubmit = (sprint: any) => {
    if (inputCode === sprint.joinCode) {
      window.location.href = `/sprints/join?code=${sprint.joinCode}`;
    } else {
      setCodeError("Invalid lobby code. Please try again.");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sprints.map((sprint) => {
          const now = new Date();
          const end = new Date(sprint.endDate);
          const isCompleted = end < now;
          const isLive = sprint.isStarted && !isCompleted;
          const isSubmitted = participations[sprint.id];

          let statusBadge;
          if (isCompleted) {
            statusBadge = (
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 bg-zinc-100 px-2 py-1 rounded-md border border-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" /> Completed
              </span>
            );
          } else if (isSubmitted) {
            statusBadge = (
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 shrink-0" /> Submitted
              </span>
            );
          } else if (isLive) {
            statusBadge = (
              <span className="text-[9px] font-bold text-[#E61E32] uppercase tracking-wider flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E61E32] animate-pulse shrink-0" /> Live Now
              </span>
            );
          } else {
            statusBadge = (
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-100 px-2 py-1 rounded-md border border-zinc-200">
                Upcoming
              </span>
            );
          }

          return (
            <div key={sprint.id} className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between h-[210px] transition-shadow group ${isCompleted || isSubmitted ? "border-zinc-200 opacity-80" : "border-zinc-200 hover:shadow-md"}`}>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${isCompleted || isSubmitted ? "bg-zinc-100 border-zinc-200 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500 group-hover:text-[#E61E32] group-hover:border-red-200 group-hover:bg-red-50"}`}>
                    <Code2 className="w-5 h-5" />
                  </div>
                  {statusBadge}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-zinc-900 line-clamp-1">{sprint.title}</h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                    {sprint.description || "Join this sprint room to view challenge details and requirements."}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-auto border-t border-zinc-100">
                {isSubmitted ? (
                  <div className="w-full text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 select-none">
                    Exam Submitted
                  </div>
                ) : isCompleted ? (
                  <div className="w-full text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200 select-none">
                    Sprint Ended
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setActiveSprintId(sprint.id);
                      setInputCode("");
                      setCodeError("");
                    }}
                    className={`w-full text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isLive
                        ? "bg-[#E61E32] hover:bg-[#c8102e] text-white shadow-sm"
                        : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
                    }`}
                  >
                    <span>Join Sprint Room</span>
                    <Play className="w-3.5 h-3.5" fill="currentColor" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeSprintId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            {sprints.filter(s => s.id === activeSprintId).map(sprint => (
              <div key="modal-content">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">Enter Lobby Code</h3>
                  <p className="text-sm text-zinc-500 mb-6">
                    Please provide the access code for <strong className="text-zinc-800 font-medium">{sprint.title}</strong>.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => {
                          setInputCode(e.target.value);
                          setCodeError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleJoinSubmit(sprint);
                          if (e.key === 'Escape') setActiveSprintId(null);
                        }}
                        placeholder="e.g. URF0HD"
                        className={`w-full px-4 py-3 rounded-xl border outline-none text-sm font-medium focus:ring-2 focus:ring-offset-1 transition-all ${
                          codeError 
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50" 
                            : "border-zinc-200 focus:border-[#E61E32] focus:ring-red-100"
                        }`}
                        autoFocus
                        maxLength={12}
                      />
                      {codeError && (
                        <p className="text-xs font-medium text-red-500 mt-2 ml-1 animate-in slide-in-from-top-1">
                          {codeError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
                  <button
                    onClick={() => setActiveSprintId(null)}
                    className="px-4 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleJoinSubmit(sprint)}
                    className="px-6 py-2 text-sm font-bold text-white bg-[#E61E32] hover:bg-[#c8102e] rounded-xl shadow-sm transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
