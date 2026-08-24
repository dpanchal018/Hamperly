// @ts-nocheck
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // Create or load a unique session ID for the backend to group messages
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = sessionStorage.getItem('hamperly_chat_session_id');
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem('hamperly_chat_session_id', id);
      }
      return id;
    }
    return '';
  });

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat/storefront',
      body: { sessionId }
    })
  });
  const isLoading = status === 'streaming' || status === 'submitted';
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Load from session storage on mount
  useEffect(() => {
    const savedMsgs = sessionStorage.getItem('hamperly_chat_messages');
    const savedOpen = sessionStorage.getItem('hamperly_chat_is_open');
    if (savedMsgs) {
      try {
        setMessages(JSON.parse(savedMsgs));
      } catch (e) {
        console.error("Failed to parse saved chat", e);
      }
    }
    if (savedOpen === 'true') {
      setIsOpen(true);
    }
    isInitialized.current = true;
  }, [setMessages]);

  // Save to session storage whenever messages change
  useEffect(() => {
    if (isInitialized.current) {
      sessionStorage.setItem('hamperly_chat_messages', JSON.stringify(messages));
      sessionStorage.setItem('hamperly_chat_is_open', String(isOpen));
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 transition-all hover:scale-105 z-50 flex items-center justify-center"
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <MessageCircle className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping"></div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-slate-200"
          >
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-200" />
                <div>
                  <h3 className="font-semibold">Hamperly Concierge</h3>
                  <p className="text-xs text-indigo-200">AI Shopping Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-indigo-200 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-slate-500">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-sm">Hello! I'm your Hamperly Concierge. <br/> How can I help you find the perfect gift today?</p>
                </div>
              )}
              
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-slate-200 ml-2' : 'bg-indigo-100 mr-2'}`}>
                      {m.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                    </div>

                    <div className={`px-4 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                      {m.parts ? (
                        (() => {
                          const hasText = m.parts.some(p => p.type === 'text' && p.text.trim().length > 0);
                          return m.parts.map((part, index) => {
                            if (part.type === 'text') {
                              return <div key={index} className="whitespace-pre-wrap">{part.text}</div>;
                            }
                            if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                              // Hide the tool loading state entirely if the AI is already streaming the actual text answer
                              if (hasText) return null;

                              // Determine the tool invocation state
                              const state = (part as any).state;
                              const toolName = part.type === 'dynamic-tool' 
                                ? (part as any).toolName 
                                : part.type.replace('tool-', '');
                              
                              let actionText = "Working...";
                              
                              if (toolName === 'checkInventory') {
                                actionText = "Checking inventory...";
                              } else if (toolName === 'listAvailableHampers') {
                                actionText = "Browsing hamper catalogue...";
                              } else if (toolName === 'listOccasions') {
                                actionText = "Fetching supported occasions...";
                              } else if (toolName === 'getProductsForOccasion') {
                                actionText = "Finding gifts for occasion...";
                              }

                              return (
                                <div key={index} className="mt-2 mb-2 p-2 bg-slate-50 rounded-lg text-xs border border-slate-100 text-slate-500 flex items-center">
                                  <span className="animate-pulse mr-1">●</span> {actionText}
                                </div>
                              );
                            }
                            return null;
                          });
                        })()
                      ) : (
                        <div className="whitespace-pre-wrap">{(m as any).content}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Error Message */}
              {error && (
                <div className="mx-4 mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs border border-red-100 flex items-start space-x-2">
                  <span className="mt-0.5">⚠️</span>
                  <div>
                    <strong className="block mb-1">We couldn't reach the AI:</strong>
                    {error.message.includes('429') || error.message.includes('High traffic') || error.message.includes('Rate limit')
                      ? "Our servers are experiencing very high traffic. Please wait about 15 seconds and try sending your message again."
                      : "An unexpected error occurred. Please try again."}
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inputValue.trim()) return;
                  sendMessage({ role: 'user', content: inputValue });
                  setInputValue('');
                }} 
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about hampers, stock, or delivery..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shrink-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
