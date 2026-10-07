import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="route-page thank-page">
      <div className="thank-page__image" />
      <div className="thank-page__shade" />
      <div
        className="thank-page__content"
        style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '120px 20px 80px' }}
      >
        <div className="inner-hero__ornament">AE</div>
        <p className="section-kicker section-kicker--gold">From the bottom of our hearts</p>
        <h1>
          Thank <em>you.</em>
        </h1>
        <p
          style={{
            maxWidth: '580px',
            margin: '20px auto 30px',
            fontSize: '18px',
            lineHeight: '1.6',
          }}
        >
          For every journey made, every prayer offered, every dance shared and every memory
          created—we will carry this day with us always.
        </p>
        <div
          className="signature"
          style={{
            fontFamily: 'var(--font-signature, cursive)',
            fontSize: '32px',
            color: 'var(--light-gold)',
            marginBottom: '35px',
          }}
        >
          Adetolani &amp; Abiodun
        </div>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="button button--magenta" href="/gallery">
            View wedding gallery
          </Link>
          <Link className="button button--glass" href="/">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
