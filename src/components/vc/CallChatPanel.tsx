import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Send, X, MessageSquare, Smile, Zap } from 'lucide-react';
import { VCChatMessage } from '../../types';

interface CallChatPanelProps {
  messages: VCChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  onClose: () => void;
}

const QUICK_EMOJIS = ['👏', '🔥', '🚀', '❤️', '👍', '💡', '⚡', '🎉'];

export default function CallChatPanel({
  messages,
  onSendMessage,
  onSendReaction,
  onClose,
}: CallChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full sm:w-80 md:w-96 h-full bg-[#0a0a0d] border-l border-white/15 flex flex-col z-30 font-sans shadow-2xl">
      {/* Panel Header */}
      <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2 text-white">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">
            In-Call Transmission Chat
          </span>
          <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.2 rounded-xs text-white/70">
            {messages.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
          title="Close Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Reaction Emojis Ribbon */}
      <div className="px-3 py-2 border-b border-white/5 bg-black/20 flex items-center gap-1.5 overflow-x-auto select-none">
        <span className="text-[10px] font-mono text-white/40 uppercase mr-1 flex items-center gap-1">
          <Smile className="w-3 h-3 text-amber-400" /> React:
        </span>
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendReaction(emoji)}
            className="px-2 py-1 bg-white/5 hover:bg-white/15 text-sm rounded-xs border border-white/10 transition-all hover:scale-110 cursor-pointer active:scale-95"
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-white/30 space-y-2 p-6">
            <Zap className="w-8 h-8 text-white/20 animate-pulse" />
            <p className="text-xs">No transmissions yet in this room.</p>
            <p className="text-[10px] text-white/20">Send a message or trigger an emoji reaction!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col space-y-1 ${
                msg.isSelf ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 text-[10px] text-white/40">
                <span className={`font-semibold ${msg.isSelf ? 'text-cyan-400' : 'text-white/80'}`}>
                  {msg.senderName} {msg.isSelf ? '(You)' : ''}
                </span>
                <span>•</span>
                <span>{formatTime(msg.timestamp)}</span>
              </div>
              <div
                className={`max-w-[85%] px-3.5 py-2 rounded-xs text-xs font-sans leading-relaxed break-words shadow-sm ${
                  msg.isSelf
                    ? 'bg-white text-black font-medium border border-white'
                    : 'bg-white/10 text-white border border-white/10'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-black/60">
        <div className="flex items-center gap-2 bg-[#121216] border border-white/15 rounded-xs p-1.5 focus-within:border-white/40 transition-colors">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message to peers..."
            className="flex-1 bg-transparent text-white text-xs px-2 py-1 outline-none font-sans placeholder:text-white/30"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-3 py-1.5 bg-white text-black font-bold rounded-2xs text-xs flex items-center gap-1 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px] font-mono uppercase">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
