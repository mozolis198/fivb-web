import { NextResponse } from "next/server";
import { decodeHtml, fetchJson, stripHtml } from "@/lib/fivb";

type RawLiveRow = {
  LiveScore?: string;
};

function extractMatches(html: string) {
  const title = decodeHtml(html.match(/<h6><a[^>]*>([\s\S]*?)<\/a><\/h6>/i)?.[1] ?? "Live match");
  const detailHref = html.match(/href="([^"]*\/match\?match=[^"]+)"/i)?.[1];
  const detailUrl = detailHref ? new URL(detailHref, "https://fivb.12ndr.at").toString() : null;

  const teamRows = [...html.matchAll(/<tr><td[^>]*>([\s\S]*?)<\/td><td/gi)]
    .map((m) => stripHtml(m[1]))
    .filter(Boolean)
    .slice(0, 2);

  const clock = decodeHtml(html.match(/Start:\s*([^<&]+)/i)?.[1] ?? "Live");
  const court = decodeHtml(html.match(/Court:\s*([^<&]+)/i)?.[1] ?? "Court");

  return {
    id: detailUrl ?? `${title}-${court}`,
    tournament: title,
    teams: teamRows.length ? teamRows : ["Team A", "Team B"],
    clock,
    court,
    detailUrl,
  };
}

export async function GET() {
  try {
    const rows = await fetchJson<RawLiveRow[]>("https://fivb.12ndr.at/cache/scripts/livescore.json");
    const matches = rows
      .map((row) => row.LiveScore)
      .filter((html): html is string => Boolean(html))
      .map((html) => extractMatches(html));

    return NextResponse.json({
      matches,
      source: "https://fivb.12ndr.at/livescore",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown livescore error" },
      { status: 500 },
    );
  }
}
