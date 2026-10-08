import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Video,
  Sliders,
  RotateCcw,
  Download,
  CheckCircle2,
  ScanSearch,
  ZoomIn,
  Layers,
  Info,
  AlertTriangle,
  Wand2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  WatermarkEngine,
  VideoWatermarkEngine,
  WatermarkBox,
  TunerSettings,
  DetectionResult,
  cleanFrame,
  getAdaptiveImagePreset,
  getAdaptiveVideoPreset,
  detectWatermarkCandidate,
  detectVideoWatermarkCandidate,
  grabImageFrame,
  grabVideoPreviewFrame,
} from '../utils/watermarkEngine';

interface WatermarkRemoverAppProps {
  onBack?: () => void;
}

export default function WatermarkRemoverApp({ onBack }: WatermarkRemoverAppProps) {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');

  // Engines
  const watermarkEngineRef = useRef<WatermarkEngine | null>(null);
  const videoEngineRef = useRef<VideoWatermarkEngine | null>(null);

  // Image State
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgFrame, setImgFrame] = useState<{ width: number; height: number; imageData: ImageData } | null>(null);
  const [imgBase, setImgBase] = useState<WatermarkBox | null>(null);
  const [imgBitmap, setImgBitmap] = useState<ImageBitmap | null>(null);
  const [imgDetected, setImgDetected] = useState<DetectionResult | null>(null);
  const [imgPreset, setImgPreset] = useState<'new' | 'classic'>('new');
  const [imgSettings, setImgSettings] = useState<TunerSettings>({
    gain: 0.6,
    offsetX: -128,
    offsetY: -128,
    sizeScale: 1.0,
  });
  const [isImgLoading, setIsImgLoading] = useState(false);
  const [imgExportResult, setImgExportResult] = useState<{
    originalUrl: string;
    cleanedUrl: string;
    width: number;
    height: number;
    fileName: string;
  } | null>(null);
  const [imgDragOver, setImgDragOver] = useState(false);

  // Video State
  const [vidFile, setVidFile] = useState<File | null>(null);
  const [vidFrame, setVidFrame] = useState<{ width: number; height: number; imageData: ImageData } | null>(null);
  const [vidBase, setVidBase] = useState<WatermarkBox | null>(null);
  const [vidBitmap, setVidBitmap] = useState<ImageBitmap | null>(null);
  const [vidDetected, setVidDetected] = useState<DetectionResult | null>(null);
  const [vidPreset, setVidPreset] = useState<'veo' | 'corner' | 'sparkle'>('veo');
  const [vidSettings, setVidSettings] = useState<TunerSettings>({
    gain: 0.6,
    offsetX: -24,
    offsetY: -24,
    sizeScale: 1.0,
  });
  const [isVidLoading, setIsVidLoading] = useState(false);
  const [isVidEncoding, setIsVidEncoding] = useState(false);
  const [vidProgress, setVidProgress] = useState(0);
  const [vidError, setVidError] = useState<string | null>(null);
  const [vidExportResult, setVidExportResult] = useState<{
    originalUrl: string;
    cleanedUrl: string;
    width: number;
    height: number;
    fileName: string;
  } | null>(null);
  const [vidDragOver, setVidDragOver] = useState(false);

  // Canvas Refs - Image
  const imgMainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgZoomOrigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgZoomCleanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgInputRef = useRef<HTMLInputElement | null>(null);

  // Canvas Refs - Video
  const vidMainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const vidZoomOrigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const vidZoomCleanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const vidInputRef = useRef<HTMLInputElement | null>(null);

  const ensureImageEngine = async () => {
    if (!watermarkEngineRef.current) {
      watermarkEngineRef.current = await WatermarkEngine.create();
    }
    return watermarkEngineRef.current;
  };

  const ensureVideoEngine = async () => {
    if (!videoEngineRef.current) {
      videoEngineRef.current = await VideoWatermarkEngine.create();
    }
    return videoEngineRef.current;
  };

  // Render Image Tuner Canvases
  const renderImageTuner = useCallback(() => {
    const engine = watermarkEngineRef.current;
    const mainCanvas = imgMainCanvasRef.current;
    const zoomOrigCanvas = imgZoomOrigCanvasRef.current;
    const zoomCleanCanvas = imgZoomCleanCanvasRef.current;
    if (!imgFrame || !imgBase || !engine || !mainCanvas) return;

    const { width, height, imageData } = imgFrame;
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const copy = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
    const { wm, roi } = cleanFrame(engine.bg96, copy, width, height, imgBase, imgSettings);
    offscreen.getContext('2d')!.putImageData(copy, 0, 0);

    const maxW = 380;
    const scale = Math.min(1, maxW / width);
    mainCanvas.width = Math.round(width * scale);
    mainCanvas.height = Math.round(height * scale);
    const mctx = mainCanvas.getContext('2d')!;
    mctx.drawImage(offscreen, 0, 0, mainCanvas.width, mainCanvas.height);
    mctx.strokeStyle = '#22d3ee';
    mctx.lineWidth = 2;
    mctx.strokeRect(wm.x * scale, wm.y * scale, wm.width * scale, wm.height * scale);

    if (zoomOrigCanvas && imgBitmap) {
      const zctx = zoomOrigCanvas.getContext('2d')!;
      zctx.imageSmoothingEnabled = false;
      zctx.clearRect(0, 0, zoomOrigCanvas.width, zoomOrigCanvas.height);
      zctx.drawImage(imgBitmap, roi.x, roi.y, roi.width, roi.height, 0, 0, zoomOrigCanvas.width, zoomOrigCanvas.height);
      const sx = zoomOrigCanvas.width / roi.width;
      const sy = zoomOrigCanvas.height / roi.height;
      zctx.strokeStyle = '#38bdf8';
      zctx.lineWidth = 2;
      zctx.strokeRect((wm.x - roi.x) * sx, (wm.y - roi.y) * sy, wm.width * sx, wm.height * sy);
    }

    if (zoomCleanCanvas) {
      const zctx = zoomCleanCanvas.getContext('2d')!;
      zctx.imageSmoothingEnabled = false;
      zctx.clearRect(0, 0, zoomCleanCanvas.width, zoomCleanCanvas.height);
      zctx.drawImage(offscreen, roi.x, roi.y, roi.width, roi.height, 0, 0, zoomCleanCanvas.width, zoomCleanCanvas.height);
      const sx = zoomCleanCanvas.width / roi.width;
      const sy = zoomCleanCanvas.height / roi.height;
      zctx.strokeStyle = '#34d399';
      zctx.lineWidth = 2;
      zctx.strokeRect((wm.x - roi.x) * sx, (wm.y - roi.y) * sy, wm.width * sx, wm.height * sy);
    }
  }, [imgFrame, imgBase, imgSettings, imgBitmap]);

  useEffect(() => {
    if (activeTab === 'image' && imgFrame) {
      renderImageTuner();
    }
  }, [activeTab, imgFrame, imgSettings, renderImageTuner]);

  // Render Video Tuner Canvases
  const renderVideoTuner = useCallback(() => {
    const engine = videoEngineRef.current;
    const mainCanvas = vidMainCanvasRef.current;
    const zoomOrigCanvas = vidZoomOrigCanvasRef.current;
    const zoomCleanCanvas = vidZoomCleanCanvasRef.current;
    if (!vidFrame || !vidBase || !engine || !mainCanvas) return;

    const { width, height, imageData } = vidFrame;
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const copy = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
    const { wm, roi } = cleanFrame(engine.sparkleImage, copy, width, height, vidBase, vidSettings);
    offscreen.getContext('2d')!.putImageData(copy, 0, 0);

    const maxW = 380;
    const scale = Math.min(1, maxW / width);
    mainCanvas.width = Math.round(width * scale);
    mainCanvas.height = Math.round(height * scale);
    const mctx = mainCanvas.getContext('2d')!;
    mctx.drawImage(offscreen, 0, 0, mainCanvas.width, mainCanvas.height);
    mctx.strokeStyle = '#22d3ee';
    mctx.lineWidth = 2;
    mctx.strokeRect(wm.x * scale, wm.y * scale, wm.width * scale, wm.height * scale);

    if (zoomOrigCanvas && vidBitmap) {
      const zctx = zoomOrigCanvas.getContext('2d')!;
      zctx.imageSmoothingEnabled = false;
      zctx.clearRect(0, 0, zoomOrigCanvas.width, zoomOrigCanvas.height);
      zctx.drawImage(vidBitmap, roi.x, roi.y, roi.width, roi.height, 0, 0, zoomOrigCanvas.width, zoomOrigCanvas.height);
      const sx = zoomOrigCanvas.width / roi.width;
      const sy = zoomOrigCanvas.height / roi.height;
      zctx.strokeStyle = '#38bdf8';
      zctx.lineWidth = 2;
      zctx.strokeRect((wm.x - roi.x) * sx, (wm.y - roi.y) * sy, wm.width * sx, wm.height * sy);
    }

    if (zoomCleanCanvas) {
      const zctx = zoomCleanCanvas.getContext('2d')!;
      zctx.imageSmoothingEnabled = false;
      zctx.clearRect(0, 0, zoomCleanCanvas.width, zoomCleanCanvas.height);
      zctx.drawImage(offscreen, roi.x, roi.y, roi.width, roi.height, 0, 0, zoomCleanCanvas.width, zoomCleanCanvas.height);
      const sx = zoomCleanCanvas.width / roi.width;
      const sy = zoomCleanCanvas.height / roi.height;
      zctx.strokeStyle = '#34d399';
      zctx.lineWidth = 2;
      zctx.strokeRect((wm.x - roi.x) * sx, (wm.y - roi.y) * sy, wm.width * sx, wm.height * sy);
    }
  }, [vidFrame, vidBase, vidSettings, vidBitmap]);

  useEffect(() => {
    if (activeTab === 'video' && vidFrame) {
      renderVideoTuner();
    }
  }, [activeTab, vidFrame, vidSettings, renderVideoTuner]);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsImgLoading(true);
    setImgExportResult(null);
    setImgFile(file);

    try {
      const engine = await ensureImageEngine();
      const frame = await grabImageFrame(file);
      const base = engine.getWatermarkInfo(frame.width, frame.height);
      if (imgBitmap) imgBitmap.close();
      const bmp = await createImageBitmap(frame.imageData);

      const detected = detectWatermarkCandidate(frame.imageData, frame.width, frame.height, engine.bg96);

      setImgFrame(frame);
      setImgBase(base);
      setImgBitmap(bmp);
      setImgDetected(detected);
      setImgPreset((detected.presetKey as 'new' | 'classic') || 'new');
      setImgSettings({
        gain: detected.gain,
        offsetX: detected.offsetX,
        offsetY: detected.offsetY,
        sizeScale: detected.sizeScale,
      });
    } catch (e) {
      console.error('Image processing error:', e);
    } finally {
      setIsImgLoading(false);
    }
  };

  const handleLoadSampleImage = async () => {
    setIsImgLoading(true);
    try {
      const res = await fetch('/watermark/before.webp');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'gemini_sample_watermarked.webp', { type: 'image/webp' });
      await handleImageUpload(sampleFile);
    } catch (e) {
      console.error('Failed to load sample image:', e);
      setIsImgLoading(false);
    }
  };

  const handleSelectImagePreset = (presetKey: 'new' | 'classic') => {
    setImgPreset(presetKey);
    const w = imgFrame ? imgFrame.width : 1536;
    const h = imgFrame ? imgFrame.height : 1536;
    const p = getAdaptiveImagePreset(presetKey, w, h);
    setImgSettings(p);
  };

  const handleResetImageSliders = () => {
    if (imgDetected) {
      setImgPreset((imgDetected.presetKey as 'new' | 'classic') || 'new');
      setImgSettings({
        gain: imgDetected.gain,
        offsetX: imgDetected.offsetX,
        offsetY: imgDetected.offsetY,
        sizeScale: imgDetected.sizeScale,
      });
    } else {
      handleSelectImagePreset('new');
    }
  };

  const handleExportImage = async () => {
    if (!imgFile || !imgFrame || !imgBase || !watermarkEngineRef.current) return;
    const { width, height, imageData } = imgFrame;
    const copy = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
    cleanFrame(watermarkEngineRef.current.bg96, copy, width, height, imgBase, imgSettings);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.putImageData(copy, 0, 0);

    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
    if (!blob) return;

    const originalUrl = URL.createObjectURL(imgFile);
    const cleanedUrl = URL.createObjectURL(blob);
    const cleanName = imgFile.name.replace(/\.[^.]+$/, '') + '.png';

    setImgExportResult({
      originalUrl,
      cleanedUrl,
      width,
      height,
      fileName: `clean_${cleanName}`,
    });
  };

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) return;
    setIsVidLoading(true);
    setVidError(null);
    setVidExportResult(null);
    setVidFile(file);

    try {
      const engine = await ensureVideoEngine();
      const frame = await grabVideoPreviewFrame(file);
      const base = engine.getVeoWatermark(frame.width, frame.height);
      if (vidBitmap) vidBitmap.close();
      const bmp = await createImageBitmap(frame.imageData);

      const detected = detectVideoWatermarkCandidate(frame.imageData, frame.width, frame.height, engine.sparkleImage);

      setVidFrame(frame);
      setVidBase(base);
      setVidBitmap(bmp);
      setVidDetected(detected);
      setVidPreset((detected.presetKey as 'veo' | 'corner' | 'sparkle') || 'veo');
      setVidSettings({
        gain: detected.gain,
        offsetX: detected.offsetX,
        offsetY: detected.offsetY,
        sizeScale: detected.sizeScale,
      });
    } catch (e: any) {
      console.error('Video frame extraction error:', e);
      setVidError(e?.message || 'Could not extract a preview frame from this video.');
    } finally {
      setIsVidLoading(false);
    }
  };

  const handleSelectVideoPreset = (presetKey: 'veo' | 'corner' | 'sparkle') => {
    setVidPreset(presetKey);
    const w = vidFrame ? vidFrame.width : 720;
    const h = vidFrame ? vidFrame.height : 720;
    const p = getAdaptiveVideoPreset(presetKey, w, h);
    setVidSettings(p);
  };

  const handleResetVideoSliders = () => {
    if (vidDetected) {
      setVidPreset((vidDetected.presetKey as 'veo' | 'corner' | 'sparkle') || 'veo');
      setVidSettings({
        gain: vidDetected.gain,
        offsetX: vidDetected.offsetX,
        offsetY: vidDetected.offsetY,
        sizeScale: vidDetected.sizeScale,
      });
    } else {
      handleSelectVideoPreset('veo');
    }
  };

  const handleExportVideo = async () => {
    if (!vidFile || !videoEngineRef.current) return;
    setIsVidEncoding(true);
    setVidProgress(0);
    setVidError(null);
    setVidExportResult(null);

    try {
      const res = await videoEngineRef.current.process(vidFile, {
        ...vidSettings,
        onProgress: ({ progress }) => {
          setVidProgress(Math.round(progress * 100));
        },
      });
      const cleanName = vidFile.name.replace(/\.[^.]+$/, '') + '.mp4';
      setVidExportResult({
        originalUrl: res.originalUrl,
        cleanedUrl: res.url,
        width: res.width,
        height: res.height,
        fileName: `clean_${cleanName}`,
      });
    } catch (e: any) {
      console.error('Video processing failed:', e);
      setVidError(e?.message || 'Video processing failed. Please ensure your browser supports WebCodecs H.264.');
    } finally {
      setIsVidEncoding(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/15 p-6 sm:p-8 space-y-8 rounded-xs">
      {/* Header */}
      <div className="border-b border-white/10 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mathematical Reverse-Alpha Unblending Engine • 100% Client-Side</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold uppercase text-white font-mono tracking-tight">
            Gemini, Flow &amp; Veo Watermark Remover
          </h2>
          <p className="text-xs text-gray-400 font-sans max-w-2xl">
            Remove visible Google Gemini, Imagen 3, Nano Banana, Gemini Omni, Google Flow, and Veo 3 watermarks with zero quality loss. Restores exact pixel colors mathematically without blurry AI inpainting.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-black/60 border border-white/15 p-1 rounded-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-2xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'image'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image Remover</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-2xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'video'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Remover (Veo/Flow)</span>
          </button>
        </div>
      </div>

      {/* ================= IMAGE REMOVER PANEL ================= */}
      {activeTab === 'image' && (
        <div className="space-y-6">
          {/* Upload Dropzone + Quick Sample Button */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div
              onClick={() => !isImgLoading && imgInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (!isImgLoading) setImgDragOver(true);
              }}
              onDragLeave={() => setImgDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setImgDragOver(false);
                if (!isImgLoading && e.dataTransfer.files.length) {
                  handleImageUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`lg:col-span-3 border-2 border-dashed rounded-xs p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                imgDragOver
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-white/20 bg-black/40 hover:border-white/40 hover:bg-white/[0.02]'
              }`}
            >
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleImageUpload(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
              />
              {isImgLoading ? (
                <>
                  <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
                  <p className="text-sm font-mono font-bold text-cyan-300 uppercase">
                    Processing &amp; Detecting Watermark...
                  </p>
                  <p className="text-xs font-mono text-white/40">
                    Running multi-scale NCC &amp; gradient edge analysis...
                  </p>
                </>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-xs bg-white/5 border border-white/15 flex items-center justify-center text-cyan-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-mono font-bold text-white uppercase">
                    {imgFile ? `Loaded: ${imgFile.name} (Click or Drop to Replace)` : 'Upload or Drag Your Gemini / Nano Banana Image'}
                  </p>
                  <p className="text-xs font-mono text-white/40">
                    Supports PNG, JPG, WebP • 100% Local Browser Processing
                  </p>
                </>
              )}
            </div>

            {/* 1-Click Sample Watermarked Image Loader */}
            <div className="bg-black/50 border border-white/15 p-5 rounded-xs flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                  Instant Demo Test
                </span>
                <h3 className="text-xs font-mono font-bold text-white uppercase">
                  Don't have a watermarked photo handy?
                </h3>
                <p className="text-[11px] text-white/50 font-sans leading-relaxed">
                  Load the calibrated Gemini sample image to test auto-detection, live zoom alignment, and pixel-perfect unblending immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadSampleImage}
                disabled={isImgLoading}
                className="w-full py-2.5 px-3 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Load Sample Image</span>
              </button>
            </div>
          </div>

          {/* Live Image Tuner */}
          {imgFrame && (
            <div className="bg-black/50 border border-white/15 p-6 rounded-xs space-y-6">
              {/* Auto-Detection Status Banner */}
              {imgDetected && (
                <div
                  className={`p-3.5 rounded-xs border flex flex-wrap items-center justify-between gap-3 font-mono text-xs ${
                    imgDetected.matchFound
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ScanSearch className="w-4 h-4 shrink-0" />
                    <span>
                      {imgDetected.matchFound ? (
                        <>
                          Auto-Detected: <strong className="text-white">{imgDetected.name}</strong> (
                          {Math.round(imgDetected.score * 100)}% NCC Confidence)
                        </>
                      ) : (
                        <>Standard Preset Applied: {imgDetected.name}</>
                      )}
                    </span>
                  </div>
                  <span className="text-[11px] text-white/50 tabular-nums">
                    Resolution: {imgFrame.width} × {imgFrame.height}px
                  </span>
                </div>
              )}

              {/* 3-Canvas Preview Row (Full Frame + Dual Zoomed Comparison) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Full Frame Preview */}
                <div className="lg:col-span-5 bg-[#060606] border border-white/10 p-4 rounded-xs space-y-2.5 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between text-[11px] font-mono text-white/60">
                    <span>Preview (Full Frame)</span>
                    <span className="text-cyan-400">Active ROI Box</span>
                  </div>
                  <div className="w-full flex items-center justify-center bg-black/80 border border-white/5 p-2 rounded-2xs min-h-[220px]">
                    <canvas ref={imgMainCanvasRef} className="max-w-full h-auto rounded-2xs" />
                  </div>
                </div>

                {/* Dual Zoomed Comparison */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#060606] border border-white/10 p-4 rounded-xs space-y-2.5 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between text-[11px] font-mono">
                      <span className="text-sky-400 font-bold flex items-center gap-1.5">
                        <ZoomIn className="w-3.5 h-3.5" /> Zoomed Original Corner
                      </span>
                      <span className="text-white/40">Before</span>
                    </div>
                    <div className="bg-black border border-white/10 p-2 rounded-2xs">
                      <canvas ref={imgZoomOrigCanvasRef} width={220} height={220} className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px]" />
                    </div>
                  </div>

                  <div className="bg-[#060606] border border-emerald-500/20 p-4 rounded-xs space-y-2.5 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between text-[11px] font-mono">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Zoomed Cleaned Corner
                      </span>
                      <span className="text-emerald-400/60">Live Unblended</span>
                    </div>
                    <div className="bg-black border border-emerald-500/20 p-2 rounded-2xs">
                      <canvas ref={imgZoomCleanCanvasRef} width={220} height={220} className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Model Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                <span className="text-xs font-mono text-white/50 uppercase mr-2">Model Preset:</span>
                <button
                  type="button"
                  onClick={() => handleSelectImagePreset('new')}
                  className={`px-3.5 py-2 text-xs font-mono rounded-xs border transition-all cursor-pointer whitespace-nowrap ${
                    imgPreset === 'new'
                      ? 'bg-white text-black font-bold border-white'
                      : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
                  }`}
                >
                  Gemini &amp; Nano Banana (Adaptive Inset)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectImagePreset('classic')}
                  className={`px-3.5 py-2 text-xs font-mono rounded-xs border transition-all cursor-pointer whitespace-nowrap ${
                    imgPreset === 'classic'
                      ? 'bg-white text-black font-bold border-white'
                      : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
                  }`}
                >
                  Classic Corner (Standard)
                </button>
              </div>

              {/* 4 Precision Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 font-mono text-xs">
                <div className="space-y-1.5 bg-white/[0.02] border border-white/10 p-3.5 rounded-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60 uppercase text-[10px]">Strength (Gain)</span>
                    <span className="text-cyan-300 font-bold tabular-nums">{imgSettings.gain.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.05"
                    value={imgSettings.gain}
                    onChange={(e) => setImgSettings({ ...imgSettings, gain: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 bg-white/[0.02] border border-white/10 p-3.5 rounded-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60 uppercase text-[10px]">Size Scale</span>
                    <span className="text-cyan-300 font-bold tabular-nums">{imgSettings.sizeScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={imgSettings.sizeScale}
                    onChange={(e) => setImgSettings({ ...imgSettings, sizeScale: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 bg-white/[0.02] border border-white/10 p-3.5 rounded-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60 uppercase text-[10px]">Position X Offset</span>
                    <span className="text-cyan-300 font-bold tabular-nums">{imgSettings.offsetX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-500"
                    max="500"
                    step="1"
                    value={imgSettings.offsetX}
                    onChange={(e) => setImgSettings({ ...imgSettings, offsetX: parseInt(e.target.value, 10) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 bg-white/[0.02] border border-white/10 p-3.5 rounded-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60 uppercase text-[10px]">Position Y Offset</span>
                    <span className="text-cyan-300 font-bold tabular-nums">{imgSettings.offsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-500"
                    max="500"
                    step="1"
                    value={imgSettings.offsetY}
                    onChange={(e) => setImgSettings({ ...imgSettings, offsetY: parseInt(e.target.value, 10) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleResetImageSliders}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono rounded-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Auto-Detected</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportImage}
                  className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold uppercase tracking-wider rounded-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Remove &amp; Export Lossless PNG</span>
                </button>
              </div>
            </div>
          )}

          {/* Exported Image Result Card */}
          {imgExportResult && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-6 rounded-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-mono font-bold text-white uppercase">
                      Image Watermark Cleaned Successfully!
                    </h3>
                    <p className="text-xs font-mono text-emerald-300/80">
                      Full Resolution ({imgExportResult.width} × {imgExportResult.height}px) • Lossless PNG
                    </p>
                  </div>
                </div>
                <a
                  href={imgExportResult.cleanedUrl}
                  download={imgExportResult.fileName}
                  className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Cleaned PNG</span>
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/60 border border-white/10 p-3 rounded-xs space-y-2">
                  <span className="text-[11px] font-mono text-white/50 uppercase block">
                    Original ({imgExportResult.width}×{imgExportResult.height}px)
                  </span>
                  <img
                    src={imgExportResult.originalUrl}
                    alt="Original watermarked image"
                    referrerPolicy="no-referrer"
                    className="max-h-72 w-full object-contain mx-auto rounded-2xs"
                  />
                </div>
                <div className="bg-black/60 border border-emerald-500/30 p-3 rounded-xs space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase block">
                    Cleaned Result (Zero Blur Alpha Unblended)
                  </span>
                  <img
                    src={imgExportResult.cleanedUrl}
                    alt="Cleaned watermark-free result"
                    referrerPolicy="no-referrer"
                    className="max-h-72 w-full object-contain mx-auto rounded-2xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= VIDEO REMOVER PANEL ================= */}
      {activeTab === 'video' && (
        <div className="space-y-6">
          <div
            onClick={() => !isVidLoading && !isVidEncoding && vidInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isVidLoading && !isVidEncoding) setVidDragOver(true);
            }}
            onDragLeave={() => setVidDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setVidDragOver(false);
              if (!isVidLoading && !isVidEncoding && e.dataTransfer.files.length) {
                handleVideoUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-xs p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
              vidDragOver
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-white/20 bg-black/40 hover:border-white/40 hover:bg-white/[0.02]'
            }`}
          >
            <input
              ref={vidInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleVideoUpload(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />
            {isVidLoading ? (
              <>
                <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
                <p className="text-sm font-mono font-bold text-cyan-300 uppercase">
                  Extracting Best Frame &amp; Auto-Detecting Watermark...
                </p>
                <p className="text-xs font-mono text-white/40">
                  Scanning video frames for Gemini Omni / Google Flow / Veo 3 watermark mask...
                </p>
              </>
            ) : (
              <>
                <div className="w-11 h-11 rounded-xs bg-white/5 border border-white/15 flex items-center justify-center text-cyan-400">
                  <Video className="w-5 h-5" />
                </div>
                <p className="text-sm font-mono font-bold text-white uppercase">
                  {vidFile
                    ? `Loaded: ${vidFile.name} (Click or Drop to Replace)`
                    : 'Upload or Drag a Gemini Omni, Google Flow, or Veo 3 Video'}
                </p>
                <p className="text-xs font-mono text-white/40">
                  Supports MP4, WebM, MOV • WebCodecs Hardware-Accelerated H.264 Export with Audio Preservation
                </p>
              </>
            )}
          </div>

          {vidError && (
            <div className="bg-rose-950/30 border border-rose-500/40 p-4 rounded-xs flex items-center gap-3 text-xs font-mono text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{vidError}</span>
            </div>
          )}

          {/* Live Video Tuner */}
          {vidFrame && !isVidEncoding && (
            <div className="bg-black/50 border border-white/15 p-6 rounded-xs space-y-6">
              {vidDetected && (
                <div
                  className={`p-3.5 rounded-xs border flex flex-wrap items-center justify-between gap-3 font-mono text-xs ${
                    vidDetected.matchFound
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ScanSearch className="w-4 h-4 shrink-0" />
                    <span>
                      {vidDetected.matchFound ? (
                        <>
                          Auto-Detected: <strong className="text-white">{vidDetected.name}</strong> (
                          {Math.round(vidDetected.score * 100)}% Match)
                        </>
                      ) : (
                        <>Standard Video Preset Applied: {vidDetected.name}</>
                      )}
                    </span>
                  </div>
                  <span className="text-[11px] text-white/50 tabular-nums">
                    Video Frame: {vidFrame.width} × {vidFrame.height}px
                  </span>
                </div>
              )}

              {/* 3-Canvas Video Preview Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-5 bg-[#060606] border border-white/10 p-4 rounded-xs space-y-2.5 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between text-[11px] font-mono text-white/60">
                    <span>Preview (Extracted Frame)</span>
                    <span className="text-cyan-400">Active ROI Box</span>
                  </div>
                  <div className="w-full flex items-center justify-center bg-black/80 border border-white/5 p-2 rounded-2xs min-h-[220px]">
                    <canvas ref={vidMainCanvasRef} className="max-w-full h-auto rounded-2xs" />
                  </div>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#060606] border border-white/10 p-4 rounded-xs space-y-2.5 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between text-[11px] font-mono">
                      <span className="text-sky-400 font-bold flex items-center gap-1.5">
                        <ZoomIn className="w-3.5 h-3.5" /> Zoomed Original
                      </span>
                      <span className="text-white/40">Before</span>
                    </div>
                    <div className="bg-black border border-white/10 p-2 rounded-2xs">
                      <canvas ref={vidZoomOrigCanvasRef} width={220} height={220} className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px]" />
                    </div>
                  </div>

                  <div className="bg-[#060606] border border-emerald-500/20 p-4 rounded-xs space-y-2.5 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between text-[11px] font-mono">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Zoomed Cleaned
                      </span>
                      <span className="text-emerald-400/60">Unblended</span>
                    </div>
                    <div className="bg-black border border-emerald-500/20 p-2 rounded-2xs">
                      <canvas ref={vidZoomCleanCanvasRef} width={220} height={220} className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Model Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                <span className="text-xs font-mono text-white/50 uppercase mr-2">Video Preset:</span>
                <button
                  type="button"
                  onClick={() => handleSelectVideoPreset('veo')}
                  className={`px-3.5 py-2 text-xs font-mono rounded-xs border transition-all cursor-pointer whitespace-nowrap ${
                    vidPreset === 'veo'
                      ? 'bg-white text-black font-bold border-white'
                      : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
                  }`}
                >
                  Gemini Omni &amp; Flow (Adaptive)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectVideoPreset('corner')}
                  className={`px-3.5 py-2 text-xs font-mono rounded-xs border transition-all cursor-pointer whitespace-nowrap ${
                    vidPreset === 'corner'
                      ? 'bg-white text-black font-bold border-white'
                      : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
                  }`}
                >
                  Veo (Corner)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectVideoPreset('sparkle')}
                  className={`px-3.5 py-2 text-xs font-mono rounded-xs border transition-all cursor-pointer whitespace-nowrap ${
                    vidPreset === 'sparkle'
                      ? 'bg-white text-black font-bold border-white'
                      : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
                  }`}
                >
                  Standard Sparkle
                </button>
              </div>

              {/* Video Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 font-mono text-xs">
                <div className="space-y-1.5 bg-white/[0.02] border border-white/10 p-3.5 rounded-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60 uppercase text-[10px]">Strength (Gain)</span>
                    <span className="text-cyan-300 font-bold tabular-nums">{vidSettings.gain.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.05"
                    value={vidSettings.gain}
                    onChange={(e) => setVidSettings({ ...vidSettings, gain: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 bg-white/[0.02] border border-white/10 p-3.5 rounded-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60 uppercase text-[10px]">Size Scale</span>
                    <span className="text-cyan-300 font-bold tabular-nums">{vidSettings.sizeScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={vidSettings.sizeScale}
                    onChange={(e) => setVidSettings({ ...vidSettings, sizeScale: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 bg-white/[0.02] border border-white/10 p-3.5 rounded-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60 uppercase text-[10px]">Position X Offset</span>
                    <span className="text-cyan-300 font-bold tabular-nums">{vidSettings.offsetX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    step="1"
                    value={vidSettings.offsetX}
                    onChange={(e) => setVidSettings({ ...vidSettings, offsetX: parseInt(e.target.value, 10) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 bg-white/[0.02] border border-white/10 p-3.5 rounded-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60 uppercase text-[10px]">Position Y Offset</span>
                    <span className="text-cyan-300 font-bold tabular-nums">{vidSettings.offsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    step="1"
                    value={vidSettings.offsetY}
                    onChange={(e) => setVidSettings({ ...vidSettings, offsetY: parseInt(e.target.value, 10) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleResetVideoSliders}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono rounded-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Sliders</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportVideo}
                  className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold uppercase tracking-wider rounded-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Remove &amp; Export Video MP4</span>
                </button>
              </div>
            </div>
          )}

          {/* Video Encoding Progress */}
          {isVidEncoding && (
            <div className="bg-black/60 border border-cyan-500/30 p-6 rounded-xs space-y-3 text-center font-mono">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
              <p className="text-sm font-bold text-white uppercase">
                Cleaning &amp; Encoding Video via WebCodecs...
              </p>
              <div className="w-full max-w-md mx-auto h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-150"
                  style={{ width: `${vidProgress}%` }}
                />
              </div>
              <p className="text-xs text-cyan-300 tabular-nums">{vidProgress}% — keep tab open</p>
            </div>
          )}

          {/* Exported Video Result */}
          {vidExportResult && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-6 rounded-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-mono font-bold text-white uppercase">
                      Video Watermark Cleaned Successfully!
                    </h3>
                    <p className="text-xs font-mono text-emerald-300/80">
                      H.264 MP4 ({vidExportResult.width} × {vidExportResult.height}px) • Original Audio Intact
                    </p>
                  </div>
                </div>
                <a
                  href={vidExportResult.cleanedUrl}
                  download={vidExportResult.fileName}
                  className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Cleaned Video MP4</span>
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/60 border border-white/10 p-3 rounded-xs space-y-2">
                  <span className="text-[11px] font-mono text-white/50 uppercase block">Original Video</span>
                  <video
                    src={vidExportResult.originalUrl}
                    controls
                    playsInline
                    className="w-full max-h-72 rounded-2xs"
                  />
                </div>
                <div className="bg-black/60 border border-emerald-500/30 p-3 rounded-xs space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase block">
                    Cleaned Video Result
                  </span>
                  <video
                    src={vidExportResult.cleanedUrl}
                    controls
                    playsInline
                    className="w-full max-h-72 rounded-2xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mathematical Unblending Reference & Before/After Showcase */}
      <div className="border-t border-white/10 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-5 space-y-3">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
            Zero-Blur Mathematical Restoration
          </span>
          <h3 className="text-base font-mono font-bold text-white uppercase">
            Why Reverse-Alpha Beats AI Inpainting
          </h3>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            Google Gemini, Imagen 3, Nano Banana, Google Flow, and Veo 3 embed visible watermarks using semi-transparent alpha blending. Because original pixel data remains underneath, exact reverse-alpha subtraction restores 100% of original clarity:
          </p>
          <div className="bg-black/70 border border-white/15 p-3 rounded-xs font-mono text-xs text-cyan-300 text-center">
            Original = (Watermarked − Logo × α) / (1 − α)
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] font-mono text-white/60 pt-1">
            <span>100% Client-Side Privacy</span>
            <span>·</span>
            <span>Zero Quality Loss</span>
            <span>·</span>
            <span>WebCodecs GPU Muxing</span>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-black/50 border border-white/10 p-3 rounded-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-rose-400 font-bold uppercase">Before (Gemini Sparkle)</span>
              <span className="text-white/40">Visible Watermark</span>
            </div>
            <img
              src="/watermark/before.webp"
              alt="Before Gemini watermark removal"
              referrerPolicy="no-referrer"
              className="w-full h-48 object-cover rounded-2xs border border-white/10"
            />
          </div>
          <div className="bg-black/50 border border-emerald-500/25 p-3 rounded-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-400 font-bold uppercase">After (Alpha Unblended)</span>
              <span className="text-emerald-400/60">100% Pixel Recovery</span>
            </div>
            <img
              src="/watermark/after.webp"
              alt="After Gemini watermark removal"
              referrerPolicy="no-referrer"
              className="w-full h-48 object-cover rounded-2xs border border-emerald-500/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
