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
  timestamp?: string;
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

export const normalizeChatMessage = (msg: any): ChatMessage => {
  let normalizedTimestamp: string | undefined = undefined;
  if (msg.timestamp) {
    if (msg.timestamp instanceof Date) {
      normalizedTimestamp = msg.timestamp.toISOString();
    } else if (typeof msg.timestamp === 'string') {
      try {
        const parsedDate = new Date(msg.timestamp);
        if (!isNaN(parsedDate.getTime())) {
          normalizedTimestamp = parsedDate.toISOString();
        } else {
          normalizedTimestamp = msg.timestamp;
        }
      } catch (_) {
        normalizedTimestamp = msg.timestamp;
      }
    } else {
      normalizedTimestamp = String(msg.timestamp);
    }
  }

  let normalizedCreatedAt = msg.created_at;
  if (msg.created_at) {
    if (msg.created_at instanceof Date) {
      normalizedCreatedAt = msg.created_at.toISOString();
    } else if (typeof msg.created_at === 'string') {
      try {
        const parsedDate = new Date(msg.created_at);
        if (!isNaN(parsedDate.getTime())) {
          normalizedCreatedAt = parsedDate.toISOString();
        } else {
          normalizedCreatedAt = msg.created_at;
        }
      } catch (_) {
        normalizedCreatedAt = msg.created_at;
      }
    }
  } else if (normalizedTimestamp) {
    normalizedCreatedAt = normalizedTimestamp;
  } else {
    normalizedCreatedAt = new Date().toISOString();
  }

  return {
    id: msg.id || msg._id || String(Math.random()),
    role: msg.role || 'user',
    content: msg.content || '',
    sentiment: msg.sentiment,
    sentiment_score: msg.sentiment_score,
    is_crisis: msg.is_crisis || msg.isCrisis || false,
    session_id: msg.session_id || msg.sessionId,
    created_at: normalizedCreatedAt,
    timestamp: normalizedTimestamp || normalizedCreatedAt,
  };
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(normalizeChatMessage(action.payload));
    },
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = (action.payload || []).map(normalizeChatMessage);
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
