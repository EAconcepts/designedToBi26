import { ImageResponse } from 'next/og';
import { SITE } from '@/content/site.config';

export const runtime = 'nodejs';

export const alt = `${SITE.couple.a} & ${SITE.couple.b} — Wedding Celebration`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fbf8f3',
        padding: '40px',
      }}
    >
      {/* Double gold hairline border frame */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #c9a24b',
          borderRadius: '16px',
          padding: '36px',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Monogram circle */}
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: '3px solid #c9a24b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            fontSize: '44px',
            fontWeight: 600,
            color: '#c9a24b',
            fontFamily: 'serif',
          }}
        >
          {SITE.couple.initials}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: '18px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#c9a24b',
            fontWeight: 600,
            marginBottom: '10px',
          }}
        >
          The Wedding Celebration of
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: '52px',
            fontWeight: 700,
            color: '#2a0a1f',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: '14px',
            fontFamily: 'serif',
          }}
        >
          {`${SITE.couple.a} & ${SITE.couple.b}`}
        </div>

        <div
          style={{
            display: 'flex',
            width: '160px',
            height: '2px',
            backgroundColor: '#c9a24b',
            marginBottom: '18px',
          }}
        />

        <div
          style={{
            display: 'flex',
            fontSize: '24px',
            color: '#5b4553',
            marginBottom: '22px',
          }}
        >
          {`Saturday, 19 December 2026 · ${SITE.venue.city}, ${SITE.venue.state}`}
        </div>

        {/* Palette swatches & Hashtag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '1px solid #c9a24b',
              }}
            />
            <div
              style={{
                display: 'flex',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#c9a24b',
              }}
            />
            <div
              style={{
                display: 'flex',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#a3125f',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '20px',
              color: '#a3125f',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            {SITE.hashtag}
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
