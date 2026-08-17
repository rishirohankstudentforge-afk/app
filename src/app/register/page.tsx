"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { CheckCircle, Camera } from "lucide-react";
import Link from "next/link";
import { Turnstile } from "@/components/ui/turnstile";
import { isExamRegistrationClosed } from "@/utils/examDates";

interface ExamDetails {
  id: number;
  name: string;
  company_name: string;
  company_logo?: string;
  date: string;
  time: string;
  total_qns: number;
  types_of_qns: string;
  registration_closed?: boolean;
}

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const examId = searchParams.get("examId");

  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [loadingExam, setLoadingExam] = useState(true);

  const [photo, setPhoto] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("1st Year");

  const [decl1, setDecl1] = useState(false);
  const [decl2, setDecl2] = useState(false);
  const [decl3, setDecl3] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [generatedRegNum, setGeneratedRegNum] = useState("");
  const [generatedHtNum, setGeneratedHtNum] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    if (!examId) {
      setLoadingExam(false);
      return;
    }
    const fetchExamDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("exams")
          .select("id, name, company_name, date, time, total_qns, types_of_qns, company_logo, registration_closed")
          .eq("id", Number(examId))
          .single();

        if (!error && data) {
          setExam(data);
        } else {
          console.error("Exam not found:", error);
        }
      } catch (err) {
        console.error("Error fetching exam:", err);
      } finally {
        setLoadingExam(false);
      }
    };

    fetchExamDetails();
  }, [examId]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Candidate photo must be under 2MB in size.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
      setErrorMsg("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId) {
      setErrorMsg("Invalid or missing examination reference ID.");
      return;
    }
    if (isExamRegistrationClosed(exam)) {
      setErrorMsg("Registration for this examination is closed. No new candidate entries can be accepted.");
      return;
    }
    if (!photo) {
      setErrorMsg("Please upload your candidate verification photo.");
      return;
    }
    if (!decl1 || !decl2 || !decl3) {
      setErrorMsg("Please accept all three declaration checkboxes to register.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const { data: existingReg } = await supabase
        .from("registrations")
        .select("id")
        .eq("exam_id", Number(examId))
        .eq("email", email.trim())
        .maybeSingle();

      if (existingReg) {
        setErrorMsg("You have already registered for this examination.");
        setIsSubmitting(false);
        return;
      }

      const regNum = String(Math.floor(100000 + Math.random() * 900000));
      const htNum = "26AI" + String(Math.floor(100000 + Math.random() * 900000));

      const { error } = await supabase.from("registrations").insert({
        exam_id: Number(examId),
        candidate_name: name,
        email: email.trim(),
        phone,
        college,
        department,
        year_of_study: yearOfStudy,
        photo_url: photo,
        registration_number: regNum,
        hall_ticket_number: htNum,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setGeneratedRegNum(regNum);
        setGeneratedHtNum(htNum);
        setSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected registration error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const coverSrc =
    (exam as any)?.company_logo && (exam as any).company_logo.startsWith("http")
      ? (exam as any).company_logo
      : exam?.name?.toLowerCase().includes("business") || exam?.name?.toLowerCase().includes("bussiness")
      ? "https://ik.imagekit.io/dypkhqxip/bussiness%20analysis.png"
      : exam?.name?.toLowerCase().includes("sales")
      ? "https://ik.imagekit.io/dypkhqxip/Sales%20and%20Marketing.png"
      : exam?.name?.toLowerCase().includes("technical")
      ? "https://ik.imagekit.io/dypkhqxip/technical%20Wing.png"
      : exam?.name?.toLowerCase().includes("marketing")
      ? "https://ik.imagekit.io/dypkhqxip/marketing%20Wing.png"
      : exam?.name?.toLowerCase().includes("analytics")
      ? "https://ik.imagekit.io/dypkhqxip/Data%20Analytics%20Wing.png"
      : exam?.name?.toLowerCase().includes("ui") || exam?.name?.toLowerCase().includes("ux")
      ? "https://ik.imagekit.io/dypkhqxip/UI%20and%20UX%20Wing.png"
      : "/exam-cover.png";

  if (loadingExam) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <div className="w-9 h-9 rounded-full border-2 border-t-[#E61E32] border-r-zinc-200 border-b-zinc-200 border-l-zinc-200 animate-spin mb-3" />
        <p className="text-zinc-500 text-xs font-medium tracking-wide">Retrieving examination information...</p>
      </div>
    );
  }

  if (!examId || (!loadingExam && !exam)) {
    return (
      <div className="py-16 text-center max-w-md mx-auto bg-white border border-zinc-200/90 rounded-2xl p-8 shadow-xs">
        <p className="text-zinc-900 text-sm font-bold mb-1">Invalid Examination Reference</p>
        <p className="text-zinc-500 text-xs mb-6 leading-relaxed">The exam publication reference is missing or invalid. Please check the scheduled exams directory.</p>
        <Link
          href="/scheduled-exams"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E61E32] hover:bg-[#d01729] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          ← Back to Directory
        </Link>
      </div>
    );
  }

  if (exam && isExamRegistrationClosed(exam)) {
    return (
      <div className="py-16 text-center max-w-md mx-auto bg-white border border-zinc-200/90 rounded-xl p-8 shadow-xs">
        <p className="text-zinc-900 text-sm font-bold mb-1">Registration Closed</p>
        <p className="text-zinc-500 text-xs mb-6 leading-relaxed">Registrations for this examination have ended. The scheduled examination period has concluded and no new candidate entries can be accepted.</p>
        <Link
          href="/scheduled-exams"
          className="inline-flex items-center text-xs font-semibold text-white bg-[#E61E32] hover:bg-[#d01729] px-4 py-2 rounded-md transition-all cursor-pointer"
        >
          ← Back to Scheduled Exams
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6 w-full max-w-2xl mx-auto animate-in fade-in duration-300">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background-color: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            header, footer, .no-print {
              display: none !important;
            }
            main {
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
            }
            #hall-ticket-print-area {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              page-break-inside: avoid !important;
            }
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
          }
        `}} />

        <div className="no-print bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/80 shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Registration Confirmed</h3>
              <p className="text-[11px] text-zinc-500">Your Hall Ticket is generated below. Click Print to save it as a PDF document.</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-initial px-4 py-2 bg-[#E61E32] hover:bg-[#d01729] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Print / Save PDF
            </button>
            <Link
              href="/scheduled-exams"
              className="flex-1 sm:flex-initial px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-xs rounded-xl shadow-xs transition-colors text-center cursor-pointer"
            >
              Exams Directory
            </Link>
          </div>
        </div>

        <div id="hall-ticket-print-area" className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-8 shadow-xs font-sans text-zinc-700 text-left space-y-6 relative overflow-hidden print:border-none print:shadow-none print:p-0">
          
          <div className="border-b border-zinc-200/80 pb-5 pt-1 flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left w-full md:w-auto justify-center sm:justify-start">
              <div className="shrink-0">
                {exam?.company_logo ? (
                  <img src={exam.company_logo} alt="Company Logo" className="h-12 w-12 object-contain" />
                ) : (
                  <div className="w-12 h-12 bg-zinc-100 border border-zinc-200 rounded-xl flex items-center justify-center font-bold text-zinc-500 uppercase tracking-wider text-sm select-none">
                    {exam?.company_name?.charAt(0) || "C"}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center sm:items-start">
                <h1 className="text-xl font-bold text-zinc-900 leading-snug">{exam?.company_name || "STUDENT FORGE"}</h1>
                <p className="text-[11px] font-semibold text-[#E61E32] mt-0.5">Redlix Proctored Examination Portal</p>
                <div className="mt-1.5 bg-zinc-100 text-zinc-700 font-semibold text-[9px] py-0.5 px-2.5 border border-zinc-200 inline-block rounded-md">
                  Official Hall Ticket &amp; Entry Permit
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center gap-1.5 border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto md:items-end justify-center">
              <div className="w-16 h-16 bg-white border border-zinc-200 rounded-xl flex items-center justify-center p-1 shadow-xs relative">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                    `Candidate: ${name}\nHall Ticket: ${generatedHtNum}\nReg No: ${generatedRegNum}\nExam: ${exam?.name || ""}`
                  )}`}
                  alt="Scan to Verify"
                  className="w-full h-full"
                />
              </div>
              <span className="text-[9px] text-zinc-400 font-medium">Verification QR</span>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pt-1">
            <div className="md:col-span-2 space-y-4">
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Hall Ticket Number</p>
                <p className="text-xl font-extrabold text-zinc-900 tracking-wide font-mono mt-0.5">{generatedHtNum}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-zinc-100">
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Candidate Name</p>
                  <p className="text-xs font-bold text-zinc-800 mt-0.5">{name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Registration Number</p>
                  <p className="text-xs font-bold text-zinc-800 font-mono mt-0.5">{generatedRegNum}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                <p className="text-[11px] text-emerald-700 font-semibold">Status: Verified &amp; Confirmed</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-1 border-t md:border-t-0 md:border-l border-zinc-200 pt-4 md:pt-0 md:pl-6 shrink-0">
              <div className="w-24 h-28 bg-zinc-50 border border-zinc-200/90 rounded-xl overflow-hidden shrink-0 shadow-xs relative">
                {photo ? (
                  <img src={photo} alt="Candidate Portrait" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400 font-semibold text-xs bg-zinc-100">Photo</div>
                )}
              </div>
              <span className="text-[9px] text-zinc-400 font-medium">Candidate Photo</span>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-zinc-200/80">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">{exam?.name} Schedule</h4>
            
            <div className="border border-zinc-200/80 rounded-xl overflow-hidden divide-y divide-zinc-100 text-xs">
              <div className="grid grid-cols-12 bg-zinc-50/80 font-semibold py-2 px-3.5 text-[10px] text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80">
                <div className="col-span-1">No.</div>
                <div className="col-span-7">Registered Subject / Paper</div>
                <div className="col-span-4 text-right">Scheduled Time (IST)</div>
              </div>
              <div className="grid grid-cols-12 py-3 px-3.5 font-medium text-zinc-700 items-center bg-white">
                <div className="col-span-1 font-mono text-zinc-400 text-xs">01</div>
                <div className="col-span-7 pr-3">
                  <p className="text-zinc-900 font-bold text-xs">{exam?.name}</p>
                  <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Format: {exam?.total_qns} Questions ({exam?.types_of_qns})</p>
                </div>
                <div className="col-span-4 text-right leading-tight">
                  <p className="font-bold text-zinc-900 text-xs">{exam?.date}</p>
                  <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{exam?.time}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-zinc-200/80">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Candidate Profile Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 bg-zinc-50/60 p-4 border border-zinc-200/80 rounded-xl text-xs">
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Email Address</p>
                <p className="font-semibold text-zinc-800 truncate mt-0.5">{email}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Contact Phone</p>
                <p className="font-semibold text-zinc-800 mt-0.5">{phone}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">College / Institution</p>
                <p className="font-semibold text-zinc-800 truncate mt-0.5">{college}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Department / Branch</p>
                <p className="font-semibold text-zinc-800 mt-0.5">{department}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Year of Study</p>
                <p className="font-semibold text-zinc-800 mt-0.5">{yearOfStudy}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
      
      {/* LEFT COLUMN: Candidate Registration Form (7/12 Cols on Desktop) */}
      <div className="lg:col-span-7 bg-white border border-zinc-200/90 rounded-2xl shadow-xs p-6 md:p-8 space-y-6">
        
        {/* Header Info */}
        <div className="border-b border-zinc-100 pb-5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E61E32] bg-red-50 border border-red-200/80 px-2.5 py-0.5 rounded-md inline-block">
            {exam?.company_name || "STUDENT FORGE"}
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-900 font-inter tracking-tight">Candidate Registration</h1>
          <p className="text-xs text-zinc-500 font-medium">
            Registering for:{" "}
            <span className="font-bold text-zinc-900">
              {(() => {
                if (!exam?.name) return "";
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
            </span>
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200/80 rounded-xl text-red-800 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-rounded text-sm shrink-0">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Verification Photo Upload Zone */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Candidate Verification Photo *</label>
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-zinc-50/70 border border-zinc-200/80 rounded-xl">
              <div className="w-24 h-28 bg-white border border-zinc-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                {photo ? (
                  <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-zinc-300" />
                )}
              </div>
              <div className="space-y-2 text-center sm:text-left flex-1">
                <p className="text-xs text-zinc-600 font-medium">Upload photograph for candidate identity verification.</p>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-[#E61E32] flex items-center justify-center sm:justify-start gap-1">
                    <span>⚠</span> Strictly passport-size photo required
                  </p>
                  <p className="text-[10px] font-semibold text-zinc-500">
                    Maximum file size: <span className="font-bold text-zinc-700">2 MB</span> — larger files will be rejected
                  </p>
                </div>
                <input
                  id="photo-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="text-xs file:mr-4 file:py-1.5 file:px-3.5 file:rounded-lg file:border file:border-zinc-200 file:text-xs file:font-semibold file:bg-white file:text-zinc-800 hover:file:bg-zinc-100 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-bold text-zinc-700 mb-1.5">Full Name *</label>
              <input
                id="reg-name"
                type="text"
                required
                placeholder="e.g. Jean Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs w-full py-2.5 px-3.5 border border-zinc-200/90 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#E61E32]/20 focus:border-[#E61E32] transition-all font-medium placeholder:text-zinc-400"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-bold text-zinc-700 mb-1.5">Email Address *</label>
              <input
                id="reg-email"
                type="email"
                required
                placeholder="e.g. jean.doe@edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs w-full py-2.5 px-3.5 border border-zinc-200/90 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#E61E32]/20 focus:border-[#E61E32] transition-all font-medium placeholder:text-zinc-400"
              />
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-bold text-zinc-700 mb-1.5">Phone Number *</label>
              <input
                id="reg-phone"
                type="tel"
                required
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-xs w-full py-2.5 px-3.5 border border-zinc-200/90 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#E61E32]/20 focus:border-[#E61E32] transition-all font-medium placeholder:text-zinc-400"
              />
            </div>

            <div>
              <label htmlFor="reg-year" className="block text-xs font-bold text-zinc-700 mb-1.5">Year of Study *</label>
              <select
                id="reg-year"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="text-xs w-full py-2.5 px-3.5 border border-zinc-200/90 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#E61E32]/20 focus:border-[#E61E32] transition-all font-medium text-zinc-800"
              >
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
                <option>Postgraduate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-college" className="block text-xs font-bold text-zinc-700 mb-1.5">College/Institution Name *</label>
              <input
                id="reg-college"
                type="text"
                required
                placeholder="e.g. IIT Madras"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="text-xs w-full py-2.5 px-3.5 border border-zinc-200/90 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#E61E32]/20 focus:border-[#E61E32] transition-all font-medium placeholder:text-zinc-400"
              />
            </div>

            <div>
              <label htmlFor="reg-department" className="block text-xs font-bold text-zinc-700 mb-1.5">Department / Branch Name *</label>
              <input
                id="reg-department"
                type="text"
                required
                placeholder="e.g. Computer Science & Eng"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="text-xs w-full py-2.5 px-3.5 border border-zinc-200/90 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#E61E32]/20 focus:border-[#E61E32] transition-all font-medium placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Declarations */}
          <div className="border-t border-zinc-100 pt-5 space-y-3">
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Candidate Declarations *</label>
            
            <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors border border-zinc-100/80">
              <input
                type="checkbox"
                id="decl1"
                checked={decl1}
                onChange={(e) => setDecl1(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#E61E32] cursor-pointer shrink-0"
              />
              <label htmlFor="decl1" className="text-xs text-zinc-700 select-none cursor-pointer leading-relaxed font-medium">
                I confirm that the uploaded photo is a clear, recent portrait of myself and matches my appearance.
              </label>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors border border-zinc-100/80">
              <input
                type="checkbox"
                id="decl2"
                checked={decl2}
                onChange={(e) => setDecl2(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#E61E32] cursor-pointer shrink-0"
              />
              <label htmlFor="decl2" className="text-xs text-zinc-700 select-none cursor-pointer leading-relaxed font-medium">
                I declare that all information provided in this registration form is correct and matches my college records.
              </label>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors border border-zinc-100/80">
              <input
                type="checkbox"
                id="decl3"
                checked={decl3}
                onChange={(e) => setDecl3(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#E61E32] cursor-pointer shrink-0"
              />
              <label htmlFor="decl3" className="text-xs text-zinc-700 select-none cursor-pointer leading-relaxed font-medium">
                I agree to the Redlix Secure evaluation terms, which include webcam and screen monitoring protocol during the exam.
              </label>
            </div>
          </div>



          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <Link
              href="/scheduled-exams"
              className="flex-1 py-3 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold text-xs rounded-xl shadow-xs transition-all text-center cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-[#E61E32] hover:bg-[#d01729] disabled:bg-[#E61E32]/60 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer border-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                "Submit Registration"
              )}
            </button>
          </div>

        </form>
      </div>

      {/* RIGHT COLUMN: Exam Poster & Minimal Details Card (5/12 Cols on Desktop - Sticky) */}
      <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
        
        {/* 1200x1200px Cover Poster Card */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-xs">
          <div className="w-full aspect-square rounded-xl overflow-hidden border border-zinc-200/80 bg-zinc-100 shadow-xs relative">
            <img
              src={coverSrc}
              alt={exam?.name || "Exam Cover"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Minimal Details Summary Card */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="border-b border-zinc-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E61E32]">
              {exam?.company_name || "STUDENT FORGE"}
            </span>
            <h2 className="text-sm font-bold text-zinc-900 mt-1 font-inter leading-snug">
              {(() => {
                if (!exam?.name) return "";
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
            </h2>
          </div>

          {/* Key Metrics Stack */}
          <div className="space-y-2.5">
            {[
              { label: "Schedule Date", value: exam?.date, icon: "calendar_today" },
              { label: "Start Time", value: exam?.time, icon: "schedule" },
              { label: "Duration", value: "3 Hours (180 Minutes)", icon: "timer" },
              { label: "Questions", value: `${exam?.total_qns || 50} MCQs (100 Marks)`, icon: "quiz" },
              { label: "Negative Marking", value: "No Negative Marking", icon: "do_not_disturb_on" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-50/70 border border-zinc-100/90">
                <span className="material-symbols-rounded text-sm text-[#E61E32] shrink-0">{icon}</span>
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{label}</p>
                  <p className="text-xs font-bold text-zinc-900 mt-0.5 leading-snug">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-zinc-100 text-center">
            <Link
              href={`/scheduled-exams/${examId}`}
              className="text-xs text-zinc-500 hover:text-zinc-900 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-rounded text-xs">info</span>
              View Full Exam Specifications
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function RegisterForExamPage() {
  return (
    <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900 flex flex-col selection:bg-[#E61E32]/10 selection:text-[#E61E32]">
      {/* Redlix Modern Navbar */}
      <header className="sticky top-0 z-50 bg-[#E61E32] border-b border-[#d01729] py-3 px-6 md:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="https://ik.imagekit.io/dypkhqxip/logotraining?updatedAt=1783099023149"
              alt="Redlix Logo"
              className="h-7.5 md:h-8 w-auto object-contain shrink-0 transition-transform group-hover:scale-[1.02]"
            />
            <div className="flex items-center gap-2 border-l border-white/20 pl-3">
              <span className="font-semibold text-xs text-white font-inter tracking-wide">Candidate Registration</span>
            </div>
          </Link>

          <nav className="text-xs text-white/90 font-semibold flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-white/40">/</span>
            <Link href="/scheduled-exams" className="hover:text-white transition-colors">Scheduled Exams</Link>
            <span className="text-white/40">/</span>
            <span className="text-white font-bold">Register</span>
          </nav>
        </div>
      </header>

      {/* Main Content Container - Full Width (max-w-6xl) */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-8">
        <Suspense fallback={
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="w-9 h-9 rounded-full border-2 border-t-[#E61E32] border-r-zinc-200 border-b-zinc-200 border-l-zinc-200 animate-spin mb-3" />
            <p className="text-zinc-500 text-xs font-medium tracking-wide">Loading candidate registration desk...</p>
          </div>
        }>
          <RegisterFormContent />
        </Suspense>
      </main>

      <footer className="py-6 border-t border-zinc-200/80 bg-white mt-12 text-center text-xs text-zinc-500 font-medium shrink-0">
        © 2026 Redlix Secure. Secure Candidate Examinations Registry.
      </footer>
    </div>
  );
}
