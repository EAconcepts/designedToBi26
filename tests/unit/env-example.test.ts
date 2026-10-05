import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { serverSchema, publicSchema } from '@/lib/env';

describe('Environment example parity', () => {
  it('has identical keys in .env.example and schema (both directions)', () => {
    const envExamplePath = path.resolve(process.cwd(), '.env.example');
    const content = fs.readFileSync(envExamplePath, 'utf-8');

    // Extract all variable names from .env.example (lines with KEY=)
    const exampleKeys = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => line.split('=')[0]?.trim())
      .filter((key): key is string => Boolean(key));

    const serverKeys = Object.keys(serverSchema.shape);
    const publicKeys = Object.keys(publicSchema.shape);
    const schemaKeys = [...serverKeys, ...publicKeys];

    const exampleKeySet = new Set(exampleKeys);
    const schemaKeySet = new Set(schemaKeys);

    // Assert both sets have the exact same keys
    const missingInExample = schemaKeys.filter((k) => !exampleKeySet.has(k));
    const missingInSchema = exampleKeys.filter((k) => !schemaKeySet.has(k));

    expect(missingInExample).toEqual([]);
    expect(missingInSchema).toEqual([]);
    expect(exampleKeySet).toEqual(schemaKeySet);
  });
});
