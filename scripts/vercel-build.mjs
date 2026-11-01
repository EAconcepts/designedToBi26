import { spawn } from 'node:child_process';

const maxMigrationAttempts = 5;

function runPnpm(args, captureOutput = false) {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['exec', ...args], {
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    let output = '';

    for (const stream of [child.stdout, child.stderr]) {
      stream.on('data', (chunk) => {
        const text = chunk.toString();
        if (captureOutput) output += text;
        (stream === child.stdout ? process.stdout : process.stderr).write(text);
      });
    }

    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 1, output }));
  });
}

async function buildForVercel() {
  const directUrl = process.env.DIRECT_URL;
  if (directUrl && new URL(directUrl).hostname.includes('-pooler')) {
    console.error(
      'DIRECT_URL points to a pooled PostgreSQL endpoint. Set it to the database provider direct (non-pooler) connection URL for migrations.',
    );
    process.exitCode = 1;
    return;
  }

  for (let attempt = 1; attempt <= maxMigrationAttempts; attempt += 1) {
    const migration = await runPnpm(['prisma', 'migrate', 'deploy'], true);
    if (migration.code === 0) break;

    const isAdvisoryLockTimeout =
      /P1002/i.test(migration.output) && /advisory lock/i.test(migration.output);
    if (!isAdvisoryLockTimeout || attempt === maxMigrationAttempts) {
      process.exitCode = migration.code;
      return;
    }

    const delayMs = attempt * 5_000;
    console.warn(
      `Prisma migration lock is busy. Retrying in ${delayMs / 1_000}s (attempt ${attempt + 1}/${maxMigrationAttempts}).`,
    );
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const generate = await runPnpm(['prisma', 'generate']);
  if (generate.code !== 0) {
    process.exitCode = generate.code;
    return;
  }

  const build = await runPnpm(['next', 'build']);
  process.exitCode = build.code;
}

await buildForVercel();
