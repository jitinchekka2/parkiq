import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
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

export default api;
