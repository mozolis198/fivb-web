const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#039;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
};

export function decodeHtml(text: string): string {
  return text
    .replace(/&(amp|quot|#039|lt|gt|nbsp);/g, (entity) => ENTITY_MAP[entity] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

export function stripHtml(text: string): string {
  return decodeHtml(text.replace(/<[^>]*>/g, " "));
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; fivb-proxy/1.0)",
      accept: "application/json, text/plain, */*",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; fivb-proxy/1.0)",
      accept: "text/html, text/plain, */*",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

export function extractTcode(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const normalized = decodeHtml(url);
    const parsed = new URL(normalized);
    return parsed.searchParams.get("tcode");
  } catch {
    const match = decodeHtml(url).match(/[?&]tcode=([^&]+)/i);
    return match?.[1] ?? null;
  }
}

export function sanitizeTournamentHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\s(on\w+)=("[^"]*"|'[^']*')/gi, "")
    .replace(/href="https:\/\/fivb\.12ndr\.at[^"]*"/gi, 'href="#"')
    .replace(/href='https:\/\/fivb\.12ndr\.at[^']*'/gi, "href='#'")
    .replace(/target="_blank"/gi, "")
    .replace(/target='_blank'/gi, "");
}
