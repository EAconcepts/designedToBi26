import Link from 'next/link';

export default function GiftCompletePage() {
  return (
    <div className="route-page status-page">
      <div className="status-card">
        <div className="status-rings">
          <span>✓</span>
        </div>
        <p className="section-kicker section-kicker--gold">Gift received</p>
        <h1>
          Thank you,
          <br />
          <em>truly.</em>
        </h1>
        <p>Your generosity means more than we can say. A receipt is on its way to your email.</p>
        <div className="receipt">
          <span>Contribution</span>
          <strong>₦10,000</strong>
          <span>Honeymoon fund</span>
        </div>
        <Link className="button button--outline-gold" href="/">
          Return to our invitation
        </Link>
      </div>
    </div>
  );
}
