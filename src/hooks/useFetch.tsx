import React, { useEffect, useState } from 'react';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

function useFetch(url: any, headers?: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);


  useEffect(() => {
    console.log("here's me fetching use effect")
    
    setLoading(true); // set loading to true

    const fetchData = async () => {
      setError(null);
      setLoading(true);
      try {
        console.log("url")
        console.log(url)
        console.log(headers)
        const response = await axios.get(url, headers);
        setData(response.data);
      } catch (error: any) {
        if (error instanceof AxiosError) {
          console.log("hi axioserror")
          console.log(error)
        }
        else {
          console.log("hi non- axios error")
          console.log(error)
          setError(error.message);
          setLoading(false)
        }
      }
      setLoading(false);
    };

      fetchData()
    

      
  }, []);

  return { data, loading, error };
}

export default useFetch;