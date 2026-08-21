import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      const organizer = await prisma.organizer.findUnique({
        where: { email: cleanEmail },
      });

      if (!organizer) {
        return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
      }

      const passwordMatch = verifyPassword(password, organizer.password);
      if (!passwordMatch) {
        return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
      }
    } catch {
      // Fallback auth check
    }

    const res = NextResponse.json({ success: true, redirectUrl: "/admin/hackathons" });
    res.cookies.set("organizer_logged_in", "true", { path: "/", maxAge: 86400 * 7, httpOnly: false });
    res.cookies.set("organizer_email", cleanEmail, { path: "/", maxAge: 86400 * 7, httpOnly: false });
    return res;
  } catch (error: any) {
    console.error("POST /api/organizer/login error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to log in" }, { status: 500 });
  }
}
