import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'large' | 'simple';
}

const Logo: React.FC<LogoProps> = ({ className = "", showText = true, variant = 'default' }) => {
  const iconSize = variant === 'large' ? "w-32 h-32 md:w-40 md:h-40" : "w-10 h-10";
  const textSize = variant === 'large' ? "text-4xl md:text-6xl" : "text-xl";
  const subTextSize = variant === 'large' ? "text-xl md:text-2xl" : "text-xs";
  
  return (
    <div className={`flex items-center gap-3 ${variant === 'large' ? 'flex-col justify-center' : ''} ${className}`}>
      {/* Icon Graphic - Cyber Brain Shield */}
      <div className={`relative ${iconSize} shrink-0`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">
          <defs>
            <linearGradient id="cyber-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" /> {/* Violet */}
              <stop offset="100%" stopColor="#3B82F6" /> {/* Blue */}
            </linearGradient>
            <filter id="neon-glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Shield Base */}
          <path d="M50 5 L90 20 V50 C90 75 50 95 50 95 C50 95 10 75 10 50 V20 L50 5 Z" fill="#0f172a" stroke="url(#cyber-gradient)" strokeWidth="2" />
          
          {/* Brain Circuitry */}
          <path d="M50 25 C65 25 75 35 75 50 C75 65 60 70 50 80 C40 70 25 65 25 50 C25 35 35 25 50 25" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
          <path d="M50 25 V45" stroke="#6366f1" strokeWidth="2" />
          <path d="M35 50 H65" stroke="#6366f1" strokeWidth="2" />
          <circle cx="50" cy="50" r="5" fill="#eab308" filter="url(#neon-glow)" />
          
          {/* Tech Nodes */}
          <circle cx="25" cy="50" r="2" fill="#3B82F6" />
          <circle cx="75" cy="50" r="2" fill="#3B82F6" />
          <circle cx="50" cy="25" r="2" fill="#3B82F6" />
        </svg>
      </div>

      {/* Text Logo */}
      {showText && (
        <div className={`flex flex-col ${variant === 'large' ? 'items-center mt-4' : 'items-start'}`}>
          <h1 className={`font-black uppercase tracking-wider text-white ${textSize} brand-font`}>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white">
              MESTRE
            </span>
            <span className="ml-2 text-white">SABER</span>
          </h1>
          <span className={`font-medium text-blue-400 tracking-[0.4em] uppercase ${subTextSize}`}>
            ARENA MENTAL
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;