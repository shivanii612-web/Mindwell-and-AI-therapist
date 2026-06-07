import { createApi } from '@reduxjs/toolkit/query/react';

import { API_URL, joinUrl } from '@utils/apiUtils';

// ... (other imports)

// Mock data removed as per strict requirements

// Mock data removed as per strict requirements

// Mock data removed as per strict requirements

const mockBaseQuery = async ({ url, method, body }: any) => {
  const getTokens = () => {
    const stored = localStorage.getItem('mindwell-session') || sessionStorage.getItem('mindwell-session');
    if (!stored) return { token: null, refreshToken: null };
    const parsed = JSON.parse(stored);
    return { token: parsed.access_token, refreshToken: parsed.refreshToken };
  };

  const saveTokens = (token: string, refreshToken: string) => {
    const storage = localStorage.getItem('mindwell-session') ? localStorage : sessionStorage;
    storage.setItem('mindwell-session', JSON.stringify({ access_token: token, refreshToken }));
  };

  const clearTokens = () => {
    localStorage.removeItem('mindwell-session');
    sessionStorage.removeItem('mindwell-session');
  };

  // Guard: ensure url is always a string (prevents 'Cannot read properties of undefined (reading startsWith)')
  const safeUrl = typeof url === 'string' ? url : '';
  if (!safeUrl) {
    console.error('MindWell: apiSlice called with undefined/empty URL');
    return { error: { status: 'FETCH_ERROR', error: 'Invalid API request: URL is missing.' } };
  }

  // Real backend API endpoints — routes that must NEVER be intercepted by mocks.
  // The query builders pass paths like '/moods', '/appointments', '/journals', '/chat/...',
  // '/auth/...', '/community/...', '/support/...', '/payments/...' — none start with '/api/'
  // because joinUrl() appends the /api prefix itself. We must route ALL of these to the real
  // backend. Only Supabase REST paths ('/rest/v1/...') should fall through to the mock block.
  const isRealBackendRoute = (u: string): boolean => {
    if (u.startsWith('/api/')) return true;
    const realPrefixes = [
      '/moods', '/journals', '/appointments', '/chat', '/auth',
      '/community', '/support', '/payments', '/health', '/consultations',
      '/therapist-applications',
    ];
    return realPrefixes.some(prefix => u.startsWith(prefix));
  };

  // Handle ALL real backend routes
  if (isRealBackendRoute(safeUrl)) {
    try {

      let { token, refreshToken } = getTokens();

      const makeRequest = async (tokenToUse: string | null) => {
        const finalUrl = joinUrl(API_URL, safeUrl);
        return fetch(finalUrl, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': tokenToUse ? `Bearer ${tokenToUse}` : '',
          },
          credentials: 'include',
          body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
        });
      };

      let response;
      try {
        response = await makeRequest(token);
      } catch (fetchError: any) {
        console.error('MindWell: Fetch Error:', fetchError.message);
        return {
          error: {
            status: 'FETCH_ERROR',
            error: 'Connection to server failed. Retrying...'
          }
        };
      }

      // Handle token expiration - Try refresh once
      if (response.status === 401 && refreshToken && !safeUrl.includes('/auth/login') && !safeUrl.includes('/auth/register')) {
        console.log('MindWell: Access token expired, attempting refresh...');
        const refreshResponse = await fetch(joinUrl(API_URL, '/auth/refresh-token'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          saveTokens(refreshData.token, refreshData.refreshToken);
          console.log('MindWell: Token refreshed successfully. Retrying request.');
          response = await makeRequest(refreshData.token);
        } else {
          console.warn('MindWell: Refresh token expired/invalid. Logging out.');
          clearTokens();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          return { error: { status: response.status, data: errorData } };
        }
        return { error: { status: response.status, data: { message: 'Server error' } } };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('MindWell: Expected JSON but received:', contentType);
        return {
          error: {
            status: 'FETCH_ERROR',
            error: 'API unavailable'
          }
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Fetch Error:', error);
      return {
        error: {
          status: 'FETCH_ERROR',
          error: 'Connection error'
        }
      };
    }
  }

  // Supabase REST-style paths — return empty, these are legacy/unused routes.
  // Real data is served by the backend via the isRealBackendRoute() block above.
  if (url.includes('/rest/v1/moods')) {
    return { data: [] };
  }
  if (url.includes('/rest/v1/journals')) {
    return { data: [] }; // No mock journals — real data comes from /journals endpoint
  }
  if (url.includes('/rest/v1/therapists')) {
    return { data: [] };
  }
  if (url.includes('/rest/v1/subscriptions')) {
    return { data: [] };
  }

  return { data: [] };
};

export interface Mood {
  id: string;
  user_id: string;
  mood: string;
  mood_score: number;
  energy_level: number;
  anxiety_level: number;
  sleep_quality: number;
  notes: string;
  activities: string[];
  triggers: string[];
  logged_at: string;
  created_at: string;
}

export interface Journal {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: string;
  mood_score: number;
  tags: string[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface Therapist {
  id: string;
  user_id: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    email: string;
  };
  specialization: string[];
  qualifications: string[];
  experience_years: number;
  consultation_fee: number;
  availability: Record<string, unknown>;
  rating: number;
  total_reviews: number;
  is_available: boolean;
  is_verified: boolean;
  bio: string;
  languages: string[];
  created_at: string;
}

export interface Appointment {
  id: string;
  userId: string;
  sessionType: string;
  preferredDate: string;
  preferredTime: string;
  reason: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  is_pinned?: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  likes_count: number;
  parent_comment_id: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  transaction_id: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  started_at: string;
  expires_at: string;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: mockBaseQuery,
  tagTypes: ['Mood', 'Journal', 'Therapist', 'Appointment', 'Community', 'Payment', 'Subscription', 'Notification'],
  endpoints: (builder) => ({
    getMoods: builder.query<Mood[], { limit?: number; offset?: number }>({
      query: ({ limit = 200, offset = 0 }) => ({
        url: `/moods?limit=${limit}&offset=${offset}`,
      }),
      transformResponse: (response: any[]) => response.map(item => ({ ...item, id: item._id })),
      providesTags: ['Mood'],
    }),
    createMood: builder.mutation<Mood, Partial<Mood>>({
      query: (mood) => ({
        url: '/moods',
        method: 'POST',
        body: mood,
      }),
      transformResponse: (response: any) => ({ ...response, id: response._id }),
      invalidatesTags: ['Mood'],
    }),
    getJournals: builder.query<Journal[], { limit?: number; offset?: number }>({
      query: ({ limit = 20, offset = 0 }) => ({
        url: `/journals?limit=${limit}&offset=${offset}`,
      }),
      transformResponse: (response: any[]) => response.map(item => ({ ...item, id: item._id })),
      providesTags: ['Journal'],
    }),
    getJournal: builder.query<Journal, string>({
      query: (id) => ({
        url: `/journals/${id}`,
      }),
      transformResponse: (response: any) => ({ ...response, id: response._id }),
      providesTags: ['Journal'],
    }),
    createJournal: builder.mutation<Journal, Partial<Journal>>({
      query: (journal) => ({
        url: '/journals',
        method: 'POST',
        body: journal,
      }),
      transformResponse: (response: any) => ({ ...response, id: response._id }),
      invalidatesTags: ['Journal'],
    }),
    updateJournal: builder.mutation<Journal, { id: string; updates: Partial<Journal> }>({
      query: ({ id, updates }) => ({
        url: `/journals/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['Journal'],
    }),
    deleteJournal: builder.mutation<void, string>({
      query: (id) => ({
        url: `/journals/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Journal'],
    }),
    getTherapists: builder.query<Therapist[], { specialization?: string }>({
      query: ({ specialization }) => {
        let url = '/rest/v1/therapists?select=*,profiles(full_name,avatar_url,email)&is_available=eq.true&is_verified=eq.true';
        if (specialization) {
          url += `&specialization=cs.${specialization}`;
        }
        return { url };
      },
      transformResponse: (response: Therapist[]) => response,
      providesTags: ['Therapist'],
    }),
    getTherapist: builder.query<Therapist, string>({
      query: (id) => ({
        url: `/rest/v1/therapists?select=*,profiles(full_name,avatar_url,email)&id=eq.${id}`,
      }),
      transformResponse: (response: Therapist[]) => response[0],
      providesTags: ['Therapist'],
    }),
    getAppointments: builder.query<Appointment[], void>({
      query: () => ({
        url: '/appointments',
      }),
      transformResponse: (response: any[]) => response.map(item => ({ ...item, id: item._id })),
      providesTags: ['Appointment'],
    }),
    createAppointment: builder.mutation<Appointment, any>({
      query: (appointment) => ({
        url: '/appointments',
        method: 'POST',
        body: appointment,
      }),
      invalidatesTags: ['Appointment'],
    }),
    updateAppointment: builder.mutation<Appointment, { id: string; updates: Partial<Appointment> }>({
      query: ({ id, updates }) => ({
        url: `/appointments/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Appointment'],
    }),
    getCommunityPosts: builder.query<CommunityPost[], { category?: string; limit?: number }>({
      query: ({ category, limit = 20 }) => {
        let url = `/community/posts?limit=${limit}`;
        if (category) {
          url += `&category=${category}`;
        }
        return { url };
      },
      transformResponse: (response: any[]) => response.map(item => ({ ...item, id: item._id })),
      providesTags: ['Community'],
    }),
    getCommunityPost: builder.query<CommunityPost, string>({
      query: (id) => ({
        url: `/community/posts/${id}`,
      }),
      transformResponse: (response: any) => ({ ...response, id: response._id }),
      providesTags: ['Community'],
    }),
    createCommunityPost: builder.mutation<CommunityPost, Partial<CommunityPost>>({
      query: (post) => ({
        url: '/community/posts',
        method: 'POST',
        body: post,
      }),
      invalidatesTags: ['Community'],
    }),
    getComments: builder.query<CommunityComment[], string>({
      query: (postId) => ({
        url: `/community/posts/${postId}/comments`,
      }),
      transformResponse: (response: any[]) => response.map(item => ({ ...item, id: item._id })),
      providesTags: ['Community'],
    }),
    toggleLike: builder.mutation<{ id: string; likes_count: number; is_liked: boolean }, string>({
      query: (id) => ({
        url: `/community/posts/${id}/like`,
        method: 'POST',
      }),
      invalidatesTags: ['Community'],
    }),
    addComment: builder.mutation<any, { postId: string; text: string }>({
      query: ({ postId, text }) => ({
        url: `/community/posts/${postId}/comment`,
        method: 'POST',
        body: { text },
      }),
      invalidatesTags: ['Community'],
    }),
    createComment: builder.mutation<CommunityComment, Partial<CommunityComment>>({
      query: (comment) => ({
        url: '/community/comments',
        method: 'POST',
        body: comment,
      }),
      invalidatesTags: ['Community'],
    }),
    getPayments: builder.query<Payment[], void>({
      query: () => ({
        url: '/payments/history',
      }),
      transformResponse: (response: any) => {
        const list = Array.isArray(response) ? response : (response?.payments || []);
        return list.map((item: any) => ({ ...item, id: item._id }));
      },
      providesTags: ['Payment'],
    }),
    getPaymentHistory: builder.query<Payment[], void>({
      query: () => ({
        url: '/payments/history',
      }),
      transformResponse: (response: any) => {
        const list = Array.isArray(response) ? response : (response?.payments || []);
        return list.map((item: any) => ({ ...item, id: item._id }));
      },
      providesTags: ['Payment'],
    }),
    createPayment: builder.mutation<Payment, Partial<Payment>>({
      query: (payment) => ({
        url: '/payments/create-order',
        method: 'POST',
        body: payment,
      }),
      invalidatesTags: ['Payment'],
    }),
    getSubscription: builder.query<any, void>({
      query: () => '/payments/subscription',
      providesTags: ['Subscription'],
    }),
    checkHealth: builder.query<{ status: string; server: string }, void>({
      query: () => '/health',
    }),
    getProfile: builder.query<any, void>({
      query: () => '/auth/profile',
      providesTags: ['Subscription'],
    }),
    login: builder.mutation<any, any>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<any, any>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    updateProfile: builder.mutation<any, any>({
      query: (userData) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: userData,
      }),
    }),
    changePassword: builder.mutation<{ success: boolean; message: string }, any>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST', // Server route is POST /auth/change-password
        body,
      }),
    }),
    contactSupport: builder.mutation<{ message: string }, any>({
      query: (body) => ({
        url: '/support/contact',
        method: 'POST',
        body,
      }),
    }),
    createPaymentOrder: builder.mutation<any, { planName: string, amount: number }>({
      query: (body) => ({
        url: '/payments/create-order',
        method: 'POST',
        body,
      }),
    }),
    verifyPayment: builder.mutation<any, any>({
      query: (body) => ({
        url: '/payments/verify',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subscription'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetMoodsQuery,
  useCreateMoodMutation,
  useGetJournalsQuery,
  useGetJournalQuery,
  useCreateJournalMutation,
  useUpdateJournalMutation,
  useDeleteJournalMutation,
  useGetTherapistsQuery,
  useGetTherapistQuery,
  useGetAppointmentsQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useGetCommunityPostsQuery,
  useGetCommunityPostQuery,
  useCreateCommunityPostMutation,
  useToggleLikeMutation,
  useAddCommentMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useGetPaymentsQuery,
  useGetPaymentHistoryQuery,
  useCreatePaymentMutation,
  useGetSubscriptionQuery,
  useChangePasswordMutation,
  useContactSupportMutation,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useCheckHealthQuery,
} = apiSlice;
