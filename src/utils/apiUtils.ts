/**
 * MindWell: Centralized API URL Resolution Utility
 * 
 * Consistent URL resolving for development (local/network IPs) and production.
 */
export const getApiUrl = () => {
    // In Production (Docker/Static Build), use relative path /api
    if (import.meta.env.PROD || import.meta.env.MODE === 'production') {
        return import.meta.env.VITE_API_URL || '/api';
    }

    // In Development, dynamically resolve to the current hostname on port 5000
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${hostname || 'localhost'}:5000/api`;
};

export const API_URL = getApiUrl();

/**
 * MindWell: Smart URL Joiner
 * Ensures no double slashes and no double /api/api
 */
export const joinUrl = (base: string, endpoint: string) => {
    // 1. Validate inputs
    if (!endpoint || typeof endpoint !== 'string') {
        console.warn('MindWell: joinUrl called with invalid endpoint:', endpoint);
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

    if (import.meta.env.DEV) {
        console.log(`[MindWell API]
  BASE_URL: ${normalizedBase}
  ENDPOINT: /${cleanEndpoint}
  FINAL_URL: ${finalUrl}`);
    }

    return finalUrl;
};
