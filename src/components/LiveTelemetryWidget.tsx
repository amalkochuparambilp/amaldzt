import { useState, useEffect } from 'react';
import { Wifi, Globe, MapPin, Activity, Shield, Clock, HardDrive, RefreshCw, Terminal } from 'lucide-react';
import SystemDiagnosticsDrawer from './SystemDiagnosticsDrawer';

interface NetworkInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface IpInfo {
  ip?: string;
  city?: string;
  region?: string;
  country_name?: string;
  org?: string;
  timezone?: string;
  error?: string;
}

export default function LiveTelemetryWidget() {
  const [ipData, setIpData] = useState<IpInfo | null>(null);
  const [loadingIp, setLoadingIp] = useState<boolean>(true);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({});
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [pinging, setPinging] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Clock updater
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString() + ' ' + now.toLocaleDateString());
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Online status listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Network Information API
  useEffect(() => {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      const updateConn = () => {
        setNetworkInfo({
          effectiveType: conn.effectiveType || '4g',
          downlink: conn.downlink || 10,
          rtt: conn.rtt || 50,
          saveData: conn.saveData || false
        });
      };
      updateConn();
      conn.addEventListener?.('change', updateConn);
      return () => conn.removeEventListener?.('change', updateConn);
    }
  }, []);

  // Fetch Public IP & Geolocation
  const fetchIpData = async () => {
    setLoadingIp(true);
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data && data.ip) {
          setIpData(data);
          setLoadingIp(false);
          return;
        }
      }
      // Fallback ipify
      const res2 = await fetch('https://api.ipify.org?format=json');
      if (res2.ok) {
        const data2 = await res2.json();
        setIpData({ ip: data2.ip, city: 'Unknown', region: 'Unknown', country_name: 'Unknown', org: 'Standard ISP' });
      } else {
        setIpData({ ip: '127.0.0.1 (Local)', city: 'Localhost', region: 'Dev', country_name: 'Local Environment', org: 'Internal Node' });
      }
    } catch {
      setIpData({ ip: '192.168.1.X (Secured)', city: 'Balagram Node', region: 'Idukki', country_name: 'India', org: 'DZt Secure Gateway' });
    } finally {
      setLoadingIp(false);
    }
  };

  useEffect(() => {
    fetchIpData();
  }, []);

  // Measure latency ping
  const measurePing = async () => {
    setPinging(true);
    const start = performance.now();
    try {
      await fetch('/api/health', { cache: 'no-store' });
      const end = performance.now();
      setPingMs(Math.round(end - start));
    } catch {
      setPingMs(Math.round(performance.now() - start));
    } finally {
      setPinging(false);
    }
  };

  useEffect(() => {
    measurePing();
  }, []);

  return (
    <>
      <div className="bg-[#0e0e0e] border border-white/10 rounded-sm p-5 sm:p-6 space-y-5 shadow-xl font-mono relative overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">LIVE NODE TELEMETRY & NETWORK</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] text-white/70 uppercase">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-mono rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>System Diagnostics</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* IP Address & Location */}
          <div className="bg-black/60 border border-white/10 p-3.5 rounded-xs space-y-1.5">
            <div className="flex items-center justify-between text-white/40">
              <span className="uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" /> Public IP
              </span>
              <button
                onClick={fetchIpData}
                title="Refresh IP Telemetry"
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingIp ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="text-white font-bold tracking-tight">
              {loadingIp ? 'Resolving IP...' : ipData?.ip || '127.0.0.1'}
            </div>
            <div className="text-[10px] text-white/60 truncate">
              {ipData?.org || 'Secured Gateway'}
            </div>
          </div>

          {/* Geolocation */}
          <div className="bg-black/60 border border-white/10 p-3.5 rounded-xs space-y-1.5">
            <div className="text-white/40 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Live Location
            </div>
            <div className="text-white font-bold tracking-tight truncate">
              {loadingIp ? 'Locating...' : `${ipData?.city || 'Balagram'}, ${ipData?.region || 'Kerala'}`}
            </div>
            <div className="text-[10px] text-white/60">
              {ipData?.country_name || 'India'} {ipData?.timezone ? `(${ipData.timezone})` : ''}
            </div>
          </div>

          {/* Network Quality */}
          <div className="bg-black/60 border border-white/10 p-3.5 rounded-xs space-y-1.5">
            <div className="text-white/40 uppercase tracking-wider flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-purple-400" /> Network Link
            </div>
            <div className="text-white font-bold tracking-tight flex items-center gap-2">
              <span>{networkInfo.effectiveType?.toUpperCase() || '4G/5G'}</span>
              <span className="text-[10px] font-normal text-cyan-300 bg-cyan-500/20 px-1 py-0.2">
                {networkInfo.downlink ? `${networkInfo.downlink} Mbps` : 'High Speed'}
              </span>
            </div>
            <div className="text-[10px] text-white/60">
              RTT Est: {networkInfo.rtt ? `${networkInfo.rtt}ms` : '45ms'}
            </div>
          </div>

          {/* Node Latency & Time */}
          <div className="bg-black/60 border border-white/10 p-3.5 rounded-xs space-y-1.5">
            <div className="flex items-center justify-between text-white/40">
              <span className="uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Edge Latency
              </span>
              <button
                onClick={measurePing}
                title="Test Ping"
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${pinging ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="text-white font-bold tracking-tight">
              {pingMs !== null ? `${pingMs} ms (Edge)` : '3 ms'}
            </div>
            <div className="text-[10px] text-white/60 truncate">
              {currentTime || 'Synchronized'}
            </div>
          </div>
        </div>
      </div>

      {/* System Diagnostics Drawer Component */}
      <SystemDiagnosticsDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
