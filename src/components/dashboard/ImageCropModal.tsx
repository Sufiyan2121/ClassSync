"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Check, 
  RotateCcw,
  Move,
  Crop
} from "lucide-react";

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}: ImageCropModalProps) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const pinchRef = useRef<{ dist: number; startZoom: number } | null>(null);

  // Responsive crop box dimension (square)
  const [cropBoxSize, setCropBoxSize] = useState(260);

  useEffect(() => {
    setMounted(true);
    const updateSize = () => {
      if (typeof window !== "undefined") {
        const available = Math.min(window.innerWidth - 48, 300);
        setCropBoxSize(Math.max(220, Math.min(available, 280)));
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Reset controls whenever a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Load natural dimensions of the image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Determine scale and boundary clamps
  const isRotated90 = rotation === 90 || rotation === 270;
  const effectiveNaturalWidth = imageSize ? (isRotated90 ? imageSize.height : imageSize.width) : 1;
  const effectiveNaturalHeight = imageSize ? (isRotated90 ? imageSize.width : imageSize.height) : 1;

  const minScale = imageSize
    ? Math.max(cropBoxSize / effectiveNaturalWidth, cropBoxSize / effectiveNaturalHeight)
    : 1;

  const currentScale = minScale * zoom;
  const displayedWidth = effectiveNaturalWidth * currentScale;
  const displayedHeight = effectiveNaturalHeight * currentScale;

  const maxOffsetX = Math.max(0, (displayedWidth - cropBoxSize) / 2);
  const maxOffsetY = Math.max(0, (displayedHeight - cropBoxSize) / 2);

  const clampedX = Math.min(maxOffsetX, Math.max(-maxOffsetX, offset.x));
  const clampedY = Math.min(maxOffsetY, Math.max(-maxOffsetY, offset.y));

  // Mouse handlers for dragging/repositioning
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - clampedX, y: e.clientY - clampedY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch handlers for mobile pan & pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - clampedX, y: touch.clientY - clampedY });
      pinchRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = {
        dist: Math.hypot(dx, dy),
        startZoom: zoom,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchRef.current.dist;
      const newZoom = Math.max(1, Math.min(3, pinchRef.current.startZoom * ratio));
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    pinchRef.current = null;
  };

  // Wheel to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.max(1, Math.min(3, parseFloat((prev + delta).toFixed(2)))));
  };

  const handleRotate = () => {
    setRotation((prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270);
    setOffset({ x: 0, y: 0 }); // Center on rotation change
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Perform the crop on HTML5 Canvas
  const handleApplyCrop = () => {
    if (!imageSize || !imgRef.current) return;

    const OUTPUT_SIZE = 320; // 320x320 Retina-sharp avatar
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High quality interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const scaleRatio = OUTPUT_SIZE / cropBoxSize;

    // Transform canvas coordinate space:
    // 1. Center of canvas
    ctx.translate(
      OUTPUT_SIZE / 2 + clampedX * scaleRatio,
      OUTPUT_SIZE / 2 + clampedY * scaleRatio
    );
    // 2. Rotate around center
    ctx.rotate((rotation * Math.PI) / 180);
    // 3. Scale by effective scale
    ctx.scale(minScale * zoom * scaleRatio, minScale * zoom * scaleRatio);
    // 4. Draw image centered
    ctx.drawImage(
      imgRef.current,
      -imageSize.width / 2,
      -imageSize.height / 2,
      imageSize.width,
      imageSize.height
    );

    // Export as optimized JPEG
    const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top, 1rem))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white dark:bg-[#0c1610] text-stone-900 dark:text-stone-100 rounded-3xl shadow-2xl border border-stone-200/80 dark:border-[#1e3025] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 dark:border-[#1e3025] bg-stone-50/70 dark:bg-[#121c16]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Crop size={16} />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-stone-900 dark:text-white tracking-tight">
                Crop Profile Picture
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Drag to reposition • Scroll or slider to zoom
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#1e3025] transition-colors cursor-pointer"
            title="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Interactive Viewport Area */}
        <div className="p-4 sm:p-6 flex flex-col items-center">
          
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative overflow-hidden select-none bg-stone-900/95 dark:bg-[#070e0a] rounded-3xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner border border-stone-800"
            style={{
              width: cropBoxSize,
              height: cropBoxSize,
            }}
          >
            {/* The Image being cropped */}
            {imageSrc && (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                className="max-w-none pointer-events-none transition-transform duration-75 ease-out"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transformOrigin: "center center",
                  transform: `translate(-50%, -50%) translate(${clampedX}px, ${clampedY}px) rotate(${rotation}deg) scale(${currentScale})`,
                }}
              />
            )}

            {/* Squircle Avatar Mask Overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-3xl border-2 border-emerald-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
              {/* Rule of thirds grid lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30 pointer-events-none">
                <div className="border-r border-b border-white/60"></div>
                <div className="border-r border-b border-white/60"></div>
                <div className="border-b border-white/60"></div>
                <div className="border-r border-b border-white/60"></div>
                <div className="border-r border-b border-white/60"></div>
                <div className="border-b border-white/60"></div>
                <div className="border-r border-white/60"></div>
                <div className="border-r border-white/60"></div>
                <div></div>
              </div>
            </div>

            {/* Center Hint Badge */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold pointer-events-none border border-white/10">
              <Move size={10} />
              <span>Drag to move</span>
            </div>
          </div>

          {/* Interactive Controls Bar */}
          <div className="w-full mt-5 space-y-3.5">
            
            {/* Zoom Slider */}
            <div className="flex items-center gap-3 px-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, parseFloat((z - 0.2).toFixed(2))))}
                className="p-1.5 rounded-xl text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#18261e] transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>

              <div className="flex-1 relative flex items-center">
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-stone-200 dark:bg-[#1e3025] rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, parseFloat((z + 0.2).toFixed(2))))}
                className="p-1.5 rounded-xl text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#18261e] transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>

              <span className="text-xs font-mono font-bold text-stone-500 dark:text-stone-400 min-w-[38px] text-right">
                {zoom.toFixed(1)}x
              </span>
            </div>

            {/* Rotation & Reset Buttons */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleRotate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-[#16231b] dark:hover:bg-[#1f3325] text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-[#243a2c] transition cursor-pointer"
              >
                <RotateCw size={13} />
                <span>Rotate 90°</span>
              </button>

              {(zoom > 1 || rotation !== 0 || clampedX !== 0 || clampedY !== 0) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              )}
            </div>

          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="px-5 py-3.5 border-t border-stone-100 dark:border-[#1e3025] bg-stone-50/70 dark:bg-[#121c16] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#1e3025] transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleApplyCrop}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Check size={14} />
            <span>Apply Crop</span>
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
