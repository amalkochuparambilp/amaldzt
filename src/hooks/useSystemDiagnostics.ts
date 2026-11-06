import { useState, useEffect } from 'react';

export interface DiagnosticsData {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  org?: string;
  timezone?: string;
  loading: boolean;
  error: string | null;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  online: boolean;
  userAgent: string;
  platform: string;
  language: string;
  cores?: number;
  memory?: number;
}

export function useSystemDiagnostics(): DiagnosticsData {
  const [data, setData] = useState<DiagnosticsData>({
    ip: 'Resolving IP...',
    loading: true,
    error: null,
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    platform: typeof navigator !== 'undefined' ? navigator.platform : '',
    language: typeof navigator !== 'undefined' ? navigator.language : '',
    cores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined,
    memory: typeof (navigator as any).deviceMemory !== 'undefined' ? (navigator as any).deviceMemory : undefined
  });

  useEffect(() => {
    let mounted = true;
    const fetchIp = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const json = await res.json();
          if (mounted) {
            setData((prev) => ({
              ...prev,
              ip: json.ip || 'Unknown',
              city: json.city,
              region: json.region,
              country: json.country_name,
              org: json.org,
              timezone: json.timezone,
              loading: false
            }));
            return;
          }
        }
        // Fallback ipify
        const res2 = await fetch('https://api.ipify.org?format=json');
        if (res2.ok) {
          const json2 = await res2.json();
          if (mounted) {
            setData((prev) => ({
              ...prev,
              ip: json2.ip || 'Unknown',
              loading: false
            }));
          }
        } else {
          throw new Error('IP service unreachable');
        }
      } catch (err: any) {
        if (mounted) {
          setData((prev) => ({
            ...prev,
            ip: '127.0.0.1 (Secured)',
            loading: false,
            error: err?.message || 'Failed to fetch public IP'
          }));
        }
      }
    };

    fetchIp();

    const handleOnline = () => setData((prev) => ({ ...prev, online: true }));
    const handleOffline = () => setData((prev) => ({ ...prev, online: false }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      setData((prev) => ({
        ...prev,
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt
      }));
    }

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return data;
}
