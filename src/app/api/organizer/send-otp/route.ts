import { NextRequest, NextResponse } from "next/server";
import { generateAndSaveOtp } from "@/lib/otpStore";
import { sendEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: "Email address is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otp = await generateAndSaveOtp(cleanEmail);

    // Send OTP email via Resend API
    const emailResult = await sendEmail({
      to: cleanEmail,
      subject: `Your Hackathon Organizer Verification OTP: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 32px; border-radius: 8px; max-width: 520px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #E61E32; margin: 0; font-size: 22px;">Redlix Hackathons</h2>
            <p style="color: #71717a; font-size: 13px; margin-top: 4px;">Organizer Account Email Verification</p>
          </div>
          <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e4e4e7; text-align: center;">
            <p style="font-size: 14px; color: #27272a; margin-top: 0;">Your 6-digit verification code is:</p>
            <div style="background-color: #fef2f2; border: 1.5px dashed #E61E32; display: inline-block; padding: 14px 28px; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #E61E32; border-radius: 6px; margin: 16px 0;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #71717a; margin-bottom: 0;">This OTP code expires in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
          </div>
          <p style="font-size: 11px; color: #a1a1aa; text-align: center; margin-top: 24px;">
            © 2026 Redlix Secure. Hackathon Platform Registry.
          </p>
        </div>
      `,
    });

    if (!emailResult.success) {
      console.warn("Resend email warning:", emailResult.error);
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to " + cleanEmail,
    });
  } catch (error: any) {
    console.error("POST /api/organizer/send-otp error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to send OTP email" }, { status: 500 });
  }
}
