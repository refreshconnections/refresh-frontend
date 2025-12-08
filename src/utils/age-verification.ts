import type { AgeCheckState } from '../components/AgeVerificationFlow';

export function consumeAgeCheckQuery(): AgeCheckState | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const value = params.get('age_verification');
  if (!value) {
    return null;
  }

  params.delete('age_verification');
  const newSearch = params.toString();
  const newUrl =
    window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
  window.history.replaceState({}, '', newUrl);

  switch (value.toLowerCase()) {
    case 'success':
    case 'complete':
      return 'success';
    case 'cancel':
    case 'cancelled':
    case 'canceled':
      return 'canceled';
    case 'failed':
    case 'declined':
      return 'failed';
    case 'error':
    case 'technical':
      return 'error';
    default:
      return null;
  }
}
