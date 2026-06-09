import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export const onboardingKeys = {
  complete: ['account', 'onboard'] as const,
};

export function useCompleteOnboarding(opts?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: onboardingKeys.complete,
    mutationFn: async () => {
      const res = await apiClient.post('/account/onboard/', {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.setQueryData(['global-current'], (current: any) => (
        current ? { ...current, onboarded: true } : current
      ));
      queryClient.invalidateQueries({ queryKey: ['global-current'] });
      opts?.onSuccess?.();
    },
  });
}
