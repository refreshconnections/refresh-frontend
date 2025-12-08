import { apiClient } from '../api-client';

export type YotiSessionResponse = {
  url: string;
  session_id: string;
  session_token: string;
  session_token_ttl: number;
};

export async function startYotiSession() {
  const res = await apiClient.post<YotiSessionResponse>('/account/yoti/start/', {});
  return res.data;
}
