import axios, { AxiosError, AxiosRequestHeaders } from 'axios';
import { keysToCamel } from 'src/utils';

export const getCookieValue = (key: string): string => {
    if (typeof window === 'undefined') return '';
    const cookieKey = `${key}=`;
    let result = '';
    const cookieArr = document.cookie.split(';');

    cookieArr.map((cookie: string, _i: number) => {
        if (cookie[0] === ' ') {
            cookie = cookie.substring(1);
        }

        if (cookie.indexOf(cookieKey) === 0) {
            result = cookie.slice(cookieKey.length, cookie.length);
        }
        return cookie;
    });
    return result;
};

export const axiosApiInstance = axios.create({
    baseURL: `${import.meta.env.VITE_APP_API_DOMAIN}`,
});

// Request interceptor for API calls
axiosApiInstance.interceptors.request.use(
    async (config) => {
        // Check specific URLs or conditions and adjust Content-Type for file upload requests
        if (config?.url?.includes('by-excel') || config?.url?.includes('excel')) {
            config.headers['Content-Type'] = 'multipart/form-data';
        } else {
            config.headers = {
                ...config.headers,
                Accept: 'application/json',
                'Content-Type': 'application/json;charset=UTF-8',
                'Access-Control-Allow-Origin': '*',
            } as unknown as AxiosRequestHeaders;
        }
        return config;
    },
    (error) => {
        Promise.reject(error);
    }
);

// Response interceptor for API calls
axiosApiInstance.interceptors.response.use(
    (response) => keysToCamel(response),
    async (error: AxiosError) => {
        const originalRequest = error.config;
        if (!(originalRequest as any)._retry) {
            (originalRequest as any)._retry = true;
            if (originalRequest) {
                // eslint-disable-next-line consistent-return
                return axios(originalRequest);
            }
        }
        // eslint-disable-next-line consistent-return
        return Promise.reject(error);
    }
);

export default axiosApiInstance;