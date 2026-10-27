import React from 'react';

export interface SpecimenTubeGraphicProps {
  capColor: string;
  capLabel?: string;
  tubeName?: string;
  liquidColor?: string;
  liquidTopColor?: string;
  hasGelSeparator?: boolean;
  fillPercent?: number; // 0 to 100
  title?: string;
  width?: number;
  height?: number;
  additive?: string;
  specimenType?: string;
  testsCount?: number;
  onClick?: () => void;
  className?: string;
}

// Standard Vacutainer Presets (Becton Dickinson / Greiner Bio-One Clinical Standard)
export const VACUTAINER_PRESETS: Record<string, {
  capColor: string;
  liquidColor: string;
  liquidTopColor: string;
  hasGelSeparator: boolean;
  specimenType: string;
  additive: string;
  stopperCoreColor: string;
  drawVolume: string;
}> = {
  lavender: {
    capColor: '#a855f7',
    liquidColor: '#6b0f1a',
    liquidTopColor: '#991b1b',
    hasGelSeparator: false,
    specimenType: 'Whole Blood (CBC / HbA1c)',
    additive: 'K2 EDTA 7.2mg',
    stopperCoreColor: '#7e22ce',
    drawVolume: '3.0 mL'
  },
  gold: {
    capColor: '#eab308',
    liquidColor: '#ca8a04',
    liquidTopColor: '#fef08a',
    hasGelSeparator: true,
    specimenType: 'Serum (LFT, KFT, Lipids)',
    additive: 'Silica Clot + Polymer Gel',
    stopperCoreColor: '#ca8a04',
    drawVolume: '5.0 mL'
  },
  grey: {
    capColor: '#94a3b8',
    liquidColor: '#881337',
    liquidTopColor: '#be123c',
    hasGelSeparator: false,
    specimenType: 'Plasma (Fasting Glucose)',
    additive: 'NaF / Potassium Oxalate',
    stopperCoreColor: '#64748b',
    drawVolume: '2.0 mL'
  },
  lightblue: {
    capColor: '#38bdf8',
    liquidColor: '#881337',
    liquidTopColor: '#be123c',
    hasGelSeparator: false,
    specimenType: 'Citrated Plasma (Coagulation PT/INR)',
    additive: 'Sodium Citrate 3.2%',
    stopperCoreColor: '#0284c7',
    drawVolume: '2.7 mL'
  },
  red: {
    capColor: '#ef4444',
    liquidColor: '#581c1c',
    liquidTopColor: '#b91c1c',
    hasGelSeparator: false,
    specimenType: 'Serum (Crossmatch, Immunology)',
    additive: 'Silica Particles Clot Activator',
    stopperCoreColor: '#dc2626',
    drawVolume: '4.0 mL'
  }
};

export const SpecimenTubeGraphic: React.FC<SpecimenTubeGraphicProps> = ({
  capColor: rawCapColor,
  capLabel,
  tubeName,
  liquidColor: rawLiquidColor,
  liquidTopColor: rawLiquidTopColor,
  hasGelSeparator: rawHasGelSeparator,
  fillPercent = 70,
  title,
  width = 38,
  height = 92,
  additive,
  specimenType,
  testsCount,
  onClick,
  className = ''
}) => {
  // Normalize color and preset detection
  const lowerName = `${tubeName || ''} ${capLabel || ''} ${rawCapColor || ''}`.toLowerCase();
  let presetKey = 'lavender';
  if (lowerName.includes('gold') || lowerName.includes('sst') || lowerName.includes('yellow')) {
    presetKey = 'gold';
  } else if (lowerName.includes('grey') || lowerName.includes('gray') || lowerName.includes('fluoride')) {
    presetKey = 'grey';
  } else if (lowerName.includes('blue') || lowerName.includes('citrate')) {
    presetKey = 'lightblue';
  } else if (lowerName.includes('red') || lowerName.includes('plain')) {
    presetKey = 'red';
  }

  const preset = VACUTAINER_PRESETS[presetKey];
  const capColor = rawCapColor || preset.capColor;
  const liquidColor = rawLiquidColor || preset.liquidColor;
  const liquidTopColor = rawLiquidTopColor || preset.liquidTopColor;
  const hasGelSeparator = rawHasGelSeparator !== undefined ? rawHasGelSeparator : preset.hasGelSeparator;
  const currentAdditive = additive || preset.additive;
  const currentType = specimenType || preset.specimenType;

  // Dimensional metrics for 4K precision rendering
  const tubeWidth = width;
  const tubeHeight = height;
  const capHeight = Math.max(18, Math.round(tubeHeight * 0.23));
  const bodyHeight = tubeHeight - capHeight;
  const clampedFill = Math.min(92, Math.max(25, fillPercent));
  const liquidHeight = Math.round((bodyHeight * clampedFill) / 100);
  const liquidTopY = tubeHeight - liquidHeight;
  const meniscusDepth = Math.max(3, tubeWidth * 0.14);

  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div 
      className={`specimenTubeContainer flex flex-col items-center group relative cursor-pointer select-none ${className}`}
      title={title || `${tubeName || capLabel || 'Vacutainer'} · ${currentType} · ${currentAdditive}`}
      onClick={onClick}
    >
      {/* 4K Medical Glass Specimen Vial Container */}
      <div className="relative flex items-center justify-center p-1.5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-700/60 shadow-xl group-hover:border-cyan-500/50 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-300">
        <svg
          width={tubeWidth}
          height={tubeHeight}
          viewBox={`0 0 ${tubeWidth} ${tubeHeight}`}
          className="filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            {/* 4K Glass Specular Reflection Highlight (Realistic multi-angle studio refraction) */}
            <linearGradient id={`glassShine-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="18%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.0" />
              <stop offset="82%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.45" />
            </linearGradient>

            {/* Glass Wall Outer Rim Gradient */}
            <linearGradient id={`glassWall-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="15%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="85%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
            </linearGradient>

            {/* Volumetric Liquid Vertical Gradient */}
            <linearGradient id={`liquidGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={liquidTopColor} stopOpacity="0.95" />
              <stop offset="40%" stopColor={liquidColor} stopOpacity="0.98" />
              <stop offset="100%" stopColor="#1a0404" stopOpacity="1" />
            </linearGradient>

            {/* SST Barrier Gel Separator Gradient (Silica Polymer with depth) */}
            <linearGradient id={`gelGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#e2e8f0" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#94a3b8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#475569" stopOpacity="0.95" />
            </linearGradient>

            {/* Hemogard Cap Cylindrical Shading with Rubber Texture */}
            <linearGradient id={`capGrad-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="25%" stopColor={capColor} stopOpacity="1" />
              <stop offset="75%" stopColor={capColor} stopOpacity="0.95" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
            </linearGradient>

            {/* Top Septum Recess Inner Shadow */}
            <radialGradient id={`septumGrad-${uniqueId}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
              <stop offset="70%" stopColor={capColor} stopOpacity="1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
            </radialGradient>

            {/* Clipping path for inner fluid inside glass barrel */}
            <clipPath id={`tubeClip-${uniqueId}`}>
              <path
                d={`M 4 ${capHeight} L ${tubeWidth - 4} ${capHeight} L ${tubeWidth - 4} ${tubeHeight - 8} Q ${tubeWidth - 4} ${tubeHeight} ${tubeWidth / 2} ${tubeHeight} Q 4 ${tubeHeight} 4 ${tubeHeight - 8} Z`}
              />
            </clipPath>
          </defs>

          {/* Tube Glass Barrel Background (Deep clinical back-drop) */}
          <path
            d={`M 4 ${capHeight} L ${tubeWidth - 4} ${capHeight} L ${tubeWidth - 4} ${tubeHeight - 8} Q ${tubeWidth - 4} ${tubeHeight} ${tubeWidth / 2} ${tubeHeight} Q 4 ${tubeHeight} 4 ${tubeHeight - 8} Z`}
            fill="#050811"
            stroke="url(#glassWall-${uniqueId})"
            strokeWidth="1.5"
          />

          {/* Inner Silica Droplets (Micro Clot Activator Spray on Glass Wall) */}
          <circle cx="8" cy={capHeight + 6} r="0.7" fill="rgba(255,255,255,0.4)" />
          <circle cx="12" cy={capHeight + 11} r="0.6" fill="rgba(255,255,255,0.3)" />
          <circle cx={tubeWidth - 10} cy={capHeight + 8} r="0.8" fill="rgba(255,255,255,0.35)" />
          <circle cx={tubeWidth - 8} cy={capHeight + 15} r="0.5" fill="rgba(255,255,255,0.4)" />

          {/* Fluid and Meniscus Group (Clipped to glass tube) */}
          <g clipPath={`url(#tubeClip-${uniqueId})`}>
            {/* Liquid Column Body */}
            <rect
              x="4"
              y={liquidTopY}
              width={tubeWidth - 8}
              height={liquidHeight}
              fill={`url(#liquidGrad-${uniqueId})`}
            />

            {/* Physical Concave Surface Meniscus Curve (Wetting tension) */}
            <path
              d={`M 4 ${liquidTopY} Q ${tubeWidth / 2} ${liquidTopY + meniscusDepth} ${tubeWidth - 4} ${liquidTopY}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="1.2"
            />
            {/* Soft meniscus glow highlight */}
            <path
              d={`M 4 ${liquidTopY} Q ${tubeWidth / 2} ${liquidTopY + meniscusDepth} ${tubeWidth - 4} ${liquidTopY} L ${tubeWidth - 4} ${liquidTopY + meniscusDepth} L 4 ${liquidTopY + meniscusDepth} Z`}
              fill="rgba(255, 255, 255, 0.18)"
            />

            {/* Optional SST Gel Barrier Layer (Silica Polymer Density Separation) */}
            {hasGelSeparator && (
              <g>
                <rect
                  x="4"
                  y={tubeHeight - Math.round(liquidHeight * 0.48)}
                  width={tubeWidth - 8}
                  height={Math.max(6, Math.round(tubeHeight * 0.09))}
                  fill={`url(#gelGrad-${uniqueId})`}
                />
                {/* Gel upper boundary curve */}
                <path
                  d={`M 4 ${tubeHeight - Math.round(liquidHeight * 0.48)} Q ${tubeWidth / 2} ${tubeHeight - Math.round(liquidHeight * 0.48) + 1.8} ${tubeWidth - 4} ${tubeHeight - Math.round(liquidHeight * 0.48)}`}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.85)"
                  strokeWidth="1"
                />
                {/* Lower Red Cell Boundary */}
                <path
                  d={`M 4 ${tubeHeight - Math.round(liquidHeight * 0.48) + Math.max(6, Math.round(tubeHeight * 0.09))} Q ${tubeWidth / 2} ${tubeHeight - Math.round(liquidHeight * 0.48) + Math.max(6, Math.round(tubeHeight * 0.09)) + 1.5} ${tubeWidth - 4} ${tubeHeight - Math.round(liquidHeight * 0.48) + Math.max(6, Math.round(tubeHeight * 0.09))}`}
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.6)"
                  strokeWidth="0.8"
                />
              </g>
            )}

            {/* Laboratory Clinical Barcode & Volume Gauge Label */}
            <g opacity="0.65">
              <rect
                x="6"
                y={capHeight + 14}
                width={tubeWidth - 12}
                height={Math.round(bodyHeight * 0.32)}
                rx="1"
                fill="rgba(255, 255, 255, 0.12)"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="0.5"
              />
              {/* Mini 2D Barcode lines */}
              <line x1="8" y1={capHeight + 18} x2="8" y2={capHeight + 30} stroke="#ffffff" strokeWidth="1" opacity="0.7" />
              <line x1="11" y1={capHeight + 18} x2="11" y2={capHeight + 30} stroke="#ffffff" strokeWidth="0.6" opacity="0.6" />
              <line x1="13" y1={capHeight + 18} x2="13" y2={capHeight + 30} stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
              <line x1="16" y1={capHeight + 18} x2="16" y2={capHeight + 30} stroke="#ffffff" strokeWidth="0.7" opacity="0.6" />
              <line x1="19" y1={capHeight + 18} x2="19" y2={capHeight + 30} stroke="#ffffff" strokeWidth="1" opacity="0.7" />
            </g>

            {/* Frosted Etched Minimum Fill Level Indicator Mark */}
            <line
              x1="5"
              y1={capHeight + Math.round(bodyHeight * 0.22)}
              x2="15"
              y2={capHeight + Math.round(bodyHeight * 0.22)}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="0.9"
              strokeDasharray="2,1.5"
            />
            {/* Fill Triangle Indicator */}
            <polygon
              points={`16,${capHeight + Math.round(bodyHeight * 0.22) - 2} 19,${capHeight + Math.round(bodyHeight * 0.22)} 16,${capHeight + Math.round(bodyHeight * 0.22) + 2}`}
              fill="rgba(255, 255, 255, 0.7)"
            />
          </g>

          {/* Glass Specular Highlight Overlay (Cylindrical refraction shine) */}
          <path
            d={`M 4 ${capHeight} L ${tubeWidth - 4} ${capHeight} L ${tubeWidth - 4} ${tubeHeight - 8} Q ${tubeWidth - 4} ${tubeHeight} ${tubeWidth / 2} ${tubeHeight} Q 4 ${tubeHeight} 4 ${tubeHeight - 8} Z`}
            fill={`url(#glassShine-${uniqueId})`}
            pointerEvents="none"
          />

          {/* Hemogard™ Precision Safety Vacuum Cap with Ribbed Grips */}
          <g>
            {/* Top Fluted Rim Flange */}
            <rect 
              x="2" 
              y="1.5" 
              width={tubeWidth - 4} 
              height="4.5" 
              rx="2" 
              fill={`url(#capGrad-${uniqueId})`} 
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="0.8"
            />

            {/* Molded Center Septum Target Ring (Needle Puncture Zone) */}
            <circle
              cx={tubeWidth / 2}
              cy="3.8"
              r="2.4"
              fill={`url(#septumGrad-${uniqueId})`}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="0.5"
            />

            {/* Main Cap Cylinder Body */}
            <rect 
              x="3" 
              y="5.5" 
              width={tubeWidth - 6} 
              height={capHeight - 5.5} 
              rx="1.5" 
              fill={`url(#capGrad-${uniqueId})`} 
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="0.5"
            />

            {/* Vertical Non-Slip Ribbed Grips on Rubber Cap */}
            <line x1={tubeWidth * 0.28} y1="6" x2={tubeWidth * 0.28} y2={capHeight - 2} stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
            <line x1={tubeWidth * 0.42} y1="6" x2={tubeWidth * 0.42} y2={capHeight - 2} stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
            <line x1={tubeWidth * 0.58} y1="6" x2={tubeWidth * 0.58} y2={capHeight - 2} stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
            <line x1={tubeWidth * 0.72} y1="6" x2={tubeWidth * 0.72} y2={capHeight - 2} stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />

            {/* Rubber Stopper Inner Ring Shadow over Glass Entry */}
            <rect 
              x="4.5" 
              y={capHeight - 3} 
              width={tubeWidth - 9} 
              height="3" 
              fill="rgba(0, 0, 0, 0.65)" 
            />

            {/* Cap Specular Highlight Bar (Reflective curve highlight) */}
            <rect 
              x="5" 
              y="3" 
              width="2.5" 
              height={capHeight - 4} 
              rx="1" 
              fill="rgba(255, 255, 255, 0.55)" 
            />
          </g>
        </svg>
      </div>

      {/* Cap Label & Details */}
      {(capLabel || tubeName) && (
        <div className="flex flex-col items-center text-center mt-1.5 max-w-[100px]">
          <span 
            className="text-[10px] font-mono font-bold leading-tight truncate px-2 py-0.5 rounded shadow-sm"
            style={{ 
              color: capColor,
              backgroundColor: `${capColor}20`,
              border: `1px solid ${capColor}45`
            }}
          >
            {capLabel || tubeName}
          </span>
          {testsCount !== undefined && (
            <span className="text-[9.5px] text-slate-400 mt-0.5 font-medium">
              {testsCount} {testsCount === 1 ? 'Test' : 'Tests'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SpecimenTubeGraphic;
