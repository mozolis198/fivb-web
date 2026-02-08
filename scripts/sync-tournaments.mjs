import { writeFile } from "node:fs/promises";

const seasons = [2024, 2025, 2026, 2027, 2028];
const sourceBase = "https://fivb.12ndr.at";

function decode(text) {
  return text
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("\u00a0", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(text) {
  return decode(text.replace(/<[^>]*>/g, " "));
}

function parseDateParts(dateText) {
  const match = dateText.match(/(\d{2})\.(\d{2})\.-/);
  if (!match) {
    return { startDay: null, startMonth: null };
  }

  return {
    startDay: Number(match[1]),
    startMonth: Number(match[2]),
  };
}

function parseTournamentTable(html, season) {
  const nameHeaderAt = html.indexOf('data-field="Name"');
  if (nameHeaderAt < 0) {
    return [];
  }

  const tbodyStart = html.indexOf("<tbody>", nameHeaderAt);
  const tbodyEnd = html.indexOf("</tbody>", tbodyStart);
  if (tbodyStart < 0 || tbodyEnd < 0) {
    return [];
  }

  const tbody = html.slice(tbodyStart + 7, tbodyEnd);
  const rows = [...tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];

  return rows
    .map((row, idx) => {
      const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
      if (cells.length < 5) {
        return null;
      }

      const [typeHtml, nameHtml, menHtml, womenHtml, countryHtml] = cells;

      const menHref = menHtml.match(/href="([^"]+)"/)?.[1] ?? null;
      const womenHref = womenHtml.match(/href="([^"]+)"/)?.[1] ?? null;
      const menUrl = menHref ? new URL(menHref, sourceBase).toString() : null;
      const womenUrl = womenHref ? new URL(womenHref, sourceBase).toString() : null;

      const tcode =
        menHref?.match(/[?&]tcode=([^&]+)/)?.[1] ??
        womenHref?.match(/[?&]tcode=([^&]+)/)?.[1] ??
        `season-${season}-${idx + 1}`;

      const menDate = stripTags(menHtml);
      const womenDate = stripTags(womenHtml);
      const dateForWeek = menDate || womenDate;
      const { startDay, startMonth } = parseDateParts(dateForWeek);

      return {
        id: `${season}-${tcode.toLowerCase()}`,
        season,
        type: stripTags(typeHtml),
        name: stripTags(nameHtml),
        menDate: menDate || null,
        womenDate: womenDate || null,
        country: stripTags(countryHtml),
        menUrl,
        womenUrl,
        startDay,
        startMonth,
      };
    })
    .filter(Boolean);
}

async function fetchSeason(season) {
  const url = `${sourceBase}/?season=${season}&international=all`;
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; tournament-sync/1.0)",
      accept: "text/html",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch season ${season}: ${res.status}`);
  }

  const html = await res.text();
  return parseTournamentTable(html, season);
}

async function main() {
  const bySeason = await Promise.all(seasons.map((season) => fetchSeason(season)));
  const all = bySeason.flat();

  await writeFile("src/data/tournaments.json", `${JSON.stringify(all, null, 2)}\n`, "utf8");
  console.log(`Saved ${all.length} tournaments to src/data/tournaments.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
