"use client";

import React from "react";

interface PosterRingProps {
  className?: string;
}

export default function PosterRing({ className = "w-44 h-44" }: PosterRingProps) {
  const segments = 32;
  const cx = 150;
  const cy = 150;

  const rInner = 58;
  const rMid = 96;
  const rOuter = 136;

  const createSectorPath = (
    innerRadius: number,
    outerRadius: number,
    startAngleDeg: number,
    endAngleDeg: number
  ) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const startRad = toRad(startAngleDeg);
    const endRad = toRad(endAngleDeg);

    const x1 = cx + innerRadius * Math.cos(startRad);
    const y1 = cy + innerRadius * Math.sin(startRad);
    const x2 = cx + outerRadius * Math.cos(startRad);
    const y2 = cy + outerRadius * Math.sin(startRad);
    const x3 = cx + outerRadius * Math.cos(endRad);
    const y3 = cy + outerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(endRad);
    const y4 = cy + innerRadius * Math.sin(endRad);

    return [
      `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      `L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      `A ${outerRadius} ${outerRadius} 0 0 1 ${x3.toFixed(2)} ${y3.toFixed(2)}`,
      `L ${x4.toFixed(2)} ${y4.toFixed(2)}`,
      `A ${innerRadius} ${innerRadius} 0 0 0 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      "Z",
    ].join(" ");
  };

  const step = 360 / segments;

  return (
    <div className={`relative select-none ${className}`} aria-hidden="true">
      {/* Subtle warm ambient glow behind the ring */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#e57347]/20 to-[#f3c68f]/20 blur-2xl" />

      <svg
        viewBox="0 0 300 300"
        className="w-full h-full animate-[spin_28s_linear_infinite]"
      >
        <defs>
          <linearGradient
            id="ssfPosterRingGrad"
            x1="15%"
            y1="15%"
            x2="85%"
            y2="85%"
          >
            <stop offset="0%" stopColor="#e26d42" />
            <stop offset="50%" stopColor="#ea9663" />
            <stop offset="100%" stopColor="#f4ca92" />
          </linearGradient>
        </defs>

        <g fill="url(#ssfPosterRingGrad)">
          {Array.from({ length: segments }).map((_, i) => {
            const start = i * step;
            const end = (i + 1) * step - 0.35;

            // Alternating staggered checkerboard between outer and inner rings
            if (i % 2 === 0) {
              return (
                <path
                  key={`outer-${i}`}
                  d={createSectorPath(rMid, rOuter, start, end)}
                />
              );
            }
            return (
              <path
                key={`inner-${i}`}
                d={createSectorPath(rInner, rMid, start, end)}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}