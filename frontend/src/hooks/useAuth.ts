import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';
import { setLoading, rehydrateAuth, getMe } from '../redux/slices/authSlice';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, profile, isLoading, isAuthenticated, error } = useAppSelector(
    (state) => state.auth
  );
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. Rehydrate from localStorage (sets state but not isAuthenticated)
        dispatch(rehydrateAuth());

        // 2. Fetch fresh user data if we have a session
        const storedSession = localStorage.getItem('mindwell-session') || sessionStorage.getItem('mindwell-session');
        if (storedSession) {
          try {
            await dispatch(getMe()).unwrap();
          } catch (verifyErr) {
            // getMe.rejected handles clearing state in authSlice
          }
        } else {
          dispatch(setLoading(false));
        }
      } catch (err) {
        // Silently handle error
      } finally {
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [dispatch]);

  return {
    user,
    profile,
    isLoading: isLoading || !initialized,
    isAuthenticated,
    error,
    initialized,
  };
}
