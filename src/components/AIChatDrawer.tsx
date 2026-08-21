import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, Globe, ShieldCheck } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
  groundingMetadata?: any;
}

export const AIChatDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Hello! I am your Vortex One AI Real Estate & Public Records Advisor. Ask me anything about Orange County properties, corporate entity vesting, tax valuations, or market trends!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'AI chat request failed');
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: data.reply,
          groundingMetadata: data.groundingMetadata,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: `Error communicating with AI Advisor: ${err.message || 'Unknown error'}. Please ensure GEMINI_API_KEY is configured.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2.5 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all font-bold text-sm border-2 border-white"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span>Vortex AI Advisor</span>
          {isOpen && <X className="w-4 h-4 ml-1" />}
        </button>
      </div>

      {/* Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-md bg-white border border-blue-200 rounded-3xl shadow-2xl flex flex-col h-[550px] overflow-hidden animate-in fade-in zoom-in duration-150">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-white/10 rounded-xl">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">Vortex AI Assistant</h3>
                <p className="text-xs text-blue-100 flex items-center gap-1 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Gemini Flash + Search Grounding
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 font-sans text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${
                  m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white text-xs'
                      : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl max-w-[80%] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-900 border border-blue-200 shadow-xs rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.groundingMetadata?.webSearchQueries && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-500 font-mono flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>Search Grounded: {m.groundingMetadata.webSearchQueries.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-xs rounded-tl-none flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-bounce"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-bounce delay-100"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-bounce delay-200"></div>
                  <span className="text-xs text-slate-500 font-mono ml-2">Searching public records & web...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-blue-200 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about properties, valuations, or OC zoning..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-blue-600 outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
