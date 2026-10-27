import Link from 'next/link';
import { validateUploadWindow } from '@/lib/uploads';
import { SITE } from '@/content/site.config';
import { UploadDropzone } from '@/components/ui/UploadDropzone';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Share Your Moments | Adetolani & Emmanuel',
  description: 'Upload your celebration photos and memories to our shared guest collection.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function UploadPage() {
  const access = await validateUploadWindow();

  // Closed window fallback: friendly branded message
  if (!access.ok) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full text-center p-8 sm:p-10 rounded-3xl bg-white border border-gold-500/30 shadow-sm space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-magenta-900 text-light-gold flex items-center justify-center font-serif font-bold text-2xl shadow-sm">
            {SITE.couple.initials}
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-gold-700 font-semibold">
              Guest Uploads
            </p>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-magenta-950">
              Upload Link Inactive
            </h1>
            <p className="text-xs sm:text-sm text-ink-600 leading-relaxed pt-1">
              Guest uploads are not open at this time. Uploads will be activated during the wedding
              celebration on 19 December 2026.
            </p>
          </div>

          <div className="pt-2 border-t border-ink-100 text-xs text-ink-600 space-y-3">
            <p className="font-semibold text-magenta-900">
              Need assistance or have memories to share?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {SITE.rsvpContacts.map((contact) => (
                <a
                  key={contact.tel}
                  href={`https://wa.me/${contact.wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-ivory-100 hover:bg-ivory-200 text-ink-800 text-xs font-medium border border-ink-200 transition-colors"
                >
                  WhatsApp {contact.name}
                </a>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-block text-xs text-gold-700 hover:text-gold-900 font-semibold underline underline-offset-4"
            >
              Return to Celebration Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 max-w-4xl mx-auto space-y-10">
      {/* Editorial Header */}
      <header className="text-center space-y-3 max-w-xl mx-auto">
        <div className="w-12 h-12 mx-auto rounded-full bg-magenta-900 text-light-gold flex items-center justify-center font-serif font-bold text-lg shadow-sm">
          {SITE.couple.initials}
        </div>
        <p className="text-xs uppercase tracking-widest text-gold-700 font-semibold font-sans">
          Through Your Eyes
        </p>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-magenta-950 tracking-tight">
          Share Your <em className="italic font-normal text-magenta-800">Moments</em>
        </h1>
        <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
          Snap a photo from your table, the reception, or the dance floor! Upload your moments
          directly to our wedding collection so we can relive today through your eyes.
        </p>
      </header>

      {/* Upload Dropzone */}
      <section aria-label="Photo upload area">
        <UploadDropzone />
      </section>
    </div>
  );
}
