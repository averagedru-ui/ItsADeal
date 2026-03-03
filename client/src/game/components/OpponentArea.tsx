import React from 'react';
import { Player, PropertyColor } from '../types';
import { PropertyArea } from './PropertyArea';
import { getCompleteSets, getTotalBankValue } from '../engine';

interface OpponentAreaProps {
  player: Player;
  isCurrentTurn: boolean;
  onPropertyClick?: (color: PropertyColor, cardId: string, playerId: number) => void;
}

export const OpponentArea: React.FC<OpponentAreaProps> = ({ player, isCurrentTurn, onPropertyClick }) => {
  const completeSets = getCompleteSets(player);
  const bankValue = getTotalBankValue(player);

  return (
    <div className={`rounded-xl border p-2 md:p-3 transition-all ${
      isCurrentTurn
        ? 'border-yellow-500 bg-yellow-500/5 shadow-md shadow-yellow-500/10'
        : 'border-gray-700 bg-gray-800/40'
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
            isCurrentTurn ? 'bg-yellow-500 text-yellow-900' : 'bg-gray-700 text-gray-300'
          }`}>
            {player.name[0]}
          </div>
          <div>
            <span className="text-white text-sm font-semibold">{player.name}</span>
            {isCurrentTurn && <span className="text-yellow-400 text-[10px] ml-1.5 animate-pulse">PLAYING</span>}
          </div>
        </div>
        <div className="flex gap-2 text-[10px] md:text-xs">
          <span className="text-gray-400">
            🃏 {player.hand.length}
          </span>
          <span className="text-emerald-400">
            💰 ${bankValue}M
          </span>
          <span className="text-yellow-400">
            ⭐ {completeSets.length}/3
          </span>
        </div>
      </div>
      <PropertyArea player={player} compact onPropertyClick={onPropertyClick} />
    </div>
  );
};
