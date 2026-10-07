import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '@/lib/db';
import { newGuestCode } from '@/lib/codes';
import { Side, type PrismaClient } from '@prisma/client';

export interface CsvGuestRow {
  lineNumber: number;
  displayName: string;
  email: string | null;
  phone: string | null;
  side: Side;
  maxPartySize: number;
  invitedTo: string[];
  key?: string;
}

export interface ParseResult {
  rows: CsvGuestRow[];
  errors: string[];
}

export interface ImportResult {
  action: 'created' | 'updated';
  displayName: string;
  code: string;
  side: Side;
  maxPartySize: number;
  invitedTo: string[];
  inviteUrl: string;
}

/**
 * Robust RFC 4180 CSV tokenizer and parser.
 * Handles quoted fields, embedded commas, quotes, and newlines.
 */
export function parseGuestsCsv(csvContent: string): ParseResult {
  const errors: string[] = [];
  const rows: CsvGuestRow[] = [];

  // Parse into raw rows of columns
  const rawRows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  let i = 0;

  while (i < csvContent.length) {
    const char = csvContent[i];

    if (insideQuotes) {
      if (char === '"') {
        if (i + 1 < csvContent.length && csvContent[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (i + 1 < csvContent.length && csvContent[i + 1] === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((f) => f.length > 0)) {
          rawRows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((f) => f.length > 0)) {
          rawRows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push last field/row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rawRows.push(currentRow);
    }
  }

  if (rawRows.length === 0) {
    return { rows: [], errors: ['CSV file is empty'] };
  }

  // Header matching
  const headerRow = rawRows[0] ?? [];
  const headers = headerRow.map((h) => h.toLowerCase().trim());
  const nameIdx = headers.indexOf('displayname');
  const emailIdx = headers.indexOf('email');
  const phoneIdx = headers.indexOf('phone');
  const sideIdx = headers.indexOf('side');
  const capIdx = headers.indexOf('maxpartysize');
  const invitedIdx = headers.indexOf('invitedto');
  const keyIdx = headers.indexOf('key');

  if (nameIdx === -1) {
    return {
      rows: [],
      errors: ['CSV must contain a "displayName" column header'],
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (let r = 1; r < rawRows.length; r++) {
    const raw = rawRows[r] ?? [];
    const lineNumber = r + 1; // 1-indexed

    const displayName = raw[nameIdx]?.trim() || '';
    if (!displayName) {
      errors.push(`Line ${lineNumber}: displayName is required`);
      continue;
    }

    const emailRaw = emailIdx >= 0 ? raw[emailIdx]?.trim() : '';
    const email = emailRaw && emailRaw.length > 0 ? emailRaw : null;
    if (email && !emailRegex.test(email)) {
      errors.push(`Line ${lineNumber}: Invalid email "${email}"`);
    }

    const phoneRaw = phoneIdx >= 0 ? raw[phoneIdx]?.trim() : '';
    const phone = phoneRaw && phoneRaw.length > 0 ? phoneRaw : null;

    let side: Side = Side.BOTH;
    if (sideIdx >= 0 && raw[sideIdx]) {
      const s = raw[sideIdx]?.trim().toUpperCase();
      if (s === 'PARTNER_A' || s === 'PARTNER_B' || s === 'BOTH') {
        side = s as Side;
      } else if (s && s.length > 0) {
        errors.push(
          `Line ${lineNumber}: Invalid side "${s}". Must be PARTNER_A, PARTNER_B, or BOTH`,
        );
      }
    }

    let maxPartySize = 1;
    if (capIdx >= 0 && raw[capIdx]) {
      const parsedCap = parseInt(raw[capIdx] || '1', 10);
      if (isNaN(parsedCap) || parsedCap < 1) {
        errors.push(`Line ${lineNumber}: Invalid maxPartySize "${raw[capIdx]}". Must be >= 1`);
      } else {
        maxPartySize = parsedCap;
      }
    }

    let invitedTo: string[] = [];
    if (invitedIdx >= 0 && raw[invitedIdx]) {
      invitedTo = (raw[invitedIdx] || '')
        .split(/[;,]/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0);
    }

    const key = keyIdx >= 0 && raw[keyIdx]?.trim() ? raw[keyIdx]?.trim() : undefined;

    rows.push({
      lineNumber,
      displayName,
      email,
      phone,
      side,
      maxPartySize,
      invitedTo,
      key,
    });
  }

  return { rows, errors };
}

export function isSafeDatabase(url: string | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('dev') ||
    lower.includes('test') ||
    lower.includes('preview') ||
    lower.includes('localhost') ||
    lower.includes('127.0.0.1')
  );
}

export async function importGuests(
  csvContent: string,
  options: {
    dryRun?: boolean;
    force?: boolean;
    baseUrl?: string;
    client?: PrismaClient;
  } = {},
): Promise<ImportResult[]> {
  const db = options.client ?? prisma;
  const dbUrl = process.env.DATABASE_URL;

  if (!options.force && !isSafeDatabase(dbUrl)) {
    throw new Error(
      'Refusing to run bulk import against database that does not contain "dev", "test", "preview", or "localhost" in URL unless --force is specified.',
    );
  }

  const { rows, errors: parseErrors } = parseGuestsCsv(csvContent);
  if (parseErrors.length > 0) {
    throw new Error(`CSV Validation Failed:\n${parseErrors.join('\n')}`);
  }

  if (rows.length === 0) {
    return [];
  }

  // Verify all event slugs against DB
  const existingEvents = await db.event.findMany({
    select: { id: true, slug: true },
  });
  const validSlugs = new Set(existingEvents.map((e) => e.slug.toLowerCase()));
  const slugToId = new Map(existingEvents.map((e) => [e.slug.toLowerCase(), e.id]));
  const defaultEventSlugs = existingEvents.map((e) => e.slug.toLowerCase());

  const slugErrors: string[] = [];
  for (const row of rows) {
    if (row.invitedTo.length === 0) {
      row.invitedTo = [...defaultEventSlugs];
    } else {
      for (const slug of row.invitedTo) {
        if (!validSlugs.has(slug)) {
          slugErrors.push(
            `Line ${row.lineNumber}: Unknown event slug "${slug}". Valid slugs: ${Array.from(validSlugs).join(', ')}`,
          );
        }
      }
    }
  }

  if (slugErrors.length > 0) {
    throw new Error(`Event Validation Failed:\n${slugErrors.join('\n')}`);
  }

  const baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (options.dryRun) {
    return rows.map((r) => ({
      action: 'created',
      displayName: r.displayName,
      code: 'DRY_RUN_',
      side: r.side,
      maxPartySize: r.maxPartySize,
      invitedTo: r.invitedTo,
      inviteUrl: `${baseUrl}/i/DRY_RUN_`,
    }));
  }

  // Atomic database transaction
  return db.$transaction(async (tx) => {
    const results: ImportResult[] = [];

    for (const row of rows) {
      // Upsert by displayName (or key if provided)
      const existing = await tx.guest.findFirst({
        where: {
          displayName: row.displayName,
        },
        include: {
          invitations: true,
        },
      });

      let guestId: string;
      let code: string;
      let action: 'created' | 'updated';

      if (existing) {
        action = 'updated';
        guestId = existing.id;
        code = existing.code;

        await tx.guest.update({
          where: { id: existing.id },
          data: {
            email: row.email,
            phone: row.phone,
            side: row.side,
            maxPartySize: row.maxPartySize,
          },
        });

        // Sync invitations
        await tx.invitation.deleteMany({
          where: { guestId: existing.id },
        });
      } else {
        action = 'created';
        code = newGuestCode();
        const created = await tx.guest.create({
          data: {
            code,
            displayName: row.displayName,
            email: row.email,
            phone: row.phone,
            side: row.side,
            maxPartySize: row.maxPartySize,
          },
        });
        guestId = created.id;
      }

      // Create invitations
      for (const slug of row.invitedTo) {
        const eventId = slugToId.get(slug);
        if (eventId) {
          await tx.invitation.create({
            data: {
              guestId,
              eventId,
            },
          });
        }
      }

      results.push({
        action,
        displayName: row.displayName,
        code,
        side: row.side,
        maxPartySize: row.maxPartySize,
        invitedTo: row.invitedTo,
        inviteUrl: `${baseUrl}/i/${code}`,
      });
    }

    return results;
  });
}

// CLI Execution Entry Point
async function runCli() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const filePath = args.find((a) => !a.startsWith('--'));

  if (!filePath) {
    console.error('Usage: pnpm seed:guests <path-to-file.csv> [--dry-run] [--force]');
    process.exit(1);
  }

  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: File not found at ${resolved}`);
    process.exit(1);
  }

  const content = fs.readFileSync(resolved, 'utf-8');

  console.log(`\nImporting guests from ${filePath}...`);
  if (dryRun) console.log('🔍 [DRY RUN MODE ENABLED - No changes will be written to database]');

  try {
    const results = await importGuests(content, { dryRun, force });

    console.log(
      '\n--------------------------------------------------------------------------------------------------',
    );
    console.log(
      `${'Action'.padEnd(9)} | ${'Name'.padEnd(25)} | ${'Code'.padEnd(10)} | ${'Side'.padEnd(10)} | ${'Cap'.padEnd(4)} | Invite URL`,
    );
    console.log(
      '--------------------------------------------------------------------------------------------------',
    );

    let createdCount = 0;
    let updatedCount = 0;

    for (const r of results) {
      if (r.action === 'created') createdCount++;
      if (r.action === 'updated') updatedCount++;

      console.log(
        `${r.action.toUpperCase().padEnd(9)} | ${r.displayName.slice(0, 24).padEnd(25)} | ${r.code.padEnd(10)} | ${r.side.padEnd(10)} | ${r.maxPartySize.toString().padEnd(4)} | ${r.inviteUrl}`,
      );
    }
    console.log(
      '--------------------------------------------------------------------------------------------------',
    );
    console.log(
      `\nDone! Processed ${results.length} guests (${createdCount} created, ${updatedCount} updated).`,
    );
  } catch (err) {
    console.error(
      `\n❌ Error during guest import:\n${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if directly executed
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  void runCli();
}
