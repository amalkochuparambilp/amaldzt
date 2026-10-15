import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  RotateCcw,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Move,
  Layers,
  Sparkles,
  Grid,
  FileImage,
  Eye,
  ShieldCheck,
  X
} from 'lucide-react';

interface CustomWatermarkStamperProps {
  onBack?: () => void;
}

type PositionPreset = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' | 'custom';
type BlendModeOption = 'source-over' | 'screen' | 'overlay' | 'soft-light' | 'multiply';
type BuiltinPresetKey = 'custom' | 'dzt' | 'copyright' | 'sparkle' | 'confidential';

export default function CustomWatermarkStamper({ onBack }: CustomWatermarkStamperProps) {
  // Base Image State
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [baseImg, setBaseImg] = useState<HTMLImageElement | null>(null);
  const [baseWidth, setBaseWidth] = useState(0);
  const [baseHeight, setBaseHeight] = useState(0);
  const [isBaseLoading, setIsBaseLoading] = useState(false);
  const [baseDragOver, setBaseDragOver] = useState(false);

  // Custom Watermark Image State
  const [wmFile, setWmFile] = useState<File | null>(null);
  const [wmImg, setWmImg] = useState<HTMLImageElement | null>(null);
  const [wmPreviewUrl, setWmPreviewUrl] = useState<string | null>(null);
  const [wmWidth, setWmWidth] = useState(0);
  const [wmHeight, setWmHeight] = useState(0);
  const [activePreset, setActivePreset] = useState<BuiltinPresetKey>('dzt');
  const [wmDragOver, setWmDragOver] = useState(false);

  // Stamping Settings
  const [position, setPosition] = useState<PositionPreset>('bottom-right');
  const [scalePercent, setScalePercent] = useState<number>(22); // 5% to 80% of base image min-dim
  const [opacity, setOpacity] = useState<number>(0.75); // 0.05 to 1.0
  const [margin, setMargin] = useState<number>(36); // px from corner
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0); // -180 to 180 degrees
  const [blendMode, setBlendMode] = useState<BlendModeOption>('source-over');
  const [isTiled, setIsTiled] = useState<boolean>(false);
  const [tileSpacing, setTileSpacing] = useState<number>(180);
  const [tileAngle, setTileAngle] = useState<number>(-30);

  // Interaction State
  const [isDraggingWm, setIsDraggingWm] = useState(false);
  const [exportResult, setExportResult] = useState<{
    url: string;
    width: number;
    height: number;
    fileName: string;
  } | null>(null);

  // Canvas Refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseInputRef = useRef<HTMLInputElement | null>(null);
  const wmInputRef = useRef<HTMLInputElement | null>(null);

  // Generate built-in procedural watermark images (DZt Logo, Copyright, Sparkle, Confidential)
  const generatePresetWatermark = useCallback((preset: BuiltinPresetKey): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d')!;

      if (preset === 'dzt') {
        c.width = 360;
        c.height = 120;
        ctx.clearRect(0, 0, c.width, c.height);

        // Futuristic DZt badge
        ctx.fillStyle = 'rgba(10, 10, 12, 0.75)';
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(8, 8, c.width - 16, c.height - 16, 12);
        ctx.fill();
        ctx.stroke();

        // Glow accent
        ctx.fillStyle = '#22d3ee';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('DZt', 28, 68);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('TECHNOLOGIES', 104, 52);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '12px monospace';
        ctx.fillText('CREATIVE LABS • 2026', 104, 76);
      } else if (preset === 'copyright') {
        c.width = 440;
        c.height = 80;
        ctx.clearRect(0, 0, c.width, c.height);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(6, 6, c.width - 12, c.height - 12, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('© 2026 AMAL K P', 24, 46);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = '12px monospace';
        ctx.fillText('ALL RIGHTS RESERVED', 220, 46);
      } else if (preset === 'confidential') {
        c.width = 400;
        c.height = 120;
        ctx.clearRect(0, 0, c.width, c.height);

        ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, c.width - 20, c.height - 20);

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CONFIDENTIAL', c.width / 2, 58);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('DO NOT DISTRIBUTE • DRAFT', c.width / 2, 88);
      } else if (preset === 'sparkle') {
        c.width = 160;
        c.height = 160;
        ctx.clearRect(0, 0, c.width, c.height);

        const cx = 80;
        const cy = 80;
        // 4-pointed sparkle star
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 70);
        ctx.quadraticCurveTo(cx, cy, cx + 70, cy);
        ctx.quadraticCurveTo(cx, cy, cx, cy + 70);
        ctx.quadraticCurveTo(cx, cy, cx - 70, cy);
        ctx.quadraticCurveTo(cx, cy, cx, cy - 70);
        ctx.fill();

        // Inner glowing core
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 40);
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      const img = new Image();
      img.onload = () => resolve(img);
      img.src = c.toDataURL('image/png');
    });
  }, []);

  // Initialize with DZt watermark preset on mount
  useEffect(() => {
    generatePresetWatermark('dzt').then((img) => {
      setWmImg(img);
      setWmWidth(img.naturalWidth || 360);
      setWmHeight(img.naturalHeight || 120);
      setWmPreviewUrl(img.src);
    });
  }, [generatePresetWatermark]);

  // Handle Base Image Upload
  const handleBaseImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsBaseLoading(true);
    setExportResult(null);
    setBaseFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setBaseImg(img);
        setBaseWidth(img.naturalWidth);
        setBaseHeight(img.naturalHeight);
        setIsBaseLoading(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Custom Watermark Image Upload
  const handleCustomWatermarkUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setWmFile(file);
    setActivePreset('custom');

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setWmImg(img);
        setWmWidth(img.naturalWidth);
        setWmHeight(img.naturalHeight);
        setWmPreviewUrl(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Switch between presets
  const handleSelectPreset = async (key: BuiltinPresetKey) => {
    setActivePreset(key);
    if (key === 'custom') {
      if (!wmFile) {
        wmInputRef.current?.click();
      }
      return;
    }
    const img = await generatePresetWatermark(key);
    setWmImg(img);
    setWmWidth(img.naturalWidth);
    setWmHeight(img.naturalHeight);
    setWmPreviewUrl(img.src);
  };

  // Calculate Watermark Bounding Box on Base Image
  const calculateWatermarkBox = useCallback(() => {
    if (!baseWidth || !baseHeight || !wmWidth || !wmHeight) {
      return { x: 0, y: 0, w: 100, h: 50 };
    }

    const minDim = Math.min(baseWidth, baseHeight);
    const targetW = Math.max(20, Math.round(minDim * (scalePercent / 100)));
    const aspect = wmHeight / wmWidth;
    const targetH = Math.max(10, Math.round(targetW * aspect));

    let x = 0;
    let y = 0;

    switch (position) {
      case 'bottom-right':
        x = baseWidth - margin - targetW + offsetX;
        y = baseHeight - margin - targetH + offsetY;
        break;
      case 'bottom-left':
        x = margin + offsetX;
        y = baseHeight - margin - targetH + offsetY;
        break;
      case 'top-right':
        x = baseWidth - margin - targetW + offsetX;
        y = margin + offsetY;
        break;
      case 'top-left':
        x = margin + offsetX;
        y = margin + offsetY;
        break;
      case 'center':
        x = Math.round((baseWidth - targetW) / 2) + offsetX;
        y = Math.round((baseHeight - targetH) / 2) + offsetY;
        break;
      case 'custom':
        x = Math.round((baseWidth - targetW) / 2) + offsetX;
        y = Math.round((baseHeight - targetH) / 2) + offsetY;
        break;
    }

    return { x, y, w: targetW, h: targetH };
  }, [baseWidth, baseHeight, wmWidth, wmHeight, scalePercent, position, margin, offsetX, offsetY]);

  // Render Watermarked Image on Canvas
  const renderWatermarkedCanvas = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !baseImg) return;

    const ctx = canvas.getContext('2d')!;
    const maxPreviewW = 780;
    const previewScale = Math.min(1, maxPreviewW / baseWidth);

    canvas.width = Math.round(baseWidth * previewScale);
    canvas.height = Math.round(baseHeight * previewScale);

    // Draw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

    if (!wmImg) return;

    // Draw Watermark
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = blendMode;

    const { x, y, w, h } = calculateWatermarkBox();
    const scaledX = x * previewScale;
    const scaledY = y * previewScale;
    const scaledW = w * previewScale;
    const scaledH = h * previewScale;

    if (isTiled) {
      // Diagonal Tiling Pattern
      const spacingX = tileSpacing * previewScale;
      const spacingY = (tileSpacing * 0.75) * previewScale;
      const angleRad = (tileAngle * Math.PI) / 180;

      for (let ty = -canvas.height; ty < canvas.height * 2; ty += spacingY) {
        for (let tx = -canvas.width; tx < canvas.width * 2; tx += spacingX) {
          ctx.save();
          ctx.translate(tx, ty);
          ctx.rotate(angleRad);
          ctx.drawImage(wmImg, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
          ctx.restore();
        }
      }
    } else {
      // Single Watermark Stamp
      ctx.save();
      const centerX = scaledX + scaledW / 2;
      const centerY = scaledY + scaledH / 2;
      ctx.translate(centerX, centerY);

      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }

      ctx.drawImage(wmImg, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
      ctx.restore();

      // Draw bounding box guideline in preview
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);
      ctx.restore();
      return;
    }

    ctx.restore();
  }, [baseImg, baseWidth, baseHeight, wmImg, opacity, blendMode, calculateWatermarkBox, isTiled, tileSpacing, tileAngle, rotation]);

  useEffect(() => {
    if (baseImg) {
      renderWatermarkedCanvas();
    }
  }, [baseImg, renderWatermarkedCanvas]);

  // Handle Drag / Click on Preview Canvas to reposition watermark
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!baseImg || !previewCanvasRef.current || isTiled) return;
    setIsDraggingWm(true);
    updateWatermarkPositionFromEvent(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingWm || !baseImg || !previewCanvasRef.current || isTiled) return;
    updateWatermarkPositionFromEvent(e);
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingWm(false);
  };

  const updateWatermarkPositionFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !baseWidth || !baseHeight) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * baseWidth;
    const clickY = ((e.clientY - rect.top) / rect.height) * baseHeight;

    const minDim = Math.min(baseWidth, baseHeight);
    const targetW = Math.max(20, Math.round(minDim * (scalePercent / 100)));
    const aspect = wmHeight / wmWidth;
    const targetH = Math.max(10, Math.round(targetW * aspect));

    setPosition('custom');
    setOffsetX(Math.round(clickX - baseWidth / 2));
    setOffsetY(Math.round(clickY - baseHeight / 2));
  };

  // Full-Resolution Lossless Export
  const handleExportWatermarkedImage = async () => {
    if (!baseImg || !wmImg || !baseWidth || !baseHeight) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = baseWidth;
    exportCanvas.height = baseHeight;
    const ctx = exportCanvas.getContext('2d')!;

    // Draw full resolution base image
    ctx.drawImage(baseImg, 0, 0, baseWidth, baseHeight);

    // Apply watermark at full resolution
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = blendMode;

    const { x, y, w, h } = calculateWatermarkBox();

    if (isTiled) {
      const spacingX = tileSpacing;
      const spacingY = tileSpacing * 0.75;
      const angleRad = (tileAngle * Math.PI) / 180;

      for (let ty = -baseHeight; ty < baseHeight * 2; ty += spacingY) {
        for (let tx = -baseWidth; tx < baseWidth * 2; tx += spacingX) {
          ctx.save();
          ctx.translate(tx, ty);
          ctx.rotate(angleRad);
          ctx.drawImage(wmImg, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
      }
    } else {
      ctx.save();
      const centerX = x + w / 2;
      const centerY = y + h / 2;
      ctx.translate(centerX, centerY);

      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }

      ctx.drawImage(wmImg, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    ctx.restore();

    const blob = await new Promise<Blob | null>((resolve) =>
      exportCanvas.toBlob(resolve, 'image/png')
    );
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const rawName = baseFile ? baseFile.name.replace(/\.[^.]+$/, '') : 'watermarked_photo';

    setExportResult({
      url,
      width: baseWidth,
      height: baseHeight,
      fileName: `${rawName}_watermarked.png`,
    });
  };

  const handleResetSettings = () => {
    setPosition('bottom-right');
    setScalePercent(22);
    setOpacity(0.75);
    setMargin(36);
    setOffsetX(0);
    setOffsetY(0);
    setRotation(0);
    setBlendMode('source-over');
    setIsTiled(false);
  };

  return (
    <div className="space-y-6">
      {/* 2-Step Upload Section: Base Image + Custom Watermark Image */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1: Base Target Image */}
        <div
          onClick={() => !isBaseLoading && baseInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setBaseDragOver(true);
          }}
          onDragLeave={() => setBaseDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setBaseDragOver(false);
            if (e.dataTransfer.files.length) {
              handleBaseImageUpload(e.dataTransfer.files[0]);
            }
          }}
          className={`border-2 border-dashed rounded-xs p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 min-h-[170px] ${
            baseDragOver
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-white/20 bg-black/40 hover:border-white/40 hover:bg-white/[0.02]'
          }`}
        >
          <input
            ref={baseInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                handleBaseImageUpload(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
          {isBaseLoading ? (
            <>
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
              <p className="text-xs font-mono font-bold text-cyan-300 uppercase">
                Loading Base Photo...
              </p>
            </>
          ) : baseImg ? (
            <>
              <div className="w-9 h-9 rounded-xs bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-mono font-bold text-white uppercase truncate max-w-[260px]">
                {baseFile ? baseFile.name : 'Target Image Loaded'}
              </p>
              <span className="text-[10px] font-mono text-emerald-400/80">
                {baseWidth} × {baseHeight}px • Click or Drop to Change
              </span>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xs bg-white/5 border border-white/15 flex items-center justify-center text-cyan-400">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-mono font-bold text-white uppercase">
                1. Upload Target Image to Watermark
              </p>
              <p className="text-[11px] font-mono text-white/40">
                Supports PNG, JPG, WebP, TIFF
              </p>
            </>
          )}
        </div>

        {/* Step 2: Custom Watermark Image Uploader */}
        <div
          onClick={() => wmInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setWmDragOver(true);
          }}
          onDragLeave={() => setWmDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setWmDragOver(false);
            if (e.dataTransfer.files.length) {
              handleCustomWatermarkUpload(e.dataTransfer.files[0]);
            }
          }}
          className={`border-2 border-dashed rounded-xs p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 min-h-[170px] ${
            wmDragOver
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-white/20 bg-black/40 hover:border-white/40 hover:bg-white/[0.02]'
          }`}
        >
          <input
            ref={wmInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                handleCustomWatermarkUpload(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
          {wmImg ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xs bg-black/80 border border-white/20 p-1 flex items-center justify-center overflow-hidden bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:6px_6px]">
                  {wmPreviewUrl && (
                    <img
                      src={wmPreviewUrl}
                      alt="Custom Watermark Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs font-mono font-bold text-white uppercase truncate max-w-[180px]">
                    {wmFile ? wmFile.name : `Preset: ${activePreset.toUpperCase()}`}
                  </p>
                  <span className="text-[10px] font-mono text-cyan-400 block">
                    {wmWidth} × {wmHeight}px • Click to Replace Watermark
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-white/40">
                Drag any PNG / SVG logo here anytime
              </span>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xs bg-white/5 border border-white/15 flex items-center justify-center text-cyan-400">
                <FileImage className="w-4 h-4" />
              </div>
              <p className="text-xs font-mono font-bold text-white uppercase">
                2. Upload Custom Watermark Image / Logo
              </p>
              <p className="text-[11px] font-mono text-white/40">
                PNG with alpha transparency, SVG, or logo
              </p>
            </>
          )}
        </div>
      </div>

      {/* Watermark Preset Selectors */}
      <div className="bg-black/50 border border-white/15 p-4 rounded-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-white/50 uppercase mr-1">Watermark Image Source:</span>
          <button
            type="button"
            onClick={() => handleSelectPreset('custom')}
            className={`px-3 py-1.5 text-xs font-mono rounded-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
              activePreset === 'custom'
                ? 'bg-white text-black font-bold border-white'
                : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Custom Upload {wmFile ? `(${wmFile.name.slice(0, 10)}...)` : ''}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('dzt')}
            className={`px-3 py-1.5 text-xs font-mono rounded-xs border transition-all cursor-pointer ${
              activePreset === 'dzt'
                ? 'bg-white text-black font-bold border-white'
                : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
            }`}
          >
            DZt Badge
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('copyright')}
            className={`px-3 py-1.5 text-xs font-mono rounded-xs border transition-all cursor-pointer ${
              activePreset === 'copyright'
                ? 'bg-white text-black font-bold border-white'
                : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
            }`}
          >
            © Copyright Stencil
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('sparkle')}
            className={`px-3 py-1.5 text-xs font-mono rounded-xs border transition-all cursor-pointer ${
              activePreset === 'sparkle'
                ? 'bg-white text-black font-bold border-white'
                : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
            }`}
          >
            Sparkle Star
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('confidential')}
            className={`px-3 py-1.5 text-xs font-mono rounded-xs border transition-all cursor-pointer ${
              activePreset === 'confidential'
                ? 'bg-white text-black font-bold border-white'
                : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
            }`}
          >
            Confidential Seal
          </button>
        </div>

        {wmImg && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Watermark Ready ({wmWidth}×{wmHeight}px)</span>
          </div>
        )}
      </div>

      {/* Interactive Watermark Stamper Studio */}
      {baseImg && (
        <div className="bg-black/50 border border-white/15 p-6 rounded-xs space-y-6">
          {/* Main Interactive Live Canvas */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-white/60">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Eye className="w-3.5 h-3.5" /> Live Stamping Canvas (Click or Drag to Reposition Watermark)
              </span>
              <span>
                Target Resolution: {baseWidth} × {baseHeight}px
              </span>
            </div>
            <div className="w-full flex items-center justify-center bg-[#070707] border border-white/10 p-3 rounded-2xs min-h-[300px] overflow-hidden">
              <canvas
                ref={previewCanvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className="max-w-full h-auto rounded-2xs cursor-crosshair shadow-2xl"
              />
            </div>
          </div>

          {/* Positioning & Placement Grid */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono text-white/60 uppercase">Placement Preset:</span>
              <span className="text-[11px] font-mono text-white/40">
                Tip: Click on the image above to move watermark anywhere
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'bottom-right', label: 'Bottom Right' },
                { key: 'bottom-left', label: 'Bottom Left' },
                { key: 'top-right', label: 'Top Right' },
                { key: 'top-left', label: 'Top Left' },
                { key: 'center', label: 'Center' },
                { key: 'custom', label: 'Custom Freeform' },
              ].map((pos) => (
                <button
                  key={pos.key}
                  type="button"
                  onClick={() => {
                    setPosition(pos.key as PositionPreset);
                    setOffsetX(0);
                    setOffsetY(0);
                  }}
                  className={`px-3 py-1.5 text-xs font-mono rounded-xs border transition-all cursor-pointer ${
                    position === pos.key
                      ? 'bg-cyan-400 text-black font-bold border-cyan-400'
                      : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
                  }`}
                >
                  {pos.label}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTiled(!isTiled)}
                  className={`px-3.5 py-1.5 text-xs font-mono rounded-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isTiled
                      ? 'bg-amber-400 text-black font-bold border-amber-400'
                      : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Repeat / Diagonal Tiling {isTiled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 6 Precision Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
            {/* Scale Slider */}
            <div className="space-y-1.5 bg-white/[0.02] border border-white/10 p-3.5 rounded-xs">
              <div className="flex justify-between">
                <span className="text-white/60 uppercase text-[10px]">Watermark Size</span>
                <span className="text-cyan-300 font-bold tabular-nums">{scalePercent}% of image</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="1"
                value={scalePercent}
                onChange={(e) => setScalePercent(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Opacity Slider */}
            <div className="space-y-1.5 bg-white/[0.02] border border-white/10 p-3.5 rounded-xs">
              <div className="flex justify-between">
                <span className="text-white/60 uppercase text-[10px]">Watermark Opacity</span>
                <span className="text-cyan-300 font-bold tabular-nums">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Margin Slider */}
            <div className="space-y-1.5 bg-white/[0.02] border border-white/10 p-3.5 rounded-xs">
              <div className="flex justify-between">
                <span className="text-white/60 uppercase text-[10px]">Corner Margin</span>
                <span className="text-cyan-300 font-bold tabular-nums">{margin}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="2"
                value={margin}
                onChange={(e) => setMargin(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Rotation Slider */}
            <div className="space-y-1.5 bg-white/[0.02] border border-white/10 p-3.5 rounded-xs">
              <div className="flex justify-between">
                <span className="text-white/60 uppercase text-[10px]">Rotation Angle</span>
                <span className="text-cyan-300 font-bold tabular-nums">{rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Offset X Slider */}
            <div className="space-y-1.5 bg-white/[0.02] border border-white/10 p-3.5 rounded-xs">
              <div className="flex justify-between">
                <span className="text-white/60 uppercase text-[10px]">Offset X Adjustment</span>
                <span className="text-cyan-300 font-bold tabular-nums">{offsetX}px</span>
              </div>
              <input
                type="range"
                min="-400"
                max="400"
                step="2"
                value={offsetX}
                onChange={(e) => setOffsetX(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Offset Y Slider */}
            <div className="space-y-1.5 bg-white/[0.02] border border-white/10 p-3.5 rounded-xs">
              <div className="flex justify-between">
                <span className="text-white/60 uppercase text-[10px]">Offset Y Adjustment</span>
                <span className="text-cyan-300 font-bold tabular-nums">{offsetY}px</span>
              </div>
              <input
                type="range"
                min="-400"
                max="400"
                step="2"
                value={offsetY}
                onChange={(e) => setOffsetY(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Blend Mode & Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/50 uppercase">Blend Mode:</span>
              <select
                value={blendMode}
                onChange={(e) => setBlendMode(e.target.value as BlendModeOption)}
                className="bg-black border border-white/20 text-white text-xs font-mono rounded-xs px-2.5 py-1.5 focus:border-cyan-400 outline-hidden cursor-pointer"
              >
                <option value="source-over">Normal (Source Over)</option>
                <option value="screen">Screen (Light on Dark)</option>
                <option value="overlay">Overlay (Contrast)</option>
                <option value="soft-light">Soft Light (Subtle)</option>
                <option value="multiply">Multiply (Darken)</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetSettings}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono rounded-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Settings</span>
              </button>

              <button
                type="button"
                onClick={handleExportWatermarkedImage}
                className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-mono font-bold uppercase tracking-wider rounded-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export Watermarked PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Result Card */}
      {exportResult && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-6 rounded-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase">
                  Watermarked Image Created Successfully!
                </h3>
                <p className="text-xs font-mono text-emerald-300/80">
                  Lossless PNG ({exportResult.width} × {exportResult.height}px) • Client-Side Export
                </p>
              </div>
            </div>
            <a
              href={exportResult.url}
              download={exportResult.fileName}
              className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Download Watermarked Image</span>
            </a>
          </div>

          <div className="bg-black/80 border border-white/10 p-3 rounded-xs max-w-2xl mx-auto">
            <img
              src={exportResult.url}
              alt="Exported Watermarked Image"
              className="max-h-80 w-auto mx-auto rounded-2xs object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
