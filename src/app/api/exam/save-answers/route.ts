import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/utils/supabase/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  try {
    const { searchParams } = new URL(req.url);
    const rawHt = searchParams.get("hallTicketNumber");

    if (!rawHt) {
      return NextResponse.json(
        { success: false, error: "Missing hallTicketNumber" },
        { status: 400 }
      );
    }

    const cleanHt = rawHt.trim();

    // 1. Fetch from Supabase
    let supabaseAnswers: Record<string | number, string> = {};
    let isBlocked = false;

    const { data, error } = await supabase
      .from("registrations")
      .select("answers, blocked")
      .ilike("hall_ticket_number", cleanHt)
      .maybeSingle();

    if (!error && data) {
      if (data.answers && typeof data.answers === "object") {
        supabaseAnswers = data.answers;
      }
      isBlocked = !!data.blocked;
    }

    // 2. Fetch from Prisma as well
    let prismaAnswers: Record<string | number, string> = {};
    try {
      const pReg = await prisma.registration.findFirst({
        where: {
          hallTicketNumber: {
            equals: cleanHt,
            mode: "insensitive"
          }
        },
        select: { answers: true }
      });
      if (pReg?.answers && typeof pReg.answers === "object") {
        prismaAnswers = pReg.answers as Record<string | number, string>;
      }
    } catch (e) {
      // ignore
    }

    const combinedAnswers = { ...prismaAnswers, ...supabaseAnswers };

    return NextResponse.json({
      success: true,
      answers: combinedAnswers,
      blocked: isBlocked,
    });
  } catch (err: any) {
    console.error("Unexpected error in GET save-answers API:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  try {
    const body = await req.json();
    const { hallTicketNumber, answers } = body as {
      hallTicketNumber?: string;
      answers?: Record<string | number, string>;
    };

    if (!hallTicketNumber || !answers) {
      return NextResponse.json(
        { success: false, error: "Missing hallTicketNumber or answers" },
        { status: 400 }
      );
    }

    const cleanHt = hallTicketNumber.trim();

    // 1. Fetch existing answers to merge and prevent any data loss
    const { data: existingData } = await supabase
      .from("registrations")
      .select("answers")
      .ilike("hall_ticket_number", cleanHt)
      .maybeSingle();

    const mergedAnswers = {
      ...(existingData?.answers && typeof existingData.answers === "object" ? existingData.answers : {}),
      ...answers,
    };

    // 2. Update Supabase
    const { error: sbError } = await supabase
      .from("registrations")
      .update({ answers: mergedAnswers })
      .ilike("hall_ticket_number", cleanHt);

    if (sbError) {
      console.error("Failed to save answers to Supabase registrations:", sbError);
    }

    // 3. Update Prisma
    try {
      await prisma.registration.updateMany({
        where: {
          hallTicketNumber: {
            equals: cleanHt,
            mode: "insensitive"
          }
        },
        data: {
          answers: mergedAnswers
        }
      });
    } catch (prismaErr) {
      console.error("Failed to save answers to Prisma registration:", prismaErr);
    }

    return NextResponse.json({ success: true, savedCount: Object.keys(mergedAnswers).length });
  } catch (err: any) {
    console.error("Unexpected error in save-answers API:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
