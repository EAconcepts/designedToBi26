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

export interface GiftReceiptEmailProps {
  giverName: string;
  amountFormatted: string;
  fundTitle: string;
  reference: string;
  message?: string | null;
}

export function GiftReceiptEmail({
  giverName,
  amountFormatted,
  fundTitle,
  reference,
  message,
}: GiftReceiptEmailProps) {
  const coupleNames = `${SITE.couple.a} & ${SITE.couple.b}`;
  const previewText = `Thank you for your generous gift of ${amountFormatted} to ${coupleNames}!`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header Monogram & Brand */}
          <Section style={headerStyle}>
            <div style={monogramCircleStyle}>{SITE.couple.initials}</div>
            <Text style={brandKickerStyle}>{SITE.hashtag}</Text>
            <Heading style={headingStyle}>Thank You, Truly</Heading>
            <Text style={subheadingStyle}>
              Your generosity brings us joy as we begin our married journey together.
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Gift Summary Card */}
          <Section style={summaryCardStyle}>
            <Text style={sectionTitleStyle}>Gift Receipt</Text>

            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={labelTdStyle}>To:</td>
                  <td style={valueTdStyle}>{coupleNames}</td>
                </tr>
                <tr>
                  <td style={labelTdStyle}>From:</td>
                  <td style={valueTdStyle}>{giverName}</td>
                </tr>
                <tr>
                  <td style={labelTdStyle}>Amount:</td>
                  <td style={amountValueTdStyle}>{amountFormatted}</td>
                </tr>
                <tr>
                  <td style={labelTdStyle}>Wish / Fund:</td>
                  <td style={valueTdStyle}>{fundTitle}</td>
                </tr>
                <tr>
                  <td style={labelTdStyle}>Reference:</td>
                  <td style={codeValueTdStyle}>{reference}</td>
                </tr>
              </tbody>
            </table>

            {message ? (
              <div style={messageBoxStyle}>
                <Text style={messageLabelStyle}>Your Message to the Couple:</Text>
                <Text style={messageTextStyle}>&ldquo;{message}&rdquo;</Text>
              </div>
            ) : null}
          </Section>

          {/* Heartfelt Note */}
          <Section style={personalNoteStyle}>
            <Text style={noteTextStyle}>
              &ldquo;Your presence in our lives and your thoughtful blessing mean the world to us.
              We are deeply grateful for your love and encouragement.&rdquo;
            </Text>
            <Text style={signatureStyle}>
              With heartfelt gratitude,
              <br />
              <strong>{coupleNames}</strong>
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Official wedding celebration of {SITE.couple.a} &amp; {SITE.couple.b}.
              <br />
              Saturday, 19 December 2026 • Kwara State, Nigeria
            </Text>
            <Text style={footerLinksStyle}>
              <Link href={SITE.hashtag} style={footerLinkStyle}>
                {SITE.hashtag}
              </Link>
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
  paddingBottom: '20px',
};

const monogramCircleStyle: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  backgroundColor: '#6B1D2F',
  color: '#C9A84C',
  display: 'inline-block',
  lineHeight: '56px',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '20px',
  letterSpacing: '1px',
  marginBottom: '12px',
};

const brandKickerStyle: React.CSSProperties = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color: '#A37D2C',
  fontWeight: 600,
  margin: '0 0 6px 0',
};

const headingStyle: React.CSSProperties = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: '26px',
  fontWeight: 700,
  color: '#6B1D2F',
  margin: '0 0 8px 0',
};

const subheadingStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#57534E',
  lineHeight: '1.5',
  margin: '0',
};

const dividerStyle: React.CSSProperties = {
  borderColor: '#F5E6B3',
  margin: '24px 0',
};

const summaryCardStyle: React.CSSProperties = {
  backgroundColor: '#FCFAF7',
  borderRadius: '8px',
  border: '1px solid #F5E6B3',
  padding: '20px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: '#6B1D2F',
  margin: '0 0 16px 0',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const labelTdStyle: React.CSSProperties = {
  padding: '8px 0',
  fontSize: '14px',
  color: '#78716C',
  width: '100px',
};

const valueTdStyle: React.CSSProperties = {
  padding: '8px 0',
  fontSize: '14px',
  color: '#1C1917',
  fontWeight: 500,
};

const amountValueTdStyle: React.CSSProperties = {
  padding: '8px 0',
  fontSize: '20px',
  color: '#6B1D2F',
  fontWeight: 700,
};

const codeValueTdStyle: React.CSSProperties = {
  padding: '8px 0',
  fontSize: '13px',
  fontFamily: 'monospace',
  color: '#44403C',
};

const messageBoxStyle: React.CSSProperties = {
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px dashed #E7E5E4',
};

const messageLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#78716C',
  textTransform: 'uppercase',
  margin: '0 0 4px 0',
};

const messageTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#44403C',
  fontStyle: 'italic',
  margin: '0',
  lineHeight: '1.4',
};

const personalNoteStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '16px 8px',
};

const noteTextStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#44403C',
  fontStyle: 'italic',
  margin: '0 0 16px 0',
};

const signatureStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#1C1917',
  margin: '0',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingTop: '12px',
};

const footerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#A8A29E',
  lineHeight: '1.4',
  margin: '0 0 8px 0',
};

const footerLinksStyle: React.CSSProperties = {
  fontSize: '12px',
  margin: '0',
};

const footerLinkStyle: React.CSSProperties = {
  color: '#A37D2C',
  textDecoration: 'none',
  fontWeight: 600,
};
