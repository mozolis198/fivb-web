import { NextResponse } from "next/server";
import { fetchJson, stripHtml } from "@/lib/fivb";

type RawRankItem = {
  Position?: number | string;
  TeamName?: string;
  TeamCountryCode?: string;
  Federation?: string;
  EntryPointsTeam?: number | string;
  Points?: number | string;
};

function toNumber(value: number | string | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const num = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function parseRows(rows: RawRankItem[]) {
  return rows.map((item, index) => ({
    rank: toNumber(item.Position) || index + 1,
    team: stripHtml(item.TeamName ?? "-"),
    country: (item.TeamCountryCode ?? item.Federation ?? "-").trim(),
    points: toNumber(item.EntryPointsTeam ?? item.Points),
  }));
}

export async function GET() {
  try {
    const [menRaw, womenRaw] = await Promise.all([
      fetchJson<RawRankItem[]>("https://fivb.12ndr.at/scripts/entry_ranking_new.php?gender=m"),
      fetchJson<RawRankItem[]>("https://fivb.12ndr.at/scripts/entry_ranking_new.php?gender=w"),
    ]);

    return NextResponse.json({
      men: parseRows(menRaw),
      women: parseRows(womenRaw),
      source: "https://fivb.12ndr.at/rankings/entry-men",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown rankings error" },
      { status: 500 },
    );
  }
}
