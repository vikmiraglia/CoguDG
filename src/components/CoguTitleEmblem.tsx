import React from 'react';

export const CoguTitleEmblem: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 360 110"
        className="w-56 sm:w-64 h-auto overflow-visible"
        role="img"
        aria-label="Emblema COGU"
      >
        <defs>
          <linearGradient id="coguGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5e6b3" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#9a7b1c" />
          </linearGradient>
        </defs>

        {/* Decorative Celestial Arch & Crescent */}
        <path
          d="M 50 92 L 130 92 M 230 92 L 310 92"
          stroke="url(#coguGold)"
          strokeWidth="1.2"
          strokeDasharray="4 4"
          opacity="0.6"
        />

        {/* Center Mushroom & Crescent Crest */}
        <g transform="translate(180, 18)">
          {/* Crescent Moon */}
          <path
            d="M -6 -10 A 12 12 0 1 0 10 6 A 9 9 0 1 1 -6 -10 Z"
            fill="url(#coguGold)"
          />
          {/* Left & Right Stars */}
          <path
            d="M -38 4 L -35 10 L -29 13 L -35 16 L -38 22 L -41 16 L -47 13 L -41 10 Z"
            fill="#d4af37"
            opacity="0.85"
          />
          <path
            d="M 38 4 L 41 10 L 47 13 L 41 16 L 38 22 L 35 16 L 29 13 L 35 10 Z"
            fill="#d4af37"
            opacity="0.85"
          />
        </g>

        {/* COGU Engraved Serif Display Lockup */}
        <text
          x="180"
          y="78"
          textAnchor="middle"
          fill="#f5efe6"
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 900,
            fontSize: '56px',
            letterSpacing: '0.12em',
          }}
        >
          COGU
        </text>

        {/* Subtle Botanical Flourish Under Wordmark */}
        <g transform="translate(180, 92)">
          <circle cx="0" cy="0" r="3.5" fill="#d4af37" />
          <circle cx="-18" cy="0" r="2" fill="#d4af37" opacity="0.7" />
          <circle cx="18" cy="0" r="2" fill="#d4af37" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
};
