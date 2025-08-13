import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { campaignQueryKeys } from './campaign-query-keys';

const getCampaignsFn = async ({queryKey}) => {
    let url = `/api/campaigns/?`
    if (queryKey[1]) {
      url += `campaigntype=${queryKey[1]}`
    }
    if (queryKey[2]) {
      url += `search=${queryKey[2]}`
    }
    const response = await apiClient.get(url);
    return response.data;
  };
  
  export function useGetCampaigns(campaigntype: string, search?: string) {
    return useQuery({
      queryKey: campaignQueryKeys.campaigns(campaigntype, search),
      queryFn: getCampaignsFn,
    });
  }