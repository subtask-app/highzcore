import { redirect } from 'next/navigation';

// Legacy nomenclature — `client` was renamed to `creator` in the platform pivot.
// Removed in M14.
export default function LegacyForClientsPage() {
  redirect('/for-creators');
}
