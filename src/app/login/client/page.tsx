import { redirect } from 'next/navigation';

// Legacy route — redirected to the new unified login page. Removed in M14.
export default function LegacyLoginClient() {
  redirect('/login');
}
