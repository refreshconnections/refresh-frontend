import axios from 'axios';
import Cookies from 'js-cookie';
import { Preferences } from '@capacitor/preferences';
import { handleLogoutCommon } from '../utilities';


const csrftoken = Cookies.get('csrftoken');

var BASE_URL = process.env.BASE_URL
if (!process.env.BASE_URL) {
  var BASE_URL = process.env.REACT_APP_BASE_URL
}

const headers = {
  'X-CSRFToken': csrftoken 
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: headers
});

apiClient.defaults.withCredentials = true

// Set the AUTH token for any request
apiClient.interceptors.request.use(function (config) {
  const token = localStorage.getItem('token');
  config.headers.Authorization =  token ? `Token ${token}` : '';
  return config;
});

//Add a response interceptor
// apiClient.interceptors.response.use(function (response) {
//     // Any status code that lie within the range of 2xx cause this function to trigger
//     // Do something with response data
//     console.log("Axios interceptor: no need")
//     return response;
//   }, async function (error) {
//     // Any status codes that falls outside the range of 2xx cause this function to trigger
//     // Do something with response error
//     console.log("error", error)
//     if (error.response.status == 401) {
//         await handleLogoutCommon()
//         console.log("Time to sign back in.")
//         return Promise.reject(error);

//     }
//     else if (error.response.status == 503) {
//         window.location.href ='/construction' 
//         console.log("The site is under maintenance.")
//         return Promise.reject(error);
//     }
//     console.log("Axios interceptor: There was an error.")
//     return ;
//   });



export const API_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
} as const;