import type { Metadata } from "next";
import { encodeExamId } from "@/utils/secureId";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { id: rawParam } = await params;
  
  let coverSrc = "https://ik.imagekit.io/dypkhqxip/technical%20Wing.png";
  let examName = "Student Forge Wing Assessment";
  let companyName = "Student Forge";
  let examDesc = "Official Proctored Examination Specification & Syllabus.";

  try {
    const defaultUrl = "https://zemknulufleswmroqcrc.supabase.co";
    const res = await fetch(`${defaultUrl}/rest/v1/exams?select=*&order=id.desc`, {
      headers: {
        apikey: "sb_publishable_hVZW7O7f0ilwwoeCgip-2Q_ryUAwiiE",
        Authorization: "Bearer sb_publishable_hVZW7O7f0ilwwoeCgip-2Q_ryUAwiiE",
      },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const allExams = await res.json();
      let targetExam = allExams.find((e: any) => encodeExamId(e.id) === rawParam);
      if (!targetExam && /^\d+$/.test(rawParam)) {
        const numId = parseInt(rawParam, 10);
        targetExam = allExams.find((e: any) => e.id === numId);
      }

      if (targetExam) {
        examName = targetExam.name || examName;
        companyName = targetExam.company_name || companyName;
        examDesc = targetExam.description ? targetExam.description.slice(0, 160) : examDesc;

        const nameLower = examName.toLowerCase();
        if (targetExam.company_logo && targetExam.company_logo.startsWith("http")) {
          coverSrc = targetExam.company_logo;
        } else if (nameLower.includes("business") || nameLower.includes("bussiness")) {
          coverSrc = "https://ik.imagekit.io/dypkhqxip/bussiness%20analysis.png";
        } else if (nameLower.includes("sales")) {
          coverSrc = "https://ik.imagekit.io/dypkhqxip/Sales%20and%20Marketing.png";
        } else if (nameLower.includes("technical")) {
          coverSrc = "https://ik.imagekit.io/dypkhqxip/technical%20Wing.png";
        } else if (nameLower.includes("marketing")) {
          coverSrc = "https://ik.imagekit.io/dypkhqxip/marketing%20Wing.png";
        } else if (nameLower.includes("analytics")) {
          coverSrc = "https://ik.imagekit.io/dypkhqxip/Data%20Analytics%20Wing.png";
        } else if (nameLower.includes("ui") || nameLower.includes("ux")) {
          coverSrc = "https://ik.imagekit.io/dypkhqxip/UI%20and%20UX%20Wing.png";
        }
      }
    }
  } catch {}

  return {
    title: `${examName} - ${companyName} | Redlix Secure`,
    description: examDesc,
    openGraph: {
      title: `${examName} - ${companyName}`,
      description: examDesc,
      images: [
        {
          url: coverSrc,
          width: 1200,
          height: 1200,
          alt: examName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${examName} - ${companyName}`,
      description: examDesc,
      images: [coverSrc],
    },
  };
}

export default function ExamDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
