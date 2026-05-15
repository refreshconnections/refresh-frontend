import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { postQueryKeys } from './post-query-keys';
import { useWarmCachedValue, WARM_CACHE_QUERY_OPTIONS } from '../../useWarmCachedValue';

const getPostsFn = async ({queryKey}) => {

  console.log("queryKey[1]", queryKey[1])
    console.log("local", queryKey[3])

    let url = `/api/refreshments_flat/?`
    if (queryKey[1]) {
      url += `bars=${queryKey[1]}&`
    }
    if (!!queryKey[2]) {
      url += `search=${queryKey[2]}&`
    }
    if (!!queryKey[3]) {
      url += `local=${queryKey[3]}&`
    }
    if (!!queryKey[4]) {
      url += `radius=${queryKey[4]}&`
    }
    if (!!queryKey[5]) {
      url += `sort=${queryKey[5]}`
    }
    const response = await apiClient.get(url);
    return response.data;
  };
  
  export function useGetPosts(category: string, search: string| null = null, local: boolean, radius: number | null = null, sort: string = 'recent') {
    const query = useQuery({
      queryKey: postQueryKeys.filtered(category, search, local, radius, sort),
      queryFn: getPostsFn,
      ...WARM_CACHE_QUERY_OPTIONS,
    });

    const warmKey = `warm_refreshments_${category || 'all'}_${search || 'none'}_${local ? 'local' : 'global'}_${radius ?? 'any'}_${sort}_v1`;
    const { cachedData } = useWarmCachedValue(
      warmKey,
      query.data,
      1000 * 60 * 10,
      true,
    );

    return {
      ...query,
      data: query.data ?? cachedData,
      isLoading: query.isLoading && !cachedData,
    };
  }
