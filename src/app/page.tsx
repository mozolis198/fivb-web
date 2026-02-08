"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { seasons, tournaments, type TourFilter, type WeekFilter } from "@/data/site-data";

type RankingRow = { rank: number; team: string; country: string; points: number };
type LiveMatch = { id: string; tournament: string; teams: string[]; clock: string; court: string };
type DateFilter = "all" | "upcoming" | "past";
type SortMode = "date-asc" | "date-desc" | "name";

const tourOptions: { value: TourFilter; label: string }[] = [
  { value: "all", label: "All Tournaments" },
  { value: "pro", label: "Pro Tour" },
  { value: "cev", label: "CEV" },
  { value: "int", label: "International" },
  { value: "nt", label: "National Tours" },
  { value: "snow", label: "Snow" },
];

const weekOptions: { value: WeekFilter; label: string }[] = [
  { value: "all", label: "Any Week" },
  { value: "last", label: "Last Week" },
  { value: "this", label: "This Week" },
  { value: "next", label: "Next Week" },
];

function tierTone(tier: string) {
  if (tier.toLowerCase().includes("elite")) return "bg-[#ffd27d] text-[#583b00]";
  if (tier.toLowerCase().includes("challenger")) return "bg-[#c3ecff] text-[#073c56]";
  return "bg-[#d8f5db] text-[#0f4e25]";
}

function parseStartDate(dateText: string | undefined, season: number) {
  if (!dateText) return null;
  const match = dateText.match(/(\d{2})\.(\d{2})\./);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  if (!day || !month) return null;

  const date = new Date(Date.UTC(season, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function Home() {
  const [season, setSeason] = useState(2026);
  const [tour, setTour] = useState<TourFilter>("pro");
  const [week, setWeek] = useState<WeekFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("date-asc");
  const [search, setSearch] = useState("");
  const [menRanking, setMenRanking] = useState<RankingRow[]>([]);
  const [womenRanking, setWomenRanking] = useState<RankingRow[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);

  const filtered = useMemo(
    () => {
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const query = search.trim().toLowerCase();

      const list = tournaments.filter((item) => {
        if (item.season !== season) return false;
        if (tour !== "all" && item.tour !== tour) return false;
        if (week !== "all" && item.week !== week) return false;

        const startDate = parseStartDate(item.menDate ?? item.womenDate, item.season);
        if (dateFilter === "upcoming" && startDate && startDate < today) return false;
        if (dateFilter === "past" && startDate && startDate >= today) return false;

        if (query) {
          const haystack = `${item.name} ${item.country} ${item.tier}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        return true;
      });

      list.sort((a, b) => {
        if (sortMode === "name") return a.name.localeCompare(b.name);

        const dateA = parseStartDate(a.menDate ?? a.womenDate, a.season)?.getTime() ?? 0;
        const dateB = parseStartDate(b.menDate ?? b.womenDate, b.season)?.getTime() ?? 0;

        if (sortMode === "date-desc") return dateB - dateA;
        return dateA - dateB;
      });

      return list;
    },
    [season, tour, week, dateFilter, sortMode, search],
  );

  const liveCount = filtered.filter((item) => item.status === "live").length;
  const featured = filtered[0];

  useEffect(() => {
    const load = async () => {
      try {
        const [rankingsRes, liveRes] = await Promise.all([
          fetch("/api/fivb/rankings"),
          fetch("/api/fivb/livescore"),
        ]);
        if (!rankingsRes.ok || !liveRes.ok) return;

        const rankings = (await rankingsRes.json()) as {
          men: RankingRow[];
          women: RankingRow[];
        };
        const livescore = (await liveRes.json()) as { matches: LiveMatch[] };
        setMenRanking(rankings.men ?? []);
        setWomenRanking(rankings.women ?? []);
        setLiveMatches(livescore.matches ?? []);
      } catch {
        // ignore fetch errors
      }
    };

    load();
  }, []);

  return (
    <div className="mx-auto min-h-screen w-full px-3 py-6 sm:px-6 sm:py-10">
      <section className="fade-up rounded-3xl border-2 border-[#1f1f1f] bg-white p-2 shadow-sm" style={{ animationDelay: "40ms" }}>
        <p className="mb-2 rounded-lg bg-[#111] px-3 py-2 text-sm font-extrabold uppercase tracking-[0.08em] text-white">BLOKAS 1</p>
      <header className="relative overflow-hidden rounded-2xl border border-[#ffffff80] bg-[linear-gradient(120deg,#083d56_0%,#0f5c7f_45%,#d96a2b_160%)] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <p className="font-head text-xs uppercase tracking-[0.2em] text-white/70">Beach Volleyball Data Hub</p>
        <h1 className="font-head mt-2 text-4xl leading-none sm:text-6xl">Beach Pro Calendar</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">Gyvas turnyru kalendorius, reitingai ir livescore vienoje vietoje.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/25 bg-white/10 p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/75">Season</p>
            <p className="font-head text-2xl">{season}</p>
          </div>
          <div className="rounded-2xl border border-white/25 bg-white/10 p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/75">Events</p>
            <p className="font-head text-2xl">{filtered.length}</p>
          </div>
          <div className="rounded-2xl border border-white/25 bg-white/10 p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/75">Live now</p>
            <p className="font-head text-2xl">{liveCount}</p>
          </div>
        </div>
      </header>
      </section>

      <main className="mt-6 grid gap-6 sm:mt-8">
        <section className="grid items-start gap-3 grid-cols-[0.8fr_1.6fr_0.9fr]">
        <div className="grid gap-2 col-start-1 row-start-1 self-start">
        <section className="fade-up rounded-3xl border-2 border-[#1f1f1f] bg-white p-2 shadow-sm" style={{ animationDelay: "140ms" }}>
          <p className="mb-2 rounded-lg bg-[#111] px-3 py-2 text-sm font-extrabold uppercase tracking-[0.08em] text-white">BLOKAS 5</p>
          <div className="grid gap-6 grid-cols-1">
          <article className="glass rounded-2xl p-5 shadow-sm sm:p-7">
            <h3 className="font-head text-3xl text-[var(--bg-deep)]">Ranking - Men</h3>
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
              {menRanking.slice(0, 10).map((row) => (
                <div key={`m-${row.rank}-${row.team}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--line)] px-4 py-3 text-sm last:border-b-0">
                  <span className="font-head text-xl text-[var(--bg-deep)]">{row.rank}</span>
                  <span><b>{row.team}</b> <small className="text-[var(--ink-soft)]">{row.country}</small></span>
                  <span className="font-semibold">{row.points}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="glass rounded-2xl p-5 shadow-sm sm:p-7">
            <h3 className="font-head text-3xl text-[var(--bg-deep)]">Ranking - Women</h3>
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
              {womenRanking.slice(0, 10).map((row) => (
                <div key={`w-${row.rank}-${row.team}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--line)] px-4 py-3 text-sm last:border-b-0">
                  <span className="font-head text-xl text-[var(--bg-deep)]">{row.rank}</span>
                  <span><b>{row.team}</b> <small className="text-[var(--ink-soft)]">{row.country}</small></span>
                  <span className="font-semibold">{row.points}</span>
                </div>
              ))}
            </div>
          </article>
          </div>
        </section>

        <section className="fade-up rounded-3xl border-2 border-[#1f1f1f] bg-white p-2 shadow-sm" style={{ animationDelay: "180ms" }}>
          <p className="mb-2 rounded-lg bg-[#111] px-3 py-2 text-sm font-extrabold uppercase tracking-[0.08em] text-white">BLOKAS 6</p>
          <div className="glass rounded-2xl p-5 sm:p-6">
            <div className="rounded-xl border border-dashed border-[var(--line)] bg-[#f9f8f3] px-4 py-6 text-center">
              <p className="font-head text-2xl text-[var(--bg-deep)]">Vieta papildomam blokui</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Cia galima deti reklama, logo, naujienas arba partneriu juosta.</p>
            </div>
          </div>
        </section>
        </div>

        <section className="fade-up rounded-3xl border-2 border-[#1f1f1f] bg-white p-2 shadow-sm col-start-2 row-start-1 self-start" style={{ animationDelay: "300ms" }}>
          <p className="mb-2 rounded-lg bg-[#111] px-3 py-2 text-sm font-extrabold uppercase tracking-[0.08em] text-white">BLOKAS 2</p>
          <div className="glass rounded-2xl p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-head text-3xl text-[var(--bg-deep)]">Tournament Calendar</h2>
            <span className="rounded-full bg-[var(--foam)] px-3 py-1 text-xs font-semibold text-[var(--bg-deep)]">{filtered.length} events</span>
          </div>

          <div className="mt-4 grid gap-3 grid-cols-5">
            <select className="rounded-xl border border-[var(--line)] bg-white px-3 py-2" value={season} onChange={(e) => setSeason(Number(e.target.value))}>
              {seasons.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
            <select className="rounded-xl border border-[var(--line)] bg-white px-3 py-2" value={tour} onChange={(e) => setTour(e.target.value as TourFilter)}>
              {tourOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select className="rounded-xl border border-[var(--line)] bg-white px-3 py-2" value={week} onChange={(e) => setWeek(e.target.value as WeekFilter)}>
              {weekOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select className="rounded-xl border border-[var(--line)] bg-white px-3 py-2" value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)}>
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
            <select className="rounded-xl border border-[var(--line)] bg-white px-3 py-2" value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
              <option value="date-asc">Sort: Date Asc</option>
              <option value="date-desc">Sort: Date Desc</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>

          <div className="mt-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tournament, country or tier"
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-2 border-b border-[var(--line)] bg-[var(--sand)]/35 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] md:grid">
              <span>Name</span><span className="text-right">Men</span><span className="text-right">Women</span><span className="text-right">Country</span>
            </div>

            <div className="hidden md:block">
              {filtered.map((event) => (
                <div key={event.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 border-b border-[var(--line)]/70 px-4 py-3 text-sm transition-colors hover:bg-[#faf9f5] last:border-b-0">
                  <div>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tierTone(event.tier)}`}>{event.tier}</span>
                    <p className="mt-1">
                      <Link href={`/tournament/${event.id}`} className="font-semibold text-[var(--bg-deep)] underline-offset-2 hover:underline">{event.name}</Link>
                    </p>
                  </div>
                  <Link href={`/tournament/${event.id}`} className="text-right text-[var(--ink-soft)] underline-offset-2 hover:underline">{event.menDate ?? "-"}</Link>
                  <Link href={`/tournament/${event.id}`} className="text-right text-[var(--ink-soft)] underline-offset-2 hover:underline">{event.womenDate ?? "-"}</Link>
                  <Link href={`/tournament/${event.id}`} className="text-right font-medium underline-offset-2 hover:underline">{event.country}</Link>
                </div>
              ))}
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {filtered.map((event) => (
                <article key={event.id} className="rounded-2xl border border-[var(--line)]/80 bg-[#fcfbf7] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tierTone(event.tier)}`}>{event.tier}</span>
                      <p className="mt-1 leading-snug">
                        <Link href={`/tournament/${event.id}`} className="font-semibold text-[var(--bg-deep)] underline-offset-2 hover:underline">{event.name}</Link>
                      </p>
                    </div>
                    {event.status === "live" && <span className="rounded-full bg-[#ffdbc7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a3c10]">Live</span>}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-white px-2 py-1.5">
                      <p className="uppercase tracking-wide text-[var(--ink-soft)]">Men</p>
                      <Link href={`/tournament/${event.id}`} className="font-semibold text-[var(--bg-deep)] underline-offset-2 hover:underline">{event.menDate ?? "-"}</Link>
                    </div>
                    <div className="rounded-lg bg-white px-2 py-1.5">
                      <p className="uppercase tracking-wide text-[var(--ink-soft)]">Women</p>
                      <Link href={`/tournament/${event.id}`} className="font-semibold text-[var(--bg-deep)] underline-offset-2 hover:underline">{event.womenDate ?? "-"}</Link>
                    </div>
                  </div>

                  <div className="mt-2 text-xs">
                    <span className="uppercase tracking-wide text-[var(--ink-soft)]">Country: </span>
                    <Link href={`/tournament/${event.id}`} className="font-semibold text-[var(--bg-deep)] underline-offset-2 hover:underline">{event.country}</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
          </div>
        </section>

        <div className="grid gap-2 col-start-3 row-start-1">
          <section className="fade-up rounded-3xl border-2 border-[#1f1f1f] bg-white p-2 shadow-sm" style={{ animationDelay: "220ms" }}>
            <p className="mb-2 rounded-lg bg-[#111] px-3 py-2 text-sm font-extrabold uppercase tracking-[0.08em] text-white">BLOKAS 3</p>
            <div className="grid gap-6">
              <article className="glass rounded-2xl p-5 shadow-sm sm:p-7">
                <div className="flex items-center justify-between">
                  <h3 className="font-head text-3xl text-[var(--bg-deep)]">Weekly Focus</h3>
                  <span className="rounded-full bg-[#ffe0cb] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7f370d]">Featured</span>
                </div>
                {featured ? (
                  <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">{featured.tier}</p>
                    <p className="font-head mt-1 text-3xl text-[var(--bg-deep)]">{featured.name}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">{featured.country} • {featured.menDate ?? "-"}</p>
                    <Link href={`/tournament/${featured.id}`} className="mt-4 inline-block rounded-full bg-[var(--bg-deep)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-[#0a526f]">Open tournament</Link>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[var(--ink-soft)]">No tournaments found for selected filters.</p>
                )}
              </article>

              <article className="glass rounded-2xl p-5 shadow-sm sm:p-7">
                <h3 className="font-head text-3xl text-[var(--bg-deep)]">Live Score</h3>
                <div className="mt-4 grid gap-3">
                  {liveMatches.slice(0, 3).map((match) => (
                    <div key={match.id} className="rounded-2xl border border-[var(--line)] bg-white p-4">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-[var(--ink-soft)]"><span>{match.court}</span><span>{match.clock}</span></div>
                      <p className="mt-2 text-sm font-semibold text-[var(--bg-deep)]">{match.tournament}</p>
                      <p className="mt-2 text-sm">{match.teams[0] ?? "-"}</p>
                      <p className="text-sm">{match.teams[1] ?? "-"}</p>
                    </div>
                  ))}
                  {liveMatches.length === 0 && <p className="text-sm text-[var(--ink-soft)]">No live matches right now.</p>}
                </div>
              </article>
            </div>
          </section>

          <section className="fade-up rounded-3xl border-2 border-[#1f1f1f] bg-white p-2 shadow-sm" style={{ animationDelay: "260ms" }}>
            <p className="mb-2 rounded-lg bg-[#111] px-3 py-2 text-sm font-extrabold uppercase tracking-[0.08em] text-white">BLOKAS 4</p>
            <div className="glass rounded-2xl p-5 shadow-sm sm:p-7">
              <h3 className="font-head text-3xl text-[var(--bg-deep)]">Ranking - Men</h3>
              <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
                {menRanking.slice(0, 10).map((row) => (
                  <div key={`m2-${row.rank}-${row.team}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--line)] px-4 py-3 text-sm last:border-b-0">
                    <span className="font-head text-xl text-[var(--bg-deep)]">{row.rank}</span>
                    <span><b>{row.team}</b> <small className="text-[var(--ink-soft)]">{row.country}</small></span>
                    <span className="font-semibold">{row.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
        </section>
      </main>
    </div>
  );
}
