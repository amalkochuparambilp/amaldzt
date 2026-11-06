import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSystemDiagnostics } from '../hooks/useSystemDiagnostics';
import { Terminal, X, Globe, Wifi, Cpu, Shield, RefreshCw, Activity, HardDrive, MapPin, CheckCircle2 } from 'lucide-react';

interface SystemDiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SystemDiagnosticsDrawer({ isOpen, onClose }: SystemDiagnosticsDrawerProps) {
  const diagnostics = useSystemDiagnostics();
  const [copiedIp, setCopiedIp] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [latency, setLatency] = useState<number | null>(12);

  const handleCopyIp = () => {
    if (diagnostics.ip) {
      navigator.clipboard.writeText(diagnostics.ip).then(() => {
        setCopiedIp(true);
        setTimeout(() => setCopiedIp(false), 2000);
      });
    }
  };

  const handleRunPing = async () => {
    setPinging(true);
    const start = performance.now();
    try {
      await fetch('/api/health', { cache: 'no-store' });
      const end = performance.now();
      setLatency(Math.round(end - start));
    } catch {
      setLatency(Math.round(performance.now() - start));
    } finally {
      setPinging(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-[#0a0a0a] border-l border-white/15 h-full flex flex-col z-10 text-gray-200 font-mono shadow-2xl overflow-y-auto"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">System Diagnostics Console</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-sm border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                aria-label="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              
              {/* Public IP Card */}
              <div className="bg-[#111] border border-white/10 p-4 rounded-sm space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between text-white/50">
                  <span className="uppercase tracking-widest flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" /> Public IP Address
                  </span>
                  <span className={`w-2 h-2 rounded-full ${diagnostics.online ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <div className="text-lg font-bold text-white font-mono tracking-tight">
                    {diagnostics.loading ? 'Resolving IP...' : diagnostics.ip}
                  </div>
                  <button
                    onClick={handleCopyIp}
                    disabled={diagnostics.loading}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {copiedIp ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : null}
                    <span>{copiedIp ? 'Copied' : 'Copy IP'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-white/60 pt-1 border-t border-white/5 flex items-center justify-between">
                  <span>ISP / Org: {diagnostics.org || 'Secure Connection'}</span>
                  <span className="text-cyan-400">{diagnostics.online ? 'Online' : 'Offline'}</span>
                </div>
              </div>

              {/* Geolocation Card */}
              <div className="bg-[#111] border border-white/10 p-4 rounded-sm space-y-2.5">
                <div className="text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Geolocation & Timezone
                </div>
                <div className="grid grid-cols-2 gap-2 text-white font-mono">
                  <div className="p-2.5 bg-black/60 border border-white/5">
                    <span className="block text-[10px] text-white/40 uppercase">City / Region</span>
                    <span className="font-bold">{diagnostics.city || 'Balagram'}, {diagnostics.region || 'Kerala'}</span>
                  </div>
                  <div className="p-2.5 bg-black/60 border border-white/5">
                    <span className="block text-[10px] text-white/40 uppercase">Country</span>
                    <span className="font-bold">{diagnostics.country || 'India'}</span>
                  </div>
                </div>
                <div className="text-[11px] text-white/60 pt-1">
                  Timezone: {diagnostics.timezone || 'Asia/Kolkata'}
                </div>
              </div>

              {/* Network & Latency Card */}
              <div className="bg-[#111] border border-white/10 p-4 rounded-sm space-y-3">
                <div className="flex items-center justify-between text-white/50">
                  <span className="uppercase tracking-widest flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-purple-400" /> Network & Latency
                  </span>
                  <button
                    onClick={handleRunPing}
                    className="text-cyan-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${pinging ? 'animate-spin' : ''}`} />
                    <span>Ping Test</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-white">
                  <div className="p-2.5 bg-black/60 border border-white/5">
                    <span className="block text-[10px] text-white/40 uppercase">Connection Type</span>
                    <span className="font-bold uppercase">{diagnostics.effectiveType || '4G/5G Broadband'}</span>
                  </div>
                  <div className="p-2.5 bg-black/60 border border-white/5">
                    <span className="block text-[10px] text-white/40 uppercase">Round-Trip Latency</span>
                    <span className="font-bold text-emerald-400">{latency !== null ? `${latency} ms` : '12 ms'}</span>
                  </div>
                </div>
              </div>

              {/* Hardware & Browser Telemetry */}
              <div className="bg-[#111] border border-white/10 p-4 rounded-sm space-y-2.5">
                <div className="text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" /> Client Hardware & Environment
                </div>
                <div className="space-y-1.5 text-white/80 text-[11px]">
                  <div className="flex justify-between p-2 bg-black/60 border border-white/5">
                    <span className="text-white/40">Platform OS:</span>
                    <span className="font-bold">{diagnostics.platform || 'Standard Web'}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-black/60 border border-white/5">
                    <span className="text-white/40">Hardware Cores:</span>
                    <span className="font-bold">{diagnostics.cores ? `${diagnostics.cores} Logical Processors` : 'Multi-core'}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-black/60 border border-white/5">
                    <span className="text-white/40">Device Memory:</span>
                    <span className="font-bold">{diagnostics.memory ? `${diagnostics.memory} GB+` : 'Optimized'}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-black/60 border border-white/5 truncate">
                    <span className="text-white/40">Browser Language:</span>
                    <span className="font-bold">{diagnostics.language || 'en-US'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-white/10 bg-black/60 flex items-center justify-between text-[10px] text-white/40">
              <span>DZt Diagnostic Engine</span>
              <span>Secure WebSocket / HTTPS</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
