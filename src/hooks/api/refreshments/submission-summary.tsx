import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';

const getSubmissionSummary = async () => {
  const response = await apiClient.get('/api/submissions/summary/');
  return response.data;
};

export const useGetSubmissionSummary = () => {
  return useQuery({
    queryKey: ['submission-summary'],
    queryFn: getSubmissionSummary,
  });
};
