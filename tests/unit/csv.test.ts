import { describe, it, expect } from 'vitest';
import { toCsv } from '@/lib/csv';

describe('lib/csv', () => {
  it('correctly quotes and escapes values containing quotes, commas, and newlines', () => {
    const data = [
      {
        name: 'The "Adeyemi" Family',
        notes: 'Line 1, with comma\nLine 2',
        partySize: 4,
      },
    ];

    const csv = toCsv(data);
    expect(csv).toContain('"The ""Adeyemi"" Family"');
    expect(csv).toContain('"Line 1, with comma\nLine 2"');
    expect(csv).toContain(',4\r\n');
  });

  it('preserves header order and uses CRLF line terminators', () => {
    const headers = ['code', 'name', 'email', 'phone'];
    const data = [
      {
        code: 'ABCDEFGH',
        name: 'Mr. & Mrs. Adeleke',
        email: 'adeleke@example.com',
        phone: '08012345678',
      },
    ];

    const csv = toCsv(data, { headers });
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('code,name,email,phone');
    expect(lines[1]).toContain('ABCDEFGH');
  });

  it('handles empty rows and empty arrays properly', () => {
    expect(toCsv([])).toBe('');
    expect(toCsv([], { headers: ['a', 'b'] })).toBe('a,b\r\n');
  });

  it('supports UTF-8 BOM when requested', () => {
    const csv = toCsv([{ a: '1' }], { bom: true });
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });
});
