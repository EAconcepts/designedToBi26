import Link from 'next/link';
import { Monogram } from '@/components/brand';
import { SITE } from '@/content/site.config';
import { Greeting } from './Greeting';

export { Hero } from './Hero';
export { Countdown } from './Countdown';
export { LiveBanner } from './LiveBanner';
export { GalleryTeaser } from './GalleryTeaser';

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

// const photos = {
//   storyOne:
//     'https://images.unsplash.com/photo-1733319619122-b488fc1f1be0?auto=format&fit=crop&w=1200&q=85',
//   storyTwo:
//     'https://images.unsplash.com/photo-1733319619127-d7e1be53c806?auto=format&fit=crop&w=1200&q=85',
// };

const photos = {
  storyOne: '/img-6.jpg',
  storyTwo: '/img-3.jpg',
};

const eventDetails = [
  {
    number: '01',
    title: 'Solemnization of Holy Matrimony',
    date: 'Saturday, 19 December 2026',
    time: '11:00 in the morning',
    place: 'Methodist Church, Olorunsogo-GeriAlimi',
    dress: 'White · Gold · Magenta',
  },
  {
    number: '02',
    title: 'Reception & Celebration',
    date: 'Saturday, 19 December 2026',
    time: 'Time to be announced',
    place: 'Methodist Church, Olorunsogo-GeriAlimi',
    dress: 'Elegant Nigerian formal',
  },
];

export function InvitationText() {
  return (
    <section className="welcome paper-section" id="welcome" aria-labelledby="welcome-heading">
      <div className="flower-sketch flower-sketch--left" aria-hidden="true">
        〰
      </div>
      <p className="section-kicker">
        <Greeting />
      </p>
      <h2 id="welcome-heading">
        Our favourite people,
        <br />
        all in one place.
      </h2>
      <div className="gold-rule">
        <i />
      </div>
      <p className="intro-copy">
        There is no celebration without you. Join us as we honour our story, our families, and the
        beginning of our forever.
      </p>
      <div className="date-grid">
        <div>
          <strong>19</strong>
          <span>December</span>
        </div>
        <i />
        <div>
          <strong>11</strong>
          <span>O’clock</span>
        </div>
        <i />
        <div>
          <strong>26</strong>
          <span>Forever begins</span>
        </div>
      </div>
      <div className="flower-sketch flower-sketch--right" aria-hidden="true">
        〰
      </div>
    </section>
  );
}

export function StoryTimeline() {
  return (
    <section className="story-section" id="story" aria-labelledby="story-heading">
      <div className="story-heading">
        <p className="section-kicker section-kicker--gold">Written in the stars</p>
        <h2 id="story-heading">
          A beautiful
          <br />
          kind of becoming.
        </h2>
        <p>Two lives, countless little moments, and one very certain yes.</p>
      </div>

      <div className="timeline">
        <div className="timeline-line">
          <span />
        </div>
        <article className="story-moment story-moment--left">
          <div className="story-photo image-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos.storyOne}
              alt="Adetolani and Abiodun smiling together"
              width={600}
              height={800}
              loading="lazy"
            />
            <span>01</span>
          </div>
          <div className="story-text">
            <time>March 2026</time>
            <h3>
              The hello
              <br />
              that lingered
            </h3>
            <p>
              A mutual friend, one beautiful evening, and a conversation neither of us wanted to
              end.
            </p>
          </div>
        </article>
        <article className="story-moment story-moment--right">
          <div className="story-text">
            <time>May 2026</time>
            <h3>
              A promise
              <br />
              by the sea
            </h3>
            <p>At golden hour, with the ocean keeping our secret, we chose forever.</p>
          </div>
          <div className="story-photo image-frame image-frame--tall">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos.storyTwo}
              alt="The couple in formal evening wear"
              width={600}
              height={900}
              loading="lazy"
            />
            <span>02</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export function EventsSection() {
  return (
    <section className="events paper-section" id="events" aria-labelledby="events-heading">
      <div className="section-title">
        <p className="section-kicker">Save these moments</p>
        <h2 id="events-heading">The celebration</h2>
        <div className="gold-rule">
          <i />
        </div>
      </div>

      <div className="event-list">
        {eventDetails.map((event) => (
          <article className="event-card" key={event.number}>
            <span className="event-number">{event.number}</span>
            <p className="event-date">{event.date}</p>
            <h3>{event.title}</h3>
            <div className="event-meta">
              <p>{event.time}</p>
              <p>{event.place}</p>
              <p>Dress Code: {event.dress}</p>
            </div>
            <a
              className="text-link"
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                `${event.title} - Adetolani & Abiodun`,
              )}&dates=20261219T100000Z/20261219T140000Z&location=${encodeURIComponent(
                event.place,
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              Add to calendar <ArrowIcon />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

export function VenueSection() {
  return (
    <section className="venue" id="venue" aria-labelledby="venue-heading">
      <div className="venue-card">
        <p className="section-kicker section-kicker--gold">Meet us in Ilorin</p>
        <h2 id="venue-heading">
          Find your
          <br />
          way to us.
        </h2>
        <p>
          Methodist Church
          <br />
          Olorunsogo-GeriAlimi, Ilorin
        </p>
        <div className="venue-note">
          <span>Local note</span>
          <p>
            Please allow a little extra travel time. The solemnization begins promptly at 11:00am.
          </p>
        </div>
        <a
          className="button button--outline-gold"
          href="https://maps.google.com/?q=Methodist+Church+Olorunsogo+GeriAlimi+Ilorin"
          target="_blank"
          rel="noreferrer"
        >
          Open in Google Maps <ArrowIcon />
        </a>
      </div>

      <div className="map-art" aria-label="Stylised map of the Ilorin venue">
        <div className="map-road map-road--one" />
        <div className="map-road map-road--two" />
        <div className="map-road map-road--three" />
        <div className="map-pin">
          <Monogram compact />
        </div>
        <span className="map-label">Geri-Alimi</span>
        <span className="water-label">Ilorin, Kwara</span>
      </div>
    </section>
  );
}

export function ColourOfDay() {
  return (
    <section
      className="paper-section"
      id="details"
      style={{ padding: '80px 5vw', textAlign: 'center' }}
    >
      <p className="section-kicker section-kicker--gold">Attire &amp; Harmony</p>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px, 6vw, 64px)' }}>
        Colour of the Day
      </h2>
      <div className="gold-rule">
        <i />
      </div>
      <p style={{ maxWidth: '600px', margin: '0 auto 40px', color: '#674b5d', fontSize: '18px' }}>
        We invite our honoured guests to celebrate with us in elegant formal attire adhering to our
        colour palette.
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          margin: '0 auto 30px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '1px solid #b8892f',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          />
          <strong style={{ fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            White
          </strong>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #b8892f, #e8cb7a)',
              boxShadow: '0 4px 12px rgba(184,137,47,0.25)',
            }}
          />
          <strong style={{ fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Gold
          </strong>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#a3125f',
              boxShadow: '0 4px 12px rgba(163,18,95,0.25)',
            }}
          />
          <strong style={{ fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Magenta
          </strong>
        </div>
      </div>
    </section>
  );
}

export function GiftTeaser() {
  return (
    <section
      className="paper-section"
      id="gifts"
      style={{
        padding: '90px 5vw',
        textAlign: 'center',
        borderTop: '1px solid rgba(184, 137, 47, 0.15)',
      }}
    >
      <p className="section-kicker section-kicker--gold">Your presence is our present</p>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(42px, 6vw, 68px)' }}>
        Wedding Gifts
      </h2>
      <div className="gold-rule">
        <i />
      </div>
      <p
        style={{
          maxWidth: '560px',
          margin: '0 auto 35px',
          color: '#674b5d',
          fontSize: '19px',
          fontFamily: 'Cormorant Garamond, serif',
          fontStyle: 'italic',
        }}
      >
        For those who wish to bless our union with a token of love, we have prepared gift funds to
        help us begin our journey together.
      </p>
      <Link href="/gift" className="button button--magenta">
        View gift options <ArrowIcon />
      </Link>
    </section>
  );
}

export function FaqSection() {
  return (
    <section
      className="paper-section"
      id="faq"
      style={{
        padding: '80px 5vw',
        borderTop: '1px solid rgba(184, 137, 47, 0.15)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <p className="section-kicker section-kicker--gold">Helpful information</p>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px, 5vw, 56px)' }}>
          Frequently Asked Questions
        </h2>
        <div className="gold-rule">
          <i />
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', display: 'grid', gap: '16px' }}>
        {SITE.faq.map((item) => (
          <details
            key={item.q}
            style={{
              background: '#ffffff',
              border: '1px solid rgba(184, 137, 47, 0.25)',
              padding: '20px 24px',
              borderRadius: '8px',
            }}
          >
            <summary
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '22px',
                fontWeight: 500,
                cursor: 'pointer',
                color: '#2a0a1f',
              }}
            >
              {item.q}
            </summary>
            <p style={{ marginTop: '12px', color: '#5b4553', lineHeight: '1.7', fontSize: '15px' }}>
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function RsvpContacts() {
  return (
    <section className="rsvp" id="rsvp">
      <div className="rsvp-copy">
        <p className="section-kicker section-kicker--gold">Kindly reply by 5 December</p>
        <h2>
          Will you
          <br />
          join us?
        </h2>
        <p>Your presence is the greatest gift. We would be honoured to celebrate with you.</p>
        <div className="signature">With love, Adetolani &amp; Abiodun</div>
      </div>

      <div className="rsvp-form-wrap" style={{ textAlign: 'center' }}>
        <div
          style={{
            background: 'white',
            padding: '40px 32px',
            border: '1px solid rgba(184, 137, 47, 0.25)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          }}
        >
          <Monogram compact />
          <h3
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '28px',
              marginTop: '16px',
              marginBottom: '12px',
            }}
          >
            Online RSVP is open
          </h3>
          <p
            style={{
              color: '#5b4553',
              fontSize: '15px',
              marginBottom: '28px',
              lineHeight: '1.6',
            }}
          >
            Please let us know your attendance status and household details so we can plan your
            place at the table.
          </p>
          <Link href="/rsvp" className="button button--magenta" style={{ width: '100%' }}>
            Complete RSVP form <ArrowIcon />
          </Link>

          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(184, 137, 47, 0.2)',
              fontSize: '13px',
              color: '#5b4553',
            }}
          >
            <p style={{ fontWeight: 500, marginBottom: '6px' }}>Need assistance?</p>
            {SITE.rsvpContacts.map((contact) => (
              <p key={contact.name} style={{ margin: '4px 0' }}>
                {contact.name}:{' '}
                <a
                  href={`tel:${contact.tel}`}
                  style={{ textDecoration: 'underline', color: '#a3125f' }}
                >
                  {contact.tel}
                </a>
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return null; // Handled by PublicFooter in layout
}
