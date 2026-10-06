import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Admin Guard Coverage (A16)', () => {
  const rootDir = process.cwd();
  const apiAdminDir = path.join(rootDir, 'app/api/admin');
  const adminLayoutPath = path.join(rootDir, 'app/admin/layout.tsx');

  function findRoutes(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const routes: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        routes.push(...findRoutes(fullPath));
      } else if (entry.isFile() && entry.name === 'route.ts') {
        routes.push(fullPath);
      }
    }

    return routes;
  }

  it('ensures app/admin/layout.tsx exists and invokes requireAdmin()', () => {
    expect(fs.existsSync(adminLayoutPath)).toBe(true);
    const layoutContent = fs.readFileSync(adminLayoutPath, 'utf8');
    expect(layoutContent).toContain('requireAdmin(');
  });

  it('scans all app/api/admin/**/route.ts files and asserts each invokes requireAdmin()', () => {
    const routeFiles = findRoutes(apiAdminDir);
    expect(routeFiles.length).toBeGreaterThan(0);

    for (const routeFile of routeFiles) {
      const content = fs.readFileSync(routeFile, 'utf8');
      const relativePath = path.relative(rootDir, routeFile);
      expect(
        content.includes('requireAdmin('),
        `Admin API route "${relativePath}" is missing requireAdmin() guard call`,
      ).toBe(true);
    }
  });
});
