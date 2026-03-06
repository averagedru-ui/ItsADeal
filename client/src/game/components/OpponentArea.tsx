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
      <div className="flex items-center justify-between mb-2">
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
        <div className="flex gap-2 text-[10px] md:text-xs items-center">
          <span className="text-yellow-400 font-bold">
            {completeSets.length}/3
          </span>
        </div>
      </div>

      <PropertyArea player={player} compact onPropertyClick={onPropertyClick} />

      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-700/50">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 text-[10px]">Bank:</span>
          {player.bank.length > 0 ? (
            <div className="flex items-center">
              {player.bank.slice(0, 8).map((card, i) => (
                <div
                  key={card.id}
                  className="w-7 h-10 md:w-8 md:h-11 rounded border border-emerald-600/60 bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center shadow-sm text-emerald-300 text-[8px] md:text-[9px] font-bold"
                  style={{ marginLeft: i > 0 ? '-4px' : 0, zIndex: i }}
                >
                  ${card.value}M
                </div>
              ))}
              {player.bank.length > 8 && (
                <span className="text-gray-500 text-[9px] ml-1">+{player.bank.length - 8}</span>
              )}
            </div>
          ) : (
            <span className="text-gray-600 text-[10px] italic">Empty</span>
          )}
          <span className="text-emerald-400 text-[10px] font-bold ml-1">${bankValue}M</span>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex">
            {Array.from({ length: Math.min(player.hand.length, 5) }).map((_, i) => (
              <div
                key={i}
                className="w-4 h-6 rounded-sm bg-gradient-to-br from-indigo-800 to-purple-900 border border-gray-600"
                style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: i }}
              />
            ))}
          </div>
          <span className="text-gray-400 text-[10px]">{player.hand.length}</span>
        </div>
      </div>
    </div>
  );
};
