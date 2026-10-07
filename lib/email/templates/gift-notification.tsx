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

export interface GiftNotificationEmailProps {
  giverName: string;
  giverEmail?: string | null;
  amountFormatted: string;
  fundTitle: string;
  reference: string;
  channel: string;
  message?: string | null;
  ledgerUrl: string;
}

export function GiftNotificationEmail({
  giverName,
  giverEmail,
  amountFormatted,
  fundTitle,
  reference,
  channel,
  message,
  ledgerUrl,
}: GiftNotificationEmailProps) {
  const previewText = `New Gift: ${amountFormatted} from ${giverName} for ${fundTitle}`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <div style={tagStyle}>Gift Alert</div>
            <Heading style={headingStyle}>New Gift Received</Heading>
            <Text style={subheadingStyle}>
              A celebration contribution has just been processed for {SITE.hashtag}.
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          <Section style={detailsCardStyle}>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={labelTdStyle}>Amount:</td>
                  <td style={amountTdStyle}>{amountFormatted}</td>
                </tr>
                <tr>
                  <td style={labelTdStyle}>Giver:</td>
                  <td style={valueTdStyle}>
                    <strong>{giverName}</strong>
                    {giverEmail ? ` (${giverEmail})` : ''}
                  </td>
                </tr>
                <tr>
                  <td style={labelTdStyle}>Fund:</td>
                  <td style={valueTdStyle}>{fundTitle}</td>
                </tr>
                <tr>
                  <td style={labelTdStyle}>Channel:</td>
                  <td style={valueTdStyle}>{channel}</td>
                </tr>
                <tr>
                  <td style={labelTdStyle}>Reference:</td>
                  <td style={codeTdStyle}>{reference}</td>
                </tr>
              </tbody>
            </table>

            {message ? (
              <div style={messageBoxStyle}>
                <Text style={messageLabelStyle}>Message from Giver:</Text>
                <Text style={messageTextStyle}>&ldquo;{message}&rdquo;</Text>
              </div>
            ) : null}
          </Section>

          <Section style={ctaSectionStyle}>
            <Link href={ledgerUrl} style={buttonStyle}>
              View in Admin Ledger →
            </Link>
          </Section>

          <Hr style={dividerStyle} />

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Automated gift notification for {SITE.couple.a} &amp; {SITE.couple.b}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const mainStyle: React.CSSProperties = {
  backgroundColor: '#FAF8F5',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: '40px 16px',
  color: '#1C1917',
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #E7E5E4',
  maxWidth: '560px',
  margin: '0 auto',
  padding: '36px 28px',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingBottom: '16px',
};

const tagStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#F5E6B3',
  color: '#6B1D2F',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  padding: '4px 10px',
  borderRadius: '4px',
  marginBottom: '10px',
};

const headingStyle: React.CSSProperties = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: '24px',
  fontWeight: 700,
  color: '#6B1D2F',
  margin: '0 0 6px 0',
};

const subheadingStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#57534E',
  margin: '0',
};

const dividerStyle: React.CSSProperties = {
  borderColor: '#E7E5E4',
  margin: '20px 0',
};

const detailsCardStyle: React.CSSProperties = {
  backgroundColor: '#FCFAF7',
  borderRadius: '8px',
  border: '1px solid #E7E5E4',
  padding: '18px',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const labelTdStyle: React.CSSProperties = {
  padding: '6px 0',
  fontSize: '13px',
  color: '#78716C',
  width: '90px',
};

const valueTdStyle: React.CSSProperties = {
  padding: '6px 0',
  fontSize: '14px',
  color: '#1C1917',
};

const amountTdStyle: React.CSSProperties = {
  padding: '6px 0',
  fontSize: '18px',
  color: '#6B1D2F',
  fontWeight: 700,
};

const codeTdStyle: React.CSSProperties = {
  padding: '6px 0',
  fontSize: '13px',
  fontFamily: 'monospace',
  color: '#44403C',
};

const messageBoxStyle: React.CSSProperties = {
  marginTop: '14px',
  paddingTop: '14px',
  borderTop: '1px dashed #E7E5E4',
};

const messageLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#78716C',
  textTransform: 'uppercase',
  margin: '0 0 4px 0',
};

const messageTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#44403C',
  fontStyle: 'italic',
  margin: '0',
};

const ctaSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px 0 8px 0',
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#6B1D2F',
  color: '#FFFFFF',
  padding: '10px 20px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
};

const footerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#A8A29E',
  margin: '0',
};
