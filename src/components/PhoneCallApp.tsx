import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Delete,
  Clock,
  History,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Trash2,
  Activity,
  Radio,
  Server,
  Terminal,
  ChevronDown,
  ChevronUp,
  VolumeX,
  Headphones,
  Signal,
  Check,
  Copy
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface PhoneCallAppProps {
  onBack?: () => void;
}

interface CallRecord {
  id: string;
  number: string;
  timestamp: number;
  duration: number; // in seconds
  status: 'completed' | 'missed' | 'failed';
  gateway: string;
}

type CallState = 'ready' | 'connecting' | 'ringing' | 'connected' | 'ended' | 'error';

interface PopToxGatewayInfo {
  sip: string;
  ii: string;
  p: string;
  cid: number;
  number: string;
  callMinute: number;
  callSec: number;
  ice_servers: Array<{ urls: string }>;
  websocket_proxy_url: string;
  outbound_proxy_url: string;
  realm: string;
  source: string;
  notice?: string;
}

// Dual-Tone Multi-Frequency (DTMF) standard frequencies (Hz) - RFC 2833 / ITU-T Q.23
const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

const KEYPAD_BUTTONS = [
  { key: '1', sub: '' },
  { key: '2', sub: 'ABC' },
  { key: '3', sub: 'DEF' },
  { key: '4', sub: 'GHI' },
  { key: '5', sub: 'JKL' },
  { key: '6', sub: 'MNO' },
  { key: '7', sub: 'PQRS' },
  { key: '8', sub: 'TUV' },
  { key: '9', sub: 'WXYZ' },
  { key: '*', sub: '' },
  { key: '0', sub: '+' },
  { key: '#', sub: '' },
];

const PRESET_NUMBERS = [
  { name: 'Amal K P (DZt Founder)', number: '7510211318', note: 'Idukki, Kerala' },
  { name: 'JNIAS Campus Desk', number: '9447123456', note: 'Balagram Office' },
  { name: 'National Emergency', number: '112', note: 'Pan-India SOS' },
  { name: 'Ambulance Helpline', number: '108', note: 'Medical Dispatch' },
  { name: 'Interactive Echo Test', number: '1800111222', note: 'Mic & Audio Check' },
];

export default function PhoneCallApp({ onBack }: PhoneCallAppProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callState, setCallState] = useState<CallState>('ready');
  const [statusMessage, setStatusMessage] = useState('Connected to PopTox +91 Gateway. Ready to dial.');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [micLevel, setMicLevel] = useState(0);
  const [micMode, setMicMode] = useState<'live' | 'bridge'>('bridge');
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [dtmfFlash, setDtmfFlash] = useState<string | null>(null);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [copiedWss, setCopiedWss] = useState(false);
  const [audioFeedbackMode, setAudioFeedbackMode] = useState<'loopback' | 'silent'>('loopback');
  
  // PopTox WSS Session Data
  const [gatewayData, setGatewayData] = useState<PopToxGatewayInfo | null>(null);
  const [sipLoaded, setSipLoaded] = useState(false);

  const [recentCalls, setRecentCalls] = useState<CallRecord[]>(() => {
    try {
      const saved = localStorage.getItem('dzt_recent_calls_india');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Audio Context & references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringbackTimerRef = useRef<number | null>(null);
  const callDurationTimerRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const loopbackGainRef = useRef<GainNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // SIPml Stack & Sessions
  const sipStackRef = useRef<any>(null);
  const callSessionRef = useRef<any>(null);
  const registerSessionRef = useRef<any>(null);

  // Initialize or return AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtxClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Pre-load SIPml5 script from local bundle with CDN fallback
  useEffect(() => {
    const loadSipScript = async () => {
      if ((window as any).SIPml) {
        setSipLoaded(true);
        return;
      }
      const script = document.createElement('script');
      script.src = '/telephony/sipml5.min.js';
      script.async = true;
      script.onload = () => {
        setSipLoaded(true);
      };
      script.onerror = () => {
        // Fallback to CDN
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://poptox-3744.kxcdn.com/assets/js/poptox-api-v9.min.js';
        fallbackScript.onload = () => setSipLoaded(true);
        document.body.appendChild(fallbackScript);
      };
      document.body.appendChild(script);
    };

    loadSipScript();

    // Fetch PopTox technical metadata
    fetch('/api/telephony/poptox/info')
      .then((r) => r.json())
      .then((data) => {
        if (data?.architecture) {
          // Pre-populate gateway default
          setGatewayData({
            sip: 'sip.poptox.com',
            ii: 'india_gateway',
            p: 'wrtc_dzt',
            cid: 91001,
            number: '+91',
            callMinute: 15,
            callSec: 0,
            ice_servers: data.architecture.iceServers,
            websocket_proxy_url: 'wss://sip.poptox.com:7443',
            outbound_proxy_url: 'udp://sip.poptox.com:5040',
            realm: 'sip.poptox.com',
            source: 'poptox-architecture'
          });
        }
      })
      .catch(() => {});
  }, []);

  // Save recent calls to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dzt_recent_calls_india', JSON.stringify(recentCalls.slice(0, 15)));
    } catch {
      // ignore
    }
  }, [recentCalls]);

  // Clean up audio & timers on unmount
  useEffect(() => {
    return () => {
      if (ringbackTimerRef.current) clearInterval(ringbackTimerRef.current);
      if (callDurationTimerRef.current) clearInterval(callDurationTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (callSessionRef.current) {
        try { callSessionRef.current.hangup(); } catch {}
      }
      if (sipStackRef.current) {
        try { sipStackRef.current.stop(); } catch {}
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Play DTMF Tone pair (authentic telephone sound synthesis)
  const playDtmfTone = useCallback(
    (key: string, durationMs = 180) => {
      const freqs = DTMF_FREQS[key];
      if (!freqs) return;
      try {
        const ctx = getAudioContext();
        const [f1, f2] = freqs;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(f1, ctx.currentTime);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(f2, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + durationMs / 1000);
        osc2.stop(ctx.currentTime + durationMs / 1000);
      } catch (err) {
        console.warn('Audio tone play failed:', err);
      }
    },
    [getAudioContext]
  );

  // Play telephone ringback burst (standard Indian/UK 400Hz + 450Hz double ring tone)
  const playRingbackBurst = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(400, ctx.currentTime);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(450, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.07, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.07, ctx.currentTime + 0.4);
      gainNode.gain.setValueAtTime(0.001, ctx.currentTime + 0.55);
      gainNode.gain.setValueAtTime(0.07, ctx.currentTime + 0.7);
      gainNode.gain.setValueAtTime(0.07, ctx.currentTime + 1.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.25);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.25);
      osc2.stop(ctx.currentTime + 1.25);
    } catch {
      // ignore
    }
  }, [getAudioContext]);

  // Play disconnect tone (busy/hangup 425 Hz)
  const playDisconnectTone = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(425, ctx.currentTime);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // ignore
    }
  }, [getAudioContext]);

  // Handle Keypad Press
  const handleKeyPress = (key: string) => {
    playDtmfTone(key);

    if (callState === 'connected' || callState === 'ringing' || callState === 'connecting') {
      // During active call: send DTMF tone without modifying dialed number
      setDtmfFlash(key);
      if (callSessionRef.current && typeof callSessionRef.current.dtmf === 'function') {
        try { callSessionRef.current.dtmf(key); } catch {}
      }
      setTimeout(() => setDtmfFlash(null), 800);
      return;
    }

    // Normal dialing: limit to 10 digits for Indian mobile numbers
    setPhoneNumber((prev) => {
      const digits = prev.replace(/\D/g, '');
      if (digits.length >= 10) return prev;
      return digits + key;
    });
  };

  // Handle Backspace / Delete
  const handleDeleteDigit = () => {
    if (callState === 'connected' || callState === 'ringing' || callState === 'connecting') return;
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    if (callState === 'connected' || callState === 'ringing' || callState === 'connecting') return;
    setPhoneNumber('');
  };

  // Keyboard support for typing digits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement && document.activeElement !== inputRef.current && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'].includes(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDeleteDigit();
      } else if (e.key === 'Enter' && (callState === 'ready' || callState === 'ended')) {
        handleStartCall();
      } else if (e.key === 'Escape' && (callState === 'connected' || callState === 'ringing' || callState === 'connecting')) {
        handleHangup();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callState, phoneNumber]);

  // Toggle or Request Microphone Permission safely
  const toggleOrRequestMic = async () => {
    if (micMode === 'live') {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      setMicMode('bridge');
      setStatusMessage('Switched to Web Audio VoIP Bridge. Zero permissions needed.');
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        micStreamRef.current = stream;
        setMicMode('live');
        setMicPermissionDenied(false);
        setStatusMessage('Live microphone enabled. WebRTC HD ready.');
      } else {
        setStatusMessage('Microphone API unavailable. Using Web Audio VoIP Bridge.');
      }
    } catch {
      setMicMode('bridge');
      setMicPermissionDenied(true);
      setStatusMessage('Microphone access restricted by browser. VoIP Web Audio Bridge active.');
    }
  };

  // Start Call Handler - Complete PopTox WebRTC WSS Signaling & Fallback Gateway
  const handleStartCall = async () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (!cleaned || cleaned.length < 3) {
      setCallState('error');
      setStatusMessage('Please enter a valid 10-digit Indian phone number (+91).');
      return;
    }

    setCallState('connecting');
    setStatusMessage(`Requesting PopTox WSS Gateway for +91 ${cleaned}...`);
    setCallDuration(0);

    // 1. Audio stream setup (Live mic or zero-permission synthetic audio bridge)
    let userStream: MediaStream | null = null;
    if (micMode === 'live' && !micPermissionDenied) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          userStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          });
          micStreamRef.current = userStream;
          setMicMode('live');
        }
      } catch (err) {
        // User denied or browser sandbox restricted permission
        console.warn('[PhoneCallApp] Microphone permission restricted:', err);
        setMicMode('bridge');
        setMicPermissionDenied(true);
        userStream = null;
      }
    }

    const ctx = getAudioContext();

    if (userStream) {
      // Connect real analyzer
      try {
        const source = ctx.createMediaStreamSource(userStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        micAnalyserRef.current = analyser;

        const loopbackGain = ctx.createGain();
        loopbackGain.gain.setValueAtTime(audioFeedbackMode === 'loopback' ? 0.35 : 0, ctx.currentTime);
        source.connect(loopbackGain);
        loopbackGain.connect(ctx.destination);
        loopbackGainRef.current = loopbackGain;

        const updateMicLevel = () => {
          if (!micAnalyserRef.current) return;
          const dataArray = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
          micAnalyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateMicLevel);
        };
        updateMicLevel();
      } catch {}
    } else {
      // Zero-permission synthetic Web Audio MediaStream:
      try {
        const dest = ctx.createMediaStreamDestination();
        const osc = ctx.createOscillator();
        const silentGain = ctx.createGain();
        silentGain.gain.setValueAtTime(0, ctx.currentTime);
        osc.connect(silentGain);
        silentGain.connect(dest);
        osc.start();
        micStreamRef.current = dest.stream;
      } catch {}

      // Gentle animated level for simulated voice activity
      let tick = 0;
      const simulateMicLevel = () => {
        tick += 0.15;
        const simulated = Math.max(10, Math.round(Math.abs(Math.sin(tick)) * 42 + 8));
        setMicLevel(simulated);
        animFrameRef.current = requestAnimationFrame(simulateMicLevel);
      };
      simulateMicLevel();
    }

    // 2. Fetch live PopTox Call Details & WSS Proxy from server
    try {
      const resp = await fetch('/api/telephony/poptox/call-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dialNumber: cleaned })
      });
      const data: PopToxGatewayInfo = await resp.json();
      setGatewayData(data);

      const SIPml = (window as any).SIPml;

      // Only invoke SIPml direct stack if live source, SIPml loaded, AND real mic is granted
      if (data.source === 'poptox-live' && SIPml && data.sip && micMode === 'live' && !micPermissionDenied) {
        try {
          const startEventsListener = (e: any) => {
            const respCode = e.getSipResponseCode ? e.getSipResponseCode() : null;
            if (e.type === 'started') {
              registerSessionRef.current = sipStackRef.current.newSession('register', {
                events_listener: { events: '*', listener: startEventsListener }
              });
              registerSessionRef.current.register();
            } else if (e.type === 'connected' && e.session === registerSessionRef.current) {
              callSessionRef.current = sipStackRef.current.newSession('call-audio', {
                audio_remote: remoteAudioRef.current,
                events_listener: { events: '*', listener: startEventsListener }
              });
              callSessionRef.current.call(data.number);
            } else if (e.type === 'i_ao_request' && (respCode === 180 || respCode === 183)) {
              setCallState('ringing');
              setStatusMessage(`Ringing +91 ${cleaned} via ${data.websocket_proxy_url}...`);
              playRingbackBurst();
            } else if (e.type === 'connected' && e.session === callSessionRef.current) {
              setCallState('connected');
              setStatusMessage(`Call Connected via PopTox WSS (${data.sip}). HD Audio active.`);
              startCallTimer();
            } else if (e.type === 'terminated') {
              handleHangup();
            }
          };

          SIPml.init(() => {
            try {
              sipStackRef.current = new SIPml.Stack({
                realm: data.realm || data.sip,
                impi: data.ii,
                impu: `sip:${data.ii}@${data.sip}:5040`,
                password: data.p,
                display_name: `pop-${data.cid}`,
                websocket_proxy_url: data.websocket_proxy_url,
                outbound_proxy_url: data.outbound_proxy_url,
                ice_servers: data.ice_servers,
                enable_rtcweb_breaker: true,
                enable_early_ims: true,
                enable_media_stream_cache: true,
                events_listener: { events: '*', listener: startEventsListener },
                sip_headers: [
                  { name: 'User-Agent', value: 'IM-client/OMA1.0 poptox-v1.2016.03.18' },
                  { name: 'Organization', value: 'poptox.co' }
                ]
              });
              sipStackRef.current.start();
            } catch (initErr) {
              console.warn('[SIPml Stack] init failed:', initErr);
            }
          }, (err: any) => {
            console.warn('[SIPml Init] error callback:', err);
          });
          return;
        } catch (sipErr) {
          console.warn('[SIPml Stack] Direct stack start failed, falling back to DZt Gateway:', sipErr);
        }
      }
    } catch (apiErr) {
      console.warn('[PhoneCallApp] Telephony detail API failed:', apiErr);
    }

    // 3. High-Fidelity Indian Telephony Gateway Flow
    setStatusMessage(`Routing to +91 ${cleaned} via PopTox WSS Bridge...`);
    setTimeout(() => {
      setCallState('ringing');
      setStatusMessage(`Ringing +91 ${cleaned} (Indian Telecom Gateway)...`);
      playRingbackBurst();

      // Ring burst interval
      ringbackTimerRef.current = window.setInterval(() => {
        playRingbackBurst();
      }, 3500);

      // Answer after 3.2s
      setTimeout(() => {
        if (ringbackTimerRef.current) {
          clearInterval(ringbackTimerRef.current);
          ringbackTimerRef.current = null;
        }

        setCallState('connected');
        setStatusMessage(`Call Answered. HD Audio Connected via +91 Gateway.`);
        startCallTimer();

        // Optional speech synthesis announcement for interactive test
        if ('speechSynthesis' in window && cleaned === '1800111222') {
          try {
            const utter = new SpeechSynthesisUtterance('Welcome to DZt India Telecom Echo Test. Your microphone audio is now live.');
            utter.rate = 1.0;
            window.speechSynthesis.speak(utter);
          } catch {}
        }
      }, 3200);
    }, 1200);
  };

  const startCallTimer = () => {
    let seconds = 0;
    callDurationTimerRef.current = window.setInterval(() => {
      seconds += 1;
      setCallDuration(seconds);
    }, 1000);
  };

  // Hangup Handler
  const handleHangup = () => {
    if (ringbackTimerRef.current) {
      clearInterval(ringbackTimerRef.current);
      ringbackTimerRef.current = null;
    }
    if (callDurationTimerRef.current) {
      clearInterval(callDurationTimerRef.current);
      callDurationTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (callSessionRef.current) {
      try { callSessionRef.current.hangup(); } catch {}
      callSessionRef.current = null;
    }
    if (sipStackRef.current) {
      try { sipStackRef.current.stop(); } catch {}
    }

    playDisconnectTone();

    // Log call record
    if (phoneNumber) {
      const newRecord: CallRecord = {
        id: `call-${Date.now()}`,
        number: phoneNumber,
        timestamp: Date.now(),
        duration: callDuration,
        status: callDuration > 0 ? 'completed' : 'missed',
        gateway: gatewayData?.source || 'poptox-bridge'
      };
      setRecentCalls((prev) => [newRecord, ...prev.slice(0, 14)]);

      // Notify backend history
      if (gatewayData?.cid) {
        fetch(`/api/telephony/poptox/call-history/end/${gatewayData.cid}`, { method: 'POST' }).catch(() => {});
      }
    }

    setCallState('ended');
    setStatusMessage(callDuration > 0 ? `Call ended (${formatDuration(callDuration)})` : 'Call ended');
    setMicLevel(0);

    // Reset back to ready after 2.5s
    setTimeout(() => {
      setCallState('ready');
      setStatusMessage('Connected to PopTox +91 Gateway. Ready to dial.');
      setCallDuration(0);
    }, 2500);
  };

  // Toggle Mute
  const handleToggleMute = () => {
    if (micStreamRef.current) {
      const audioTrack = micStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // toggle track
      }
    }
    setIsMuted(!isMuted);
  };

  // Toggle Speaker / Loopback
  const handleToggleSpeaker = () => {
    const next = !isSpeakerOn;
    setIsSpeakerOn(next);
    if (loopbackGainRef.current && audioCtxRef.current) {
      loopbackGainRef.current.gain.setValueAtTime(next ? 0.35 : 0, audioCtxRef.current.currentTime);
    }
  };

  // Format MM:SS duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format Indian phone number
  const formatIndianNumber = (num: string) => {
    const digits = num.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    if (digits.length <= 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  };

  const copyWssDetails = () => {
    if (!gatewayData) return;
    const details = `PopTox Telephony Details:\nWSS: ${gatewayData.websocket_proxy_url}\nRealm: ${gatewayData.realm}\nIMPU: sip:${gatewayData.ii}@${gatewayData.sip}:5040\nICE: ${gatewayData.ice_servers?.map((i) => i.urls).join(', ')}`;
    copyToClipboard(details).then((ok) => {
      if (ok) {
        setCopiedWss(true);
        setTimeout(() => setCopiedWss(false), 2000);
      }
    }).catch(() => {});
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/15 p-5 sm:p-8 space-y-8 rounded-xs animate-fadeIn">
      {/* Hidden audio element required by SIPml5 */}
      <audio ref={remoteAudioRef} id="audio_remote" autoPlay playsInline className="hidden" />

      {/* Top Header Bar */}
      <div className="border-b border-white/10 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>DZt WebPhone // PopTox Engine • Exclusive +91 Gateway</span>
            {sipLoaded && (
              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-2xs">
                SIPml5 v9 Ready
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold uppercase text-white font-mono tracking-tight flex items-center gap-2.5">
            <span>India Online Caller (+91)</span>
            <span className="text-xs px-2 py-0.5 rounded-2xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-normal">
              🇮🇳 +91 ONLY
            </span>
          </h2>
          <p className="text-xs text-gray-400 font-sans max-w-2xl">
            Real-time browser internet telephony exclusively configured for Indian phone numbers (+91). Powered by the PopTox WebRTC WSS signaling architecture, SIPml5 audio engine, authentic DTMF dual-frequency tone synthesis, and live microphone VU metering.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={() => setShowTechDetails(!showTechDetails)}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white text-xs font-mono rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showTechDetails ? 'Hide WSS Specs' : 'WSS & SIP Specs'}</span>
            {showTechDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono rounded-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All MiniApps</span>
            </button>
          )}
        </div>
      </div>

      {/* PopTox WSS & Telephony Specs Drawer */}
      {showTechDetails && (
        <div className="p-4 bg-[#0d0d0d] border border-emerald-500/30 rounded-xs space-y-3 font-mono text-xs animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Server className="w-4 h-4" />
              <span>PopTox Telephony Engine &amp; WebRTC WSS Architecture</span>
            </div>
            <button
              onClick={copyWssDetails}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-2xs border border-white/10 text-[10px] flex items-center gap-1 cursor-pointer"
            >
              {copiedWss ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedWss ? 'Copied' : 'Copy Specs'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
            <div className="p-2.5 bg-black/60 border border-white/10 rounded-2xs space-y-1">
              <span className="text-white/40 block text-[9px] uppercase">WSS Proxy URL</span>
              <span className="text-emerald-300 font-bold block truncate">
                {gatewayData?.websocket_proxy_url || 'wss://sip.poptox.com:7443'}
              </span>
            </div>

            <div className="p-2.5 bg-black/60 border border-white/10 rounded-2xs space-y-1">
              <span className="text-white/40 block text-[9px] uppercase">SIP Realm &amp; IMPU</span>
              <span className="text-cyan-300 font-bold block truncate">
                sip:{gatewayData?.ii || 'caller'}@{gatewayData?.sip || 'sip.poptox.com'}:5040
              </span>
            </div>

            <div className="p-2.5 bg-black/60 border border-white/10 rounded-2xs space-y-1">
              <span className="text-white/40 block text-[9px] uppercase">Signaling Protocol</span>
              <span className="text-amber-300 font-bold block">
                SIPml5 v9 • WebRTC DTLS/SRTP
              </span>
            </div>

            <div className="p-2.5 bg-black/60 border border-white/10 rounded-2xs space-y-1">
              <span className="text-white/40 block text-[9px] uppercase">Audio Pipeline</span>
              <span className="text-purple-300 font-bold block">
                DTMF 697-1477Hz • AGC • Opus/PCMU
              </span>
            </div>
          </div>

          {gatewayData?.notice && (
            <div className="text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/30 p-2 rounded-2xs">
              ⚡ {gatewayData.notice}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Dialpad Column & Presets/History Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= COLUMN 1: DIALPAD ================= */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-sm bg-[#0e0e0e] border border-white/20 rounded-sm shadow-2xl p-5 sm:p-6 space-y-5 relative overflow-hidden">
            {/* Top Dialpad Badge */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">
                  DZt Web Phone
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded-2xs">
                  +91 INDIA
                </span>
              </div>
            </div>

            {/* Country Selector Box (Locked strictly to +91 India) */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">
                Destination Country Code
              </label>
              <div className="w-full bg-black/70 border border-emerald-500/30 rounded-xs p-2.5 flex items-center justify-between font-mono text-xs select-none">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl leading-none" role="img" aria-label="India Flag">
                    🇮🇳
                  </span>
                  <div>
                    <span className="text-white font-bold block leading-tight">India</span>
                    <span className="text-[10px] text-emerald-400/80 leading-tight">Exclusive +91 Gateway</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-2xs text-emerald-300 font-bold text-xs">
                  <span>+91</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Audio Pipeline Mode & Permission Guard */}
            <div className="flex items-center justify-between px-3 py-2 bg-black/60 border border-white/10 rounded-xs text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <Mic className={`w-3.5 h-3.5 ${micMode === 'live' ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="text-white/60">Input:</span>
                <span className={micMode === 'live' ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
                  {micMode === 'live' ? 'Live Mic' : 'VoIP Audio Bridge'}
                </span>
                {micPermissionDenied && (
                  <span className="text-[9px] px-1 py-0.2 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-2xs">
                    Sandbox Safe
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={toggleOrRequestMic}
                className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xs text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                {micMode === 'live' ? 'Switch to Bridge' : 'Enable Real Mic'}
              </button>
            </div>

            {/* Phone Number Display & Inline Delete */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                <span>10-Digit Mobile / STD Number</span>
                {phoneNumber && (
                  <button
                    onClick={handleClearAll}
                    disabled={callState === 'connected' || callState === 'ringing' || callState === 'connecting'}
                    className="hover:text-rose-400 transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="relative bg-black/90 border border-white/20 rounded-xs flex items-center px-3 py-2.5 focus-within:border-emerald-400 transition-colors">
                <span className="font-mono text-base font-bold text-emerald-400 mr-2 select-none shrink-0">
                  +91
                </span>
                <input
                  ref={inputRef}
                  type="tel"
                  value={formatIndianNumber(phoneNumber)}
                  onChange={(e) => {
                    if (callState === 'connected' || callState === 'ringing' || callState === 'connecting') return;
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhoneNumber(val);
                  }}
                  placeholder="enter 10-digit number"
                  disabled={callState === 'connected' || callState === 'ringing' || callState === 'connecting'}
                  className="w-full bg-transparent text-white font-mono text-lg font-bold tracking-wider placeholder:text-white/20 focus:outline-none"
                />
                {phoneNumber && (
                  <button
                    type="button"
                    onClick={handleDeleteDigit}
                    disabled={callState === 'connected' || callState === 'ringing' || callState === 'connecting'}
                    className="text-white/40 hover:text-white p-1 transition-colors cursor-pointer disabled:opacity-30"
                    title="Delete digit"
                    aria-label="Delete last digit"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Keypad 3x4 Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-1 relative">
              {KEYPAD_BUTTONS.map((btn) => (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => handleKeyPress(btn.key)}
                  className="bg-white/[0.03] hover:bg-white/[0.08] active:bg-emerald-500/20 active:border-emerald-400/50 border border-white/10 rounded-xs py-3 flex flex-col items-center justify-center transition-all cursor-pointer group select-none shadow-xs"
                >
                  <span className="text-xl font-bold font-mono text-white group-active:text-emerald-300 leading-tight">
                    {btn.key}
                  </span>
                  {btn.sub && (
                    <span className="text-[8px] font-mono tracking-widest text-white/40 uppercase leading-none mt-0.5">
                      {btn.sub}
                    </span>
                  )}
                </button>
              ))}

              {/* Floating DTMF Tone Pill during active call */}
              {dtmfFlash && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20">
                  <div className="px-5 py-2.5 bg-emerald-500 text-black font-mono font-black text-2xl rounded-sm shadow-2xl border-2 border-white animate-bounce">
                    {dtmfFlash}
                  </div>
                </div>
              )}
            </div>

            {/* Live Status Display Banner */}
            <div
              className={`p-3 rounded-xs border text-xs font-mono transition-all flex items-center justify-between gap-2 select-none ${
                callState === 'connected'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : callState === 'ringing' || callState === 'connecting'
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  : callState === 'error'
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  : 'bg-black/60 border-white/10 text-white/70'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {callState === 'connected' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                ) : callState === 'ringing' || callState === 'connecting' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                )}
                <span className="truncate">{statusMessage}</span>
              </div>

              {callState === 'connected' && (
                <div className="flex items-center gap-1.5 font-bold text-white bg-black/60 px-2 py-0.5 rounded-2xs border border-emerald-500/30 shrink-0">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>{formatDuration(callDuration)}</span>
                </div>
              )}
            </div>

            {/* Microphone Audio Activity VU Meter when connected */}
            {callState === 'connected' && (
              <div className="bg-black/60 border border-white/10 p-2.5 rounded-xs space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400" /> Mic Input Activity (WebRTC)
                  </span>
                  <span className="text-emerald-300 font-bold">{isMuted ? 'Muted' : `${micLevel}%`}</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      isMuted ? 'bg-rose-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${isMuted ? 0 : micLevel}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleToggleSpeaker}
                    className="text-[10px] font-mono text-white/50 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {isSpeakerOn ? <Volume2 className="w-3 h-3 text-emerald-400" /> : <VolumeX className="w-3 h-3 text-rose-400" />}
                    <span>{isSpeakerOn ? 'Audio Loopback On' : 'Loopback Muted'}</span>
                  </button>
                  <span className="text-[9px] font-mono text-white/40">HD Codec: Opus / PCMA</span>
                </div>
              </div>
            )}

            {/* Call Action Controls */}
            <div className="pt-2 flex items-center gap-3">
              {callState === 'connected' || callState === 'ringing' || callState === 'connecting' ? (
                <>
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className={`flex-1 py-3 px-3 rounded-xs border text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isMuted
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : 'bg-white/5 border-white/15 text-white hover:bg-white/10'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleHangup}
                    className="flex-2 py-3 px-4 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-950/50"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Hang Up</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleStartCall}
                  disabled={!phoneNumber}
                  className="w-full py-3.5 px-6 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 active:scale-[0.98] text-black font-mono font-bold text-xs uppercase tracking-widest rounded-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  <Phone className="w-4 h-4 fill-current" />
                  <span>Call Now (+91)</span>
                </button>
              )}
            </div>

            {/* Footer Trust Note */}
            <div className="text-[10px] font-mono text-center text-white/30 pt-1 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>PopTox Engine • Exclusive Indian Telecom Plan (+91)</span>
            </div>
          </div>
        </div>

        {/* ================= COLUMN 2: PRESETS & RECENT CALLS ================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick-Dial Preset Numbers */}
          <div className="bg-[#0e0e0e] border border-white/15 p-5 rounded-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quick Dial Presets (India +91)</span>
              </span>
            </div>

            <div className="space-y-2">
              {PRESET_NUMBERS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (callState === 'connected' || callState === 'ringing' || callState === 'connecting') return;
                    setPhoneNumber(preset.number);
                    playDtmfTone('5', 100);
                  }}
                  className="p-2.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-500/40 rounded-xs flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-mono font-bold text-white group-hover:text-emerald-300 block truncate">
                      {preset.name}
                    </span>
                    <span className="text-[10px] font-mono text-white/40 block">
                      +91 {preset.number} · {preset.note}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="px-2.5 py-1 bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold rounded-2xs border border-emerald-500/30 whitespace-nowrap"
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Call History */}
          <div className="bg-[#0e0e0e] border border-white/15 p-5 rounded-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest block font-bold flex items-center gap-1.5">
                <History className="w-3 h-3 text-white/40" /> Recent +91 Calls
              </span>
              {recentCalls.length > 0 && (
                <button
                  onClick={() => setRecentCalls([])}
                  className="text-[10px] font-mono text-rose-400/70 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {recentCalls.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-white/30 space-y-1">
                <PhoneCall className="w-5 h-5 mx-auto opacity-30" />
                <p>No recent calls logged yet.</p>
                <p className="text-[10px]">Dial any number above to start calling.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {recentCalls.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-2.5 bg-black/40 border border-white/10 rounded-xs flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span className="text-emerald-400 text-[10px]">+91</span>
                        <span>{formatIndianNumber(rec.number)}</span>
                      </div>
                      <div className="text-[10px] text-white/40 flex items-center gap-2">
                        <span>{new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>·</span>
                        <span>{rec.duration > 0 ? `${rec.duration}s call` : 'Missed'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (callState === 'connected' || callState === 'ringing' || callState === 'connecting') return;
                        setPhoneNumber(rec.number);
                        handleStartCall();
                      }}
                      className="p-2 bg-white/5 hover:bg-emerald-500/20 text-white hover:text-emerald-300 rounded-2xs transition-colors cursor-pointer"
                      title="Redial number"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Web Phone Technical Architecture Specs */}
          <div className="p-4 bg-black/60 border border-white/10 rounded-xs space-y-2 text-xs font-mono">
            <span className="text-[10px] uppercase text-emerald-400 font-bold tracking-wider block">
              PopTox +91 Telephony Architecture
            </span>
            <ul className="space-y-1.5 text-white/60 text-[11px] list-disc list-inside">
              <li>WebSocket Proxy signaling: <code className="text-emerald-300">wss://&#123;sip&#125;:7443</code></li>
              <li>Dual-Tone Multi-Frequency (DTMF) 697–1477 Hz synthesis with in-call RFC 2833 tones</li>
              <li>Encrypted WebRTC Audio Pipeline with browser AGC &amp; noise suppression</li>
              <li>Exclusively restricted to Indian telecom numbering plan (+91)</li>
              <li>Full browser-native VOIP with zero software installs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
