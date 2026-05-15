import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { EmailPasswordForm } from '@/components/auth/EmailPasswordForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export const metadata = {
  title: 'Sign up as a creator · Highzcore',
};

export default function SignupCreatorPage() {
  return (
    <AuthShell
      title="Start growing your channel"
      description="Real audience feedback. Real titles + thumbnails tested. Real promotion. No bots."
      backHref="/signup"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-brand font-semibold">Log in</Link>
        </>
      }
    >
      <OAuthButtons role="creator" />
      <Divider>or with email</Divider>
      <EmailPasswordForm mode="signup" role="creator" />
      <p className="mt-6 text-xs text-fg-subtle leading-relaxed">
        By signing up you agree to our{' '}
        <Link href="/terms" className="underline hover:text-fg">Terms</Link>{' '}and{' '}
        <Link href="/privacy" className="underline hover:text-fg">Privacy Policy</Link>.
      </p>
    </AuthShell>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-fg-subtle">
      <span className="flex-1 h-px bg-border" />
      <span className="uppercase tracking-[0.18em] font-semibold">{children}</span>
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}
