import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import piexif from 'piexifjs';
import {
  Camera,
  Image as ImageIcon,
  Video,
  Sparkles,
  Copy,
  Check,
  Download,
  Share2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Glasses,
  Zap,
  Play,
  Pause,
  Film,
  Volume2,
  VolumeX,
  Maximize2,
  Layers,
  FileCode,
  FileCheck
} from 'lucide-react';

interface MetaRayBanConverterProps {
  onBack?: () => void;
}

type MediaType = 'image' | 'video';

export default function MetaRayBanConverter({ onBack }: MetaRayBanConverterProps) {
  // Mode & File States
  const [activeTab, setActiveTab] = useState<MediaType>('image');
  const [sourceType, setSourceType] = useState<MediaType | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string>('');
  const [sourceFileSize, setSourceFileSize] = useState<number>(0);
  const [fileMimeType, setFileMimeType] = useState<string>('');

  // Image Output States
  const [finalDataUrl, setFinalDataUrl] = useState<string | null>(null);
  const [pureBase64, setPureBase64] = useState<string | null>(null);

  // Video Output & Playback States
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [extractedFrameUrl, setExtractedFrameUrl] = useState<string | null>(null);
  const [extractedFrameBase64, setExtractedFrameBase64] = useState<string | null>(null);
  const [isTranscodingVideo, setIsTranscodingVideo] = useState(false);
  const [transcodeProgress, setTranscodeProgress] = useState(0);
  const [transcodedVideoUrl, setTranscodedVideoUrl] = useState<string | null>(null);

  // General UI States
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const [copiedBase64, setCopiedBase64] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const cameraPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const cameraVideoInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (sourceDataUrl && sourceDataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(sourceDataUrl);
      }
      if (transcodedVideoUrl && transcodedVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(transcodedVideoUrl);
      }
    };
  }, [sourceDataUrl, transcodedVideoUrl]);

  // Handle incoming file (Image: JPG, PNG, WEBP; Video: MP4, MOV, WebM, etc.)
  const handleFile = (file: File) => {
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|mkv)$/i.test(file.name);

    if (!isImage && !isVideo) {
      setStatus({
        message: 'Unsupported format. Please select a JPG, PNG, WEBP image or an MP4, MOV, WebM video.',
        type: 'error'
      });
      return;
    }

    setSourceFile(file);
    setSourceFileName(file.name || (isImage ? 'Photo' : 'Video'));
    setSourceFileSize(file.size);
    setFileMimeType(file.type || (isImage ? 'image/jpeg' : 'video/mp4'));
    setFinalDataUrl(null);
    setPureBase64(null);
    setExtractedFrameUrl(null);
    setExtractedFrameBase64(null);
    setTranscodedVideoUrl(null);
    setStatus(null);

    if (isImage) {
      setSourceType('image');
      setActiveTab('image');
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSourceDataUrl(result);
      };
      reader.readAsDataURL(file);
    } else {
      setSourceType('video');
      setActiveTab('video');
      const url = URL.createObjectURL(file);
      setSourceDataUrl(url);

      // Extract raw video base64 in background for API payloads
      const reader = new FileReader();
      reader.onload = (e) => {
        const full = e.target?.result as string;
        if (full && full.includes(',')) {
          setPureBase64(full.split(',')[1]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Read EXIF orientation for JPG / PNG
  const readOrientation = (dataUrl: string): number => {
    try {
      if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
        const exif = piexif.load(dataUrl);
        return exif['0th']?.[piexif.ImageIFD.Orientation] || 1;
      }
      return 1;
    } catch {
      return 1;
    }
  };

  // Draw image with correct 3024 × 4032 aspect / transform (Supports PNG transparency background & orientation)
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

        // Fill crisp background for PNG transparency
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

        // Scale & center image preserving aspect ratio or fill target 3024 × 4032
        const imgRatio = img.width / img.height;
        const targetRatio = targetW / targetH;

        let drawW = targetW;
        let drawH = targetH;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > targetRatio) {
          drawW = targetH * imgRatio;
          offsetX = (targetW - drawW) / 2;
        } else {
          drawH = targetW / imgRatio;
          offsetY = (targetH - drawH) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  // Build authentic Ray-Ban Meta Gen 2 EXIF Header
  const buildExif = (dataUrl: string, width = 3024, height = 4032) => {
    let exif: any;
    try {
      if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
        exif = piexif.load(dataUrl);
      } else {
        exif = { '0th': {}, Exif: {}, GPS: {}, '1st': {}, thumbnail: null };
      }
    } catch {
      exif = { '0th': {}, Exif: {}, GPS: {}, '1st': {}, thumbnail: null };
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
    exif['Exif'][piexif.ExifIFD.PixelXDimension] = width;
    exif['Exif'][piexif.ExifIFD.PixelYDimension] = height;

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

  const saveOrShareFile = async (
    blobOrUrl: Blob | string,
    filename = 'meta-rayban-converted.jpg',
    mime = 'image/jpeg'
  ) => {
    let blob: Blob;
    if (typeof blobOrUrl === 'string') {
      if (blobOrUrl.startsWith('data:')) {
        blob = dataUrlToBlob(blobOrUrl);
      } else {
        const res = await fetch(blobOrUrl);
        blob = await res.blob();
      }
    } else {
      blob = blobOrUrl;
    }

    const file = new File([blob], filename, { type: mime });

    // 1. Mobile Web Share (Native Camera Roll / Save on iOS & Android)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Ray-Ban Meta Glasses Media',
          text: 'Converted Ray-Ban Meta Smart Glasses Media'
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

  // Convert Image (JPG/PNG/WEBP) -> 3024 × 4032 + Meta AI EXIF
  const handleConvertImageAllInOne = async () => {
    if (!sourceDataUrl) {
      imageInputRef.current?.click();
      return;
    }

    setIsProcessing(true);
    setStatus({
      message: 'Converting format (3024×4032) & injecting Ray-Ban Meta EXIF...',
      type: 'loading'
    });

    try {
      const orientation = readOrientation(sourceDataUrl);
      const corrected = await drawCorrected(sourceDataUrl, 3024, 4032, orientation);
      const exif = buildExif(sourceDataUrl, 3024, 4032);
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
      const result = await saveOrShareFile(inserted, `meta-rayban-${Date.now()}.jpg`, 'image/jpeg');

      if (result.method === 'share') {
        setStatus({
          message: 'Base64 copied & Share Sheet opened (Tap "Save Image" to keep in Camera Roll).',
          type: 'success'
        });
      } else {
        setStatus({
          message: 'Success! 3024×4032 Meta EXIF injected, Base64 copied & photo downloaded.',
          type: 'success'
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatus({
        message: err?.message || 'Conversion failed. Please try another image.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract Frame from Video at current timestamp & Inject Meta EXIF (3024 × 4032)
  const handleExtractVideoFrame = async () => {
    if (!videoRef.current || !sourceDataUrl) return;

    setIsProcessing(true);
    setStatus({
      message: `Extracting video frame at ${currentTime.toFixed(1)}s & scaling to 3024×4032...`,
      type: 'loading'
    });

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 3024;
      canvas.height = 4032;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context unavailable');

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scale video to 3024 × 4032 preserving aspect
      const vWidth = video.videoWidth || 1080;
      const vHeight = video.videoHeight || 1920;
      const vRatio = vWidth / vHeight;
      const targetRatio = 3024 / 4032;

      let drawW = 3024;
      let drawH = 4032;
      let offsetX = 0;
      let offsetY = 0;

      if (vRatio > targetRatio) {
        drawW = 4032 * vRatio;
        offsetX = (3024 - drawW) / 2;
      } else {
        drawH = 3024 / vRatio;
        offsetY = (4032 - drawH) / 2;
      }

      ctx.drawImage(video, offsetX, offsetY, drawW, drawH);
      const frameJpg = canvas.toDataURL('image/jpeg', 0.95);

      const exif = buildExif(frameJpg, 3024, 4032);
      const exifBytes = piexif.dump(exif);
      const inserted = piexif.insert(exifBytes, frameJpg);
      const b64 = inserted.split(',')[1];

      setExtractedFrameUrl(inserted);
      setExtractedFrameBase64(b64);

      // Copy frame Base64
      try {
        await navigator.clipboard.writeText(b64);
      } catch {}

      // Save / Share
      const result = await saveOrShareFile(
        inserted,
        `meta-rayban-frame-${Math.floor(currentTime * 1000)}ms.jpg`,
        'image/jpeg'
      );

      setStatus({
        message: 'Video frame captured, converted to 3024×4032 Ray-Ban Meta Photo & saved!',
        type: 'success'
      });
    } catch (err: any) {
      console.error(err);
      setStatus({
        message: err?.message || 'Failed to capture video frame.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Format / Transcode Video to Ray-Ban Meta 9:16 Portrait (1440 × 1920)
  const handleTranscodeVideoToMeta = async () => {
    if (!videoRef.current || !sourceDataUrl) return;

    const video = videoRef.current;
    setIsTranscodingVideo(true);
    setTranscodeProgress(0);
    setStatus({
      message: 'Formatting video into Ray-Ban Meta 9:16 Portrait stream...',
      type: 'loading'
    });

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920; // 9:16 Meta standard
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const stream = canvas.captureStream(30);

      // Capture audio from video element if available
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      } catch (e) {
        console.warn('Audio stream attach skipped:', e);
      }

      const mimeType = MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 6000000 // 6 Mbps HD
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        setTranscodedVideoUrl(videoUrl);
        setIsTranscodingVideo(false);

        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        await saveOrShareFile(blob, `meta-rayban-video-${Date.now()}.${ext}`, mimeType);

        setStatus({
          message: `Ray-Ban Meta 9:16 Video formatted successfully (${ext.toUpperCase()}) & saved!`,
          type: 'success'
        });
      };

      mediaRecorder.start(100);

      // Render loop
      video.currentTime = 0;
      await video.play();

      const renderInterval = setInterval(() => {
        if (video.ended || video.paused) {
          clearInterval(renderInterval);
          if (mediaRecorder.state === 'recording') mediaRecorder.stop();
          return;
        }

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw 9:16 scaled frame
        const vW = video.videoWidth || 1080;
        const vH = video.videoHeight || 1920;
        const ratio = vW / vH;
        const targetRatio = 1080 / 1920;

        let dW = 1080;
        let dH = 1920;
        let oX = 0;
        let oY = 0;

        if (ratio > targetRatio) {
          dW = 1920 * ratio;
          oX = (1080 - dW) / 2;
        } else {
          dH = 1080 / ratio;
          oY = (1920 - dH) / 2;
        }

        ctx.drawImage(video, oX, oY, dW, dH);

        if (video.duration) {
          setTranscodeProgress(Math.min(100, Math.round((video.currentTime / video.duration) * 100)));
        }
      }, 1000 / 30);
    } catch (err: any) {
      console.error(err);
      setIsTranscodingVideo(false);
      setStatus({
        message: err?.message || 'Video formatting failed.',
        type: 'error'
      });
    }
  };

  const handleCopyBase64 = async (b64ToCopy?: string | null) => {
    const target = b64ToCopy || pureBase64 || extractedFrameBase64;
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target);
      setCopiedBase64(true);
      setTimeout(() => setCopiedBase64(false), 2000);
      setStatus({
        message: 'Base64 payload copied to clipboard!',
        type: 'success'
      });
    } catch {
      setStatus({
        message: 'Clipboard access restricted by browser permissions.',
        type: 'error'
      });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-4 sm:p-6 font-sans">
      {/* Hidden File Inputs */}
      {/* 1. Photo Picker (JPG, PNG, WEBP) */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {/* 2. Photo Camera */}
      <input
        ref={cameraPhotoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {/* 3. Video Picker (MP4, MOV, WebM) */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/*,.mp4,.mov,.webm,.m4v,.mkv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {/* 4. Video Camera */}
      <input
        ref={cameraVideoInputRef}
        type="file"
        accept="video/*,.mp4,.mov"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {/* Main Glass Card */}
      <div className="bg-[#0e0e0e] border border-white/15 rounded-xs p-5 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold tracking-wide">
            <Glasses className="w-4 h-4 text-pink-400" />
            <span>Ray-Ban Meta Smart Glasses Hub</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase font-mono">
            DZt Meta RayBan
          </h1>

          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
            3024×4032 Photo & PNG Converter, Meta AI EXIF Injection, Base64 Vision Feeds, and 9:16 Video Frame Suite.
          </p>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex border-b border-white/10 p-1 bg-black/50 rounded-xs gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-2.5 px-3 rounded-xs font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-xs'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-pink-400" />
            <span>Photo Mode (JPG / PNG / WEBP)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-2.5 px-3 rounded-xs font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-purple-600/30 text-purple-400 border border-purple-500/40 shadow-xs'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Video className="w-4 h-4 text-cyan-400" />
            <span>Video Mode (MP4 / MOV / WebM)</span>
          </button>
        </div>

        {/* Quick Source Selectors */}
        {activeTab === 'image' ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraPhotoInputRef.current?.click()}
              className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xs flex flex-col items-center justify-center gap-1.5 text-white transition-all cursor-pointer group"
            >
              <Camera className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Take Photo</span>
              <span className="text-[10px] text-white/40 font-mono">Camera Capture</span>
            </button>

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 rounded-xs flex flex-col items-center justify-center gap-1.5 text-white transition-all cursor-pointer group"
            >
              <ImageIcon className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">JPG / PNG Photo</span>
              <span className="text-[10px] text-white/40 font-mono">Photo Library</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraVideoInputRef.current?.click()}
              className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-xs flex flex-col items-center justify-center gap-1.5 text-white transition-all cursor-pointer group"
            >
              <Camera className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Record Video</span>
              <span className="text-[10px] text-white/40 font-mono">9:16 Video Record</span>
            </button>

            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-xs flex flex-col items-center justify-center gap-1.5 text-white transition-all cursor-pointer group"
            >
              <Film className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Video File</span>
              <span className="text-[10px] text-white/40 font-mono">MP4 / MOV / WebM</span>
            </button>
          </div>
        )}

        {/* Universal Drop Zone */}
        <div
          onClick={() => {
            if (activeTab === 'image') imageInputRef.current?.click();
            else videoInputRef.current?.click();
          }}
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
          className={`border-2 border-dashed rounded-xs p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-white/20 bg-black/40 hover:border-white/40 hover:bg-black/60'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <Sparkles className="w-7 h-7 text-cyan-400 animate-pulse" />
            <p className="font-mono font-bold text-sm text-white">
              {sourceFileName || `Tap or Drop ${activeTab === 'image' ? 'JPG / PNG Photo' : 'Video (MP4 / MOV)'} to Convert`}
            </p>
            <p className="text-xs text-white/50 font-mono">
              {sourceFileSize > 0
                ? `${(sourceFileSize / (1024 * 1024)).toFixed(2)} MB • ${fileMimeType} ready`
                : activeTab === 'image'
                ? 'Supports JPG, JPEG, PNG (with transparency), WEBP'
                : 'Supports MP4, MOV, WebM with frame extraction'}
            </p>
          </div>
        </div>

        {/* PHOTO PREVIEW & ACTIONS */}
        {activeTab === 'image' && sourceDataUrl && sourceType === 'image' && (
          <div className="space-y-4">
            <div className="relative rounded-xs overflow-hidden border border-white/15 bg-black">
              <img
                src={finalDataUrl || sourceDataUrl}
                alt="RayBan Meta Preview"
                className="w-full max-h-80 object-contain mx-auto select-all"
              />
              <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-xs border border-white/20 px-2.5 py-1 rounded-xs text-[11px] font-mono text-cyan-400 font-bold">
                {finalDataUrl ? '3024×4032 EXIF Injected' : `${fileMimeType.split('/')[1]?.toUpperCase() || 'IMAGE'} Ready`}
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xs text-white/80 text-[10px] font-mono px-3 py-1 rounded-full pointer-events-none">
                📱 Tap & hold image to save to photos
              </div>
            </div>

            {/* Photo Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleConvertImageAllInOne}
                disabled={isProcessing}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-mono font-bold text-sm uppercase tracking-widest rounded-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing 3024×4032 & Meta EXIF...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>⚡ ALL-IN-ONE CONVERT & SAVE (3024×4032)</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleCopyBase64()}
                  disabled={!pureBase64 || isProcessing}
                  className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {copiedBase64 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                  <span>{copiedBase64 ? 'Copied' : 'Copy Base64'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (finalDataUrl) saveOrShareFile(finalDataUrl, `meta-rayban-${Date.now()}.jpg`, 'image/jpeg');
                  }}
                  disabled={!finalDataUrl || isProcessing}
                  className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-4 h-4 text-pink-400" />
                  <span>Save / Share</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIDEO PREVIEW & ACTIONS */}
        {activeTab === 'video' && sourceDataUrl && sourceType === 'video' && (
          <div className="space-y-4">
            <div className="relative rounded-xs overflow-hidden border border-white/15 bg-black flex flex-col items-center">
              <video
                ref={videoRef}
                src={sourceDataUrl}
                playsInline
                muted={isMuted}
                onLoadedMetadata={(e) => {
                  const target = e.currentTarget;
                  setVideoDuration(target.duration || 0);
                  setVideoDimensions({ width: target.videoWidth, height: target.videoHeight });
                }}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full max-h-80 object-contain mx-auto bg-black"
              />

              {/* Video Player Controls Bar */}
              <div className="w-full bg-[#121212] border-t border-white/10 p-3 flex items-center gap-3 font-mono text-xs text-white">
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      if (isPlaying) videoRef.current.pause();
                      else videoRef.current.play();
                    }
                  }}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xs text-cyan-400 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <input
                  type="range"
                  min="0"
                  max={videoDuration || 100}
                  step="0.05"
                  value={currentTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setCurrentTime(val);
                    if (videoRef.current) videoRef.current.currentTime = val;
                  }}
                  className="flex-1 accent-cyan-400 cursor-pointer"
                />

                <span className="text-[11px] text-white/70 whitespace-nowrap">
                  {currentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
                </span>

                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xs text-white/70 hover:text-white cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-xs border border-white/20 px-2.5 py-1 rounded-xs text-[11px] font-mono text-purple-400 font-bold">
                {videoDimensions.width} × {videoDimensions.height} px
              </div>
            </div>

            {/* Video Suite Actions */}
            <div className="space-y-3">
              {/* 1-Tap Video Frame -> 3024×4032 Photo with Meta EXIF */}
              <button
                type="button"
                onClick={handleExtractVideoFrame}
                disabled={isProcessing || isTranscodingVideo}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting & Injecting Meta EXIF...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Capture Frame as Meta RayBan Photo (3024×4032)</span>
                  </>
                )}
              </button>

              {/* Sub-actions for video */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleTranscodeVideoToMeta}
                  disabled={isTranscodingVideo || isProcessing}
                  className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Film className="w-4 h-4 text-cyan-400" />
                  <span>
                    {isTranscodingVideo ? `Formatting ${transcodeProgress}%` : 'Format 9:16 Video'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyBase64(pureBase64)}
                  disabled={!pureBase64}
                  className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {copiedBase64 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
                  <span>{copiedBase64 ? 'Copied' : 'Copy Video B64'}</span>
                </button>
              </div>

              {/* Extracted Frame Preview if ready */}
              {extractedFrameUrl && (
                <div className="p-3 bg-black/60 border border-emerald-500/30 rounded-xs flex items-center gap-3">
                  <img
                    src={extractedFrameUrl}
                    alt="Extracted Frame"
                    className="w-12 h-16 object-cover rounded-xs border border-white/20"
                  />
                  <div className="flex-1 font-mono text-xs">
                    <p className="text-emerald-400 font-bold">Frame Injected (3024×4032)</p>
                    <p className="text-white/50 text-[10px]">Ray-Ban Meta 2 EXIF Model Attached</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveOrShareFile(extractedFrameUrl, `meta-rayban-frame.jpg`, 'image/jpeg')}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xs"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 font-mono">
          <div className="p-2.5 bg-black/60 border border-white/10 rounded-xs space-y-1">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block">Photo Spec</span>
            <span className="text-xs text-cyan-300 font-bold">3024 × 4032 (3:4)</span>
          </div>
          <div className="p-2.5 bg-black/60 border border-white/10 rounded-xs space-y-1">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block">Video Spec</span>
            <span className="text-xs text-purple-300 font-bold">1440 × 1920 (9:16)</span>
          </div>
          <div className="p-2.5 bg-black/60 border border-white/10 rounded-xs space-y-1">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block">Supported Media</span>
            <span className="text-xs text-pink-300 font-bold">JPG, PNG, MP4, MOV</span>
          </div>
          <div className="p-2.5 bg-black/60 border border-white/10 rounded-xs space-y-1">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block">Model EXIF</span>
            <span className="text-xs text-emerald-300 font-bold">Ray-Ban Meta 2</span>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-white/40 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Client-Side. Photos, PNGs & Videos are processed directly in your local browser sandbox.</span>
        </div>
      </div>
    </div>
  );
}
