import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Bot, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  ExternalLink, 
  Terminal, 
  Copy, 
  Check, 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  SendHorizontal,
  Layers,
  ArrowLeft,
  Smartphone,
  MessageSquare
} from 'lucide-react';
import { DiyaChatMessage, DiyaBotStatus } from '../../types';

interface DiyaBotStudioProps {
  onBackToHub?: () => void;
}

export default function DiyaBotStudio({ onBackToHub }: DiyaBotStudioProps) {
  const [status, setStatus] = useState<DiyaBotStatus>({
    online: true,
    telegramConfigured: false,
    geminiConfigured: false
  });
  const [statusLoading, setStatusLoading] = useState(true);

  const [messages, setMessages] = useState<DiyaChatMessage[]>([
    {
      id: 'studio-greet',
      sender: 'diya',
      text: `Welcome to **Diya AI Studio** & Telegram Bot Bridge!

I am Amal's digital companion and full-stack portfolio concierge. Every message sent here is processed with contextual knowledge of Amal's projects, systems, and technical background—and can be transmitted directly to Amal's personal **Telegram Bot** in real time.`,
      timestamp: Date.now()
    }
  ]);

  const [inputMsg, setInputMsg] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorContact, setVisitorContact] = useState('');
  const [forwardToTelegram, setForwardToTelegram] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Test ping state
  const [testPingStatus, setTestPingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testPingMsg, setTestPingMsg] = useState('');

  const [copiedLink, setCopiedLink] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBotStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchBotStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/diya/status');
      if (res.ok) {
        const data = await res.json();
        setStatus({
          online: data.online ?? true,
          telegramConfigured: Boolean(data.telegramConfigured),
          botUsername: data.botUsername,
          botName: data.botName,
          geminiConfigured: Boolean(data.geminiConfigured)
        });
      }
    } catch {
      // offline fallback
    } finally {
      setStatusLoading(false);
    }
  };

  const handleTestPing = async () => {
    setTestPingStatus('testing');
    setTestPingMsg('');
    try {
      const res = await fetch('/api/diya/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName: visitorName || 'Studio Diagnostics Tester',
          contact: visitorContact || 'Web Studio Console',
          message: '⚡ Telemetry Test Ping from Diya AI Studio on amalkp.online',
          context: 'DZt MiniApp / Diya Studio'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestPingStatus('success');
        setTestPingMsg('Test message successfully reached Amal\'s Telegram Bot!');
      } else {
        setTestPingStatus('failed');
        setTestPingMsg(data.error || 'Failed to dispatch Telegram message.');
      }
    } catch (e: any) {
      setTestPingStatus('failed');
      setTestPingMsg(e?.message || 'Network communication error.');
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || inputMsg).trim();
    if (!text || isSending) return;

    setInputMsg('');
    const userMsg: DiyaChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
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
          context: 'Diya Studio MiniApp'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `diya-${Date.now()}`,
            sender: 'diya',
            text: data.reply,
            timestamp: Date.now(),
            telegramSent: Boolean(data.telegramSent)
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `diya-${Date.now()}`,
            sender: 'diya',
            text: data.reply || "I'm having trouble connecting right now, but you can reach Amal directly at amalkochuparambilp@gmail.com!",
            timestamp: Date.now(),
            telegramSent: false
          }
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `diya-${Date.now()}`,
          sender: 'diya',
          text: "I'm Diya, Amal's AI assistant. Amal K P is a full-stack developer and BCA candidate at JNIAS in Idukki, Kerala, and founder of DZt. Reach him at amalkochuparambilp@gmail.com!",
          timestamp: Date.now(),
          telegramSent: false
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const copyDirectBotUrl = () => {
    if (status.botUsername) {
      navigator.clipboard.writeText(`https://t.me/${status.botUsername}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Studio Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 bg-[#0a0a0a] border border-white/10 rounded-xl">
        <div className="flex items-center gap-4">
          {onBackToHub && (
            <button
              onClick={onBackToHub}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg border border-white/10 transition-colors cursor-pointer"
              title="Return to MiniApps Catalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-mono tracking-tight text-white uppercase">
                  Diya AI & Telegram Bot Bridge
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                  Active Hub
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono">
                Interactive AI Concierge connected to Amal's personal Telegram Bot notifications
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBotStatus}
            disabled={statusLoading}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-mono rounded-lg border border-white/10 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Diagnostics</span>
          </button>

          {status.botUsername && (
            <a
              href={`https://t.me/${status.botUsername}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-white text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-white/90 transition-all flex items-center gap-2"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Open in Telegram</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Diagnostics & Configuration Status */}
        <div className="space-y-4">
          {/* Telegram Gateway Telemetry Card */}
          <div className="p-5 bg-[#0a0a0a] border border-white/10 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-white font-bold">
                  Gateway Diagnostics
                </h2>
              </div>
              <span className={`w-2 h-2 rounded-full ${status.telegramConfigured ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 bg-white/5 rounded border border-white/5">
                <span className="text-white/50">Telegram Gateway:</span>
                <span className={status.telegramConfigured ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {status.telegramConfigured ? 'CONNECTED' : 'STANDBY'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-white/5 rounded border border-white/5">
                <span className="text-white/50">Bot Identity:</span>
                <span className="text-white font-medium truncate max-w-[160px]">
                  {status.botUsername ? `@${status.botUsername}` : 'DZt Gateway Bot'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-white/5 rounded border border-white/5">
                <span className="text-white/50">AI Brain:</span>
                <span className={status.geminiConfigured ? 'text-cyan-400 font-bold' : 'text-white/70'}>
                  {status.geminiConfigured ? 'Gemini 3.8 Flash' : 'DZt Semantic Knowledge'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-white/5 rounded border border-white/5">
                <span className="text-white/50">Target Destination:</span>
                <span className="text-white/80">Amal K P (Balagram)</span>
              </div>
            </div>

            {/* Test Ping Action */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <button
                id="btn-studio-test-ping"
                onClick={handleTestPing}
                disabled={testPingStatus === 'testing'}
                className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white font-mono text-xs rounded border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {testPingStatus === 'testing' ? 'Transmitting Ping...' : 'Transmit Test Telegram Ping'}
                </span>
              </button>

              {testPingMsg && (
                <div
                  className={`p-2.5 rounded text-[11px] font-mono flex items-start gap-2 ${
                    testPingStatus === 'success'
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-950/40 border border-red-500/30 text-red-300'
                  }`}
                >
                  {testPingStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  )}
                  <span>{testPingMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Visitor Identification Card */}
          <div className="p-5 bg-[#0a0a0a] border border-white/10 rounded-xl space-y-3 font-mono">
            <h3 className="text-xs uppercase tracking-wider text-white font-bold">
              Visitor Identity (Optional)
            </h3>
            <p className="text-[11px] text-white/50">
              Attach your details so Amal can recognize you and reply back on Telegram.
            </p>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-white/40 block mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Chen"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/40 block mb-1">Email or @Telegram</label>
                <input
                  type="text"
                  placeholder="e.g. alex@company.com or @alex_dev"
                  value={visitorContact}
                  onChange={(e) => setVisitorContact(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Full-Height Studio Conversation Canvas */}
        <div className="lg:col-span-2 flex flex-col bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden min-h-[580px]">
          {/* Conversation Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 font-sans text-xs sm:text-sm">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-2 px-1 text-[11px] font-mono text-white/40">
                    <span className="font-bold text-white/70">{isUser ? 'You' : 'Diya AI'}</span>
                    <span>•</span>
                    <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-[88%] rounded-xl p-4 leading-relaxed ${
                      isUser
                        ? 'bg-white text-black font-medium'
                        : 'bg-[#111111] border border-white/15 text-white/90'
                    }`}
                  >
                    <div className="space-y-1.5 whitespace-pre-wrap">
                      {m.text}
                    </div>
                  </div>

                  {m.telegramSent && (
                    <div className="flex items-center gap-1.5 px-2 text-[10px] font-mono text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Transmitted to Amal's Telegram Bot</span>
                    </div>
                  )}
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-2 text-white/50 font-mono text-xs pl-2">
                <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Diya is formulating response & bridging to Telegram...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestion Pills */}
          <div className="p-3 bg-[#0d0d0d] border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              'What projects has Amal built?',
              'Send a message to Amal via Telegram',
              'What is Amal\'s tech stack?',
              'Can I hire Amal for full-stack work?'
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isSending}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full text-xs font-mono border border-white/10 whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Controls */}
          <div className="p-4 bg-[#111111] border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Ask Diya or enter a note to deliver to Amal's Telegram..."
                disabled={isSending}
                className="flex-1 min-h-[46px] px-4 py-2.5 bg-black/60 border border-white/20 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
              />

              <button
                id="btn-studio-send"
                onClick={() => handleSendMessage()}
                disabled={!inputMsg.trim() || isSending}
                className="min-h-[46px] px-6 bg-white text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-white/90 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2 shrink-0"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-white/50 px-1">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white/80 select-none">
                <input
                  type="checkbox"
                  checked={forwardToTelegram}
                  onChange={(e) => setForwardToTelegram(e.target.checked)}
                  className="rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span>Forward transcript directly to Amal's Telegram device ✈️</span>
              </label>

              <span className="text-[11px] text-white/30">
                Press Enter ↵
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
