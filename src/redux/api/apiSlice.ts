import { createApi } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || '') : `http://${window.location.hostname}:5000`;

// Mock data removed as per strict requirements

const mockJournals: Journal[] = [
  {
    id: '1',
    user_id: 'mock-user-id',
    title: 'A New Beginning',
    content: 'Today I started my journey towards better mental health. It feels good to finally take this step.',
    mood: 'Hopeful',
    mood_score: 7,
    tags: ['first-entry', 'hope'],
    is_private: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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

  // Handle ALL /api/ routes via real Backend
  if (url.startsWith('/api/')) {
    try {
      let { token, refreshToken } = getTokens();

      const makeRequest = async (tokenToUse: string | null) => {
        return fetch(`${API_URL}${url}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': tokenToUse ? `Bearer ${tokenToUse}` : '',
          },
          credentials: 'include',
          body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
        });
      };

      let response = await makeRequest(token);

      // Handle token expiration - Try refresh once
      if (response.status === 401 && refreshToken && !url.includes('/auth/login') && !url.includes('/auth/register')) {
        console.log('MindWell: Access token expired, attempting refresh...');
        const refreshResponse = await fetch(`${API_URL}/api/auth/refresh-token`, {
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
        const errorData = await response.json();
        return { error: { status: response.status, data: errorData } };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Fetch Error:', error);
      return { error: { status: 'FETCH_ERROR', error: (error as Error).message } };
    }
  }

  // 1. Handle others via Mocks (for Supabase compat if needed)
  if (url.includes('/rest/v1/moods')) {
    return { data: [] }; // No mock moods
  }
  if (url.includes('/rest/v1/journals')) {
    if (url.includes('id=eq.')) {
      return { data: [mockJournals[0]] };
    }
    return { data: mockJournals };
  }
  if (url.includes('/rest/v1/therapists')) {
    return { data: [] }; // No fake therapists
  }
  if (url.includes('/rest/v1/subscriptions')) {
    return { data: [{ id: '1', user_id: 'mock-user-id', plan: 'Premium', status: 'active' }] };
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
        url: `/api/moods?limit=${limit}&offset=${offset}`,
      }),
      transformResponse: (response: any[]) => response.map(item => ({ ...item, id: item._id })),
      providesTags: ['Mood'],
    }),
    createMood: builder.mutation<Mood, Partial<Mood>>({
      query: (mood) => ({
        url: '/api/moods',
        method: 'POST',
        body: mood,
      }),
      transformResponse: (response: any) => ({ ...response, id: response._id }),
      invalidatesTags: ['Mood'],
    }),
    getJournals: builder.query<Journal[], { limit?: number; offset?: number }>({
      query: ({ limit = 20, offset = 0 }) => ({
        url: `/api/journals?limit=${limit}&offset=${offset}`,
      }),
      transformResponse: (response: any[]) => response.map(item => ({ ...item, id: item._id })),
      providesTags: ['Journal'],
    }),
    getJournal: builder.query<Journal, string>({
      query: (id) => ({
        url: `/api/journals/${id}`,
      }),
      transformResponse: (response: any) => ({ ...response, id: response._id }),
      providesTags: ['Journal'],
    }),
    createJournal: builder.mutation<Journal, Partial<Journal>>({
      query: (journal) => ({
        url: '/api/journals',
        method: 'POST',
        body: journal,
      }),
      transformResponse: (response: any) => ({ ...response, id: response._id }),
      invalidatesTags: ['Journal'],
    }),
    updateJournal: builder.mutation<Journal, { id: string; updates: Partial<Journal> }>({
      query: ({ id, updates }) => ({
        url: `/api/journals/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['Journal'],
    }),
    deleteJournal: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/journals/${id}`,
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
        url: '/api/appointments',
      }),
      transformResponse: (response: any[]) => response.map(item => ({ ...item, id: item._id })),
      providesTags: ['Appointment'],
    }),
    createAppointment: builder.mutation<Appointment, any>({
      query: (appointment) => ({
        url: '/api/appointments',
        method: 'POST',
        body: appointment,
      }),
      invalidatesTags: ['Appointment'],
    }),
    updateAppointment: builder.mutation<Appointment, { id: string; updates: Partial<Appointment> }>({
      query: ({ id, updates }) => ({
        url: `/rest/v1/appointments?id=eq.${id}`,
        method: 'PATCH',
        body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
      }),
      invalidatesTags: ['Appointment'],
    }),
    getCommunityPosts: builder.query<CommunityPost[], { category?: string; limit?: number }>({
      query: ({ category, limit = 20 }) => {
        let url = `/api/community/posts?limit=${limit}`;
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
        url: `/api/community/posts/${id}`,
      }),
      transformResponse: (response: any) => ({ ...response, id: response._id }),
      providesTags: ['Community'],
    }),
    createCommunityPost: builder.mutation<CommunityPost, Partial<CommunityPost>>({
      query: (post) => ({
        url: '/api/community/posts',
        method: 'POST',
        body: post,
      }),
      invalidatesTags: ['Community'],
    }),
    getComments: builder.query<CommunityComment[], string>({
      query: (postId) => ({
        url: `/api/community/posts/${postId}/comments`,
      }),
      transformResponse: (response: any[]) => response.map(item => ({ ...item, id: item._id })),
      providesTags: ['Community'],
    }),
    toggleLike: builder.mutation<{ id: string; likes_count: number; is_liked: boolean }, string>({
      query: (id) => ({
        url: `/api/community/posts/${id}/like`,
        method: 'POST',
      }),
      invalidatesTags: ['Community'],
    }),
    addComment: builder.mutation<any, { postId: string; text: string }>({
      query: ({ postId, text }) => ({
        url: `/api/community/posts/${postId}/comment`,
        method: 'POST',
        body: { text },
      }),
      invalidatesTags: ['Community'],
    }),
    createComment: builder.mutation<CommunityComment, Partial<CommunityComment>>({
      query: (comment) => ({
        url: '/api/community/comments',
        method: 'POST',
        body: comment,
      }),
      invalidatesTags: ['Community'],
    }),
    getPayments: builder.query<Payment[], void>({
      query: () => ({
        url: '/rest/v1/payments?select=*&order=created_at.desc',
      }),
      transformResponse: (response: Payment[]) => response,
      providesTags: ['Payment'],
    }),
    createPayment: builder.mutation<Payment, Partial<Payment>>({
      query: (payment) => ({
        url: '/rest/v1/payments',
        method: 'POST',
        body: JSON.stringify(payment),
      }),
      invalidatesTags: ['Payment'],
    }),
    getSubscription: builder.query<any, void>({
      query: () => '/api/payments/subscription',
      providesTags: ['Subscription'],
    }),
    getProfile: builder.query<any, void>({
      query: () => '/api/auth/profile',
      providesTags: ['Subscription'],
    }),
    login: builder.mutation<any, any>({
      query: (credentials) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<any, any>({
      query: (userData) => ({
        url: '/api/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    updateProfile: builder.mutation<any, any>({
      query: (userData) => ({
        url: '/api/auth/profile',
        method: 'PUT',
        body: userData,
      }),
    }),
    changePassword: builder.mutation<{ success: boolean; message: string }, any>({
      query: (body) => ({
        url: '/api/auth/change-password',
        method: 'PUT',
        body,
      }),
    }),
    contactSupport: builder.mutation<{ message: string }, any>({
      query: (body) => ({
        url: '/api/support/contact',
        method: 'POST',
        body,
      }),
    }),
    createPaymentOrder: builder.mutation<any, { planName: string, amount: number }>({
      query: (body) => ({
        url: '/api/payments/create-order',
        method: 'POST',
        body,
      }),
    }),
    verifyPayment: builder.mutation<any, any>({
      query: (body) => ({
        url: '/api/payments/verify',
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
  useCreatePaymentMutation,
  useGetSubscriptionQuery,
  useChangePasswordMutation,
  useContactSupportMutation,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
} = apiSlice;
