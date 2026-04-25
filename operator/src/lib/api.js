import axios from 'axios';

const sanitizeBaseUrl = (url) => (url || '').trim().replace(/\/+$/, '');

const FALLBACK_BASE_URLS = [
    sanitizeBaseUrl(import.meta.env.VITE_API_URL),
    'https://parkiq-api-v2-production.up.railway.app',
    'https://parkiq-api-production.up.railway.app',
].filter((url, index, arr) => Boolean(url) && arr.indexOf(url) === index);

const api = axios.create({
    baseURL: FALLBACK_BASE_URLS[0],
});

const getStoredToken = () => {
    const operatorPersistedAuth = localStorage.getItem('parkiq-operator-auth');
    if (operatorPersistedAuth) {
        try {
            const parsedOperator = JSON.parse(operatorPersistedAuth);
            const operatorToken = parsedOperator?.state?.token;
            if (operatorToken) return operatorToken;
        } catch {
            // Continue to fallback token keys.
        }
    }

    const directToken =
        localStorage.getItem('o_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('auth_token');

    if (directToken) return directToken;

    // Supports Zustand persist format used by the client app store.
    const persistedAuth = localStorage.getItem('parkiq-auth');
    if (!persistedAuth) return null;

    try {
        const parsed = JSON.parse(persistedAuth);
        return parsed?.state?.token || null;
    } catch {
        return null;
    }
};

api.interceptors.request.use((config) => {
    const token = getStoredToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error?.config;
        if (!config) throw error;

        const isNetworkFailure = !error?.response;
        if (!isNetworkFailure) throw error;

        const attempted = Array.isArray(config.__attemptedBaseUrls) ? config.__attemptedBaseUrls : [];
        const currentBase = sanitizeBaseUrl(config.baseURL || api.defaults.baseURL || '');
        const attemptedWithCurrent = currentBase ? [...attempted, currentBase] : attempted;
        const nextBase = FALLBACK_BASE_URLS.find((base) => !attemptedWithCurrent.includes(base));

        if (!nextBase) {
            throw error;
        }

        config.baseURL = nextBase;
        config.__attemptedBaseUrls = attemptedWithCurrent;

        return api.request(config);
    }
);

export default api;
