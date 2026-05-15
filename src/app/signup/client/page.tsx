import { redirect } from 'next/navigation';

// Legacy route — redirected to the new creator signup flow ('client' was
// renamed to 'creator' in the platform pivot). Removed in M14.
export default function LegacySignupClient() {
  redirect('/signup/creator');
}
