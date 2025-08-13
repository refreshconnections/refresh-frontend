import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

export function useMultipleAccountsCheck(installLinked: boolean = false) {

  const multipleAccountsCheckFn = async () => {
    const response = await apiClient.get(`/api/profiles/multiple_accounts_check/`);
    console.log("multiple account ***", response)
    if (response.data['multiple_accounts'] == "true") {
      return true
    }
    else {
      return false
    }
  };

  return useQuery({
    queryKey: userQueryKeys.multiple_accounts(),
    queryFn: multipleAccountsCheckFn,
    enabled: installLinked && !!localStorage.getItem('token')
  });
}