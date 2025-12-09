import { apiClient } from '../api-client';

export type YotiSessionResponse = {
  redirect_url: string;
  session_id: string;
  session_token?: string;
  session_token_ttl?: number;
};

export type YotiResultResponse = {
  status?: string;
  failed_result?: boolean;
  eligibility?: any;
};

export async function startYotiSession() {
  const res = await apiClient.post<YotiSessionResponse>('/account/yoti/start/', {});
  return res.data;
}

export async function simulateFakeYotiResultForUser(status: 'passed' | 'failed' | 'inconclusive') {
  const res = await apiClient.post<YotiResultResponse>('/account/yoti/fake-user-result/', {
    status,
  });
  return res.data;
}
