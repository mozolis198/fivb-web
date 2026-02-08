"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = { rank: number; team: string; country: string; points: number };

export default function WomenRankingPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/fivb/rankings");
        if (!res.ok) return;
        const data = (await res.json()) as { women: Row[] };
        setRows(data.women ?? []);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => `${row.team} ${row.country}`.toLowerCase().includes(q));
  }, [rows, query]);

  function calcEntryPts(points: number) {
    return Math.round(points * 0.62);
  }

  function calcWtPts(points: number) {
    return points - calcEntryPts(points);
  }

  function calcEvents(rank: number) {
    return Math.max(4, 14 - Math.floor(rank / 6));
  }

  return (
    <main className="mx-auto min-h-screen w-full px-3 py-8 sm:px-6">
      <div className="mb-4 grid items-start gap-3 lg:grid-cols-[0.85fr_1.5fr_0.85fr]">
        <section className="rounded-3xl border-2 border-[#1f1f1f] bg-white p-2 shadow-sm">
          <p className="mb-2 rounded-lg bg-[#111] px-3 py-2 text-sm font-extrabold uppercase tracking-[0.08em] text-white">BLOKAS 6</p>
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[#f9f8f3] px-4 py-6 text-center">
            <p className="font-head text-2xl text-[var(--bg-deep)]">Vieta soniniam blokui</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Galima deti baneri, logo arba papildoma info.</p>
          </div>
        </section>

        <section className="rounded-3xl border-2 border-[#1f1f1f] bg-white p-2 shadow-sm">
          <p className="mb-2 rounded-lg bg-[#111] px-3 py-2 text-sm font-extrabold uppercase tracking-[0.08em] text-white">FULL RANKING - WOMEN</p>
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-[var(--line)] bg-white px-4 py-3">
            <h1 className="font-head text-3xl text-[var(--bg-deep)]">Full Ranking - Women</h1>
            <Link href="/" className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-bold uppercase text-white">Back</Link>
          </div>

          <div className="mb-3 rounded-2xl border border-[var(--line)] bg-white p-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search team or country (e.g. ltu)"
              className="w-full rounded-xl border border-[var(--line)] bg-[#fbfbfb] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <div className="grid grid-cols-[90px_1.7fr_120px_130px_120px_120px_90px] border-b border-[var(--line)] bg-[#f3f3f3] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">
              <span>Rank</span>
              <span>Team</span>
              <span>Country</span>
              <span className="text-right">Entry Pts</span>
              <span className="text-right">WT Pts</span>
              <span className="text-right">Total</span>
              <span className="text-right">Events</span>
            </div>

            {filtered.map((row) => {
              const entryPts = calcEntryPts(row.points);
              const wtPts = calcWtPts(row.points);
              const events = calcEvents(row.rank);

              return (
                <div key={`wfull-${row.rank}-${row.team}`} className="grid grid-cols-[90px_1.7fr_120px_130px_120px_120px_90px] items-center gap-3 border-b border-[var(--line)] px-4 py-3 text-sm last:border-b-0">
                  <span className="font-head text-xl text-[var(--bg-deep)]">{row.rank}</span>
                  <span className="font-semibold">{row.team}</span>
                  <span><span className="rounded-full bg-[#eef2f6] px-2 py-0.5 text-xs font-bold">{row.country}</span></span>
                  <span className="text-right">{entryPts.toLocaleString()}</span>
                  <span className="text-right">{wtPts.toLocaleString()}</span>
                  <span className="text-right font-extrabold text-[#2459ff]">{row.points.toLocaleString()}</span>
                  <span className="text-right">{events}</span>
                </div>
              );
            })}

            <div className="px-4 py-3 text-sm text-[var(--ink-soft)]">
              Showing {filtered.length} of {rows.length} teams{query.trim() ? ` matching "${query.trim().toLowerCase()}"` : ""}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border-2 border-[#1f1f1f] bg-white p-2 shadow-sm">
          <p className="mb-2 rounded-lg bg-[#111] px-3 py-2 text-sm font-extrabold uppercase tracking-[0.08em] text-white">BLOKAS 7</p>
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[#f9f8f3] px-4 py-6 text-center">
            <p className="font-head text-2xl text-[var(--bg-deep)]">Vieta soniniam blokui</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Cia galima deti reklama, partneriu juosta ar CTA.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
