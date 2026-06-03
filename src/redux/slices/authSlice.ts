import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
const API_URL = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || '') : `http://${window.location.hostname}:5000`;

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: 'user' | 'therapist' | 'admin';
  phone: string;
  date_of_birth: string | null;
  gender: string;
  bio: string;
  is_verified: boolean;
  is_active: boolean;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.session?.access_token;

      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      return data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_: string, { rejectWithValue, dispatch }) => {
    try {
      // Always call getMe to ensure consistency with MongoDB
      return dispatch(getMe()).unwrap();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password, rememberMe = true }: { email: string; password: string; rememberMe?: boolean }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      return { ...data, rememberMe };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (
    { email, password, fullName, username }: { email: string; password: string; fullName: string; username?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, full_name: fullName, username }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      return data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  // Clear all storage immediately for responsiveness
  localStorage.removeItem('mindwell-session');
  localStorage.removeItem('mindwell-user');
  localStorage.removeItem('mindwell-profile');
  sessionStorage.removeItem('mindwell-session');
  sessionStorage.removeItem('mindwell-user');
  sessionStorage.removeItem('mindwell-profile');
  return null;
});

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      return true;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    { userId, updates }: { userId: string; updates: Partial<Profile> },
    { rejectWithValue }
  ) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSession: (state, action: PayloadAction<Session | null>) => {
      console.log('MindWell: Setting Session...', { hasSession: !!action.payload });
      state.session = action.payload;
      state.user = action.payload?.user ?? null;
      state.isAuthenticated = !!action.payload?.user;

      const clearAll = () => {
        localStorage.removeItem('mindwell-session');
        localStorage.removeItem('mindwell-user');
        localStorage.removeItem('mindwell-profile');
        sessionStorage.removeItem('mindwell-session');
        sessionStorage.removeItem('mindwell-user');
        sessionStorage.removeItem('mindwell-profile');
      };

      if (action.payload?.user) {
        // Default to localStorage for setSession if used externally
        localStorage.setItem('mindwell-session', JSON.stringify(action.payload));
        localStorage.setItem('mindwell-user', JSON.stringify(action.payload.user));
      } else {
        clearAll();
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    rehydrateAuth: (state) => {
      console.log('MindWell: Rehydrating Auth State (localStorage + sessionStorage Check)...');
      try {
        const getStored = (key: string) => localStorage.getItem(key) || sessionStorage.getItem(key);

        const storedSession = getStored('mindwell-session');
        const storedUser = getStored('mindwell-user');
        const storedProfile = getStored('mindwell-profile');

        if (storedSession && storedUser) {
          state.session = JSON.parse(storedSession);
          state.user = JSON.parse(storedUser);
          state.profile = storedProfile ? JSON.parse(storedProfile) : null;
          state.isAuthenticated = false; // Must verify via /api/auth/me
          console.log('MindWell: Local/Session Auth Data Found, Awaiting Verification...', {
            email: state.user?.email,
            source: localStorage.getItem('mindwell-session') ? 'localStorage' : 'sessionStorage'
          });
        } else {
          state.isAuthenticated = false;
        }
      } catch (err) {
        console.error('MindWell: Rehydration Error:', err);
        state.isAuthenticated = false;
      }
      state.isLoading = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.token && action.payload.user) {
          const { token, refreshToken, user, rememberMe } = action.payload;
          state.session = { access_token: token, refreshToken } as any;
          state.user = user;
          state.profile = user;
          state.isAuthenticated = true;
          state.error = null;

          const storage = rememberMe ? localStorage : sessionStorage;
          const clearOther = () => {
            const other = rememberMe ? sessionStorage : localStorage;
            other.removeItem('mindwell-session');
            other.removeItem('mindwell-user');
            other.removeItem('mindwell-profile');
          };

          clearOther();
          storage.setItem('mindwell-session', JSON.stringify({ access_token: token, refreshToken }));
          storage.setItem('mindwell-user', JSON.stringify(user));
          storage.setItem('mindwell-profile', JSON.stringify(user));

          console.log(`MindWell: User Logged In (${rememberMe ? 'Persistent' : 'Session'})`, {
            user: user?.email
          });
        } else {
          state.isAuthenticated = false;
          state.error = 'Invalid server response';
        }
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Login failed';
        state.isAuthenticated = false;
        state.session = null;
        state.user = null;
        state.profile = null;

        const clearAll = () => {
          localStorage.removeItem('mindwell-session');
          localStorage.removeItem('mindwell-user');
          localStorage.removeItem('mindwell-profile');
          sessionStorage.removeItem('mindwell-session');
          sessionStorage.removeItem('mindwell-user');
          sessionStorage.removeItem('mindwell-profile');
        };
        clearAll();
        console.warn('MindWell: Login rejected. All storage cleared.');
      })
      .addCase(signUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.token && action.payload.user) {
          const { token, refreshToken, user } = action.payload;
          state.session = { access_token: token, refreshToken } as any;
          state.user = user;
          state.profile = user;
          state.isAuthenticated = true;
          state.error = null;

          // Default registration to localStorage
          localStorage.setItem('mindwell-session', JSON.stringify({ access_token: token, refreshToken }));
          localStorage.setItem('mindwell-user', JSON.stringify(user));
          localStorage.setItem('mindwell-profile', JSON.stringify(user));
          console.log('MindWell: User Registered & LocalSession Persisted', { user: user?.email });
        }
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.profile = null;
        state.session = null;
        state.isAuthenticated = false;
        state.isLoading = false;

        localStorage.removeItem('mindwell-session');
        localStorage.removeItem('mindwell-user');
        localStorage.removeItem('mindwell-profile');
        sessionStorage.removeItem('mindwell-session');
        sessionStorage.removeItem('mindwell-user');
        sessionStorage.removeItem('mindwell-profile');
        console.log('MindWell: User Logged Out & All Storage Cleared');
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.profile = action.payload.user;
        state.isAuthenticated = true;
        state.isLoading = false;

        // Update user data in whichever storage it exists
        const storage = localStorage.getItem('mindwell-session') ? localStorage : sessionStorage;
        storage.setItem('mindwell-user', JSON.stringify(action.payload.user));
        storage.setItem('mindwell-profile', JSON.stringify(action.payload.user));
      })
      .addCase(getMe.rejected, (state) => {
        state.user = null;
        state.profile = null;
        state.session = null;
        state.isAuthenticated = false;
        state.isLoading = false;

        localStorage.removeItem('mindwell-session');
        localStorage.removeItem('mindwell-user');
        localStorage.removeItem('mindwell-profile');
        sessionStorage.removeItem('mindwell-session');
        sessionStorage.removeItem('mindwell-user');
        sessionStorage.removeItem('mindwell-profile');
        console.warn('MindWell: Auth Verification Failed. All Storage Cleared.');
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        if (action.payload) {
          localStorage.setItem('mindwell-profile', JSON.stringify(action.payload));
        }
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.error = null;
      });
  },
});

export const { clearError, setSession, setLoading, rehydrateAuth } = authSlice.actions;
export default authSlice.reducer;
