import Link from "next/link";
import { notFound } from "next/navigation";
import { getTournamentById } from "@/data/site-data";
import { extractTcode, fetchText, sanitizeTournamentHtml } from "@/lib/fivb";
import styles from "./page.module.css";

type TournamentPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ g?: string }>;
};

async function loadTournamentHtml(tcode: string) {
  const cachedUrl = `https://fivb.12ndr.at/cache/scripts/tournament_html_${tcode}.html`;

  try {
    return await fetchText(cachedUrl);
  } catch {
    return fetchText(`https://fivb.12ndr.at/scripts/tournament.php?tcode=${tcode}`);
  }
}

function rewriteSwitchLinks(html: string, id: string, currentGender: "men" | "women") {
  const toMenHref = `/tournament/${id}?g=men`;
  const toWomenHref = `/tournament/${id}?g=women`;

  const menAnchor = `<a href="${toMenHref}">Switch to Men</a>`;
  const womenAnchor = `<a href="${toWomenHref}">Switch to Women</a>`;

  if (currentGender === "men") {
    return html
      .replace(/<a[^>]*>\s*Switch to Women\s*<\/a>/gi, womenAnchor)
      .replace(/<a[^>]*>\s*Switch to Men\s*<\/a>/gi, menAnchor);
  }

  return html
    .replace(/<a[^>]*>\s*Switch to Men\s*<\/a>/gi, menAnchor)
    .replace(/<a[^>]*>\s*Switch to Women\s*<\/a>/gi, womenAnchor);
}

export default async function TournamentPage({ params, searchParams }: TournamentPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const tournament = getTournamentById(id);

  if (!tournament) notFound();

  const requestedGender = query.g === "women" ? "women" : "men";
  const tcode =
    (requestedGender === "women"
      ? extractTcode(tournament.womenUrl) ?? extractTcode(tournament.menUrl)
      : extractTcode(tournament.menUrl) ?? extractTcode(tournament.womenUrl)) ?? null;

  if (!tcode) notFound();

  let html: string | null = null;
  try {
    const rawHtml = await loadTournamentHtml(tcode);
    html = rewriteSwitchLinks(sanitizeTournamentHtml(rawHtml), id, requestedGender);
  } catch {
    html = null;
  }

  return (
    <main className="mx-auto min-h-screen w-[96%] px-2 py-6 sm:px-4 sm:py-8">
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
        >
          Atgal i kalendoriu
        </Link>
      </div>

      <section className={styles.layout}>
        <aside className={styles.block1}>
          <p className={styles.blockTitle}>BLOKAS 1</p>
          <p className="font-head text-lg text-[var(--bg-deep)]">Greita navigacija</p>
          <div className="mt-3 grid gap-2 text-sm">
            <a href="#results_md" className="hover:underline">Results MD</a>
            <a href="#results_qu" className="hover:underline">Results QU</a>
            <a href="#ranking" className="hover:underline">Ranking</a>
            <a href="#teams_md" className="hover:underline">Teams MD</a>
            <a href="#teams_qu" className="hover:underline">Teams QU</a>
            <a href="#teams_res" className="hover:underline">Teams Res</a>
            <a href="#teams_country" className="hover:underline">Entries by Country</a>
            <a href="#teams_with" className="hover:underline">Withdrawn</a>
          </div>
        </aside>

        <article className={styles.block3}>
          <p className={styles.blockTitle}>BLOKAS 3</p>
          <div className="w-full rounded-xl border border-dashed border-[var(--line)] bg-[#f9f8f3] px-4 py-3">
            <p className="font-head text-xl text-[var(--bg-deep)]">Vieta logo / reklaminiam baneriui</p>
            <p className="text-sm text-[var(--ink-soft)]">Galite ideti klubo logo, sponsoriaus vizuala arba promo juosta.</p>
          </div>
        </article>

        <article className={styles.block4}>
          <p className={styles.blockTitle}>BLOKAS 4</p>
          <nav className="mb-3 rounded-xl border border-[var(--line)] bg-[#f6f6f6] p-2">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-[var(--bg-deep)]">
              <a href="#results_md" className="hover:underline">Results</a>
              <a href="#results_md" className="hover:underline">Main Draw</a>
              <a href="#results_qu" className="hover:underline">Qualification</a>
              <a href="#ranking" className="hover:underline">Ranking</a>
              <a href="#teams_md" className="hover:underline">Teams</a>
              <a href="#teams_md" className="hover:underline">Main Draw</a>
              <a href="#teams_qu" className="hover:underline">Qualification</a>
              <a href="#teams_res" className="hover:underline">Reserve</a>
              <a href="#teams_country" className="hover:underline">Entries by Country</a>
              <a href="#teams_with" className="hover:underline">Withdrawn</a>
              <a href="#results_md" className="hover:underline">Results MD</a>
              <a href="#results_qu" className="hover:underline">Results QU</a>
              <a href="#ranking" className="hover:underline">Ranking</a>
              <a href="#teams_md" className="hover:underline">Teams MD</a>
              <a href="#teams_qu" className="hover:underline">Teams QU</a>
              <a href="#teams_res" className="hover:underline">Teams Res</a>
              <a href="#teams_country" className="hover:underline">Entries by Country</a>
              <a href="#teams_with" className="hover:underline">Withdrawn</a>
            </div>
          </nav>
          {html ? (
            <div
              className={`overflow-x-auto rounded-xl border border-[var(--line)] bg-white p-3 ${styles.embed}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <div className="rounded-xl border border-[var(--line)] bg-white p-4 text-sm text-[var(--ink-soft)]">
              Nepavyko ikelti pilnos turnyro informacijos siuo metu. Pabandyk dar karta po keliu sekundziu.
            </div>
          )}
        </article>

        <article className={styles.block2}>
          <p className={styles.blockTitle}>BLOKAS 2</p>
          <p className="text-xs text-[var(--ink-soft)]">Men</p>
          <p className="font-head text-lg text-[var(--bg-deep)]">{tournament.menDate ?? "-"}</p>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">Women</p>
          <p className="font-head text-lg text-[var(--bg-deep)]">{tournament.womenDate ?? "-"}</p>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">Tier / Tour</p>
          <p className="text-sm font-semibold text-[var(--bg-deep)]">{tournament.tier} / {tournament.tour.toUpperCase()}</p>
        </article>
      </section>
    </main>
  );
}
