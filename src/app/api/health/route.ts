import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("_health_check")
      .select("*")
      .limit(1);

    // A "relation does not exist" error still proves the app reached
    // Supabase and authenticated successfully — no schema exists yet.
    if (error && error.code !== "PGRST205" && error.code !== "42P01") {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ status: "ok", supabase: "reachable" });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
