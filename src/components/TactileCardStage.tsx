import React, { useRef, useState } from 'react';
import { BACK_CARD_ID, getCardImageUrl } from '../game/rules';

interface TactileCardStageProps {
  currentCard: number | null;
  remainingCount: number;
  isDrawing: boolean;
  tensionIntensity: number; // 0 to 1
  onCardClick: () => void;
  onExpandCard?: () => void;
}

export const TactileCardStage: React.FC<TactileCardStageProps> = ({
  currentCard,
  remainingCount,
  isDrawing,
  tensionIntensity,
  onCardClick,
  onExpandCard,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  const isFlipped = currentCard !== null;
  const frontSrc = getCardImageUrl(currentCard);
  const backSrc = getCardImageUrl(BACK_CARD_ID);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const ry = (x - 0.5) * 18;
    const rx = (0.5 - y) * 18;
    setTilt({
      rx,
      ry,
      gx: Math.round(x * 100),
      gy: Math.round(y * 100),
      active: true,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  };

  // Stack depth layers based on remaining cards
  const stackLayers = Math.min(4, Math.ceil(remainingCount / 15));

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-2">
      {/* Ambient Aura behind Deck that warms up as tension increases */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 rounded-full transition-opacity duration-500"
        style={{
          background:
            tensionIntensity > 0.5
              ? `radial-gradient(circle, rgba(220, 38, 38, ${0.14 + tensionIntensity * 0.22}) 0%, rgba(212, 175, 55, 0.08) 45%, transparent 72%)`
              : `radial-gradient(circle, rgba(212, 175, 55, ${0.12 + tensionIntensity * 0.14}) 0%, transparent 70%)`,
        }}
      />

      {/* 3D Perspective Container */}
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative w-[224px] h-[325px] sm:w-[276px] sm:h-[400px] lg:w-[308px] lg:h-[446px]"
        style={{ perspective: '1300px' }}
      >
        {/* Physical Deck Thickness Stack Layers beneath the top card */}
        {Array.from({ length: stackLayers }).map((_, idx) => {
          const offset = (stackLayers - idx) * 3.5;
          return (
            <div
              key={idx}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[18px] bg-[#ede4d3] border border-[#2c241b]/40 shadow-md"
              style={{
                transform: `translate3d(${offset}px, ${offset * 1.15}px, -${(stackLayers - idx) * 8}px) rotateZ(${
                  (idx % 2 === 0 ? 1 : -1) * 0.7
                }deg)`,
                opacity: 0.65 + idx * 0.08,
              }}
            />
          );
        })}

        {/* Primary Interactive Card Button */}
        <button
          type="button"
          onClick={isFlipped && onExpandCard ? onExpandCard : onCardClick}
          disabled={isDrawing}
          aria-label={
            isFlipped
              ? `Carta ${currentCard} revelada. Toque para ampliar a carta`
              : 'Baralho COGU. Toque para puxar uma carta'
          }
          className={`group relative w-full h-full rounded-[18px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] cursor-pointer transition-transform ${
            isDrawing ? 'scale-[0.96] animate-shake-tension' : 'active:scale-[0.98]'
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transition: tilt.active
              ? 'transform 110ms cubic-bezier(0.16, 1, 0.3, 1)'
              : 'transform 560ms cubic-bezier(0.22, 1, 0.36, 1)',
            transform: `rotateX(${tilt.rx}deg) rotateY(${
              (isFlipped ? 180 : 0) + tilt.ry
            }deg)`,
          }}
        >
          {/* BACK FACE (61.png - Original COGU Back) */}
          <div
            className="absolute inset-0 w-full h-full rounded-[18px] overflow-hidden bg-[#f5efe6] shadow-[0_22px_50px_rgba(0,0,0,0.75)] border border-[#d4af37]/40"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <img
              src={backSrc}
              alt="Verso da carta COGU"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
            />
            {/* Dynamic Foil Glare Overlay */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={{
                opacity: tilt.active ? 0.32 : 0.12,
                background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255, 248, 220, 0.55), transparent 60%)`,
              }}
            />
          </div>

          {/* FRONT FACE (1..60.png - Original Authorial Card) */}
          <div
            className="absolute inset-0 w-full h-full rounded-[18px] overflow-hidden bg-[#f5efe6] shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-[#d4af37]/60"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <img
              src={frontSrc}
              alt={currentCard ? `Carta COGU número ${currentCard}` : 'Carta do jogo'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
            />
            {/* Dynamic Foil Glare Overlay on Revealed Card */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={{
                opacity: tilt.active ? 0.25 : 0.08,
                background: `radial-gradient(circle at ${100 - tilt.gx}% ${tilt.gy}%, rgba(255, 250, 230, 0.45), transparent 65%)`,
              }}
            />
          </div>
        </button>
      </div>
    </div>
  );
};
