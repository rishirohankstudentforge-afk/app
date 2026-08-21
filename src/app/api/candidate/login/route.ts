import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/utils/supabase/admin";
import { verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Fetch candidate
    const { data: candidate, error: fetchError } = await supabase
      .from("candidates")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Invalid email address or password." },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, candidate.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email address or password." },
        { status: 401 }
      );
    }

    // Create session cookie response
    const res = NextResponse.json({
      success: true,
      candidate: {
        id: candidate.id,
        email: candidate.email,
        fullName: candidate.full_name,
        phone: candidate.phone,
        college: candidate.college,
        department: candidate.department,
      },
    });

    res.cookies.set("candidate_session_token", candidate.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });
    // Add client-readable auth cookies like signup does
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
