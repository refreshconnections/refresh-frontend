import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export const accountEmailKeys = {
  status: ['account', 'email-status'] as const,
};

type StatusResp = {
  secondary_email_approved: any;
  primary_email: string;
  secondary_email: string | null;
  secondary_email_validated: boolean;
  secondary_email_fully_verified: boolean;
  phone: string | null;
};

type SetSecondaryVars = {
  email: string;
  current_password: string;
  method: 'email' | 'sms';
};

type ApproveSmsVars = { code: string };
type SwapVars = { current_password: string };

export function useEmailStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: accountEmailKeys.status,
    queryFn: async () => {
      const res = await apiClient.get<StatusResp>('/account/email_status/');
      return res.data;
    },
    enabled: !!localStorage.getItem('token') && (options?.enabled ?? true),
  });
}

export function useSetSecondaryEmail(opts?: { onSuccess?: (msg?: string) => void; onError?: (err?: string) => void }) {
  return useMutation({
    mutationFn: async (vars: SetSecondaryVars) => {
      const res = await apiClient.post<{ detail: string }>('/account/secondary_email/', vars);
      console.log("res",res )
      return res.data;
    },
    onSuccess: (data) => opts?.onSuccess?.(data?.detail),
    onError: (e: any) => {
      const msg = e?.response?.data?.detail || e?.message;
      opts?.onError?.(msg);
    },
  });
}

export function useApproveSecondarySms(opts?: { onSuccess?: (msg?: string) => void; onError?: (err?: string) => void }) {
  return useMutation({
    mutationFn: async (vars: ApproveSmsVars) => {
      const res = await apiClient.post<{ detail: string }>('/account/secondary_email/approve_sms/', vars);
      return res.data;
    },
    onSuccess: (data) => opts?.onSuccess?.(data?.detail),
    onError: (e: any) => {
      const msg = e?.response?.data?.detail || e?.message;
      opts?.onError?.(msg);
    },
  });
}

export function useSwapPrimaryEmail(opts?: { onSuccess?: (msg?: string) => void; onError?: (err?: string) => void }) {
  return useMutation({
    mutationFn: async (vars: SwapVars) => {
      const res = await apiClient.post<{ detail: string }>('/account/secondary_email/make_primary/', vars);
      return res.data;
    },
    onSuccess: (data) => opts?.onSuccess?.(data?.detail),
    onError: (e: any) => {
      const msg = e?.response?.data?.detail || e?.message;
      opts?.onError?.(msg);
    },
  });
}

export function useClearSecondaryEmail(opts?: { onSuccess?: () => void; onError?: (err?: string) => void }) {
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete('/account/secondary_email/clear/');
    },
    onSuccess: () => opts?.onSuccess?.(),
    onError: (e: any) => {
      const msg = e?.response?.data?.detail || e?.message;
      opts?.onError?.(msg);
    },
  });
}
