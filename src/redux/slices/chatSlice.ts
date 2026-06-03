import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sentiment?: string;
  sentiment_score?: number;
  is_crisis?: boolean;
  session_id?: string;
  created_at: string;
}

interface ChatState {
  messages: ChatMessage[];
  currentSessionId: string | null;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  currentSessionId: null,
  isLoading: false,
  isTyping: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.currentSessionId = null;
    },
    setCurrentSessionId: (state, action: PayloadAction<string>) => {
      state.currentSessionId = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addMessage,
  setMessages,
  clearMessages,
  setCurrentSessionId,
  setLoading,
  setTyping,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer;
