import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, QrCode as QrIcon, AlertCircle, RefreshCw } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  title?: string;
  subtitle?: string;
  showActions?: boolean;
  darkColor?: string;
  lightColor?: string;
  className?: string;
  fileName?: string;
}

export default function QRCodeDisplay({
  value,
  size = 200,
  title,
  subtitle,
  showActions = true,
  darkColor = '#000000',
  lightColor = '#ffffff',
  className = '',
  fileName = 'dzt-qr-code.png'
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);
    setError(null);

    const generateQR = async () => {
      if (!value) {
        setError('No QR payload data provided');
        setIsGenerating(false);
        return;
      }

      try {
        // Generate high-resolution data URL with standard ISO QR matrix
        const url = await QRCode.toDataURL(value, {
          width: size * 2, // 2x for retina sharpness
          margin: 2,
          errorCorrectionLevel: 'M',
          color: {
            dark: darkColor,
            light: lightColor
          }
        });

        if (isMounted) {
          setDataUrl(url);
          setIsGenerating(false);
        }

        // Also render onto canvas ref if available
        if (canvasRef.current && isMounted) {
          await QRCode.toCanvas(canvasRef.current, value, {
            width: size,
            margin: 2,
            errorCorrectionLevel: 'M',
            color: {
              dark: darkColor,
              light: lightColor
            }
          });
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('QR code generation error:', err);
          setError(err?.message || 'Failed to render standard QR matrix');
          setIsGenerating(false);
        }
      }
    };

    generateQR();

    return () => {
      isMounted = false;
    };
  }, [value, size, darkColor, lightColor]);

  const handleCopyLink = () => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {title && (
        <div className="text-center space-y-0.5">
          <h4 className="text-sm font-bold font-mono text-white uppercase tracking-tight flex items-center justify-center gap-1.5">
            <QrIcon className="w-4 h-4 text-cyan-400" />
            <span>{title}</span>
          </h4>
          {subtitle && <p className="text-xs text-white/50">{subtitle}</p>}
        </div>
      )}

      {/* QR Code Container */}
      <div 
        className="p-3 bg-white rounded-xs shadow-2xl flex items-center justify-center relative transition-transform hover:scale-[1.02]"
        style={{ width: size + 24, height: size + 24 }}
      >
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-2 text-black/60 font-mono text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-600" />
            <span>Generating Matrix...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-3 text-center text-rose-600 space-y-1">
            <AlertCircle className="w-6 h-6 mx-auto" />
            <span className="text-[11px] font-mono font-bold leading-tight">Generation Error</span>
            <span className="text-[9px] text-neutral-600 leading-tight">{error}</span>
          </div>
        ) : dataUrl ? (
          <img
            src={dataUrl}
            alt="Scannable QR Code"
            className="w-full h-full object-contain rounded-2xs select-all"
            width={size}
            height={size}
          />
        ) : (
          <canvas ref={canvasRef} width={size} height={size} className="rounded-2xs" />
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center gap-2 w-full max-w-xs pt-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 py-2 px-3 bg-white text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-white/90 transition-colors rounded-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            title="Copy URL / Text Payload"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!dataUrl}
            className="py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs rounded-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            title="Download QR as PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      )}

      {/* Display Value Subtext */}
      <div className="text-[10px] font-mono text-white/40 max-w-xs truncate text-center select-all">
        {value}
      </div>
    </div>
  );
}
