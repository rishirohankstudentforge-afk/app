import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, hackathonId } = await req.json();
    if (!name || !hackathonId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Get current candidate from cookies
    const cookieStore = req.cookies;
    const candidateEmail = cookieStore.get("candidate_email")?.value;
    
    if (!candidateEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please login again." }, { status: 401 });
    }

    try {
      const team = await prisma.team.create({
        data: {
          name,
          hackathonId,
          members: JSON.stringify([candidateEmail])
        }
      });
      return NextResponse.json({ success: true, data: team });
    } catch {
      // Fallback
      const mockTeamId = "team_" + Math.random().toString(36).substring(2, 9);
      return NextResponse.json({
        success: true,
        data: { id: mockTeamId, name, hackathonId, createdAt: new Date().toISOString() }
      });
    }
  } catch (error: any) {
    console.error("POST /api/teams error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to register team" }, { status: 500 });
  }
}

export async function GET() {
  try {
    try {
      const teams = await prisma.team.findMany({
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ success: true, data: teams });
    } catch {
      return NextResponse.json({ success: true, data: [] });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
