import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otpStore";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ success: false, error: "Email and OTP code are required" }, { status: 400 });
    }

    const isValid = await verifyOtp(email, otp);
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP code. Please check your email or resend." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "OTP verified successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to verify OTP" }, { status: 500 });
  }
}
