// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { X, Send, Bot, User, BarChart, Package, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DefaultChatTransport } from 'ai';

interface AdminCopilotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminCopilot({ isOpen, onClose }: AdminCopilotProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or retrieve session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let stored = sessionStorage.getItem('admin_copilot_session');
      if (!stored) {
        stored = crypto.randomUUID();
        sessionStorage.setItem('admin_copilot_session', stored);
      }
      setSessionId(stored);
    }
  }, []);

  const [inputValue, setInputValue] = useState('');

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat/admin',
      body: { sessionId }
    })
  });
  
  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    sendMessage({ role: 'user', content: inputValue });
    setInputValue('');
  };

  // Suggestion buttons handler
  const handleSuggestion = (text: string) => {
    sendMessage({ role: 'user', content: text });
  };

  const clearChat = () => {
    setMessages([]);
    sessionStorage.removeItem('admin_copilot_messages');
  };

  return (
    <div
      className={`fixed bottom-24 right-6 w-[400px] h-[650px] max-h-[80vh] bg-white shadow-2xl rounded-2xl border border-slate-200 transform transition-all duration-300 ease-in-out z-50 flex flex-col origin-bottom-right ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <BarChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">AI Store Manager</h2>
            <p className="text-xs text-slate-300">Admin Copilot</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={clearChat}
            title="Clear Chat"
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-rose-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="Minimize"
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-700">Welcome back!</h3>
              <p className="text-sm text-slate-500 max-w-[250px]">
                I'm your personal AI store manager. How can I help you analyze the store today?
              </p>
            </div>
            <div className="space-y-2 w-full px-4">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal h-auto py-2"
                onClick={() => handleSuggestion("Summarize today's sales and orders.")}
              >
                <ShoppingCart className="w-4 h-4 mr-2 text-emerald-500" />
                Summarize today's sales
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal h-auto py-2"
                onClick={() => handleSuggestion("What products are running low on stock?")}
              >
                <Package className="w-4 h-4 mr-2 text-rose-500" />
                Check low stock inventory
              </Button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => {
              return (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-100'
                    }`}
                  >
                    <div className="prose prose-sm prose-slate max-w-none">
                      {m.parts ? (
                        m.parts.map((part, index) => {
                          if (part.type === 'text') {
                            return (
                              <div key={index} className="whitespace-pre-wrap">
                                {part.text}
                              </div>
                            );
                          }
                          if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                            const toolName = part.type === 'dynamic-tool' 
                                ? (part as any).toolName 
                                : part.type.replace('tool-', '');
                            const hasText = m.parts.some(p => p.type === 'text' && p.text.trim().length > 0);
                            if (hasText) return null;
                            
                            let actionText = "Processing data...";
                            if (toolName === 'getBusinessSummary') actionText = "Calculating revenue...";
                            if (toolName === 'getLowStockAlerts') actionText = "Checking low stock levels...";
                            if (toolName === 'getRecentOrders') actionText = "Fetching recent orders...";
                            if (toolName === 'getStoreSummary') actionText = "Counting catalog items...";
                            if (toolName === 'fetchDatabaseRecords') actionText = "Querying database...";
                            if (toolName === 'checkInventory') actionText = "Searching inventory...";
                            if (toolName === 'updateStock') actionText = "Updating stock levels...";
                            if (toolName === 'updatePrice') actionText = "Updating price...";
                            if (toolName === 'searchCustomers') actionText = "Searching customer records...";

                            return (
                              <div key={index} className="flex items-center text-xs text-indigo-500 italic mt-1 mb-1">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping mr-2"></div>
                                {actionText}
                              </div>
                            );
                          }
                          return null;
                        })
                      ) : (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  <span className="text-xs text-slate-500 ml-2">Analyzing data...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mx-4 mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs border border-red-100">
                <strong>Network Error:</strong> {error.message}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form
          onSubmit={onSubmit}
          className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-2 py-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all"
        >
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about sales, stock, or orders..."
            className="flex-1 bg-transparent border-none focus:outline-none px-4 text-sm text-slate-700 placeholder-slate-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
