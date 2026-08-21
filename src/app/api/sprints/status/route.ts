import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const id = searchParams.get("id");

    if (!code && !id) {
      return NextResponse.json({ success: false, error: "Missing code or id" }, { status: 400 });
    }

    const sprint = await prisma.hackathon.findFirst({
      where: code ? { joinCode: code } : { id: id! }
    });

    if (!sprint) {
      return NextResponse.json({ success: false, error: "Sprint not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: sprint.id,
        title: sprint.title,
        description: sprint.description,
        isStarted: sprint.isStarted,
        isPaused: sprint.isPaused,
        joinCode: sprint.joinCode,
        logoUrl: sprint.logoUrl,
        location: sprint.location,
        type: sprint.type,
        startDate: sprint.startDate,
        endDate: sprint.endDate
      }
    });
  } catch (error: any) {
    console.error("GET /api/sprints/status error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
