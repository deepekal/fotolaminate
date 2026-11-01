const url = "https://fotolaminate.com/awards/";

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractYear(text) {
  const m = text.match(/AWARD\s+IN\s+(\d{4})/i);
  return m?.[1] ?? null;
}

function normalizeTitle(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\bAWARD\s+IN\s+\d{4}\b/gi, "")
    .trim();
}

const res = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0",
    "Accept-Language": "en-US,en;q=0.9",
  },
});

if (!res.ok) {
  console.error(`Failed: ${res.status}`);
  process.exit(1);
}

const html = await res.text();

const items = [];

// Extract each AwardN.png occurrence and look backwards for the closest title + year.
for (let n = 1; n <= 25; n++) {
  const needle = `/Assets/Awards/Award${n}.png`;
  const idx = html.indexOf(needle);
  if (idx < 0) {
    items.push({ n, found: false });
    continue;
  }

  const windowStart = Math.max(0, idx - 2000);
  const windowEnd = Math.min(html.length, idx + 200);
  const windowHtml = html.slice(windowStart, windowEnd);
  const text = stripTags(windowHtml);

  // Heuristic: take last ~220 chars before the image url in the textified window.
  const beforeText = text.slice(Math.max(0, text.length - 220));
  const year = extractYear(beforeText);

  // Try to locate the last title-like chunk before "AWARD IN".
  let title = beforeText;
  const split = beforeText.split(/AWARD\s+IN\s+\d{4}/i);
  if (split.length >= 2) title = split[split.length - 2];
  title = normalizeTitle(title);

  items.push({ n, found: true, title, year, imageUrl: `https://fotolaminate.com${needle}` });
}

console.log(JSON.stringify(items, null, 2));
