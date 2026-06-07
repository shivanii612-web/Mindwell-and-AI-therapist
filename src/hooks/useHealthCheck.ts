import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { API_URL, joinUrl } from '@utils/apiUtils';

const TOAST_ID = 'backend-connection-error';
const GRACE_PERIOD_MS = 10000;
const POLLING_INTERVAL_MS = 30000;

export const useHealthCheck = () => {
    const [isHealthy, setIsHealthy] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);

    // Use refs to avoid stale closure bugs — reads always get the current value
    const isHealthyRef = useRef(true);
    const failureTimestamp = useRef<number | null>(null);
    const healthInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // Sync ref whenever state changes
    useEffect(() => {
        isHealthyRef.current = isHealthy;
    }, [isHealthy]);

    const checkHealth = useCallback(async () => {
        try {
            const res = await fetch(joinUrl(API_URL, '/health'), {
                signal: AbortSignal.timeout(4000)
            });

            if (res.ok) {
                const wasUnhealthy = !isHealthyRef.current;
                // Clear failure state
                failureTimestamp.current = null;
                isHealthyRef.current = true;
                setIsHealthy(true);
                setIsConnecting(false);

                // Always dismiss any lingering error toast
                toast.dismiss(TOAST_ID);

                // Only show reconnect toast if we actually recovered from an error
                if (wasUnhealthy) {
                    toast.success('Connected to server', { id: 'health-reconnect', duration: 3000 });
                }
            } else if (res.status === 503) {
                setIsConnecting(true);
                isHealthyRef.current = false;
                setIsHealthy(false);
                handleFailure('Database is connecting. Please wait a moment...');
            } else {
                isHealthyRef.current = false;
                setIsHealthy(false);
                setIsConnecting(false);
                handleFailure('Backend returned an unexpected status. Please refresh.');
            }
        } catch (err) {
            isHealthyRef.current = false;
            setIsHealthy(false);
            setIsConnecting(false);
            handleFailure('Cannot reach backend server. Please ensure it is running on port 5000.');
        }
    }, []); // stable — reads state via refs, no closure over stale state

    const handleFailure = (message: string) => {
        if (!failureTimestamp.current) {
            failureTimestamp.current = Date.now();
        }

        const elapsed = Date.now() - failureTimestamp.current;
        // Only show the toast once after the grace period has elapsed.
        // Uses the same TOAST_ID so react-hot-toast deduplicates automatically.
        if (elapsed >= GRACE_PERIOD_MS) {
            toast.error(message, {
                id: TOAST_ID,
                duration: Infinity,
            });
        }
    };

    useEffect(() => {
        checkHealth();
        healthInterval.current = setInterval(checkHealth, POLLING_INTERVAL_MS);

        return () => {
            if (healthInterval.current) clearInterval(healthInterval.current);
        };
    }, [checkHealth]);

    return { isHealthy, isConnecting };
};
