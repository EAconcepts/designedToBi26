'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function GiftPage() {
  const [method, setMethod] = useState<'card' | 'bank'>('card');
  const [fund, setFund] = useState('Honeymoon');
  const [amount, setAmount] = useState('10,000');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText('1234567890');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="route-page">
      <header className="inner-hero">
        <div className="inner-hero__ornament">AE</div>
        <p className="section-kicker section-kicker--gold">Your presence is our greatest gift</p>
        <h1>
          A gift, <em>with love</em>
        </h1>
        <p className="inner-hero__body">
          For those who have asked, we’ve created a few ways to contribute to our next chapter.
        </p>
        <span className="inner-hero__line" />
      </header>

      <section className="gift-page paper-section">
        <div className="gift-funds">
          <p className="section-kicker">Choose a wish</p>
          <h2>Where would you like your kindness to go?</h2>
          {[
            ['Honeymoon', 'A few beautiful days to begin married life'],
            ['Our first home', 'Helping us build a place full of warmth'],
            ['Give forward', 'A contribution to a cause close to us'],
          ].map(([name, body], index) => (
            <button
              className={fund === name ? 'active' : ''}
              onClick={() => setFund(name ?? '')}
              key={name}
              type="button"
            >
              <span>0{index + 1}</span>
              <div>
                <b>{name}</b>
                <small>{body}</small>
              </div>
              <i>→</i>
            </button>
          ))}
        </div>

        <div className="gift-checkout">
          <div className="gift-tabs">
            <button
              className={method === 'card' ? 'active' : ''}
              onClick={() => setMethod('card')}
              type="button"
            >
              Pay securely
            </button>
            <button
              className={method === 'bank' ? 'active' : ''}
              onClick={() => setMethod('bank')}
              type="button"
            >
              Bank transfer
            </button>
          </div>

          {method === 'card' ? (
            <>
              <p className="selected-fund">
                Your gift to <strong>{fund}</strong>
              </p>
              <div className="amount-grid">
                {['5,000', '10,000', '20,000', '50,000'].map((value) => (
                  <button
                    className={amount === value ? 'active' : ''}
                    onClick={() => setAmount(value)}
                    key={value}
                    type="button"
                  >
                    ₦{value}
                  </button>
                ))}
              </div>
              <label className="gift-label">
                Or enter an amount
                <div className="currency-input">
                  <span>₦</span>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} type="text" />
                </div>
              </label>
              <label className="gift-label">
                Your name
                <input placeholder="Full name" type="text" />
              </label>
              <label className="gift-label">
                Email for your receipt
                <input placeholder="you@example.com" type="email" />
              </label>
              <label className="gift-label">
                A message, if you wish
                <textarea rows={3} placeholder="Write a note to the couple..." />
              </label>
              <Link
                className="button button--magenta gift-pay"
                href="/gift/complete?status=success"
              >
                Continue to secure payment <span>→</span>
              </Link>
              <p className="secure-note">
                Payments are securely processed by Paystack. We never see or store your card
                details.
              </p>
            </>
          ) : (
            <div className="bank-card">
              <p className="section-kicker">Nigerian naira account</p>
              <h3>Our wedding gift account</h3>
              <dl>
                <div>
                  <dt>Bank</dt>
                  <dd>Providus Bank</dd>
                </div>
                <div>
                  <dt>Account name</dt>
                  <dd>Adetolani &amp; Abiodun</dd>
                </div>
                <div>
                  <dt>Account number</dt>
                  <dd>1234567890</dd>
                </div>
              </dl>
              <button className="button button--magenta" onClick={handleCopy} type="button">
                {copied ? 'Copied to clipboard' : 'Copy account number'}
              </button>
              {/* TODO(content): replace with final verified bank account details before launch */}
              <small>
                Kindly notify us after your transfer so we may properly acknowledge your gift.
              </small>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
