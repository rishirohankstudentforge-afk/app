import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sprintId, name, email } = body;

    if (!sprintId || !name || !email) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Check if already registered
    const existing = await prisma.sprintParticipant.findFirst({
      where: { sprintId, email: email.trim().toLowerCase() }
    });

    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const participant = await prisma.sprintParticipant.create({
      data: {
        sprintId,
        name,
        email: email.trim().toLowerCase()
      }
    });

    return NextResponse.json({ success: true, data: participant });
  } catch (error: any) {
    console.error("POST /api/sprints/participants error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sprintId = searchParams.get("sprintId");
    const code = searchParams.get("code");

    const email = searchParams.get("email");

    let finalSprintId = sprintId;

    if (code) {
      const sprint = await prisma.hackathon.findUnique({
        where: { joinCode: code }
      });
      if (!sprint) {
        return NextResponse.json({ success: false, error: "Sprint room not found" }, { status: 404 });
      }
      finalSprintId = sprint.id;
    }

    if (!finalSprintId) {
      return NextResponse.json({ success: false, error: "Missing sprint identifier" }, { status: 400 });
    }

    const whereClause: any = { sprintId: finalSprintId };
    if (email) whereClause.email = email.trim().toLowerCase();

    const participants = await prisma.sprintParticipant.findMany({
      where: whereClause,
      orderBy: { joinedAt: "asc" }
    });

    return NextResponse.json({ success: true, data: participants || [] });
  } catch (error: any) {
    console.error("GET /api/sprints/participants error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isLocked, warningsCount, latestSnapshot, cheatingLogs, score, isSubmitted, codeDrafts } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing participant ID" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (isLocked !== undefined) dataToUpdate.isLocked = isLocked;
    if (warningsCount !== undefined) dataToUpdate.warningsCount = warningsCount;
    if (latestSnapshot !== undefined) dataToUpdate.latestSnapshot = latestSnapshot;
    if (score !== undefined) dataToUpdate.score = score;
    if (isSubmitted !== undefined) dataToUpdate.isSubmitted = isSubmitted;
    
    // We append the new cheating log if provided
    if (cheatingLogs) {
      const existing = await prisma.sprintParticipant.findUnique({ where: { id } });
      let logs = [];
      try {
        if (existing?.cheatingLogs) logs = JSON.parse(existing.cheatingLogs);
      } catch {}
      logs.push(cheatingLogs);
      dataToUpdate.cheatingLogs = JSON.stringify(logs);
    }
    
    if (codeDrafts) {
      dataToUpdate.answers = typeof codeDrafts === "string" ? codeDrafts : JSON.stringify(codeDrafts);
    }
    
    // If answers is provided directly (from calculateAndSaveProgress)
    if (body.answers) {
      dataToUpdate.answers = typeof body.answers === "string" ? body.answers : JSON.stringify(body.answers);
    }
    
    // If results is provided directly
    if (body.results) {
      dataToUpdate.results = typeof body.results === "string" ? body.results : JSON.stringify(body.results);
    }

    const updated = await prisma.sprintParticipant.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/sprints/participants error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
