import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Battery, 
  BatteryCharging, 
  MapPin, 
  Monitor, 
  Clock, 
  Wifi, 
  Terminal, 
  RefreshCw, 
  Copy, 
  Check, 
  Navigation,
  Activity,
  ChevronDown,
  ChevronUp,
  HardDrive,
  Send
} from 'lucide-react';

interface BatteryState {
  level: number | null;
  charging: boolean | null;
  supported: boolean;
}

interface TerminalLogItem {
  id: string;
  type: 'cmd' | 'out' | 'sys';
  text: string;
  animate?: boolean;
}

function TypewriterLog({
  log,
  onCharacterTyped
}: {
  key?: string | number;
  log: TerminalLogItem;
  onCharacterTyped?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState(log.animate ? '' : log.text);
  const [isTyping, setIsTyping] = useState(log.animate ?? false);

  useEffect(() => {
    if (!log.animate) {
      setDisplayedText(log.text);
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    const speed = log.type === 'cmd' ? 10 : 6;

    const timer = setInterval(() => {
      index++;
      if (index <= log.text.length) {
        setDisplayedText(log.text.slice(0, index));
        if (onCharacterTyped) onCharacterTyped();
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [log.id, log.text, log.animate]);

  return (
    <div className="leading-relaxed font-mono">
      {log.type === 'cmd' ? (
        <span className="text-emerald-400 font-bold">
          {displayedText}
          {isTyping && <span className="inline-block w-1.5 h-3 ml-0.5 bg-emerald-400 animate-pulse align-middle" />}
        </span>
      ) : log.type === 'sys' ? (
        <span className="text-white/40 italic">
          {displayedText}
          {isTyping && <span className="inline-block w-1.5 h-3 ml-0.5 bg-white/40 animate-pulse align-middle" />}
        </span>
      ) : (
        <span className="text-white/80">
          {displayedText}
          {isTyping && <span className="inline-block w-1.5 h-3 ml-0.5 bg-emerald-400/80 animate-pulse align-middle" />}
        </span>
      )}
    </div>
  );
}

export default function HeroTelemetry() {
  // 1. Screen size state
  const [screenDimensions, setScreenDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    deviceType: 'DESKTOP'
  });

  // 2. Battery state
  const [battery, setBattery] = useState<BatteryState>({
    level: null,
    charging: null,
    supported: true
  });

  // 3. Time state
  const [currentTime, setCurrentTime] = useState<string>('');

  // 4. Live location state (from IP Address & GPS)
  const [userLocation, setUserLocation] = useState<{
    ip: string | null;
    city: string;
    region: string;
    country: string;
    lat: number | null;
    lng: number | null;
    isp: string | null;
    address: string;
    loading: boolean;
    error: string | null;
  }>({
    ip: null,
    city: 'Detecting...',
    region: '',
    country: '',
    lat: 9.734,
    lng: 77.162,
    isp: null,
    address: 'Locating via IP...',
    loading: true,
    error: null
  });

  // 5. Network ping & Online status
  const [ping, setPing] = useState<number>(14);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [connectionType, setConnectionType] = useState<string>('4G / Fiber');

  // 6. Memory & CPU telemetry
  const [memoryUsage, setMemoryUsage] = useState<{ used: number; total: number }>({
    used: 38,
    total: 128
  });

  // 7. Interactive Terminal Shell state
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogItem[]>([
    { id: '1', type: 'sys', text: 'DZt Interactive CLI Engine v2.6 Ready.', animate: false },
    { id: '2', type: 'sys', text: 'Type "help" or click a command shortcut below to execute.', animate: false }
  ]);

  const terminalLogsRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (terminalLogsRef.current) {
      terminalLogsRef.current.scrollTop = terminalLogsRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [terminalLogs, showTerminal]);

  const [copied, setCopied] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // 8. User Agent / OS
  const [systemInfo, setSystemInfo] = useState<string>('Linux x86_64');

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Connection Type API check
    if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      const conn = (navigator as any).connection;
      if (conn.effectiveType) {
        setConnectionType(`${conn.effectiveType.toUpperCase()} / Broadband`);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle Screen Resize & Device Classification
  useEffect(() => {
    const updateScreen = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let type = 'DESKTOP';
      if (w < 640) type = 'MOBILE';
      else if (w < 1024) type = 'TABLET';
      setScreenDimensions({ width: w, height: h, deviceType: type });
    };

    updateScreen();
    window.addEventListener('resize', updateScreen);
    return () => window.removeEventListener('resize', updateScreen);
  }, []);

  // Handle Clock & Memory Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour12: false,
          timeZone: 'Asia/Kolkata'
        }) + ' IST'
      );

      // Memory simulation or real Performance Memory
      if (typeof window !== 'undefined' && (performance as any).memory) {
        const mem = (performance as any).memory;
        setMemoryUsage({
          used: Math.round(mem.usedJSHeapSize / (1024 * 1024)),
          total: Math.round(mem.jsHeapSizeLimit / (1024 * 1024))
        });
      } else {
        setMemoryUsage(prev => ({
          ...prev,
          used: Math.floor(Math.random() * 6) + 36
        }));
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle Battery API
  useEffect(() => {
    let batteryObj: any = null;

    const getBatteryStatus = async () => {
      if ('getBattery' in navigator) {
        try {
          // @ts-ignore
          batteryObj = await navigator.getBattery();
          
          const updateBatteryInfo = () => {
            setBattery({
              level: Math.round(batteryObj.level * 100),
              charging: batteryObj.charging,
              supported: true
            });
          };

          updateBatteryInfo();
          batteryObj.addEventListener('levelchange', updateBatteryInfo);
          batteryObj.addEventListener('chargingchange', updateBatteryInfo);
        } catch {
          setBattery({ level: 98, charging: true, supported: false });
        }
      } else {
        setBattery({ level: 98, charging: true, supported: false });
      }
    };

    getBatteryStatus();

    // Browser & OS detection
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      let os = 'Unknown OS';
      if (ua.includes('Win')) os = 'Windows';
      else if (ua.includes('Mac')) os = 'macOS';
      else if (ua.includes('Linux')) os = 'Linux';
      else if (ua.includes('Android')) os = 'Android';
      else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

      setSystemInfo(`${os} (${navigator.hardwareConcurrency || 8} CPU Cores)`);
    }
  }, []);

  // Fetch Live Location from visitor IP Address
  const fetchIpLocation = async () => {
    setUserLocation(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('https://ipwho.is/');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUserLocation({
            ip: data.ip || null,
            city: data.city || 'Balagram',
            region: data.region || 'Kerala',
            country: data.country || 'India',
            lat: Number(data.latitude?.toFixed(4)) || 9.734,
            lng: Number(data.longitude?.toFixed(4)) || 77.162,
            isp: data.connection?.isp || data.connection?.org || null,
            address: `${data.city || 'IP Node'}${data.region ? `, ${data.region}` : ''}`,
            loading: false,
            error: null
          });
          return;
        }
      }

      const fallbackRes = await fetch('https://ipapi.co/json/');
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        setUserLocation({
          ip: data.ip || null,
          city: data.city || 'Balagram',
          region: data.region || 'Kerala',
          country: data.country_name || 'India',
          lat: Number(data.latitude?.toFixed(4)) || 9.734,
          lng: Number(data.longitude?.toFixed(4)) || 77.162,
          isp: data.org || null,
          address: `${data.city || 'Balagram'}, ${data.region || 'Kerala'}`,
          loading: false,
          error: null
        });
        return;
      }

      throw new Error('IP geolocation unreachable');
    } catch (_err) {
      setUserLocation(prev => ({
        ...prev,
        address: 'Balagram, Idukki, Kerala (Node Base)',
        loading: false,
        error: 'IP fallback'
      }));
    }
  };

  useEffect(() => {
    fetchIpLocation();
  }, []);

  // Request High Precision GPS Location or refresh IP location
  const requestLiveLocation = () => {
    if (!navigator.geolocation) {
      fetchIpLocation();
      return;
    }

    setUserLocation(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation(prev => ({
          ...prev,
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
          address: `GPS Locked: ${pos.coords.latitude.toFixed(2)}° N, ${pos.coords.longitude.toFixed(2)}° E`,
          loading: false,
          error: null
        }));
      },
      (_err) => {
        fetchIpLocation();
      },
      { timeout: 8000 }
    );
  };

  // Execute terminal commands
  const executeCommand = (cmdStr: string) => {
    const raw = cmdStr.trim().toLowerCase();
    if (!raw) return;

    if (!showTerminal) {
      setShowTerminal(true);
    }

    if (raw === 'clear') {
      setTerminalLogs([{ id: Date.now().toString(), type: 'sys', text: 'Buffer cleared. Type "help" for options.', animate: true }]);
      setTerminalInput('');
      return;
    }

    const now = Date.now();
    const newLogs: TerminalLogItem[] = [
      ...terminalLogs,
      { id: `${now}-cmd`, type: 'cmd', text: `$ ${cmdStr}`, animate: true }
    ];

    const addOut = (text: string) => {
      newLogs.push({ id: `${now}-${Math.random()}`, type: 'out', text, animate: true });
    };

    switch (raw) {
      case 'help':
        addOut('Available commands:');
        addOut('  whoami    - Display founder bio & qualifications');
        addOut('  projects  - List active platforms (LibCode, Bank Exam Portal, Hrdiya)');
        addOut('  skills    - Print key technical stack matrix');
        addOut('  ip        - Output visitor IP geolocation details');
        addOut('  ping      - Measure system network response latency');
        addOut('  call      - Launch CooMeet Live Random Video Chat (/randomcall)');
        addOut('  contact   - Display direct email & communication channels');
        addOut('  clear     - Wipe terminal screen buffer');
        break;
      case 'call':
      case 'randomcall':
      case 'video':
        addOut('CONNECTING: Launching CooMeet Live Random Video Chat Session...');
        window.location.hash = '#/randomcall';
        break;
      case 'whoami':
        addOut('NAME: Amal K P');
        addOut('ROLE: Founder & Lead at DZt | BCA Candidate at JNIAS');
        addOut('LOCATION: Balagram, Idukki, Kerala, India');
        addOut('EMAIL: amalkochuparambilp@gmail.com');
        break;
      case 'projects':
        addOut('1. LibCode JNIAS — College Library Automation System (PHP/MySQL/Barcode)');
        addOut('2. Co-operative Bank Exam Portal — Online Recruitment & Testing Engine (PHP/MySQL)');
        addOut('3. Hrdiya Healthcare Platform — Cardiac Disease Risk Analysis (Python/Django)');
        addOut('4. DZt Platform — Developer Portfolio Suite & Ecosystem Engine');
        break;
      case 'skills':
        addOut('STACK: React 18, TypeScript, Python, Django, PHP, MySQL, SQLite, Tailwind CSS');
        addOut('FOCUS: Library Systems, Recruitment Testing Engines, Health Diagnostic Platforms');
        break;
      case 'ip':
        addOut(`VISITOR IP: ${userLocation.ip || 'Local Node'}`);
        addOut(`LOCATION: ${userLocation.address}`);
        addOut(`ISP: ${userLocation.isp || 'Broadband'}`);
        break;
      case 'ping':
        const newPing = Math.floor(Math.random() * 10) + 6;
        setPing(newPing);
        addOut(`RTT LATENCY: ${newPing}ms (Connection Status: OPTIMAL)`);
        break;
      case 'contact':
        addOut('EMAIL: amalkochuparambilp@gmail.com');
        addOut('PHONE: +91 7510211318');
        addOut('GITHUB: github.com/amalkp');
        break;
      default:
        addOut(`Command not recognized: "${raw}". Type "help" for available commands.`);
        break;
    }

    setTerminalLogs(newLogs);
    setTerminalInput('');
    setTimeout(scrollToBottom, 50);
  };

  // Re-scan simulation
  const handleRescan = () => {
    setIsScanning(true);
    setPing(Math.floor(Math.random() * 12) + 8);
    fetchIpLocation();
    setTimeout(() => {
      setIsScanning(false);
    }, 600);
  };

  // Copy telemetry report
  const copyDiagnostics = () => {
    const report = [
      `[DZt SYSTEM TELEMETRY REPORT]`,
      `Time: ${currentTime}`,
      `IP Address: ${userLocation.ip || 'Detecting...'}`,
      `Location: ${userLocation.address} (${userLocation.country || ''})`,
      `Coordinates: ${userLocation.lat}° N, ${userLocation.lng}° E`,
      `ISP: ${userLocation.isp || 'N/A'}`,
      `Viewport: ${screenDimensions.width}x${screenDimensions.height} (${screenDimensions.deviceType})`,
      `Battery: ${battery.level !== null ? battery.level + '%' : 'N/A'} ${battery.charging ? '(Charging)' : ''}`,
      `System: ${systemInfo}`,
      `Network: ${isOnline ? 'ONLINE' : 'OFFLINE'} (${connectionType})`,
      `Ping Latency: ${ping}ms`,
      `Memory Heap: ${memoryUsage.used}MB / ${memoryUsage.total}MB`
    ].join('\n');

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-6 border-t border-white/10 space-y-4">
      {/* Header bar with controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white/70 uppercase tracking-widest text-[11px] font-bold">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Interactive Live System Diagnostics</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded-2xs text-[10px]">
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className={isOnline ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTerminal(prev => !prev)}
            className={`px-2.5 py-1 border transition-all text-[10px] font-mono flex items-center gap-1.5 rounded-xs cursor-pointer ${
              showTerminal 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Terminal className="w-3 h-3 text-emerald-400" />
            <span>Terminal CLI</span>
            {showTerminal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={handleRescan}
            disabled={isScanning}
            className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all text-[10px] font-mono flex items-center gap-1.5 rounded-xs cursor-pointer"
            title="Refresh system metrics"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin text-white' : ''}`} />
            <span>Re-Scan</span>
          </button>

          <button
            onClick={copyDiagnostics}
            className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all text-[10px] font-mono flex items-center gap-1.5 rounded-xs cursor-pointer"
            title="Copy diagnostics to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Logs</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of 6 High-Density Telemetry Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Viewport / Screen Size Widget */}
        <div className="p-3 bg-[#0d0d0d] border border-white/10 rounded-sm hover:border-white/20 transition-all space-y-1.5 group">
          <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
            <span>SCREEN SIZE</span>
            <Monitor className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors" />
          </div>
          <div className="text-sm font-mono font-bold text-white tracking-tight">
            {screenDimensions.width} × {screenDimensions.height}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 tracking-wider">
            [{screenDimensions.deviceType}]
          </div>
        </div>

        {/* 2. Battery Level Widget */}
        <div className="p-3 bg-[#0d0d0d] border border-white/10 rounded-sm hover:border-white/20 transition-all space-y-1.5 group">
          <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
            <span>BATTERY LEVEL</span>
            {battery.charging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors" />
            )}
          </div>
          <div className="text-sm font-mono font-bold text-white tracking-tight flex items-center gap-1.5">
            <span>{battery.level !== null ? `${battery.level}%` : '100%'}</span>
            {battery.charging && (
              <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xs">
                CHG
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-white/40">
            {battery.supported ? (battery.charging ? 'Power Connected' : 'Discharging') : 'Standard AC Power'}
          </div>
        </div>

        {/* 3. Live IP Location Widget */}
        <div className="p-3 bg-[#0d0d0d] border border-white/10 rounded-sm hover:border-white/20 transition-all space-y-1.5 group">
          <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
            <span>LIVE IP LOCATION</span>
            <button 
              onClick={requestLiveLocation}
              className="text-white/40 hover:text-white transition-colors cursor-pointer"
              title="Refresh IP location or request GPS"
            >
              <Navigation className={`w-3 h-3 ${userLocation.loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
          <div className="text-xs font-mono font-bold text-white tracking-tight truncate" title={userLocation.address}>
            {userLocation.address}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 truncate">
            <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
            <span className="truncate">
              {userLocation.ip ? `IP: ${userLocation.ip}` : `${userLocation.lat}°N, ${userLocation.lng}°E`}
            </span>
          </div>
        </div>

        {/* 4. Real-time Clock Widget */}
        <div className="p-3 bg-[#0d0d0d] border border-white/10 rounded-sm hover:border-white/20 transition-all space-y-1.5 group">
          <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
            <span>SYSTEM TIME</span>
            <Clock className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors" />
          </div>
          <div className="text-xs font-mono font-bold text-white tracking-tight">
            {currentTime || '00:00:00 IST'}
          </div>
          <div className="text-[10px] font-mono text-white/40">
            Asia/Kolkata (+05:30)
          </div>
        </div>

        {/* 5. Network Speed & Ping Latency Widget */}
        <div className="p-3 bg-[#0d0d0d] border border-white/10 rounded-sm hover:border-white/20 transition-all space-y-1.5 group">
          <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
            <span>PING / SPEED</span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-sm font-mono font-bold text-white tracking-tight flex items-center gap-1">
            <span>{ping} ms</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          </div>
          <div className="text-[10px] font-mono text-emerald-400/90 truncate" title={connectionType}>
            {connectionType}
          </div>
        </div>

        {/* 6. Memory & Hardware Threads Widget */}
        <div className="p-3 bg-[#0d0d0d] border border-white/10 rounded-sm hover:border-white/20 transition-all space-y-1.5 group">
          <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
            <span>MEMORY HEAP</span>
            <HardDrive className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors" />
          </div>
          <div className="text-xs font-mono font-bold text-white tracking-tight">
            {memoryUsage.used} MB Used
          </div>
          <div className="text-[10px] font-mono text-white/40 truncate" title={systemInfo}>
            {systemInfo.split('(')[1]?.replace(')', '') || '8 CPU Cores'}
          </div>
        </div>
      </div>

      {/* Expandable Terminal CLI Drawer */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-[#0a0a0a] border border-emerald-500/30 rounded-sm p-3.5 space-y-3 font-mono text-xs"
          >
            {/* Terminal Top Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] text-white/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 font-bold text-white/80">$ dzt_kernel --interactive-shell</span>
              </div>
              <span className="text-emerald-400 text-[10px]">STATUS: READY</span>
            </div>

            {/* Terminal Output Log Window */}
            <div 
              ref={terminalLogsRef} 
              className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin text-white/80 scroll-smooth"
            >
              {terminalLogs.map((log) => (
                <TypewriterLog 
                  key={log.id} 
                  log={log} 
                  onCharacterTyped={scrollToBottom} 
                />
              ))}
            </div>

            {/* Quick Command Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10 text-[10px]">
              <span className="text-white/40 uppercase tracking-widest mr-1">Quick Run:</span>
              {['whoami', 'projects', 'skills', 'ip', 'ping', 'contact', 'clear'].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => executeCommand(cmd)}
                  className="px-2 py-0.5 bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 text-white/70 transition-all rounded-2xs cursor-pointer"
                >
                  ${cmd}
                </button>
              ))}
            </div>

            {/* Terminal Input Prompt */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeCommand(terminalInput);
              }}
              className="flex items-center gap-2 pt-1"
            >
              <span className="text-emerald-400 font-bold">$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Type 'help', 'whoami', 'projects' or 'skills'..."
                className="flex-1 bg-transparent border-none outline-none text-white font-mono text-xs placeholder:text-white/30"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all rounded-2xs text-[10px] font-bold cursor-pointer flex items-center gap-1"
              >
                <span>Run</span>
                <Send className="w-2.5 h-2.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
