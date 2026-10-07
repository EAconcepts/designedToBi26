import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Link,
  Hr,
  Preview,
} from '@react-email/components';
import { SITE } from '@/content/site.config';

export interface RsvpConfirmationEmailProps {
  guestName: string;
  status: 'ATTENDING' | 'DECLINED';
  attendees: Array<{
    name: string;
    events: string[];
    meal?: string | null;
    dietary?: string | null;
  }>;
  events: Array<{
    slug: string;
    title: string;
    dateFormatted: string;
    timeFormatted: string;
    venueName: string;
  }>;
  songRequest?: string | null;
  message?: string | null;
  calendarUrl?: string;
  manageRsvpUrl?: string;
}

export function RsvpConfirmationEmail({
  guestName,
  status,
  attendees,
  events,
  songRequest,
  message,
  calendarUrl,
  manageRsvpUrl,
}: RsvpConfirmationEmailProps) {
  const isAttending = status === 'ATTENDING';
  const coupleNames = `${SITE.couple.a} & ${SITE.couple.b}`;
  const previewText = isAttending
    ? `Your RSVP is confirmed for ${coupleNames}'s wedding celebrating on 19 December 2026.`
    : `We have received your RSVP response for ${coupleNames}'s wedding.`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header Monogram & Brand */}
          <Section style={headerSectionStyle}>
            <div style={monogramBadgeStyle}>AE</div>
            <Text style={hashtagStyle}>{SITE.hashtag}</Text>
            <Text style={subHeaderStyle}>The Wedding of {coupleNames}</Text>
          </Section>

          <Hr style={goldDividerStyle} />

          {/* Main Card */}
          <Section style={contentCardStyle}>
            <Heading style={headingStyle}>
              {isAttending ? 'RSVP Confirmation' : 'Response Received'}
            </Heading>

            <Text style={greetingStyle}>Dear {guestName},</Text>

            {isAttending ? (
              <Section style={statusBannerAttendingStyle}>
                <Text style={statusBannerTextStyle}>
                  ✓ We are delighted to confirm your attendance! We cannot wait to celebrate our
                  special day with you.
                </Text>
              </Section>
            ) : (
              <Section style={statusBannerDeclinedStyle}>
                <Text style={statusBannerTextStyle}>
                  Thank you for letting us know. You will be dearly missed on our special day!
                </Text>
              </Section>
            )}

            {/* Event schedule details (only if attending) */}
            {isAttending && events.length > 0 && (
              <Section style={sectionBlockStyle}>
                <Text style={sectionTitleStyle}>EVENTS & SCHEDULE</Text>
                {events.map((evt) => (
                  <div key={evt.slug} style={eventCardStyle}>
                    <Text style={eventTitleStyle}>{evt.title}</Text>
                    <Text style={eventDetailStyle}>
                      📅 {evt.dateFormatted} • {evt.timeFormatted}
                    </Text>
                    <Text style={eventDetailStyle}>📍 {evt.venueName}</Text>
                  </div>
                ))}
              </Section>
            )}

            {/* Attendees list (only if attending) */}
            {isAttending && attendees.length > 0 && (
              <Section style={sectionBlockStyle}>
                <Text style={sectionTitleStyle}>REGISTERED GUESTS ({attendees.length})</Text>
                <div style={attendeeCardStyle}>
                  {attendees.map((att, idx) => (
                    <div
                      key={idx}
                      style={{
                        paddingBottom: '8px',
                        marginBottom: idx !== attendees.length - 1 ? '8px' : '0',
                        borderBottom: idx !== attendees.length - 1 ? '1px solid #EBE4D8' : 'none',
                      }}
                    >
                      <Text style={attendeeNameStyle}>
                        <strong>{att.name}</strong>
                      </Text>
                      {att.dietary && (
                        <Text style={attendeeMetaStyle}>Dietary notes: {att.dietary}</Text>
                      )}
                      {att.meal && (
                        <Text style={attendeeMetaStyle}>Meal preference: {att.meal}</Text>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Personal messages */}
            {(songRequest || message) && (
              <Section style={sectionBlockStyle}>
                <Text style={sectionTitleStyle}>YOUR NOTES</Text>
                <div style={notesCardStyle}>
                  {songRequest && (
                    <Text style={noteTextStyle}>
                      🎶 <strong>Song Request:</strong> &quot;{songRequest}&quot;
                    </Text>
                  )}
                  {message && (
                    <Text style={noteTextStyle}>
                      💌 <strong>Message to the Couple:</strong> &quot;{message}&quot;
                    </Text>
                  )}
                </div>
              </Section>
            )}

            {/* Actions: Calendar & Update */}
            <Section style={actionSectionStyle}>
              {calendarUrl && isAttending && (
                <Link href={calendarUrl} style={primaryButtonStyle}>
                  Add to Calendar
                </Link>
              )}
              {manageRsvpUrl && (
                <Text style={manageTextStyle}>
                  Need to update your plans?{' '}
                  <Link href={manageRsvpUrl} style={linkStyle}>
                    Review or update your RSVP here
                  </Link>
                </Text>
              )}
            </Section>

            {/* Contact Coordinators */}
            <Section style={contactSectionStyle}>
              <Text style={contactHeaderStyle}>Questions or need assistance?</Text>
              <Text style={contactBodyStyle}>
                {SITE.rsvpContacts.map((c, i) => (
                  <span key={c.name}>
                    {c.name}:{' '}
                    <a href={`tel:${c.tel}`} style={linkStyle}>
                      {c.tel}
                    </a>
                    {i < SITE.rsvpContacts.length - 1 ? ' • ' : ''}
                  </span>
                ))}
              </Text>
            </Section>

            <Hr style={thinDividerStyle} />

            {/* Sign-off */}
            <Section style={signOffStyle}>
              <Text style={signOffTextStyle}>With love and appreciation,</Text>
              <Text style={signatureStyle}>Adetolani & Emmanuel</Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footerSectionStyle}>
            <Text style={footerTextStyle}>
              {SITE.hashtag} • Saturday, 19 December 2026 • Ilorin, Nigeria
            </Text>
            <Text style={footerDisclaimerStyle}>
              This email was sent to confirm your wedding RSVP. If you did not submit this, please
              contact the wedding party.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Inline styles for broad email client support (Gmail, iOS Mail, Outlook)
const mainStyle: React.CSSProperties = {
  backgroundColor: '#F8F6F0',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  margin: '0',
  padding: '24px 0',
  color: '#242220',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0 16px',
};

const headerSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '16px 0 8px',
};

const monogramBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  width: '48px',
  height: '48px',
  lineHeight: '48px',
  borderRadius: '24px',
  backgroundColor: '#C5A059',
  color: '#FFFFFF',
  fontFamily: 'Georgia, serif',
  fontSize: '20px',
  fontWeight: 'bold',
  textAlign: 'center',
  letterSpacing: '1px',
};

const hashtagStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: '#8A6D3B',
  margin: '8px 0 2px',
};

const subHeaderStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#635D56',
  margin: '0',
};

const goldDividerStyle: React.CSSProperties = {
  borderColor: '#C5A059',
  borderWidth: '1px',
  borderStyle: 'solid',
  margin: '16px auto 24px',
  maxWidth: '120px',
};

const thinDividerStyle: React.CSSProperties = {
  borderColor: '#E8E3D9',
  borderWidth: '1px',
  borderStyle: 'solid',
  margin: '24px 0',
};

const contentCardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '32px 24px',
  border: '1px solid #EAE3D6',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
};

const headingStyle: React.CSSProperties = {
  fontSize: '22px',
  fontFamily: 'Georgia, serif',
  color: '#242220',
  textAlign: 'center',
  margin: '0 0 16px',
};

const greetingStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#383430',
  marginBottom: '16px',
};

const statusBannerAttendingStyle: React.CSSProperties = {
  backgroundColor: '#F3F8F2',
  borderRadius: '8px',
  padding: '12px 16px',
  border: '1px solid #D2E7CF',
  marginBottom: '20px',
};

const statusBannerDeclinedStyle: React.CSSProperties = {
  backgroundColor: '#FAF5F3',
  borderRadius: '8px',
  padding: '12px 16px',
  border: '1px solid #EEDCD5',
  marginBottom: '20px',
};

const statusBannerTextStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
  color: '#2A4E27',
};

const sectionBlockStyle: React.CSSProperties = {
  marginBottom: '20px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: '#8A6D3B',
  margin: '0 0 8px',
};

const eventCardStyle: React.CSSProperties = {
  backgroundColor: '#FAF8F4',
  border: '1px solid #EFEAE0',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '8px',
};

const eventTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#242220',
  margin: '0 0 4px',
};

const eventDetailStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#635D56',
  margin: '2px 0',
};

const attendeeCardStyle: React.CSSProperties = {
  backgroundColor: '#FAF8F4',
  border: '1px solid #EFEAE0',
  borderRadius: '8px',
  padding: '12px 16px',
};

const attendeeNameStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#242220',
  margin: '0',
};

const attendeeMetaStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#635D56',
  margin: '2px 0 0',
};

const notesCardStyle: React.CSSProperties = {
  backgroundColor: '#FAF8F4',
  border: '1px solid #EFEAE0',
  borderRadius: '8px',
  padding: '12px 16px',
};

const noteTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#383430',
  margin: '4px 0',
};

const actionSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '24px',
  marginBottom: '16px',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#C5A059',
  color: '#FFFFFF',
  padding: '12px 24px',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '14px',
  textDecoration: 'none',
  letterSpacing: '0.02em',
  boxShadow: '0 2px 4px rgba(197, 160, 89, 0.25)',
};

const manageTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#706A62',
  marginTop: '12px',
};

const linkStyle: React.CSSProperties = {
  color: '#8A6D3B',
  textDecoration: 'underline',
};

const contactSectionStyle: React.CSSProperties = {
  backgroundColor: '#FAF9F6',
  borderRadius: '8px',
  padding: '12px 16px',
  textAlign: 'center',
  marginTop: '20px',
};

const contactHeaderStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#4A4641',
  margin: '0 0 4px',
};

const contactBodyStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#706A62',
  margin: '0',
};

const signOffStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '16px',
};

const signOffTextStyle: React.CSSProperties = {
  fontSize: '14px',
  fontStyle: 'italic',
  color: '#706A62',
  margin: '0 0 4px',
};

const signatureStyle: React.CSSProperties = {
  fontSize: '18px',
  fontFamily: 'Georgia, serif',
  color: '#8A6D3B',
  fontWeight: 600,
  margin: '0',
};

const footerSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '24px 0 8px',
};

const footerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#857F77',
  margin: '0 0 6px',
};

const footerDisclaimerStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#A6A097',
  margin: '0',
  lineHeight: '1.4',
};
