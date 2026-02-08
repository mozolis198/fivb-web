import { NextRequest, NextResponse } from "next/server";
import { getTournamentById } from "@/data/site-data";
import { extractTcode, fetchText, sanitizeTournamentHtml } from "@/lib/fivb";

async function loadTournamentHtml(tcode: string) {
  const cachedUrl = `https://fivb.12ndr.at/cache/scripts/tournament_html_${tcode}.html`;
  try {
    return await fetchText(cachedUrl);
  } catch {
    const fallbackUrl = `https://fivb.12ndr.at/scripts/tournament.php?tcode=${tcode}`;
    return fetchText(fallbackUrl);
  }
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const tournament = getTournamentById(id);
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const tcode = extractTcode(tournament.womenUrl) ?? extractTcode(tournament.menUrl);
  if (!tcode) {
    return NextResponse.json({ error: "Tournament tcode not available" }, { status: 422 });
  }

  try {
    const html = await loadTournamentHtml(tcode);
    return NextResponse.json({
      id,
      tcode,
      html: sanitizeTournamentHtml(html),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Tournament fetch failed" },
      { status: 500 },
    );
  }
}
