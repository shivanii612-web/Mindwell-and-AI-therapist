import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Heart,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@hooks/useRedux';
import {
  addMessage,
  clearMessages,
  setMessages,
  setTyping,
} from '@redux/slices/chatSlice';
import { openModal } from '@redux/slices/uiSlice';
import { GlassCard } from '@components/ui/Layout';
import { cn } from '@utils/cn';
import { v4 as uuidv4 } from 'uuid';
const API_URL = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || '') : `http://${window.location.hostname}:5000`;

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sentiment?: string;
  is_crisis?: boolean;
}

const welcomeMessages = [
  "Hello! I'm here to support you on your mental wellness journey. How are you feeling today?",
  "Welcome! I'm MindWell, your AI companion. What's on your mind?",
  "Hi there! I'm here to listen and support. What would you like to talk about?",
];

export const ChatPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { messages, isTyping } = useAppSelector((state) => state.chat);
  const [input, setInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [sessionId] = useState(() => {
    const userId = user?.id || 'anonymous';
    const key = `mindwell-chat-session-id-${userId}`;
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    const newId = uuidv4();
    localStorage.setItem(key, newId);
    return newId;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const userId = user?.id || 'anonymous';
      const response = await fetch(`${API_URL}/api/chat/history/${sessionId}?userId=${userId}`);
      if (response.ok) {
        const history: any[] = await response.json();
        if (history.length > 0) {
          const formattedHistory = history.map(msg => ({
            id: msg._id,
            role: msg.role,
            content: msg.content,
            created_at: msg.timestamp,
            sentiment: msg.sentiment,
            is_crisis: msg.isCrisis,
            timestamp: new Date(msg.timestamp)
          } as any));
          dispatch(setMessages(formattedHistory));
        }
      }
    } catch (err) {
      console.error('MindWell: Failed to fetch history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, sessionId]);

  useEffect(() => {
    // Add welcome message if no history and not loading
    if (!isLoadingHistory && messages.length === 0) {
      const welcomeMsg =
        welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      dispatch(
        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: welcomeMsg,
          created_at: new Date().toISOString(),
        } as any)
      );
    }
  }, [messages.length, isLoadingHistory]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: input.trim(),
      created_at: new Date().toISOString(),
      timestamp: new Date()
    };

    dispatch(addMessage(userMessage as any));
    setInput('');
    dispatch(setTyping(true));

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          sessionId,
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI response');
      }

      const data = await response.json();

      const assistantMessage = {
        id: uuidv4(),
        role: 'assistant' as const,
        content: data.message,
        created_at: new Date().toISOString(),
        sentiment: data.sentiment,
        is_crisis: data.is_crisis,
        timestamp: new Date()
      };

      dispatch(addMessage(assistantMessage as any));

      if (data.is_crisis) {
        dispatch(openModal('emergency'));
      }
    } catch (err) {
      console.error('MindWell: Chat error:', err);
      // Absolute last resort fallback if backend is totally unreachable
      const localFallbacks = [
        "I'm here with you. It feels like our connection is a bit quiet right now, but I'm still listening. What's on your mind?",
        "I’m right here. Sometimes things get a little slow, but I’m not going anywhere. How are you holding up in this moment?",
        "I hear you, and I’m here to support you. Let’s take a breath together. What would you like to share?"
      ];
      dispatch(
        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: localFallbacks[Math.floor(Math.random() * localFallbacks.length)],
          created_at: new Date().toISOString(),
        } as any)
      );
    } finally {
      dispatch(setTyping(false));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-10.5rem)] flex flex-col overflow-hidden">
      <GlassCard className="flex-1 flex flex-col overflow-hidden" hover={false}>
        {/* Header */}
        <div className="flex-none px-6 py-4 border-b border-calm-200/50 dark:border-calm-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lavender-500 to-accent-500 flex items-center justify-center shadow-glow">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-calm-800 dark:text-white">
                  MindWell AI
                </h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-mint-500 animate-pulse" />
                  <span className="text-xs text-calm-500">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => dispatch(clearMessages())}
                className="p-2 rounded-xl hover:bg-calm-100 dark:hover:bg-calm-800 text-calm-500"
              >
                <RefreshCw className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4 custom-scrollbar">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'flex gap-3 max-w-[80%]',
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-lavender-500 to-accent-500'
                        : 'bg-gradient-to-br from-primary-500 to-cyan-500'
                    )}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={cn(
                      'relative px-4 py-3 rounded-2xl',
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-lavender-500 to-accent-500 text-white'
                        : 'bg-calm-100 dark:bg-calm-800 text-calm-800 dark:text-white',
                      message.is_crisis && 'ring-2 ring-coral-500'
                    )}
                  >
                    {message.is_crisis && message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 text-coral-600 dark:text-coral-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium">Sensitivity Alert</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={cn(
                        'text-xs mt-2',
                        message.role === 'user'
                          ? 'text-white/70'
                          : 'text-calm-500'
                      )}
                    >
                      {message.created_at ? new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : ''}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-calm-100 dark:bg-calm-800 px-4 py-3 rounded-2xl">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                        className="w-2 h-2 rounded-full bg-lavender-500"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-none px-6 py-4 border-t border-calm-200/50 dark:border-calm-700/50">
          <div className="relative">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Share what's on your mind..."
                  rows={1}
                  className={cn(
                    'w-full px-4 py-3 rounded-2xl resize-none',
                    'bg-calm-100/50 dark:bg-calm-800/50',
                    'backdrop-blur-sm',
                    'border border-calm-200 dark:border-calm-700',
                    'text-calm-800 dark:text-white',
                    'placeholder:text-calm-400',
                    'focus:outline-none focus:ring-2 focus:ring-lavender-500/50',
                    'transition-all duration-200'
                  )}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center',
                  'bg-gradient-to-br from-lavender-500 to-accent-500',
                  'text-white shadow-glow',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200'
                )}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
          <p className="text-xs text-calm-400 dark:text-calm-500 mt-2 text-center">
            <Heart className="w-3 h-3 inline mr-1" />
            This is a supportive chat. For emergencies, please contact professional help.
          </p>
        </div>
      </GlassCard >
    </div >
  );
};

export default ChatPage;
