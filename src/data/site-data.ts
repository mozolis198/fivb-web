import tournamentsRaw from "@/data/tournaments.json";

export type WeekFilter = "all" | "last" | "this" | "next";
export type TourFilter = "all" | "pro" | "cev" | "int" | "nt" | "snow";

type RawTournament = {
  id: string;
  season: number;
  type: string;
  name: string;
  menDate: string | null;
  womenDate: string | null;
  country: string;
  menUrl: string | null;
  womenUrl: string | null;
  startDay: number | null;
  startMonth: number | null;
};

export type Tournament = {
  id: string;
  tier: string;
  name: string;
  menDate?: string;
  womenDate?: string;
  menUrl?: string;
  womenUrl?: string;
  country: string;
  season: number;
  tour: Exclude<TourFilter, "all">;
  week: WeekFilter;
  status: "live" | "upcoming";
};

export type RankingRow = {
  rank: number;
  team: string;
  country: string;
  points: number;
  movement: "up" | "down" | "same";
};

export type LiveMatch = {
  id: string;
  court: string;
  tournament: string;
  status: "live" | "next";
  teams: [string, string];
  sets: [number, number][];
  clock: string;
};

export const seasons = [2024, 2025, 2026, 2027, 2028];

function inferTour(type: string, name: string): Exclude<TourFilter, "all"> {
  const text = `${type} ${name}`.toLowerCase();

  if (text.includes("snow")) return "snow";
  if (text.includes("elite16") || text.includes("challenger") || text.includes("future") || text.includes("bpt")) return "pro";
  if (text.includes("cev") || text.includes("eurobeach") || text.includes("nations cup")) return "cev";
  if (type.toUpperCase().includes("NT")) return "nt";
  return "int";
}

function inferWeek(season: number, startMonth: number | null, startDay: number | null): WeekFilter {
  if (!startMonth || !startDay) {
    return "all";
  }

  const eventDate = new Date(Date.UTC(season, startMonth - 1, startDay));
  const now = new Date();
  const nowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diffDays = Math.floor((eventDate.getTime() - nowUtc.getTime()) / 86400000);

  if (diffDays < -7) return "last";
  if (diffDays <= 7) return "this";
  return "next";
}

function inferStatus(week: WeekFilter): "live" | "upcoming" {
  return week === "this" ? "live" : "upcoming";
}

export const tournaments: Tournament[] = (tournamentsRaw as RawTournament[]).map((item) => {
  const week = inferWeek(item.season, item.startMonth, item.startDay);

  return {
    id: item.id,
    tier: item.type,
    name: item.name,
    menDate: item.menDate ?? undefined,
    womenDate: item.womenDate ?? undefined,
    menUrl: item.menUrl ?? undefined,
    womenUrl: item.womenUrl ?? undefined,
    country: item.country,
    season: item.season,
    tour: inferTour(item.type, item.name),
    week,
    status: inferStatus(week),
  };
});

export const menRanking: RankingRow[] = [
  { rank: 1, team: "Perusic / Schweiner", country: "CZE", points: 8760, movement: "same" },
  { rank: 2, team: "Mol / Sorum", country: "NOR", points: 8610, movement: "up" },
  { rank: 3, team: "Partain / Benesh", country: "USA", points: 8420, movement: "down" },
  { rank: 4, team: "Ehlers / Wickler", country: "GER", points: 8180, movement: "up" },
  { rank: 5, team: "Immers / van de Velde", country: "NED", points: 7990, movement: "same" },
];

export const womenRanking: RankingRow[] = [
  { rank: 1, team: "Ana Patricia / Duda", country: "BRA", points: 9040, movement: "same" },
  { rank: 2, team: "Hughes / Cheng", country: "USA", points: 8820, movement: "up" },
  { rank: 3, team: "Nuss / Kloth", country: "USA", points: 8710, movement: "same" },
  { rank: 4, team: "Mueller / Tillmann", country: "GER", points: 8490, movement: "down" },
  { rank: 5, team: "Clancy / Mariafe", country: "AUS", points: 8330, movement: "up" },
];

export const liveMatches: LiveMatch[] = [
  {
    id: "live-1",
    court: "Center Court",
    tournament: "Futures Mount Maunganui",
    status: "live",
    teams: ["Samoilovs / Smedins", "Boeckermann / Flueggen"],
    sets: [
      [21, 18],
      [16, 21],
      [8, 6],
    ],
    clock: "LIVE 32:14",
  },
  {
    id: "live-2",
    court: "Court 2",
    tournament: "Futures Mount Maunganui",
    status: "next",
    teams: ["Lode / Lippmann", "Klinger / Klinger"],
    sets: [],
    clock: "Starts in 18 min",
  },
];

export function getTournamentById(id: string) {
  return tournaments.find((item) => item.id === id);
}
