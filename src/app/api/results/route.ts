import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource");

  // List all exams with completion stats
  if (resource === "exams") {
    try {
      const exams = await prisma.exam.findMany({
        orderBy: { id: "desc" }
      });

      const regs = await prisma.registration.findMany({
        select: { examId: true, answers: true }
      });

      const stats = exams.map((exam: any) => {
        const examRegs = regs.filter((r: any) => r.examId === exam.id);
        const attempted = examRegs.filter((r: any) => {
          if (!r.answers || typeof r.answers !== "object") return false;
          return Object.values(r.answers).some((v: any) => v && v.toString().trim() !== "");
        }).length;
        
        return {
          id: exam.id,
          name: exam.name,
          date: exam.date,
          time: exam.time,
          company_name: exam.companyName,
          company_logo: exam.companyLogo,
          total_registered: examRegs.length,
          total_attempted: attempted
        };
      });

      return NextResponse.json({ success: true, data: serialize(stats) });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // List candidates who took an exam
  if (resource === "candidates") {
    const examId = searchParams.get("examId");
    if (!examId) return NextResponse.json({ success: false, error: "missing examId" }, { status: 400 });

    try {
      const data = await prisma.registration.findMany({
        where: { examId: Number(examId) },
        orderBy: { candidateName: "asc" }
      });

      const withStats = data.map((r: any) => {
        const answers = r.answers || {};
        const mcqAnswered = Object.entries(answers).filter(([k, v]: any) => {
          const qId = Number(k);
          const isGeneralMCQ = qId >= 1 && qId <= 100;
          const isTrainingMCQ = qId >= 1001 && qId <= 1017;
          const isPhase02MCQ = qId >= 2001 && qId <= 2025;
          const isMarketingMCQ = qId >= 3001 && qId <= 3050;
          const isAnalyticsMCQ = qId >= 4001 && qId <= 4050;
          const isUIUXMCQ = qId >= 5001 && qId <= 5050;
          const isBusinessAnalysisMCQ = qId >= 6001 && qId <= 6050;
          const isSalesMarketingMCQ = qId >= 7001 && qId <= 7050;
          return (
            (isGeneralMCQ ||
              isTrainingMCQ ||
              isPhase02MCQ ||
              isMarketingMCQ ||
              isAnalyticsMCQ ||
              isUIUXMCQ ||
              isBusinessAnalysisMCQ ||
              isSalesMarketingMCQ) &&
            v &&
            v.toString().trim()
          );
        }).length;
        const codingAnswered = Object.entries(answers).filter(([k, v]: any) => {
          const qId = Number(k);
          const isGeneralCoding = qId >= 101 && qId <= 110;
          const isTrainingCoding = qId >= 1018 && qId <= 1021;
          const isPhase02Open = qId >= 2101 && qId <= 2108;
          return (isGeneralCoding || isTrainingCoding || isPhase02Open) && v && v.toString().trim();
        }).length;
        const attempted = mcqAnswered > 0 || codingAnswered > 0;
        
        return {
          id: r.id,
          exam_id: r.examId,
          candidate_name: r.candidateName,
          hall_ticket_number: r.hallTicketNumber,
          email: r.email,
          photo_url: r.photoUrl,
          registration_number: r.registrationNumber,
          mcq_answered: mcqAnswered,
          coding_answered: codingAnswered,
          attempted,
          answers: r.answers || {},
        };
      });

      return NextResponse.json({ success: true, data: serialize(withStats) });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // Get full answers for a candidate
  if (resource === "answers") {
    const hallTicket = searchParams.get("hallTicket");
    if (!hallTicket) return NextResponse.json({ success: false, error: "missing hallTicket" }, { status: 400 });

    try {
      const data = await prisma.registration.findFirst({
        where: {
          hallTicketNumber: {
            equals: hallTicket,
            mode: "insensitive"
          }
        }
      });

      if (!data) return NextResponse.json({ success: false, error: "not_found" }, { status: 404 });

      const mapped = {
        candidate_name: data.candidateName,
        hall_ticket_number: data.hallTicketNumber,
        email: data.email,
        exam_id: data.examId,
        answers: data.answers || {}
      };

      return NextResponse.json({ success: true, data: serialize(mapped) });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: false, error: "Unknown resource" }, { status: 400 });
}
