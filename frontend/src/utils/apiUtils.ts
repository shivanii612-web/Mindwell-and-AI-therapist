/**
 * MindWell: Centralized API URL Resolution Utility
 * 
 * Consistent URL resolving for development (local/network IPs) and production.
 */
export const getApiUrl = () => {
    const envApiUrl = import.meta.env.VITE_API_URL;
    if (envApiUrl) {
        return envApiUrl.replace(/\/+$/, '');
    }

    // Default to the deployed Render backend URL
    return 'https://mindwell-and-ai-therapist.onrender.com';
};

export const API_URL = getApiUrl();

/**
 * MindWell: Smart URL Joiner
 * Ensures no double slashes and no double /api/api
 */
export const joinUrl = (base: string, endpoint: string) => {
    // 1. Validate inputs
    if (!endpoint || typeof endpoint !== 'string') {
        return base;
    }

    // 2. Normalize Base (Remove trailing slash and ensure it ends with /api)
    let normalizedBase = base.replace(/\/+$/, ''); // Remove trailing slashes
    if (!normalizedBase.endsWith('/api')) {
        normalizedBase = normalizedBase.includes('/api') ? normalizedBase : `${normalizedBase}/api`;
    }

    // 3. Normalize Endpoint (Remove leading slashes and redundant /api)
    let cleanEndpoint = endpoint.replace(/^\/+/, ''); // Remove leading slashes
    if (cleanEndpoint.startsWith('api/')) {
        cleanEndpoint = cleanEndpoint.substring(4);
    }

    // 4. Final Construction
    const finalUrl = `${normalizedBase}/${cleanEndpoint}`;

    return finalUrl;
};
