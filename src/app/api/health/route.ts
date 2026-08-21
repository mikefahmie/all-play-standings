import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/server";

const SCHEMA_TABLES = [
  "leagues",
  "teams",
  "weekly_scores",
  "ingestion_state",
] as const;

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    for (const table of SCHEMA_TABLES) {
      const { error } = await supabase.from(table).select("id").limit(1);

      if (error) {
        return NextResponse.json(
          { status: "error", table, message: error.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      status: "ok",
      supabase: "reachable",
      tables: SCHEMA_TABLES,
    });
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
