import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Send, 
  X, 
  Minus, 
  Maximize2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  SendHorizontal, 
  MessageSquare, 
  Radio, 
  ExternalLink,
  ChevronDown,
  User,
  AtSign,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { DiyaChatMessage, DiyaBotStatus } from '../types';

interface DiyaChatbotProps {
  initialOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const INITIAL_GREETING = `Hi there! I'm **Diya**, Amal's digital companion and personal AI concierge on DZt.

I am connected directly to Amal's **Telegram Bot**! You can ask me anything about Amal's engineering projects, skills, education at JNIAS, or send a live message straight to his personal Telegram!`;

const QUICK_PROMPTS = [
  { label: '🚀 Top Projects', prompt: 'Tell me about Amal\'s top projects like LibCode and Hrdiya.' },
  { label: '⚡ Message Amal on Telegram', prompt: 'I would like to send a direct message to Amal via Telegram.' },
  { label: '🛠️ Tech Stack', prompt: 'What technologies and frameworks does Amal specialize in?' },
  { label: '💼 Hiring & Collab', prompt: 'Is Amal available for full-stack developer roles or collaboration?' }
];

export default function DiyaChatbot({ initialOpen = false, onOpenChange, className = '' }: DiyaChatbotProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [messages, setMessages] = useState<DiyaChatMessage[]>(() => [
    {
      id: 'greeting-1',
      sender: 'diya',
      text: INITIAL_GREETING,
      timestamp: Date.now()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [forwardToTelegram, setForwardToTelegram] = useState(true);
  
  // Visitor optional contact info
  const [showContactFields, setShowContactFields] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorContact, setVisitorContact] = useState('');
  
  // Bot status
  const [botStatus, setBotStatus] = useState<DiyaBotStatus>({
    online: true,
    telegramConfigured: false,
    geminiConfigured: false
  });
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch Diya status on mount
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/diya/status');
      if (res.ok) {
        const data = await res.json();
        setBotStatus({
          online: data.online ?? true,
          telegramConfigured: Boolean(data.telegramConfigured),
          botUsername: data.botUsername,
          botName: data.botName,
          geminiConfigured: Boolean(data.geminiConfigured)
        });
      }
    } catch {
      // Offline / fallback mode
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Handle open/close changes
  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setIsMinimized(false);
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
    onOpenChange?.(nextState);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    setHasInteracted(true);
    setInputMessage('');
    
    const userMsgId = `user-${Date.now()}`;
    const newUserMsg: DiyaChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsSending(true);

    try {
      // Build history
      const history = messages
        .filter((m) => m.sender === 'user' || m.sender === 'diya')
        .slice(-6)
        .map((m) => ({
          role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
          text: m.text
        }));

      const res = await fetch('/api/diya/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          visitorInfo: {
            name: visitorName.trim() || undefined,
            contact: visitorContact.trim() || undefined
          },
          forwardToTelegram,
          context: typeof window !== 'undefined' ? window.location.pathname : 'Portfolio'
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const diyaMsg: DiyaChatMessage = {
          id: `diya-${Date.now()}`,
          sender: 'diya',
          text: data.reply,
          timestamp: Date.now(),
          telegramSent: Boolean(data.telegramSent)
        };

        setMessages((prev) => [...prev, diyaMsg]);
      } else {
        const errorMsg: DiyaChatMessage = {
          id: `diya-${Date.now()}`,
          sender: 'diya',
          text: data.reply || "I'm having a brief connection hitch, but you can always reach Amal directly at amalkochuparambilp@gmail.com or on WhatsApp at +91 7510211318!",
          timestamp: Date.now(),
          telegramSent: false
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      // Client-side fallback response
      const fallbackMsg: DiyaChatMessage = {
        id: `diya-${Date.now()}`,
        sender: 'diya',
        text: `I'm Diya, Amal's AI assistant. Amal K P is a full-stack developer and BCA candidate at JNIAS in Idukki, Kerala, and founder of DZt. 

He builds high-performance apps with React, Python, Django, PHP, and TypeScript. You can also reach him directly at amalkochuparambilp@gmail.com!`,
        timestamp: Date.now(),
        telegramSent: false
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `greeting-${Date.now()}`,
        sender: 'diya',
        text: INITIAL_GREETING,
        timestamp: Date.now()
      }
    ]);
  };

  // Render markdown-like text
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed break-words font-sans">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Format bold text
          let formatted: React.ReactNode = line;
          const boldParts = line.split(/(\*\*.*?\*\*)/g);
          if (boldParts.length > 1) {
            formatted = boldParts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pIdx} className="font-semibold text-white">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            });
          }

          // Bullet list styling
          if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-cyan-400 font-bold">•</span>
                <span className="flex-1">{formatted}</span>
              </div>
            );
          }

          // Numbered list styling
          const numMatch = line.trim().match(/^(\d+\.)\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-white/50 font-mono text-[11px]">{numMatch[1]}</span>
                <span className="flex-1">{formatted}</span>
              </div>
            );
          }

          return <p key={idx}>{formatted}</p>;
        })}
      </div>
    );
  };

  return (
    <div id="diya-chatbot-container" className={`fixed z-50 no-print select-none ${className}`}>
      {/* Floating Trigger Launcher Button (Bottom-Right) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 flex flex-col items-end gap-2">
          {/* Subtle Teaser Tooltip when un-interacted */}
          {!hasInteracted && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.5, duration: 0.4 }}
              onClick={handleToggleOpen}
              className="bg-[#111111] border border-white/20 text-white px-3.5 py-2 rounded-lg shadow-2xl flex items-center gap-2 cursor-pointer hover:border-cyan-500/50 transition-all max-w-[260px] text-xs font-mono group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex-1">
                <span className="font-bold text-white block">Diya AI Chatbot</span>
                <span className="text-[10px] text-white/50 block leading-tight">Telegram Bot Connected ⚡</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            </motion.div>
          )}

          <motion.button
            id="btn-diya-chatbot-trigger"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleOpen}
            className="relative min-w-[54px] min-h-[54px] w-14 h-14 bg-[#0a0a0a] text-white rounded-full border border-white/20 shadow-2xl flex items-center justify-center cursor-pointer hover:border-cyan-400 transition-all group overflow-hidden"
            aria-label="Open Diya Chatbot"
            title="Chat with Diya AI (Connected to Telegram Bot)"
          >
            {/* Ambient Background Gradient Sweep */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Pulsing beacon ring */}
            <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping pointer-events-none opacity-40" />

            {/* Diya Icon / Avatar */}
            <div className="relative flex items-center justify-center">
              <Bot className="w-6 h-6 text-white group-hover:text-cyan-300 transition-colors" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0a0a]" />
            </div>

            {/* Unread indicator */}
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-cyan-500 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-black">
                {unreadCount}
              </span>
            )}
          </motion.button>
        </div>
      )}

      {/* Interactive Chat Window Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? 'auto' : isExpanded ? '85vh' : '560px',
              width: isExpanded ? '92vw' : '380px'
            }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-[#0a0a0a] border border-white/20 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl max-w-[calc(100vw-32px)] transition-all z-50 ${
              isExpanded ? 'max-w-[760px]' : ''
            }`}
          >
            {/* Chatbot Top Header Bar */}
            <div className="px-4 py-3.5 bg-[#121212] border-b border-white/10 flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-emerald-500/20 border border-white/20 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-black" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold font-mono tracking-tight text-white uppercase">
                      Diya AI
                    </h3>
                    <span className="text-[9px] font-mono px-1 py-0.2 bg-white/10 text-white/70 rounded-xs border border-white/10">
                      v2.0
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      {botStatus.telegramConfigured 
                        ? botStatus.botUsername 
                          ? `@${botStatus.botUsername} • Live` 
                          : 'Telegram Bot Linked' 
                        : 'Telegram Bridge Ready'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1 text-white/50">
                <button
                  id="btn-diya-clear-chat"
                  onClick={handleClearHistory}
                  title="Reset conversation"
                  className="p-1.5 hover:text-white hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  id="btn-diya-expand"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Restore window size' : 'Expand window'}
                  className="hidden sm:inline-block p-1.5 hover:text-white hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                <button
                  id="btn-diya-minimize"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? 'Expand window' : 'Minimize window'}
                  className="p-1.5 hover:text-white hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <button
                  id="btn-diya-close"
                  onClick={handleToggleOpen}
                  title="Close chat"
                  className="p-1.5 hover:text-white hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Telegram Gateway Status Banner */}
            {!isMinimized && (
              <div className="px-3 py-1.5 bg-cyan-950/30 border-b border-cyan-500/20 flex items-center justify-between text-[11px] font-mono text-cyan-300/80">
                <div className="flex items-center gap-1.5 truncate">
                  <Radio className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">
                    Telegram Bot Gateway: <strong className="text-cyan-200">Active</strong>
                  </span>
                </div>
                {botStatus.botUsername && (
                  <a
                    href={`https://t.me/${botStatus.botUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-200 hover:underline shrink-0"
                  >
                    <span>Open in TG</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            )}

            {/* Expanded / Normal Chat Body */}
            {!isMinimized && (
              <>
                {/* Message Scroll View */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-white/90 font-sans text-xs select-text">
                  {messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 ${
                            isUser
                              ? 'bg-white text-black font-medium rounded-tr-none'
                              : 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                          }`}
                        >
                          {renderMessageContent(msg.text)}
                        </div>

                        {/* Message Metadata & Telegram Delivery Badge */}
                        <div className="flex items-center gap-2 px-1 text-[10px] font-mono text-white/40">
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.telegramSent && (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Delivered to Telegram</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing / Sending indicator */}
                  {isSending && (
                    <div className="flex items-center gap-2 text-white/40 font-mono text-[11px] pl-1">
                      <Bot className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      <span>Diya is thinking & relaying to Telegram...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Suggestion Prompt Chips */}
                <div className="px-3 py-2 border-t border-white/5 bg-[#0e0e0e] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {QUICK_PROMPTS.map((qp, i) => (
                    <button
                      key={i}
                      id={`btn-diya-prompt-${i}`}
                      onClick={() => handleSendMessage(qp.prompt)}
                      disabled={isSending}
                      className="px-2.5 py-1 text-[10px] font-mono bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full border border-white/10 whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>

                {/* Optional Contact Details Drawer (To let Amal reply) */}
                <div className="border-t border-white/10 bg-[#0d0d0d] px-3 py-2 text-[11px]">
                  <button
                    onClick={() => setShowContactFields(!showContactFields)}
                    className="w-full flex items-center justify-between text-white/50 hover:text-white text-[10px] font-mono uppercase tracking-wider cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      <span>Attach Contact Info (Optional)</span>
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showContactFields ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showContactFields && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 gap-2 pt-2"
                      >
                        <div>
                          <input
                            type="text"
                            placeholder="Your Name"
                            value={visitorName}
                            onChange={(e) => setVisitorName(e.target.value)}
                            className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Email or @Telegram"
                            value={visitorContact}
                            onChange={(e) => setVisitorContact(e.target.value)}
                            className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input & Dispatch Controls Footer */}
                <div className="p-3 bg-[#111111] border-t border-white/10 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      id="diya-chat-input"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Diya or send message to Amal..."
                      disabled={isSending}
                      className="flex-1 min-h-[40px] px-3.5 py-2 bg-black/60 border border-white/15 rounded-lg text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />

                    <button
                      id="btn-diya-send"
                      onClick={() => handleSendMessage()}
                      disabled={!inputMessage.trim() || isSending}
                      className="min-h-[40px] px-4 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white/90 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                      aria-label="Send message to Diya"
                    >
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Forward to Telegram Checkbox & Direct Telegram deep link */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/50 px-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-white/80 select-none">
                      <input
                        type="checkbox"
                        checked={forwardToTelegram}
                        onChange={(e) => setForwardToTelegram(e.target.checked)}
                        className="rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                      <span>Forward message to Amal's Telegram ✈️</span>
                    </label>

                    <span className="hidden sm:inline text-white/30">
                      Press Enter ↵
                    </span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
