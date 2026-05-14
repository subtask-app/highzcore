// DEPRECATED — kept only as a thin alias so older imports keep working.
// New code should import the canonical `Logo` from '@/components/brand/Logo'.

import Logo from './brand/Logo';

export default function FullLogo({ className }: { className?: string }) {
  return <Logo size="md" className={className} />;
}
