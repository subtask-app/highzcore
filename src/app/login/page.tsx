import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { EmailPasswordForm } from '@/components/auth/EmailPasswordForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export const metadata = {
  title: 'Log in · Highzcore',
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Log in to your creator or worker account."
      footer={
        <>
          New to Highzcore?{' '}
          <Link href="/signup" className="text-brand font-semibold">Sign up</Link>
        </>
      }
    >
      <OAuthButtons />
      <Divider>or with email</Divider>
      <EmailPasswordForm mode="login" />
      <p className="mt-6 text-sm text-center">
        <Link href="/forgot-password" className="text-fg-muted hover:text-fg">
          Forgot password?
        </Link>
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
