import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/utils/supabase/admin";

let bucketChecked = false;

async function ensureBucket(supabase: any) {
  if (bucketChecked) return;
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === "live-feeds");
    if (!exists) {
      await supabase.storage.createBucket("live-feeds", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
    }
    bucketChecked = true;
  } catch (e) {
    console.warn("Could not check/create live-feeds bucket:", e);
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  try {
    const { sessionId, image } = await req.json();

    if (!sessionId || !image) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: sessionId and image" },
        { status: 400 }
      );
    }

    const cleanSessionId = sessionId.toString().trim();
    let finalImageUrl = image; // fallback to data URL directly if storage is unavailable

    // Attempt Supabase storage upload
    try {
      await ensureBucket(supabase);

      const matches = image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        const fileName = `${cleanSessionId}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("live-feeds")
          .upload(fileName, buffer, {
            contentType,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("live-feeds")
            .getPublicUrl(fileName);

          if (publicUrlData?.publicUrl) {
            finalImageUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
          }
        } else {
          console.warn("Storage upload failed, falling back to data URL:", uploadError.message);
        }
      }
    } catch (storageErr) {
      console.warn("Storage processing error, using data URL fallback:", storageErr);
    }

    // 1. Update the session in the database
    const { error: dbError } = await supabase
      .from("sessions")
      .update({ live_feed: finalImageUrl })
      .ilike("id", cleanSessionId);

    if (dbError) {
      console.warn("Database session update warning:", dbError.message);
    }

    // 2. Broadcast live frame over Supabase Realtime channel for instant 0-latency live view
    try {
      const channel = supabase.channel("live-proctoring-stream");
      await channel.send({
        type: "broadcast",
        event: "live_frame",
        payload: {
          sessionId: cleanSessionId,
          liveFeed: finalImageUrl,
          timestamp: Date.now(),
        },
      });
    } catch (broadcastErr) {
      // Non-blocking
    }

    return NextResponse.json({ success: true, url: finalImageUrl });
  } catch (err: any) {
    console.error("Error in upload-feed endpoint:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
