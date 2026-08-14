// app/sect-affairs/components/Gallery.tsx

"use client";

import { PeakInfo } from "@/types/sect";
import PeakCard from "./PeakCard";
import AddCard from "./AddCard";

interface GalleryProps {
  peaks: PeakInfo[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  onCardClick: (index: number) => void;
  showAddCard: boolean;
  canCreatePeak: boolean;
  canAddDisciple: boolean;
  isMobile: boolean;
  carouselRef: React.RefObject<HTMLDivElement | null>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  totalCards: number;
}

const GALLERY = { borderActive: "#0F766E" };

export default function Gallery({
  peaks, activeIndex, setActiveIndex, onCardClick, showAddCard,
  canCreatePeak, canAddDisciple, isMobile, carouselRef,
  handleTouchStart, handleTouchEnd, totalCards,
}: GalleryProps) {
  const getCardStyle = (index: number): React.CSSProperties => {
    if (isMobile) return {};
    const offset = index - activeIndex;
    const abs = Math.abs(offset);
    const spacing = 320;
    const translateX = offset * spacing;
    const scale = Math.max(0.6, 1 - abs * 0.15);
    const opacity = abs > 2.6 ? 0 : Math.max(0.25, 1 - abs * 0.28);
    return {
      transform: `translateX(${translateX}px) scale(${scale})`,
      opacity,
      zIndex: abs * 10,
      transition: "transform 0.65s cubic-bezier(0.22,0.61,0.36,1), opacity 0.5s ease",
      pointerEvents: "auto",
      filter: abs > 0 ? `brightness(${1 - abs * 0.08})` : "none",
    };
  };

  return (
    <div className="relative mb-16" style={{ height: isMobile ? "auto" : "680px" }}>
      {!isMobile && (
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to right,transparent 0%,rgba(13,148,136,0.06) 20%,rgba(13,148,136,0.12) 50%,rgba(148,49,13,0.06) 80%,transparent 100%)", borderRadius: "999px" }}
        />
      )}
      {isMobile ? (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollSnapType: "x mandatory" }}>
          {peaks.map((peak) => (
            <PeakCard key={peak.name} peak={peak} index={0} activeIndex={0} onClick={() => onCardClick(peaks.indexOf(peak))} isMobile />
          ))}
          {showAddCard && (
            <AddCard index={0} activeIndex={0} onClick={() => onCardClick(peaks.length)}
              hasCreatePermission={canCreatePeak} hasAddPermission={canAddDisciple} isMobile />
          )}
        </div>
      ) : (
        <div ref={carouselRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
          className="relative w-full h-full" style={{ overflow: "hidden" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            {peaks.map((peak, index) => (
              <PeakCard key={peak.name} peak={peak} index={index} activeIndex={activeIndex}
                onClick={() => onCardClick(index)} cardStyle={getCardStyle(index)} />
            ))}
            {showAddCard && (
              <AddCard index={peaks.length} activeIndex={activeIndex} onClick={() => onCardClick(peaks.length)}
                hasCreatePermission={canCreatePeak} hasAddPermission={canAddDisciple} cardStyle={getCardStyle(peaks.length)} />
            )}
          </div>
        </div>
      )}
      {/* 底部指示器（点击可跳转） */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[200]">
        {Array.from({ length: totalCards }).map((_, i) => (
          <button key={i} onClick={() => setActiveIndex(i)} className="transition-all rounded-full"
            style={{ width: i === activeIndex ? "24px" : "8px", height: "8px", backgroundColor: i === activeIndex ? GALLERY.borderActive : "rgba(13,148,136,0.3)" }} />
        ))}
      </div>
    </div>
  );
}