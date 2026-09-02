import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import piexif from 'piexifjs';
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  Copy,
  Check,
  Download,
  Share2,
  AlertCircle,
  RefreshCw,
  Eye,
  ShieldCheck,
  Glasses,
  Zap,
  Maximize2
} from 'lucide-react';

interface MetaRayBanConverterProps {
  onBack?: () => void;
}

export default function MetaRayBanConverter({ onBack }: MetaRayBanConverterProps) {
  const [sourceDataUrl, setSourceDataUrl] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string>('');
  const [sourceFileSize, setSourceFileSize] = useState<number>(0);
  const [finalDataUrl, setFinalDataUrl] = useState<string | null>(null);
  const [pureBase64, setPureBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const [copiedBase64, setCopiedBase64] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [sourceFormat, setSourceFormat] = useState<'png' | 'jpeg' | 'webp' | 'other'>('jpeg');

  const handleFile = (file: File) => {
    const isPng = file.type.includes('png') || /\.png$/i.test(file.name);
    const isJpg = file.type.includes('jpeg') || file.type.includes('jpg') || /\.jpe?g$/i.test(file.name);
    const isWebp = file.type.includes('webp') || /\.webp$/i.test(file.name);

    if (!isPng && !isJpg && !isWebp) {
      setStatus({
        message: 'Please select a PNG, JPG, or JPEG photo.',
        type: 'error'
      });
      return;
    }

    setSourceFormat(isPng ? 'png' : isWebp ? 'webp' : 'jpeg');
    setSourceFileName(file.name || 'Photo');
    setSourceFileSize(file.size);
    setFinalDataUrl(null);
    setPureBase64(null);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSourceDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const readOrientation = (dataUrl: string): number => {
    if (!dataUrl.startsWith('data:image/jpeg') && !dataUrl.startsWith('data:image/jpg')) {
      return 1;
    }
    try {
      const exif = piexif.load(dataUrl);
      return exif['0th']?.[piexif.ImageIFD.Orientation] || 1;
    } catch {
      return 1;
    }
  };

  const drawCorrected = (
    dataUrl: string,
    targetW: number,
    targetH: number,
    orientation: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const rotate90 = orientation >= 5 && orientation <= 8;
        canvas.width = rotate90 ? targetH : targetW;
        canvas.height = rotate90 ? targetW : targetH;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        // Fill background with black for transparency handling (PNG to JPEG)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        switch (orientation) {
          case 2:
            ctx.setTransform(-1, 0, 0, 1, targetW, 0);
            break;
          case 3:
            ctx.setTransform(-1, 0, 0, -1, targetW, targetH);
            break;
          case 4:
            ctx.setTransform(1, 0, 0, -1, 0, targetH);
            break;
          case 5:
            ctx.setTransform(0, 1, 1, 0, 0, 0);
            break;
          case 6:
            ctx.setTransform(0, 1, -1, 0, targetH, 0);
            break;
          case 7:
            ctx.setTransform(0, -1, -1, 0, targetH, targetW);
            break;
          case 8:
            ctx.setTransform(0, -1, 1, 0, 0, targetW);
            break;
          default:
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  const buildExif = (dataUrl: string) => {
    let exif: any = { '0th': {}, Exif: {}, GPS: {}, '1st': {}, thumbnail: null };
    if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
      try {
        exif = piexif.load(dataUrl);
      } catch {
        exif = { '0th': {}, Exif: {}, GPS: {}, '1st': {}, thumbnail: null };
      }
    }

    if (!exif['0th']) exif['0th'] = {};
    if (!exif['Exif']) exif['Exif'] = {};
    exif['GPS'] = {};

    delete exif['0th'][piexif.ImageIFD.Software];
    delete exif['0th'][piexif.ImageIFD.HostComputer];

    delete exif['Exif'][piexif.ExifIFD.MakerNote];
    delete exif['Exif'][piexif.ExifIFD.LensMake];
    delete exif['Exif'][piexif.ExifIFD.LensModel];
    delete exif['Exif'][piexif.ExifIFD.LensSpecification];

    exif['0th'][piexif.ImageIFD.Make] = 'Meta AI';
    exif['0th'][piexif.ImageIFD.Model] = 'Ray-Ban Meta Smart Glasses 2';
    exif['0th'][piexif.ImageIFD.Orientation] = 1;
    exif['Exif'][piexif.ExifIFD.ColorSpace] = 1;
    exif['Exif'][piexif.ExifIFD.PixelXDimension] = 3024;
    exif['Exif'][piexif.ExifIFD.PixelYDimension] = 4032;

    return exif;
  };

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const saveOrShareImage = async (dataUrl: string, filename = 'meta-glasses-converted.jpg') => {
    const blob = dataUrlToBlob(dataUrl);
    const file = new File([blob], filename, { type: 'image/jpeg' });

    // 1. Mobile Web Share (Native Camera Roll / Save Image on iOS & Android)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Ray-Ban Meta Glasses Photo',
          text: 'Converted Ray-Ban Meta Smart Glasses 3024×4032'
        });
        return { method: 'share' };
      } catch (err: any) {
        if (err.name === 'AbortError') return { method: 'cancelled' };
      }
    }

    // 2. Blob Download fallback
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      a.remove();
    }, 4000);
    return { method: 'download' };
  };

  const handleConvertAllInOne = async () => {
    if (!sourceDataUrl) {
      fileInputRef.current?.click();
      return;
    }

    setIsProcessing(true);
    setStatus({
      message: 'Processing 3024×4032 scaling & Meta AI EXIF injection...',
      type: 'loading'
    });

    try {
      const orientation = readOrientation(sourceDataUrl);
      const corrected = await drawCorrected(sourceDataUrl, 3024, 4032, orientation);
      const exif = buildExif(sourceDataUrl);
      const exifBytes = piexif.dump(exif);
      const inserted = piexif.insert(exifBytes, corrected);
      const b64 = inserted.split(',')[1];

      setFinalDataUrl(inserted);
      setPureBase64(b64);

      // Copy Base64 to clipboard automatically
      try {
        await navigator.clipboard.writeText(b64);
      } catch {
        console.warn('Clipboard write restricted');
      }

      // Save / Native Share Sheet
      const result = await saveOrShareImage(inserted, `meta-rayban-${Date.now()}.jpg`);

      if (result.method === 'share') {
        setStatus({
          message: 'Base64 copied & Share Sheet opened (Tap "Save Image" to keep in Camera Roll).',
          type: 'success'
        });
      } else {
        setStatus({
          message: 'Success! 3024×4032 Meta EXIF injected, Base64 copied & file downloaded.',
          type: 'success'
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatus({
        message: err?.message || 'Conversion failed. Please try another JPG photo.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyBase64 = async () => {
    if (!pureBase64) return;
    try {
      await navigator.clipboard.writeText(pureBase64);
      setCopiedBase64(true);
      setTimeout(() => setCopiedBase64(false), 2000);
      setStatus({
        message: 'Base64 payload copied to clipboard!',
        type: 'success'
      });
    } catch {
      setStatus({
        message: 'Clipboard access was restricted by browser permissions.',
        type: 'error'
      });
    }
  };

  const handleSave = async () => {
    if (!finalDataUrl) return;
    await saveOrShareImage(finalDataUrl, `meta-rayban-${Date.now()}.jpg`);
    setStatus({
      message: 'Save triggered! (You can also tap & hold the image to save directly).',
      type: 'success'
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4 sm:p-6 font-sans">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,.jpg,.jpeg,image/png,.png,image/webp,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,.jpg,.jpeg,image/png,.png,image/webp,.webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {/* Main Glass Card */}
      <div className="bg-[#0e0e0e] border border-white/15 rounded-xs p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold tracking-wide">
            <Glasses className="w-4 h-4 text-pink-400" />
            <span>Now Live</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase font-mono">
            DZt Meta RayBan
          </h1>

          <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            1-Tap 3024×4032 format scaler & PNG-to-JPEG converter, Meta AI EXIF metadata injection, Base64 extraction & direct camera roll save.
          </p>
        </div>

        {/* Quick Source Selectors */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xs flex flex-col items-center justify-center gap-2 text-white transition-all cursor-pointer group"
          >
            <Camera className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Take Photo</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 rounded-xs flex flex-col items-center justify-center gap-2 text-white transition-all cursor-pointer group"
          >
            <ImageIcon className="w-6 h-6 text-pink-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Photo Library (PNG / JPG)</span>
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={`border-2 border-dashed rounded-xs p-6 sm:p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-400 bg-blue-500/10'
              : 'border-white/20 bg-black/40 hover:border-white/40 hover:bg-black/60'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
            <p className="font-mono font-bold text-sm text-white">
              {sourceFileName || 'Tap or Drop PNG / JPG Photo to Convert'}
            </p>
            <p className="text-xs text-white/50 font-mono">
              {sourceFileSize > 0
                ? `${(sourceFileSize / 1024).toFixed(1)} KB • ${sourceFormat.toUpperCase()} Ready for Meta AI EXIF & 3024×4032 Scaling`
                : 'Supports PNG, JPG, JPEG & WebP photos'}
            </p>
          </div>
        </div>

        {/* Preview Container if Image Loaded */}
        {sourceDataUrl && (
          <div className="relative rounded-xs overflow-hidden border border-white/15 bg-black">
            <img
              src={finalDataUrl || sourceDataUrl}
              alt="RayBan Meta Preview"
              className="w-full max-h-80 object-contain mx-auto select-all"
            />
            <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-xs border border-white/20 px-2.5 py-1 rounded-xs text-[11px] font-mono text-cyan-400 font-bold flex items-center gap-1.5">
              {finalDataUrl ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>3024×4032 Meta JPEG Injected</span>
                </>
              ) : (
                <span>Source Loaded ({sourceFormat.toUpperCase()})</span>
              )}
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xs text-white/80 text-[10px] font-mono px-3 py-1 rounded-full pointer-events-none">
              📱 Tap & hold to save to photos
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleConvertAllInOne}
            disabled={isProcessing}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-mono font-bold text-sm uppercase tracking-widest rounded-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Processing 3024×4032...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>CONVERT & SHARE</span>
              </>
            )}
          </button>

          {/* Secondary Sub-actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCopyBase64}
              disabled={!pureBase64 || isProcessing}
              className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
            >
              {copiedBase64 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copiedBase64 ? 'Copied' : 'Copy Base64'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!finalDataUrl || isProcessing}
              className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Download className="w-4 h-4 text-pink-400" />
              <span>Save / Share</span>
            </button>
          </div>
        </div>

        {/* Live Status Toast */}
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`p-3.5 rounded-xs text-xs font-mono flex items-center gap-2.5 border ${
                status.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : status.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
              }`}
            >
              {status.type === 'loading' ? (
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
              ) : status.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="leading-tight">{status.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Meta Specs Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-black/60 border border-white/10 rounded-xs font-mono space-y-1">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block">Output Resolution</span>
            <span className="text-xs text-cyan-300 font-bold">3024 × 4032 px (4:3)</span>
          </div>
          <div className="p-3 bg-black/60 border border-white/10 rounded-xs font-mono space-y-1">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block">Injected Model EXIF</span>
            <span className="text-xs text-pink-300 font-bold">Ray-Ban Meta 2</span>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-white/40 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Client-Side. Photos are processed strictly in your local browser sandbox.</span>
        </div>
      </div>
    </div>
  );
}
