import React, { useState, useRef, useEffect } from 'react'
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Box,
  Layers,
  Sun,
  Eye,
  Info
} from 'lucide-react'
import { Product } from '../../types'

interface Craft3DViewerProps {
  product: Product
  height?: string
}

export const Craft3DViewer: React.FC<Craft3DViewerProps> = ({
  product,
  height = 'h-[360px] sm:h-[460px] md:h-[540px]'
}) => {
  const [viewMode, setViewMode] = useState<'3d-mesh' | 'photo'>(
    product.has3DModel ? '3d-mesh' : 'photo'
  )
  const [rotation, setRotation] = useState({ x: 12, y: -25 })
  const [zoom, setZoom] = useState(1)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [isWireframe, setIsWireframe] = useState(false)
  const [lighting, setLighting] = useState<'studio' | 'daylight' | 'museum'>('studio')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const lastMousePosRef = useRef({ x: 0, y: 0 })

  // Auto-rotate orbit when enabled
  useEffect(() => {
    if (!isAutoRotating || viewMode !== '3d-mesh') return

    const interval = setInterval(() => {
      setRotation((prev) => ({ ...prev, y: (prev.y + 0.6) % 360 }))
    }, 30)

    return () => clearInterval(interval)
  }, [isAutoRotating, viewMode])

  // Mouse drag for 3D rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== '3d-mesh') return
    isDraggingRef.current = true
    lastMousePosRef.current = { x: e.clientX, y: e.clientY }
    setIsAutoRotating(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || viewMode !== '3d-mesh') return
    const deltaX = e.clientX - lastMousePosRef.current.x
    const deltaY = e.clientY - lastMousePosRef.current.y
    lastMousePosRef.current = { x: e.clientX, y: e.clientY }

    setRotation((prev) => ({
      x: Math.max(-60, Math.min(60, prev.x - deltaY * 0.4)),
      y: (prev.y + deltaX * 0.5) % 360
    }))
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  // Touch drag for Mobile / Tablet 3D rotation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (viewMode !== '3d-mesh' || e.touches.length === 0) return
    isDraggingRef.current = true
    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    setIsAutoRotating(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || viewMode !== '3d-mesh' || e.touches.length === 0) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - lastMousePosRef.current.x
    const deltaY = touch.clientY - lastMousePosRef.current.y
    lastMousePosRef.current = { x: touch.clientX, y: touch.clientY }

    setRotation((prev) => ({
      x: Math.max(-60, Math.min(60, prev.x - deltaY * 0.4)),
      y: (prev.y + deltaX * 0.5) % 360
    }))
  }

  const handleTouchEnd = () => {
    isDraggingRef.current = false
  }

  const resetView = () => {
    setRotation({ x: 12, y: -25 })
    setZoom(1)
    setIsAutoRotating(true)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${height} bg-[#1D211E] rounded-2xl overflow-hidden border border-[#78816A]/40 flex flex-col justify-between shadow-xl select-none`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-20 flex items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto min-w-0">
          {product.has3DModel ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#244C3A]/90 backdrop-blur-md text-[#F8F5EF] text-[10px] sm:text-xs font-medium border border-[#78816A]/50 shrink-0">
              <Box className="w-3 h-3 text-[#B85C38]" />
              <span className="truncate">3D Model</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-black/70 backdrop-blur-md text-[#E8DCCB] text-[10px] sm:text-xs font-medium border border-white/10 shrink-0">
              <Info className="w-3 h-3 text-[#B85C38]" />
              <span className="truncate">Studio Inspection</span>
            </div>
          )}

          {/* Mode Switcher - Visible on all devices */}
          <div className="inline-flex bg-black/60 backdrop-blur-md p-0.5 rounded-lg border border-white/10 text-xs shrink-0">
            <button
              onClick={() => setViewMode('3d-mesh')}
              className={`px-2 py-1 rounded-md transition-colors text-[11px] sm:text-xs font-medium cursor-pointer ${
                viewMode === '3d-mesh'
                  ? 'bg-[#B85C38] text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              3D Orbit
            </button>
            <button
              onClick={() => setViewMode('photo')}
              className={`px-2 py-1 rounded-md transition-colors text-[11px] sm:text-xs font-medium cursor-pointer ${
                viewMode === 'photo'
                  ? 'bg-[#244C3A] text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Photo
            </button>
          </div>
        </div>

        {/* Lighting preset & Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          <button
            onClick={() => {
              const next = lighting === 'studio' ? 'daylight' : lighting === 'daylight' ? 'museum' : 'studio'
              setLighting(next)
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-black/60 backdrop-blur-md text-white/80 hover:text-white border border-white/10 text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title={`Lighting: ${lighting}`}
          >
            <Sun className="w-3.5 h-3.5 text-[#E8DCCB]" />
            <span className="hidden md:inline capitalize">{lighting}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-lg bg-black/60 backdrop-blur-md text-white/80 hover:text-white border border-white/10 transition-colors cursor-pointer"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main 3D Canvas / Photo Viewport */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing">
        {/* Ambient Stage Lighting Glow */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            lighting === 'studio'
              ? 'bg-[radial-gradient(circle_at_50%_40%,rgba(184,92,56,0.18)_0%,transparent_70%)]'
              : lighting === 'daylight'
              ? 'bg-[radial-gradient(circle_at_30%_20%,rgba(248,245,239,0.25)_0%,transparent_60%)]'
              : 'bg-[radial-gradient(circle_at_50%_50%,rgba(212,163,115,0.2)_0%,transparent_65%)]'
          }`}
        />

        {/* Fine Architectural Grid Floor for Depth */}
        <div
          className="absolute inset-x-0 bottom-0 h-48 opacity-25 pointer-events-none transform -skew-x-12"
          style={{
            backgroundImage:
              'linear-gradient(to right, #E9E1D5 1px, transparent 1px), linear-gradient(to bottom, #E9E1D5 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'linear-gradient(to top, black 20%, transparent 95%)',
            WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent 95%)'
          }}
        />

        {viewMode === '3d-mesh' ? (
          /* 3D Geometric Craft Model Container with CSS 3D Transforms */
          <div
            className="relative flex items-center justify-center transition-transform ease-out"
            style={{
              transform: `perspective(1000px) scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              transformStyle: 'preserve-3d',
              transitionDuration: isDraggingRef.current ? '0ms' : '150ms'
            }}
          >
            {/* The Craft Centerpiece */}
            <div className="relative w-56 h-64 sm:w-72 sm:h-80 md:w-84 md:h-96 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#E8DCCB]/30 group">
              <img
                src={product.images[0]}
                alt={product.name}
                className={`w-full h-full object-cover transition-all ${
                  isWireframe ? 'opacity-30 filter invert contrast-200' : 'opacity-95'
                }`}
              />

              {/* Wireframe Matrix Overlay if enabled */}
              {isWireframe && (
                <div
                  className="absolute inset-0 border border-emerald-400/80 pointer-events-none"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(52,211,153,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.3) 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                  }}
                />
              )}

              {/* Pedestal Cast Shadow */}
              <div className="absolute -bottom-10 inset-x-4 h-10 bg-black/80 blur-xl rounded-full" />
            </div>

            {/* Orbit Axis Indicator */}
            <div
              className="absolute -bottom-8 w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-[#B85C38]/40 pointer-events-none"
              style={{
                transform: 'rotateX(80deg)',
                borderStyle: 'dashed'
              }}
            />
          </div>
        ) : (
          /* High-Resolution Studio Photography Inspection */
          <div
            className="relative max-w-lg max-h-[80%] rounded-xl overflow-hidden shadow-2xl transition-transform px-4"
            style={{ transform: `scale(${zoom})` }}
          >
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-contain max-h-[280px] sm:max-h-[380px]"
            />
          </div>
        )}
      </div>

      {/* Bottom Interactive Control Toolbar */}
      <div className="relative z-20 px-3 sm:px-4 py-2.5 bg-black/60 backdrop-blur-md border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-white text-xs">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom In */}
          <button
            onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}
            className="p-1 sm:p-1.5 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
            className="p-1 sm:p-1.5 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Reset View */}
          <button
            onClick={resetView}
            className="p-1 sm:p-1.5 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset Angle & Zoom"
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline text-[11px]">Reset</span>
          </button>

          {/* Toggle Auto Rotation */}
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`px-2 py-1 rounded-md transition-colors text-[11px] font-medium cursor-pointer ${
              isAutoRotating ? 'bg-[#244C3A] text-white' : 'hover:bg-white/10 text-white/70'
            }`}
          >
            {isAutoRotating ? 'Rotate: ON' : 'Rotate: OFF'}
          </button>

          {/* Wireframe toggle */}
          <button
            onClick={() => setIsWireframe(!isWireframe)}
            className={`p-1 sm:p-1.5 rounded-md transition-colors cursor-pointer ${
              isWireframe ? 'bg-[#B85C38] text-white' : 'hover:bg-white/10 text-white/70'
            }`}
            title="Toggle Wireframe Mesh"
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="text-[10px] sm:text-[11px] text-[#E8DCCB]/80 flex items-center gap-1.5">
          <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#B85C38] shrink-0" />
          <span className="hidden sm:inline">Drag with mouse or touch to orbit 360°</span>
          <span className="sm:hidden">Drag to orbit 360°</span>
        </div>
      </div>
    </div>
  )
}
