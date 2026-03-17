/**
 * Adds a day or week summary to the Daily Notes gist.
 * Requires in .env: GITHUB_GIST_TOKEN or GIST_TOKEN (and optionally GIST_ID / GITHUB_DAILY_NOTES_GIST_ID).
 * Run: node src/lib/updateDailyNotesGist.mjs "summary content"
 *
 * Gist structure: one file per day named YYYY-MM-DD.md; week files named week-N.md.
 */

import "dotenv/config";

const token = process.env.GITHUB_GIST_TOKEN || process.env.GIST_TOKEN;
const gistId = process.env.GIST_ID || process.env.GITHUB_DAILY_NOTES_GIST_ID;
const summary = process.argv[2];

const DAY_NAMES = ["(nd.)", "(pon.)", "(wt.)", "(śr.)", "(czw.)", "(pt.)", "(sob.)"];

if (!token) {
  console.error("Brak tokenu. Dodaj GITHUB_GIST_TOKEN lub GIST_TOKEN do .env");
  process.exit(1);
}
if (!summary) {
  console.error('Podaj treść podsumowania jako argument: node updateDailyNotesGist.mjs "treść"');
  process.exit(1);
}

const today = new Date();
const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const dayName = DAY_NAMES[today.getDay()];
const isFridayOrSaturday = today.getDay() === 5 || today.getDay() === 6;

async function fetchGist() {
  if (!gistId) {
    console.error("Brak GIST_ID. Dodaj GIST_ID lub GITHUB_DAILY_NOTES_GIST_ID do .env");
    process.exit(1);
  }
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error("Błąd pobierania gista:", res.status, await res.text());
    process.exit(1);
  }
  return res.json();
}

async function patchGist(files) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ files }),
  });
  if (!res.ok) {
    console.error("Błąd aktualizacji gista:", res.status, await res.text());
    process.exit(1);
  }
}

async function run() {
  const gist = await fetchGist();
  const existingFiles = gist.files || {};

  const filesToPatch = {};

  // Daily file
  const dailyKey = `${dateStr}.md`;
  const dailyContent = `# ${dateStr} ${dayName}\n\n## Co zrobiłem\n\n${summary}\n\n---`;
  filesToPatch[dailyKey] = { content: dailyContent };

  // Week summary file (Friday or Saturday)
  if (isFridayOrSaturday) {
    const weekKeys = Object.keys(existingFiles).filter((f) => /^week-\d+\.md$/.test(f));
    const lastWeekNum = weekKeys.reduce((max, f) => {
      const n = parseInt(f.match(/\d+/)[0], 10);
      return n > max ? n : max;
    }, 0);
    const weekKey = `week-${lastWeekNum + 1}.md`;
    const weekContent = `# Week ${lastWeekNum + 1} — ${dateStr}\n\n## Podsumowanie tygodnia\n\n${summary}\n\n---`;
    filesToPatch[weekKey] = { content: weekContent };
    console.log(`Tworzę plik tygodnia: ${weekKey}`);
  }

  await patchGist(filesToPatch);
  console.log(`Daily Notes zaktualizowane: ${dailyKey}${isFridayOrSaturday ? " + plik tygodnia" : ""}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
