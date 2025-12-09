import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api-client';

export type EligibilityStatus = {
  verification_requirement: 'none' | 'lower' | 'higher';
  lower_tier_passed: boolean;
  higher_tier_passed: boolean;
  force_age_validation: boolean;
  higher_verification_partner_name: string | null;
  failed_result: boolean;
  needs_age_verification: boolean;
  provider: string | null;
  region_name: string | null;
};

const eligibilityKeys = {
  status: ['eligibility', 'status'] as const,
};

export function useEligibilityStatus(enabled = true) {
  return useQuery({
    queryKey: eligibilityKeys.status,
    queryFn: async () => {
      const res = await apiClient.get<EligibilityStatus>('/api/eligibility/status/');
      return res.data;
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useCompleteAgeVerification(opts?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<EligibilityStatus>('/api/eligibility/verify/', {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eligibilityKeys.status });
      opts?.onSuccess?.();
    },
  });
}
