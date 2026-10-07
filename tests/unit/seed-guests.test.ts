import { describe, expect, it } from 'vitest';
import { parseGuestsCsv, isSafeDatabase } from '@/scripts/seed-guests';

describe('CSV Guests Parser Unit Tests', () => {
  it('parses valid CSV including quoted names with commas and empty phones', () => {
    const csv = `displayName,email,phone,side,maxPartySize,invitedTo
"Adeyemi, Chief Olumide",olumide@example.com,,PARTNER_A,2,"solemnization,reception"
Madam Folashade,,+2348037654321,PARTNER_B,1,reception
Simple Guest,,,,1,`;

    const result = parseGuestsCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(3);

    // Row 1: Quoted name with embedded comma, empty phone
    expect(result.rows[0]).toMatchObject({
      lineNumber: 2,
      displayName: 'Adeyemi, Chief Olumide',
      email: 'olumide@example.com',
      phone: null,
      side: 'PARTNER_A',
      maxPartySize: 2,
      invitedTo: ['solemnization', 'reception'],
    });

    // Row 2: Empty email, phone provided
    expect(result.rows[1]).toMatchObject({
      lineNumber: 3,
      displayName: 'Madam Folashade',
      email: null,
      phone: '+2348037654321',
      side: 'PARTNER_B',
      maxPartySize: 1,
      invitedTo: ['reception'],
    });

    // Row 3: Defaults
    expect(result.rows[2]).toMatchObject({
      lineNumber: 4,
      displayName: 'Simple Guest',
      email: null,
      phone: null,
      side: 'BOTH',
      maxPartySize: 1,
      invitedTo: [],
    });
  });

  it('handles CRLF line endings and trailing whitespace', () => {
    const csv =
      'displayName,email,side\r\nJohn Doe,john@example.com,BOTH\r\nJane Smith,jane@example.com,PARTNER_A\r\n';
    const result = parseGuestsCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]?.displayName).toBe('John Doe');
    expect(result.rows[1]?.displayName).toBe('Jane Smith');
  });

  it('rejects CSV without displayName header', () => {
    const csv = 'name,email\nJohn,john@example.com';
    const result = parseGuestsCsv(csv);
    expect(result.errors).toContain('CSV must contain a "displayName" column header');
    expect(result.rows).toHaveLength(0);
  });

  it('reports validation errors with exact line numbers', () => {
    const csv = `displayName,email,side,maxPartySize
,good@example.com,BOTH,1
Valid Name,not-an-email,INVALID_SIDE,0`;

    const result = parseGuestsCsv(csv);
    expect(result.errors).toContain('Line 2: displayName is required');
    expect(result.errors).toContain('Line 3: Invalid email "not-an-email"');
    expect(result.errors).toContain(
      'Line 3: Invalid side "INVALID_SIDE". Must be PARTNER_A, PARTNER_B, or BOTH',
    );
    expect(result.errors).toContain('Line 3: Invalid maxPartySize "0". Must be >= 1');
  });

  it('validates safe database detection', () => {
    expect(isSafeDatabase('postgresql://user:pass@localhost:5432/wedding_dev')).toBe(true);
    expect(isSafeDatabase('postgresql://user:pass@127.0.0.1:5432/wedding_test')).toBe(true);
    expect(isSafeDatabase('postgresql://user:pass@neon.tech/wedding_preview')).toBe(true);
    expect(isSafeDatabase('postgresql://user:pass@prod.db.com:5432/wedding_prod')).toBe(false);
    expect(isSafeDatabase(undefined)).toBe(false);
  });
});
