import React from 'react';
import { PrizeLevel } from '../types';

interface PrizeLadderProps {
  currentLevel: number; // 0 to 15
  prizes: PrizeLevel[];
}

const PrizeLadder: React.FC<PrizeLadderProps> = ({ currentLevel, prizes }) => {
  // Show only a subset on mobile, all on desktop
  // We want to reverse it so the top prize is at the top
  const reversedPrizes = [...prizes].reverse();

  return (
    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-600 shadow-lg w-full max-w-xs mx-auto lg:mx-0 max-h-[300px] lg:max-h-[600px] overflow-y-auto custom-scrollbar">
      <h3 className="text-yellow-400 font-bold text-center mb-2 uppercase tracking-wider border-b border-slate-600 pb-2">Prêmios</h3>
      <div className="space-y-1">
        {reversedPrizes.map((prize) => {
          const isCurrent = prize.level === currentLevel + 1;
          const isPast = prize.level <= currentLevel;
          
          return (
            <div 
              key={prize.level}
              className={`flex justify-between items-center px-3 py-1 rounded ${
                isCurrent 
                  ? 'bg-yellow-600 text-white font-bold animate-pulse' 
                  : isPast 
                    ? 'bg-green-900/50 text-green-400' 
                    : 'text-slate-400'
              }`}
            >
              <span className="text-xs mr-2">{prize.level}</span>
              <span className={`${isCurrent ? 'text-lg' : 'text-sm'}`}>
                R$ {prize.value.toLocaleString('pt-BR')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrizeLadder;