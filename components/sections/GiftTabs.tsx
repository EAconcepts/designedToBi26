'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SITE } from '@/content/site.config';
import { formatNGN, toMinor } from '@/lib/money';
import { FundCard } from '@/components/ui/FundCard';
import { CopyField } from '@/components/ui/CopyField';

export interface BankAccountItem {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  currency: string;
  label?: string | null;
}

export interface FundItem {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  goalMinor?: number | null;
  isActive: boolean;
}

export interface GiftTabsProps {
  funds: FundItem[];
  bankAccounts: BankAccountItem[];
}

export function GiftTabs({ funds, bankAccounts }: GiftTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentTab = searchParams.get('tab') === 'bank' ? 'bank' : 'online';

  const setTab = (tab: 'online' | 'bank') => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'bank') {
      params.set('tab', 'bank');
    } else {
      params.delete('tab');
    }
    startTransition(() => {
      router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`, {
        scroll: false,
      });
    });
  };

  // Online Gift Form State
  const defaultFund = funds[0]?.slug || 'honeymoon';
  const [selectedFundSlug, setSelectedFundSlug] = useState(defaultFund);
  const [selectedPresetMinor, setSelectedPresetMinor] = useState<number | null>(
    SITE.gift.presetAmountsMinor[1] ?? 1000000,
  );
  const [customAmountText, setCustomAmountText] = useState(
    (SITE.gift.presetAmountsMinor[1]
      ? SITE.gift.presetAmountsMinor[1] / 100
      : 10000
    ).toLocaleString('en-NG'),
  );
  const [giverName, setGiverName] = useState('');
  const [giverEmail, setGiverEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);

  // Bank Transfer Declaration State
  const [showDeclareForm, setShowDeclareForm] = useState(false);
  const [declareName, setDeclareName] = useState('');
  const [declareEmail, setDeclareEmail] = useState('');
  const [declareAmountText, setDeclareAmountText] = useState('');
  const [declareFundSlug, setDeclareFundSlug] = useState(defaultFund);
  const [declareMessage, setDeclareMessage] = useState('');
  const [declareAnonymous, setDeclareAnonymous] = useState(false);
  const [isDeclaring, setIsDeclaring] = useState(false);
  const [declareSuccessRef, setDeclareSuccessRef] = useState<string | null>(null);
  const [declareError, setDeclareError] = useState<string | null>(null);

  // Parse amount in kobo from user text
  const parseAmountMinor = (val: string): number => {
    const numericStr = val.replace(/[^0-9]/g, '');
    const naira = parseInt(numericStr || '0', 10);
    return toMinor(naira);
  };

  const handleCustomAmountChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) {
      setCustomAmountText('');
      setSelectedPresetMinor(null);
      return;
    }
    const num = parseInt(clean, 10);
    setCustomAmountText(num.toLocaleString('en-NG'));
    const minor = toMinor(num);
    if (SITE.gift.presetAmountsMinor.includes(minor)) {
      setSelectedPresetMinor(minor);
    } else {
      setSelectedPresetMinor(null);
    }
  };

  const handlePresetClick = (presetMinor: number) => {
    setSelectedPresetMinor(presetMinor);
    setCustomAmountText((presetMinor / 100).toLocaleString('en-NG'));
  };

  const handleOnlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnlineError(null);

    const amountMinor = parseAmountMinor(customAmountText);
    if (amountMinor < SITE.gift.minAmountMinor) {
      setOnlineError(`Minimum gift amount is ${formatNGN(SITE.gift.minAmountMinor)}.`);
      return;
    }
    if (amountMinor > SITE.gift.maxAmountMinor) {
      setOnlineError(`Maximum gift amount is ${formatNGN(SITE.gift.maxAmountMinor)}.`);
      return;
    }

    if (!giverName.trim() || giverName.trim().length < 2) {
      setOnlineError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!giverEmail.trim() || !giverEmail.includes('@')) {
      setOnlineError('Please provide a valid email address for your receipt.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/gifts/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundSlug: selectedFundSlug,
          amountMinor,
          giverName: giverName.trim(),
          giverEmail: giverEmail.trim(),
          message: message.trim() || undefined,
          isAnonymous,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || 'Failed to initialize payment');
      }

      // Redirect to Paystack secure checkout
      if (data.data?.authorizationUrl) {
        window.location.href = data.data.authorizationUrl;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (err) {
      setOnlineError(err instanceof Error ? err.message : 'Could not proceed to payment');
      setIsSubmitting(false);
    }
  };

  const handleDeclareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeclareError(null);

    if (!declareName.trim() || declareName.trim().length < 2) {
      setDeclareError('Please enter your name (at least 2 characters).');
      return;
    }

    setIsDeclaring(true);

    const amountMinor = declareAmountText ? parseAmountMinor(declareAmountText) : undefined;

    try {
      const res = await fetch('/api/gifts/declare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundSlug: declareFundSlug || undefined,
          amountMinor,
          giverName: declareName.trim(),
          giverEmail: declareEmail.trim() || undefined,
          message: declareMessage.trim() || undefined,
          isAnonymous: declareAnonymous,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || 'Could not record transfer declaration');
      }

      setDeclareSuccessRef(data.data.reference);
    } catch (err) {
      setDeclareError(err instanceof Error ? err.message : 'Error recording transfer');
    } finally {
      setIsDeclaring(false);
    }
  };

  if (funds.length === 0 && bankAccounts.length === 0) {
    return (
      <div className="py-16 text-center text-ink-600">
        <p className="font-serif text-lg">Giving details will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label="Gift payment method"
        className="flex rounded-xl bg-ivory-200/80 p-1.5 border border-gold-500/20 max-w-md mx-auto"
      >
        <button
          type="button"
          role="tab"
          id="tab-online"
          aria-selected={currentTab === 'online'}
          aria-controls="panel-online"
          onClick={() => setTab('online')}
          className={`flex-1 py-3 px-4 rounded-lg font-serif font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
            currentTab === 'online'
              ? 'bg-white text-magenta-900 shadow-sm'
              : 'text-ink-600 hover:text-magenta-900'
          }`}
        >
          <span>💳</span>
          <span>Give Online</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-bank"
          aria-selected={currentTab === 'bank'}
          aria-controls="panel-bank"
          onClick={() => setTab('bank')}
          className={`flex-1 py-3 px-4 rounded-lg font-serif font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
            currentTab === 'bank'
              ? 'bg-white text-magenta-900 shadow-sm'
              : 'text-ink-600 hover:text-magenta-900'
          }`}
        >
          <span>🏦</span>
          <span>Bank Transfer</span>
        </button>
      </div>

      {/* Online Tab Panel */}
      <div
        role="tabpanel"
        id="panel-online"
        aria-labelledby="tab-online"
        hidden={currentTab !== 'online'}
        className={currentTab === 'online' ? 'space-y-8' : 'hidden'}
      >
        <form onSubmit={handleOnlineSubmit} className="space-y-8">
          {/* Fund Selection */}
          <div className="space-y-4">
            <div className="text-center sm:text-left">
              <span className="text-xs font-semibold tracking-wider uppercase text-gold-600 font-sans">
                Step 1
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-magenta-950 mt-0.5">
                Choose a Wish to Bless
              </h2>
              <p className="text-xs sm:text-sm text-ink-600 mt-1">
                Select where you would like your gift to be dedicated.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {funds.map((f) => (
                <FundCard
                  key={f.id}
                  slug={f.slug}
                  title={f.title}
                  description={f.description}
                  goalMinor={f.goalMinor}
                  isSelected={selectedFundSlug === f.slug}
                  onSelect={() => setSelectedFundSlug(f.slug)}
                />
              ))}
            </div>
          </div>

          {/* Amount Selection */}
          <div className="space-y-4">
            <div className="text-center sm:text-left">
              <span className="text-xs font-semibold tracking-wider uppercase text-gold-600 font-sans">
                Step 2
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-magenta-950 mt-0.5">
                Gift Amount
              </h2>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SITE.gift.presetAmountsMinor.map((minor) => (
                <button
                  key={minor}
                  type="button"
                  onClick={() => handlePresetClick(minor)}
                  className={`py-3 px-3 rounded-lg border font-mono font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer min-h-[44px] ${
                    selectedPresetMinor === minor
                      ? 'bg-magenta-900 text-white border-magenta-900 shadow-sm'
                      : 'bg-white hover:bg-gold-50/50 text-ink-800 border-ink-200 hover:border-gold-400'
                  }`}
                >
                  {formatNGN(minor)}
                </button>
              ))}
            </div>

            {/* Custom Amount Field */}
            <div className="max-w-md">
              <label
                htmlFor="custom-amount-input"
                className="block text-xs font-medium text-ink-700 uppercase tracking-wider mb-1.5"
              >
                Or Enter Custom Amount (₦)
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <span className="text-ink-500 font-serif font-bold text-lg">₦</span>
                </div>
                <input
                  id="custom-amount-input"
                  type="text"
                  inputMode="numeric"
                  value={customAmountText}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="10,000"
                  className="block w-full rounded-lg border border-ink-300 bg-white pl-8 pr-4 py-2.5 text-base font-semibold text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>
              <p className="text-[11px] text-ink-500 mt-1">
                Minimum: {formatNGN(SITE.gift.minAmountMinor)} • Maximum:{' '}
                {formatNGN(SITE.gift.maxAmountMinor)}
              </p>
            </div>
          </div>

          {/* Donor Details */}
          <div className="space-y-4">
            <div className="text-center sm:text-left">
              <span className="text-xs font-semibold tracking-wider uppercase text-gold-600 font-sans">
                Step 3
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-magenta-950 mt-0.5">
                Your Details & Note
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="giver-name-input"
                  className="block text-xs font-medium text-ink-700 uppercase tracking-wider mb-1"
                >
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="giver-name-input"
                  type="text"
                  required
                  value={giverName}
                  onChange={(e) => setGiverName(e.target.value)}
                  placeholder="e.g. Adeyemi Adeleke"
                  className="w-full rounded-lg border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="giver-email-input"
                  className="block text-xs font-medium text-ink-700 uppercase tracking-wider mb-1"
                >
                  Email for Receipt <span className="text-red-500">*</span>
                </label>
                <input
                  id="giver-email-input"
                  type="email"
                  required
                  value={giverEmail}
                  onChange={(e) => setGiverEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="giver-message-input"
                className="block text-xs font-medium text-ink-700 uppercase tracking-wider mb-1"
              >
                Personal Message to Couple (Optional)
              </label>
              <textarea
                id="giver-message-input"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your prayers, blessings, or wedding wishes..."
                className="w-full rounded-lg border border-ink-300 bg-white px-3.5 py-2 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-lg border border-ink-200 bg-ivory-100/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-magenta-800 focus:ring-gold-500"
              />
              <div className="text-xs text-ink-700">
                <span className="font-semibold text-ink-900">Keep my name anonymous</span>
                <p className="text-[11px] text-ink-500 mt-0.5">
                  Your gift will be acknowledged as &ldquo;Anonymous&rdquo; in reports. (The couple
                  will still see your name privately in their gift records).
                </p>
              </div>
            </label>
          </div>

          {onlineError && (
            <div
              role="alert"
              className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"
            >
              ⚠️ {onlineError}
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-w-[280px] rounded-lg bg-magenta-900 hover:bg-magenta-950 text-white font-serif font-bold text-base py-3.5 px-8 shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Connecting to Paystack...</span>
              ) : (
                <>
                  <span>Proceed to Pay {formatNGN(parseAmountMinor(customAmountText))}</span>
                  <span>→</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-ink-500 mt-2 flex items-center gap-1.5">
              <span>🔒</span>
              <span>
                Secured by Paystack with 256-bit encryption. We never handle your card details.
              </span>
            </p>
          </div>
        </form>
      </div>

      {/* Bank Transfer Panel */}
      <div
        role="tabpanel"
        id="panel-bank"
        aria-labelledby="tab-bank"
        hidden={currentTab !== 'bank'}
        className={currentTab === 'bank' ? 'space-y-8' : 'hidden'}
      >
        <div className="space-y-4">
          <div className="text-center sm:text-left">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-magenta-950">
              Direct Bank Transfer Details
            </h2>
            <p className="text-sm text-ink-600 mt-1">
              Transfers are confirmed manually by the couple. Please copy the account details below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-5 rounded-xl border border-gold-500/30 bg-white shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b pb-3 border-ink-100">
                  <span className="text-xs uppercase font-bold tracking-wider text-magenta-900">
                    {acc.label || `${acc.currency} Account`}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold-50 text-gold-800 font-semibold border border-gold-200">
                    {acc.currency}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-ink-500 uppercase tracking-wider">Bank</span>
                    <p className="font-serif font-bold text-base text-ink-900">{acc.bankName}</p>
                  </div>

                  <div>
                    <span className="text-xs text-ink-500 uppercase tracking-wider">
                      Account Name
                    </span>
                    <p className="font-medium text-sm text-ink-900">{acc.accountName}</p>
                  </div>

                  <div className="pt-1">
                    <CopyField
                      label="Account Number"
                      value={acc.accountNumber}
                      className="p-2.5 rounded-lg bg-ivory-100 border border-gold-200"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Declaration Card */}
        <div className="rounded-xl border border-gold-500/30 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-lg text-magenta-950">
                Have you sent a transfer?
              </h3>
              <p className="text-xs sm:text-sm text-ink-600">
                Kindly notify us so we may record your gift and properly acknowledge your kindness.
              </p>
            </div>

            {!declareSuccessRef && (
              <button
                type="button"
                onClick={() => setShowDeclareForm(!showDeclareForm)}
                className="rounded-lg border border-magenta-300 hover:border-magenta-700 text-magenta-900 px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer min-h-[40px]"
              >
                {showDeclareForm ? 'Hide Form' : 'Notify Us of Transfer →'}
              </button>
            )}
          </div>

          {declareSuccessRef ? (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-900 space-y-2">
              <p className="font-bold text-sm">✓ Thank you for letting us know!</p>
              <p className="text-xs text-green-800">
                Your transfer declaration has been recorded with reference:{' '}
                <strong className="font-mono">{declareSuccessRef}</strong>. We will confirm it once
                received.
              </p>
            </div>
          ) : showDeclareForm ? (
            <form onSubmit={handleDeclareSubmit} className="pt-4 border-t border-ink-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="declare-name-input"
                    className="block text-xs font-medium text-ink-700 uppercase tracking-wider mb-1"
                  >
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="declare-name-input"
                    type="text"
                    required
                    value={declareName}
                    onChange={(e) => setDeclareName(e.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="declare-email-input"
                    className="block text-xs font-medium text-ink-700 uppercase tracking-wider mb-1"
                  >
                    Your Email (Optional)
                  </label>
                  <input
                    id="declare-email-input"
                    type="email"
                    value={declareEmail}
                    onChange={(e) => setDeclareEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="declare-amount-input"
                    className="block text-xs font-medium text-ink-700 uppercase tracking-wider mb-1"
                  >
                    Approximate Amount Sent (₦)
                  </label>
                  <input
                    id="declare-amount-input"
                    type="text"
                    inputMode="numeric"
                    value={declareAmountText}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10);
                      setDeclareAmountText(num ? num.toLocaleString('en-NG') : '');
                    }}
                    placeholder="e.g. 50,000"
                    className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="declare-fund-select"
                    className="block text-xs font-medium text-ink-700 uppercase tracking-wider mb-1"
                  >
                    Dedicated Wish / Fund
                  </label>
                  <select
                    id="declare-fund-select"
                    value={declareFundSlug}
                    onChange={(e) => setDeclareFundSlug(e.target.value)}
                    className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm bg-white"
                  >
                    {funds.map((f) => (
                      <option key={f.slug} value={f.slug}>
                        {f.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="declare-message-input"
                  className="block text-xs font-medium text-ink-700 uppercase tracking-wider mb-1"
                >
                  Message to Couple (Optional)
                </label>
                <textarea
                  id="declare-message-input"
                  rows={2}
                  value={declareMessage}
                  onChange={(e) => setDeclareMessage(e.target.value)}
                  placeholder="Optional note..."
                  className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-ink-700 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={declareAnonymous}
                  onChange={(e) => setDeclareAnonymous(e.target.checked)}
                  className="rounded text-magenta-800"
                />
                <span>Record gift as Anonymous</span>
              </label>

              {declareError && (
                <div
                  role="alert"
                  className="p-3 rounded bg-red-50 text-xs text-red-700 border border-red-200"
                >
                  ⚠️ {declareError}
                </div>
              )}

              <button
                type="submit"
                disabled={isDeclaring}
                className="rounded-md bg-magenta-900 hover:bg-magenta-950 text-white px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                {isDeclaring ? 'Submitting...' : 'Submit Declaration'}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
