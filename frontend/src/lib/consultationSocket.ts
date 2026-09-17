/**
 * consultationSocket.ts
 *
 * Singleton Socket.io client for the real-time consultation chat.
 * — One socket instance is reused across the app lifetime.
 * — Connect/disconnect is managed by the component that uses it.
 * — Token is read fresh from storage on EVERY connection attempt.
 * — DOES NOT touch the AI Therapist chat (AI chat uses REST only).
 */

import { io, Socket } from 'socket.io-client';

// Resolve backend URL using the same hostname logic as apiUtils
const getBackendUrl = (): string => {
    // If VITE_API_URL is configured, strip '/api' to get the backend base
    const envApiUrl = import.meta.env.VITE_API_URL;
    if (envApiUrl) {
        return envApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    }

    // Default to deployed Render backend URL
    return 'https://mindwell-and-ai-therapist.onrender.com';
};

// Read JWT access token from localStorage or sessionStorage
export const getStoredToken = (): string => {
    try {
        const raw =
            localStorage.getItem('mindwell-session') ||
            sessionStorage.getItem('mindwell-session');
        if (raw) {
            const parsed = JSON.parse(raw);
            return parsed.access_token || '';
        }
    } catch {
        // ignore parse errors
    }
    return '';
};

let socketInstance: Socket | null = null;

/**
 * getConsultationSocket — returns the shared, ready-to-connect socket.
 *
 * IMPORTANT: A new instance is created whenever:
 * - No instance exists yet
 * - The existing instance has been explicitly disconnected (socketInstance is null)
 *
 * The token is read fresh every time a new instance is created, so a user
 * who logs in after the module was first loaded always gets a valid auth token.
 */
export const getConsultationSocket = (): Socket => {
    // Only create a new instance if we don't have one at all.
    // If the instance exists but is temporarily disconnected due to network issues,
    // we keep it so Socket.io can auto-reconnect with the existing auth.
    if (!socketInstance) {
        const token = getStoredToken();

        socketInstance = io(getBackendUrl(), {
            // Token sent in handshake auth — server JWT middleware reads it here
            auth: { token },
            // Start with polling first, then upgrade to websocket for robust connection upgrades without console errors
            transports: ['polling', 'websocket'],
            // Component calls socket.connect() explicitly — no autoConnect
            autoConnect: false,
            // Reconnect up to 5 times with exponential back-off
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 8000,
            timeout: 10000,
        });
    }

    return socketInstance;
};

export const connectConsultationSocket = (): Socket => {
    const currentToken = getStoredToken();
    
    if (socketInstance) {
        const instanceToken = (socketInstance.auth as any)?.token;
        if (instanceToken === currentToken) {
            if (!socketInstance.connected) {
                socketInstance.connect();
            }
            return socketInstance;
        }
        
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
        socketInstance = null;
    }

    const socket = getConsultationSocket();
    socket.connect();
    return socket;
};

/**
 * disconnectConsultationSocket — cleanly tears down the socket.
 * Call this in the component's unmount cleanup effect.
 */
export const disconnectConsultationSocket = (): void => {
    // Keep the socket connected for other pages/Navbar to reuse.
    // Explicit disconnection is handled during signout/logout.
};

/**
 * forceDisconnectConsultationSocket — explicitly disconnects and clears the socket instance (e.g. on logout).
 */
export const forceDisconnectConsultationSocket = (): void => {
    if (socketInstance) {
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
        socketInstance = null;
    }
};
