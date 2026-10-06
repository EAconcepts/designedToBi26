import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { SITE } from '@/content/site.config';
import { Resend as ResendClient } from 'resend';

// Model mapping: AdminUser -> User
const prismaForAuth = new Proxy(prisma, {
  get(target, prop, receiver) {
    if (prop === 'user') {
      return (target as unknown as { adminUser: unknown }).adminUser;
    }
    return Reflect.get(target, prop, receiver);
  },
});

function getAdminAllowlist(): Set<string> {
  return new Set(
    env.server.ADMIN_ALLOWLIST.split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminAllowlist().has(email.trim().toLowerCase());
}

const resendClient = new ResendClient(env.server.RESEND_API_KEY);

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prismaForAuth as unknown as typeof prisma),
  session: {
    strategy: 'jwt',
    maxAge: 8 * 3600, // 8 hours per spec
  },
  secret: env.server.AUTH_SECRET,
  trustHost: true,
  providers: [
    Resend({
      apiKey: env.server.RESEND_API_KEY,
      from: env.server.EMAIL_FROM,
      maxAge: 30 * 60, // 30 minutes magic link per spec
      async sendVerificationRequest({ identifier: to, url }) {
        if (!env.isProd) {
          console.log('\n======================================================');
          console.log(`🔑 ADMIN MAGIC LINK for ${to}:`);
          console.log(url);
          console.log('======================================================\n');
        }

        try {
          const coupleNames = `${SITE.couple.a} & ${SITE.couple.b}`;
          const brandName = SITE.hashtag;
          await resendClient.emails.send({
            from: env.server.EMAIL_FROM,
            to,
            subject: `Sign in to ${brandName} Admin (${coupleNames})`,
            html: `<!DOCTYPE html>
<html>
  <body style="font-family: sans-serif; background-color: #FAF8F5; padding: 40px 20px; color: #1C1917;">
    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #E7E5E4; padding: 32px;">
      <h2 style="color: #6B1D2F; margin-top: 0; font-family: serif;">${brandName} Admin</h2>
      <p style="font-size: 16px; line-height: 1.5;">Click the button below to sign in to the wedding management dashboard for <strong>${coupleNames}</strong>.</p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${url}" style="background-color: #6B1D2F; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
          Sign In to Dashboard
        </a>
      </div>
      <p style="font-size: 14px; color: #78716C; line-height: 1.4;">This link expires in 30 minutes. If you did not request this link, you can safely ignore this email.</p>
    </div>
  </body>
</html>`,
            text: `Sign in to ${brandName} Admin (${coupleNames})\n\nOpen this link to sign in:\n${url}\n\nThis link expires in 30 minutes.`,
          });
        } catch (err) {
          if (env.isProd) {
            throw err;
          }
          console.warn('[AUTH] Resend email send skipped or failed in non-production:', err);
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      return isAllowedAdminEmail(user.email);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email.trim().toLowerCase();
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.email && session.user) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
