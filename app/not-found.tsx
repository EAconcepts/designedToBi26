import Link from 'next/link';
import { Button, Container } from '@/components/ui';
import { SITE } from '@/content/site.config';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-20 bg-ivory text-ink-900">
      <Container size="sm" className="text-center space-y-6">
        <p className="font-signature text-3xl sm:text-4xl text-gold-600">{SITE.hashtag}</p>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-magenta-900 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-ink-600 max-w-md mx-auto text-base sm:text-lg leading-relaxed">
          The page you are looking for does not exist or has been moved. We invite you to return to
          the wedding celebration.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary">Return Home</Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
