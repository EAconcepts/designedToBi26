import { describe, expect, it } from 'vitest';
import { GiftInitInput, BankTransferDeclareInput } from '@/lib/validation/gift';

describe('Gift initialization schema (Paystack)', () => {
  it('accepts valid input and trims text fields', () => {
    const parsed = GiftInitInput.safeParse({
      fundSlug: 'honeymoon',
      amountMinor: 5000000,
      giverName: '  Uncle Bola  ',
      giverEmail: '  BOLA@EXAMPLE.COM  ',
      message: '  Happy married life!  ',
      isAnonymous: false,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.giverName).toBe('Uncle Bola');
      expect(parsed.data.giverEmail).toBe('BOLA@EXAMPLE.COM');
      expect(parsed.data.message).toBe('Happy married life!');
      expect(parsed.data.isAnonymous).toBe(false);
      expect(parsed.data.amountMinor).toBe(5000000);
    }
  });

  it('requires a valid giverEmail', () => {
    expect(
      GiftInitInput.safeParse({
        fundSlug: 'honeymoon',
        amountMinor: 5000000,
        giverName: 'Uncle Bola',
      }).success,
    ).toBe(false);

    expect(
      GiftInitInput.safeParse({
        fundSlug: 'honeymoon',
        amountMinor: 5000000,
        giverName: 'Uncle Bola',
        giverEmail: 'not-an-email',
      }).success,
    ).toBe(false);
  });

  it('requires amountMinor to be an integer and positive', () => {
    expect(
      GiftInitInput.safeParse({
        fundSlug: 'honeymoon',
        amountMinor: 0,
        giverName: 'Uncle Bola',
        giverEmail: 'uncle@example.com',
      }).success,
    ).toBe(false);

    expect(
      GiftInitInput.safeParse({
        fundSlug: 'honeymoon',
        amountMinor: -5000,
        giverName: 'Uncle Bola',
        giverEmail: 'uncle@example.com',
      }).success,
    ).toBe(false);

    expect(
      GiftInitInput.safeParse({
        fundSlug: 'honeymoon',
        amountMinor: 5000.5,
        giverName: 'Uncle Bola',
        giverEmail: 'uncle@example.com',
      }).success,
    ).toBe(false);
  });

  it('defaults isAnonymous to false', () => {
    const parsed = GiftInitInput.safeParse({
      fundSlug: 'honeymoon',
      amountMinor: 100000,
      giverName: 'Auntie Ronke',
      giverEmail: 'ronke@example.com',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.isAnonymous).toBe(false);
    }
  });

  it('rejects giverName shorter than 2 or longer than 80 chars', () => {
    expect(
      GiftInitInput.safeParse({
        fundSlug: 'honeymoon',
        amountMinor: 100000,
        giverName: 'A',
        giverEmail: 'ronke@example.com',
      }).success,
    ).toBe(false);

    expect(
      GiftInitInput.safeParse({
        fundSlug: 'honeymoon',
        amountMinor: 100000,
        giverName: 'A'.repeat(81),
        giverEmail: 'ronke@example.com',
      }).success,
    ).toBe(false);
  });
});

describe('Bank transfer declaration schema', () => {
  it('accepts declaration with optional amountMinor and fundSlug omitted', () => {
    const parsed = BankTransferDeclareInput.safeParse({
      giverName: 'Bisi Akande',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.giverName).toBe('Bisi Akande');
      expect(parsed.data.amountMinor).toBeUndefined();
      expect(parsed.data.fundSlug).toBeUndefined();
      expect(parsed.data.isAnonymous).toBe(false);
    }
  });

  it('validates giverEmail if provided as non-empty string', () => {
    expect(
      BankTransferDeclareInput.safeParse({
        giverName: 'Bisi Akande',
        giverEmail: 'not-an-email',
      }).success,
    ).toBe(false);

    const validEmail = BankTransferDeclareInput.safeParse({
      giverName: 'Bisi Akande',
      giverEmail: 'bisi@example.com',
    });
    expect(validEmail.success).toBe(true);

    const emptyEmail = BankTransferDeclareInput.safeParse({
      giverName: 'Bisi Akande',
      giverEmail: '',
    });
    expect(emptyEmail.success).toBe(true);
  });
});
