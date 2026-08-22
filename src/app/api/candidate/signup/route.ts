import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/utils/supabase/admin";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      password,
      phone,
      college,
      department,
      otp, // newly added
    } = body;

    // Validation
    if (!fullName || !email || !password || !otp) {
      return NextResponse.json(
        { success: false, error: "Missing required registration parameters including OTP." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP first
    const { verifyOtp } = await import("@/lib/otpStore");
    const isOtpValid = await verifyOtp(cleanEmail, otp);
    if (!isOtpValid) {
      return NextResponse.json({ success: false, error: "OTP verification failed or expired" }, { status: 400 });
    }

    // Check if duplicate email
    const { data: existingUser, error: checkError } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A candidate with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Insert into db
    const { error: insertError } = await supabase
      .from("candidates")
      .insert({
        full_name: fullName.trim(),
        email: cleanEmail,
        password: hashedPassword,
        phone: phone ? phone.trim() : null,
        college: college ? college.trim() : null,
        department: department ? department.trim() : null,
      });

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    // Send welcome email via Resend (async, non-blocking)
    try {
      const { sendEmail } = await import("@/lib/resend");
      await sendEmail({
        to: cleanEmail,
        subject: "Welcome to Redlix Secure Candidate Portal",
        html: `
          <div style="font-family: Arial, sans-serif; color: #18181b; padding: 20px;">
            <h2 style="color: #E61E32;">Welcome to Redlix Secure, ${fullName.trim()}!</h2>
            <p>Your candidate profile has been successfully registered on the Redlix examination portal.</p>
            <p>You can now sign in using your registered email address: <strong>${cleanEmail}</strong>.</p>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p style="font-size: 12px; color: #71717a;">© 2026 Redlix Secure Proctoring System. All rights reserved.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Non-blocking welcome email dispatch failed:", emailErr);
    }

    const res = NextResponse.json({ success: true, redirectUrl: "/candidate-dashboard" });
    res.cookies.set("candidate_logged_in", "true", { path: "/", maxAge: 86400 * 7 });
    res.cookies.set("candidate_email", cleanEmail, { path: "/", maxAge: 86400 * 7 });
    
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
