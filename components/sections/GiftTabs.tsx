'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SITE } from '@/content/site.config';
import { formatNGN, toMinor } from '@/lib/money';

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
  const selectedFund = funds.find((f) => f.slug === selectedFundSlug) || funds[0];

  const [selectedPresetMinor, setSelectedPresetMinor] = useState<number | null>(
    SITE.gift.presetAmountsMinor[1] ?? 1000000,
  );
  const [customAmountText, setCustomAmountText] = useState(
    (SITE.gift.presetAmountsMinor[1]
      ? SITE.gift.presetAmountsMinor[1] / 100
      : 100000
    ).toLocaleString('en-NG'),
  );
  const [giverName, setGiverName] = useState('');
  const [giverEmail, setGiverEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);

  // Bank Transfer State
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
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

  const handleCopy = async (accNum: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(accNum);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = accNum;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedAccount(accNum);
      setTimeout(() => setCopiedAccount(null), 2500);
    } catch {
      // ignore
    }
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
      <section className="gift-page paper-section">
        <div className="gift-funds" style={{ textAlign: 'center', gridColumn: '1 / -1' }}>
          <p className="section-kicker">With Love</p>
          <h2>Giving details will appear here</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="gift-page paper-section">
      {/* Left Column: Fund Wish Selection */}
      <div className="gift-funds">
        <p className="section-kicker">Choose a wish</p>
        <h2>Where would you like your kindness to go?</h2>
        {funds.map((f, index) => (
          <button
            key={f.id}
            type="button"
            className={selectedFundSlug === f.slug ? 'active' : ''}
            onClick={() => setSelectedFundSlug(f.slug)}
            aria-pressed={selectedFundSlug === f.slug}
          >
            <span>0{index + 1}</span>
            <div>
              <b>{f.title}</b>
              {f.description ? <small>{f.description}</small> : null}
            </div>
            <i>→</i>
          </button>
        ))}
      </div>

      {/* Right Column: Checkout Card */}
      <div className="gift-checkout">
        <div className="gift-tabs" role="tablist" aria-label="Gift payment method">
          <button
            type="button"
            role="tab"
            id="tab-online"
            aria-selected={currentTab === 'online'}
            aria-controls="panel-online"
            aria-label="Pay securely (Give online)"
            className={currentTab === 'online' ? 'active' : ''}
            onClick={() => setTab('online')}
          >
            Pay securely
          </button>
          <button
            type="button"
            role="tab"
            id="tab-bank"
            aria-selected={currentTab === 'bank'}
            aria-controls="panel-bank"
            aria-label="Bank transfer"
            className={currentTab === 'bank' ? 'active' : ''}
            onClick={() => setTab('bank')}
          >
            Bank transfer
          </button>
        </div>

        {currentTab === 'online' ? (
          <div role="tabpanel" id="panel-online" aria-labelledby="tab-online">
            <form onSubmit={handleOnlineSubmit}>
              <p className="selected-fund">
                Your gift to <strong>{selectedFund?.title || 'Selected Fund'}</strong>
              </p>

              <div className="amount-grid" role="group" aria-label="Gift amount presets">
                {SITE.gift.presetAmountsMinor.map((minor) => {
                  const naira = minor / 100;
                  const label = naira.toLocaleString('en-NG');
                  return (
                    <button
                      key={minor}
                      type="button"
                      className={selectedPresetMinor === minor ? 'active' : ''}
                      onClick={() => handlePresetClick(minor)}
                    >
                      ₦{label}
                    </button>
                  );
                })}
              </div>

              <label className="gift-label" htmlFor="custom-amount-input">
                Or enter an amount
                <div className="currency-input">
                  <span>₦</span>
                  <input
                    id="custom-amount-input"
                    value={customAmountText}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    type="text"
                    inputMode="numeric"
                    placeholder="10,000"
                  />
                </div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '9px',
                    textTransform: 'none',
                    letterSpacing: 0,
                    color: '#5c4a55',
                    marginTop: '6px',
                  }}
                >
                  Min: {formatNGN(SITE.gift.minAmountMinor)} · Max:{' '}
                  {formatNGN(SITE.gift.maxAmountMinor)}
                </span>
              </label>

              <label className="gift-label" htmlFor="giver-name-input">
                Your name
                <input
                  id="giver-name-input"
                  placeholder="Full name"
                  type="text"
                  required
                  value={giverName}
                  onChange={(e) => setGiverName(e.target.value)}
                />
              </label>

              <label className="gift-label" htmlFor="giver-email-input">
                Email for your receipt
                <input
                  id="giver-email-input"
                  placeholder="you@example.com"
                  type="email"
                  required
                  value={giverEmail}
                  onChange={(e) => setGiverEmail(e.target.value)}
                />
              </label>

              <label className="gift-label" htmlFor="giver-message-input">
                A message, if you wish
                <textarea
                  id="giver-message-input"
                  rows={3}
                  placeholder="Write a note to the couple..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '-10px',
                  marginBottom: '24px',
                  fontSize: '11px',
                  color: '#735e6b',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ accentColor: 'var(--magenta)', cursor: 'pointer' }}
                />
                <span>Keep my name anonymous in public records</span>
              </label>

              {onlineError && (
                <div
                  role="alert"
                  style={{
                    padding: '12px 14px',
                    marginBottom: '20px',
                    background: '#fdf2f2',
                    border: '1px solid #f8b4b4',
                    color: '#9b1c1c',
                    fontSize: '12px',
                    borderRadius: '4px',
                  }}
                >
                  ⚠️ {onlineError}
                </div>
              )}

              <button
                className="button button--magenta gift-pay"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Connecting to Paystack...</span>
                ) : (
                  <>
                    <span>Continue to secure payment</span> <span>→</span>
                  </>
                )}
              </button>

              <p className="secure-note">
                Payments are securely processed by Paystack. We never see or store your card
                details.
              </p>
            </form>
          </div>
        ) : (
          <div role="tabpanel" id="panel-bank" aria-labelledby="tab-bank">
            {bankAccounts.map((account) => (
              <div key={account.id} className="bank-card">
                <p className="section-kicker">{account.currency} account</p>
                <h3>Our wedding gift account</h3>
                <dl>
                  <div>
                    <dt>Bank</dt>
                    <dd>{account.bankName}</dd>
                  </div>
                  <div>
                    <dt>Account name</dt>
                    <dd>{account.accountName}</dd>
                  </div>
                  <div>
                    <dt>Account number</dt>
                    <dd>{account.accountNumber}</dd>
                  </div>
                </dl>

                <button
                  className="button button--magenta"
                  onClick={() => handleCopy(account.accountNumber)}
                  type="button"
                  style={{ width: '100%', marginBottom: '14px' }}
                >
                  {copiedAccount === account.accountNumber
                    ? 'Copied to clipboard'
                    : 'Copy account number'}
                </button>

                <small style={{ display: 'block', textAlign: 'center', marginBottom: '20px' }}>
                  Kindly notify us after your transfer so we may properly acknowledge your gift.
                </small>
              </div>
            ))}

            {/* Transfer Declaration Disclosure */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0d4c8' }}>
              {!declareSuccessRef && (
                <button
                  type="button"
                  onClick={() => setShowDeclareForm(!showDeclareForm)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: '1px dashed #c4b5a5',
                    padding: '12px',
                    color: 'var(--magenta)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {showDeclareForm ? 'Hide notification form' : 'Notify Us of Transfer →'}
                </button>
              )}

              {declareSuccessRef ? (
                <div
                  style={{
                    padding: '16px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    fontSize: '13px',
                    marginTop: '16px',
                  }}
                >
                  <p style={{ fontWeight: 600 }}>✓ Thank you for letting us know!</p>
                  <p style={{ marginTop: '4px', fontSize: '12px' }}>
                    Your transfer declaration has been recorded with reference:{' '}
                    <strong style={{ fontFamily: 'monospace' }}>{declareSuccessRef}</strong>. We
                    will confirm it once received.
                  </p>
                </div>
              ) : showDeclareForm ? (
                <form onSubmit={handleDeclareSubmit} style={{ marginTop: '20px' }}>
                  <label className="gift-label" htmlFor="declare-name-input">
                    Your name
                    <input
                      id="declare-name-input"
                      placeholder="Full name"
                      type="text"
                      required
                      value={declareName}
                      onChange={(e) => setDeclareName(e.target.value)}
                    />
                  </label>

                  <label className="gift-label" htmlFor="declare-email-input">
                    Your email (optional)
                    <input
                      id="declare-email-input"
                      placeholder="you@example.com"
                      type="email"
                      value={declareEmail}
                      onChange={(e) => setDeclareEmail(e.target.value)}
                    />
                  </label>

                  <label className="gift-label" htmlFor="declare-amount-input">
                    Approximate amount sent (₦)
                    <div className="currency-input">
                      <span>₦</span>
                      <input
                        id="declare-amount-input"
                        type="text"
                        inputMode="numeric"
                        value={declareAmountText}
                        onChange={(e) => {
                          const num = parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10);
                          setDeclareAmountText(num ? num.toLocaleString('en-NG') : '');
                        }}
                        placeholder="e.g. 25,000"
                      />
                    </div>
                  </label>

                  <label className="gift-label" htmlFor="declare-fund-select">
                    Dedicated wish / fund
                    <select
                      id="declare-fund-select"
                      value={declareFundSlug}
                      onChange={(e) => setDeclareFundSlug(e.target.value)}
                      style={{
                        width: '100%',
                        marginTop: '8px',
                        padding: '10px 0',
                        border: 0,
                        borderBottom: '1px solid #cab9a7',
                        background: 'transparent',
                        fontFamily: 'Cormorant Garamond, serif',
                        fontSize: '18px',
                        color: 'var(--ink)',
                        outline: 'none',
                      }}
                    >
                      {funds.map((f) => (
                        <option key={f.slug} value={f.slug}>
                          {f.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="gift-label" htmlFor="declare-message-input">
                    Message to couple (optional)
                    <textarea
                      id="declare-message-input"
                      rows={2}
                      placeholder="Write a note..."
                      value={declareMessage}
                      onChange={(e) => setDeclareMessage(e.target.value)}
                    />
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: '-10px 0 20px',
                      fontSize: '11px',
                      color: '#735e6b',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={declareAnonymous}
                      onChange={(e) => setDeclareAnonymous(e.target.checked)}
                      style={{ accentColor: 'var(--magenta)' }}
                    />
                    <span>Record gift as Anonymous</span>
                  </label>

                  {declareError && (
                    <div
                      role="alert"
                      style={{
                        padding: '10px',
                        marginBottom: '16px',
                        background: '#fdf2f2',
                        border: '1px solid #f8b4b4',
                        color: '#9b1c1c',
                        fontSize: '12px',
                      }}
                    >
                      ⚠️ {declareError}
                    </div>
                  )}

                  <button
                    className="button button--magenta"
                    type="submit"
                    disabled={isDeclaring}
                    style={{ width: '100%' }}
                  >
                    {isDeclaring ? 'Submitting...' : 'Submit Declaration'}
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
