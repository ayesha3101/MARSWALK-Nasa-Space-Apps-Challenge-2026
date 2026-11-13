import React, { useRef, useCallback, useEffect, useState, memo } from 'react';

export type SnapPoint = 'closed' | 'peek' | 'half' | 'full';

interface BottomSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  /** Initial snap point when opened */
  initialSnap?: SnapPoint;
  /** Peek height in px */
  peekHeight?: number;
  /** Title for the sheet header (shown in the drag handle area) */
  title?: string;
  titleIcon?: React.ReactNode;
  className?: string;
}

const SNAP_HEIGHTS: Record<SnapPoint, number> = {
  closed: 0,
  peek: 80,
  half: 45, // percentage of viewport
  full: 88, // percentage of viewport
};

/**
 * Mobile bottom sheet with drag-to-snap gesture support.
 * Three snap points: peek (80px), half (45vh), full (88vh).
 * Drag handle + touch gesture for smooth UX.
 */
export const BottomSheet: React.FC<BottomSheetProps> = memo(({
  children,
  isOpen,
  onClose,
  initialSnap = 'half',
  peekHeight = 80,
  title,
  titleIcon,
  className = ''
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    isDragging: false,
    startY: 0,
    startHeight: 0,
    currentHeight: 0,
  });

  const [currentSnap, setCurrentSnap] = useState<SnapPoint>(initialSnap);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate pixel height from snap point
  const getSnapHeight = useCallback((snap: SnapPoint): number => {
    const vh = window.innerHeight;
    switch (snap) {
      case 'closed': return 0;
      case 'peek': return peekHeight;
      case 'half': return vh * 0.45;
      case 'full': return vh * 0.88;
      default: return 0;
    }
  }, [peekHeight]);

  // Animate to snap point
  useEffect(() => {
    if (!isOpen) {
      setSheetHeight(0);
      setCurrentSnap('closed');
      return;
    }
    const h = getSnapHeight(initialSnap);
    setSheetHeight(h);
    setCurrentSnap(initialSnap);
  }, [isOpen, initialSnap, getSnapHeight]);

  const snapToNearest = useCallback((currentH: number) => {
    const vh = window.innerHeight;
    const snaps: { point: SnapPoint; height: number }[] = [
      { point: 'closed', height: 0 },
      { point: 'peek', height: peekHeight },
      { point: 'half', height: vh * 0.45 },
      { point: 'full', height: vh * 0.88 },
    ];

    let closest = snaps[0];
    let minDist = Infinity;
    for (const s of snaps) {
      const dist = Math.abs(currentH - s.height);
      if (dist < minDist) {
        minDist = dist;
        closest = s;
      }
    }

    if (closest.point === 'closed') {
      onClose();
    }
    setCurrentSnap(closest.point);
    setSheetHeight(closest.height);
  }, [peekHeight, onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragRef.current.isDragging = true;
    dragRef.current.startY = e.touches[0].clientY;
    dragRef.current.startHeight = sheetHeight;
    setIsDragging(true);
  }, [sheetHeight]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.isDragging) return;
    e.preventDefault();
    const deltaY = dragRef.current.startY - e.touches[0].clientY;
    const newHeight = Math.max(0, Math.min(window.innerHeight * 0.92, dragRef.current.startHeight + deltaY));
    dragRef.current.currentHeight = newHeight;
    setSheetHeight(newHeight);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;
    setIsDragging(false);
    snapToNearest(dragRef.current.currentHeight || sheetHeight);
  }, [snapToNearest, sheetHeight]);

  if (!isOpen && sheetHeight === 0) return null;

  return (
    <>
      {/* Backdrop (only when half or full) */}
      {currentSnap !== 'peek' && currentSnap !== 'closed' && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          style={{ opacity: Math.min(1, sheetHeight / (window.innerHeight * 0.45)) }}
        />
      )}

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-mars-dark/98 border-t border-mars-border rounded-t-2xl overflow-hidden ${className}`}
        style={{
          height: `${sheetHeight}px`,
          transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-mars-muted/40 mb-1.5" />
          {title && (
            <div className="flex items-center space-x-1.5 px-4 w-full">
              {titleIcon}
              <span className="font-heading font-bold text-xs tracking-wider text-mars-text uppercase flex-1">
                {title}
              </span>
              <button
                onClick={onClose}
                className="text-mars-muted hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto overscroll-contain" style={{ height: `calc(100% - ${title ? 52 : 24}px)` }}>
          {children}
        </div>
      </div>
    </>
  );
});

BottomSheet.displayName = 'BottomSheet';
