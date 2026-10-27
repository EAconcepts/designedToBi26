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

export interface RsvpNotificationEmailProps {
  guestName: string;
  status: 'ATTENDING' | 'DECLINED';
  attendees: Array<{
    name: string;
    events: string[];
    meal?: string | null;
    dietary?: string | null;
  }>;
  message?: string | null;
  adminUrl?: string;
}

export function RsvpNotificationEmail({
  guestName,
  status,
  attendees,
  message,
  adminUrl,
}: RsvpNotificationEmailProps) {
  const isAttending = status === 'ATTENDING';
  const previewText = `New RSVP from ${guestName}: ${isAttending ? `Attending (${attendees.length} guests)` : 'Declined'}`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={badgeStyle}>NEW RSVP RECEIVED</Text>
            <Heading style={headingStyle}>{guestName}</Heading>
            <Text style={statusStyle}>
              Status:{' '}
              <strong style={{ color: isAttending ? '#2E7D32' : '#C62828' }}>{status}</strong>{' '}
              {isAttending && `(${attendees.length} guest${attendees.length === 1 ? '' : 's'})`}
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {isAttending && attendees.length > 0 && (
            <Section style={sectionStyle}>
              <Text style={labelStyle}>ATTENDEES</Text>
              {attendees.map((att, idx) => (
                <div key={idx} style={rowStyle}>
                  <Text style={rowNameStyle}>{att.name}</Text>
                  {att.events.length > 0 && (
                    <Text style={rowMetaStyle}>Events: {att.events.join(', ')}</Text>
                  )}
                  {att.dietary && <Text style={rowMetaStyle}>Dietary: {att.dietary}</Text>}
                  {att.meal && <Text style={rowMetaStyle}>Meal: {att.meal}</Text>}
                </div>
              ))}
            </Section>
          )}

          {message && (
            <Section style={sectionStyle}>
              <Text style={labelStyle}>NOTES</Text>
              {message && (
                <Text style={noteStyle}>
                  💌 <strong>Message:</strong> &quot;{message}&quot;
                </Text>
              )}
            </Section>
          )}

          {adminUrl && (
            <Section style={actionStyle}>
              <Link href={adminUrl} style={buttonStyle}>
                Open Admin Dashboard
              </Link>
            </Section>
          )}

          <Hr style={dividerStyle} />

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>{SITE.hashtag} Coordinator Notification</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const mainStyle: React.CSSProperties = {
  backgroundColor: '#F8F6F0',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  padding: '24px 0',
  color: '#242220',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '24px',
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  border: '1px solid #EAE3D6',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'left',
};

const badgeStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: '#C5A059',
  margin: '0 0 6px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '20px',
  margin: '0 0 8px',
  color: '#242220',
};

const statusStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#555',
  margin: '0',
};

const dividerStyle: React.CSSProperties = {
  borderColor: '#EFEAE0',
  margin: '16px 0',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#8A6D3B',
  margin: '0 0 6px',
};

const rowStyle: React.CSSProperties = {
  padding: '6px 0',
  borderBottom: '1px solid #FAF8F4',
};

const rowNameStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  margin: '0',
};

const rowMetaStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  margin: '2px 0 0',
};

const noteStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#333',
  margin: '4px 0',
};

const actionStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '20px',
  marginBottom: '12px',
};

const buttonStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#242220',
  color: '#FFFFFF',
  padding: '10px 20px',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 600,
  textDecoration: 'none',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
};

const footerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#999',
  margin: '0',
};
