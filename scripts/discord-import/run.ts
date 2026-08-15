/**
 * CLI entrypoint for importing DiscordChatExporter HTML exports into Market Research.
 *
 * Usage:
 *   npx tsx scripts/discord-import/run.ts --input <exportDir> [--dry-run]
 *
 * <exportDir> must contain the exported .html files alongside their sibling
 * `<file>.html_Files/` attachment directories, exactly as DiscordChatExporter
 * writes them. Only files whose name matches one of the four supported
 * channels (pre-market-analizi, market-intraday, eod, eow) are imported.
 *
 * Idempotent: re-running against the same export dir will not create
 * duplicate messages (dedup on sourceMessageId / contentHash).
 */
import "dotenv/config";
import path from "node:path";
import { readdirSync, statSync } from "node:fs";
import { prisma } from "../../lib/prisma";
import { runImport } from "./importer";
import { backfillWeeks } from "./backfill-weeks";

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputDir = args.input as string | undefined;
  if (!inputDir) {
    console.error("Usage: npx tsx scripts/discord-import/run.ts --input <exportDir> [--dry-run]");
    process.exit(1);
  }
  const dryRun = Boolean(args["dry-run"]);

  // Process smaller (per-day) exports before large full-channel-history dumps.
  // Full-history exports tend to overlap heavily with the per-day exports; once
  // the per-day data is in, most of a full-history file's messages hit the
  // dedup fast-path and skip attachment re-processing entirely.
  const files = readdirSync(inputDir)
    .filter((f) => f.toLowerCase().endsWith(".html"))
    .map((f) => path.join(inputDir, f))
    .sort((a, b) => statSync(a).size - statSync(b).size);

  if (files.length === 0) {
    console.error(`No .html export files found in ${inputDir}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} export file(s) in ${inputDir}. Dry run: ${dryRun}`);

  let importRunId: string | undefined;
  if (!dryRun) {
    const run = await prisma.marketImportRun.create({
      data: { filesTotal: files.length, triggeredBy: process.env.USERNAME ?? process.env.USER ?? null },
    });
    importRunId = run.id;
  }

  const summary = await runImport({ exportDir: inputDir, filePaths: files, dryRun, importRunId });

  console.log("Import summary:", JSON.stringify(summary, null, 2));

  if (importRunId) {
    await prisma.marketImportRun.update({
      where: { id: importRunId },
      data: {
        status: summary.errors > 0 && summary.imported === 0 ? "failed" : "completed",
        finishedAt: new Date(),
        filesDone: summary.filesDone,
        imported: summary.imported,
        duplicates: summary.duplicates,
        errors: summary.errors,
        errorDetail: summary.errorDetail.slice(0, 200) as unknown as object,
      },
    });

    const weekResult = await backfillWeeks();
    console.log(`Backfilled weeks: ${weekResult.daysLinked} day(s) linked across ${weekResult.weeksTouched} week(s).`);
  }

  await prisma.$disconnect();
}

const MAX_ATTEMPTS = 4;

async function runWithRetry() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await main();
      return;
    } catch (err) {
      console.error(`Import attempt ${attempt}/${MAX_ATTEMPTS} crashed:`, err);
      if (attempt === MAX_ATTEMPTS) {
        await prisma.$disconnect();
        process.exit(1);
      }
      // Idempotent by design (dedup on sourceMessageId) -- safe to just retry
      // the whole run against the same --input after a transient connection drop.
      console.log("Retrying in 5s...");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

runWithRetry();
