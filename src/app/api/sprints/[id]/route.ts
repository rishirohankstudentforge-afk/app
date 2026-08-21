import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sprint = await prisma.hackathon.findUnique({
      where: { id }
    });

    if (!sprint) {
      return NextResponse.json({ success: false, error: "Sprint not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: sprint });
  } catch (error: any) {
    console.error("GET /api/sprints/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { isStarted, isPaused, title, description, questions } = body;

    const sprint = await prisma.hackathon.findUnique({ where: { id } });
    if (!sprint) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (isStarted !== undefined) {
      updateData.isStarted = Boolean(isStarted);
      
      // If we are starting the sprint right now, shift the start/end dates so the 
      // countdown strictly enforces the duration starting from this exact moment!
      if (updateData.isStarted && !sprint.isStarted) {
        const durationMs = sprint.endDate.getTime() - sprint.startDate.getTime();
        updateData.startDate = new Date();
        updateData.endDate = new Date(Date.now() + durationMs);
      }
    }
    
    if (isPaused !== undefined) {
      const pausing = Boolean(isPaused);
      if (pausing && !sprint.isPaused) {
        updateData.isPaused = true;
        updateData.pausedAt = new Date();
      } else if (!pausing && sprint.isPaused) {
        updateData.isPaused = false;
        updateData.pausedAt = null;
        if (sprint.pausedAt) {
          const pauseDuration = Date.now() - sprint.pausedAt.getTime();
          updateData.endDate = new Date(sprint.endDate.getTime() + pauseDuration);
        }
      }
    }
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (questions !== undefined) updateData.questions = typeof questions === "string" ? questions : JSON.stringify(questions);

    const updated = await prisma.hackathon.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/sprints/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
