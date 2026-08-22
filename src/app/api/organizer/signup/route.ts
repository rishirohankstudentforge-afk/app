import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otpStore";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, organization, otp } = await req.json();

    if (!fullName || !email || !password || !otp) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP first
    const isOtpValid = await verifyOtp(cleanEmail, otp);
    if (!isOtpValid) {
      return NextResponse.json({ success: false, error: "OTP verification failed or expired" }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);

      // Create Organizer account in DB
      const organizer = await prisma.organizer.create({
        data: {
          fullName: fullName.trim(),
          email: cleanEmail,
          password: hashedPassword,
          organization: organization ? organization.trim() : null,
        },
      });

      const res = NextResponse.json({ success: true, redirectUrl: "/admin/hackathons", data: organizer });
      // Set session cookie
      res.cookies.set("organizer_logged_in", "true", { path: "/", maxAge: 86400 * 7, httpOnly: false });
      res.cookies.set("organizer_email", cleanEmail, { path: "/", maxAge: 86400 * 7, httpOnly: false });
      return res;
  } catch (error: any) {
    console.error("POST /api/organizer/signup error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create organizer account" }, { status: 500 });
  }
}
