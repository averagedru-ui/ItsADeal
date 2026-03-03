import React from 'react';
import { Player, PropertyColor } from '../types';
import { PROPERTY_SETS } from '../cards';
import { getCompleteSets, getRentAmount } from '../engine';

interface PropertyAreaProps {
  player: Player;
  compact?: boolean;
  onPropertyClick?: (color: PropertyColor, cardId: string, playerId: number) => void;
  highlightComplete?: boolean;
}

export const PropertyArea: React.FC<PropertyAreaProps> = ({ player, compact, onPropertyClick, highlightComplete }) => {
  const completeSets = getCompleteSets(player);
  const colors = (Object.keys(PROPERTY_SETS) as PropertyColor[]).filter(c => player.properties[c].length > 0);

  if (colors.length === 0) {
    return (
      <div className={`text-gray-500 text-xs ${compact ? 'py-1' : 'py-2'} text-center italic`}>
        No properties
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? '' : 'gap-1.5'}`}>
      {colors.map(color => {
        const setInfo = PROPERTY_SETS[color];
        const cards = player.properties[color];
        const isComplete = completeSets.includes(color);
        const rent = getRentAmount(player, color);

        return (
          <div
            key={color}
            className={`${compact ? 'px-1.5 py-1' : 'px-2 py-1.5'} rounded-lg border ${
              isComplete
                ? 'border-yellow-400 bg-yellow-500/10 shadow-sm shadow-yellow-500/20'
                : 'border-gray-600 bg-gray-800/50'
            } ${highlightComplete && isComplete ? 'ring-1 ring-yellow-400 animate-pulse' : ''}`}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <div className={`w-2.5 h-2.5 rounded-full ${setInfo.bgClass}`} />
              <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-white`}>
                {setInfo.label}
              </span>
              <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-400`}>
                {cards.length}/{setInfo.needed}
              </span>
              {isComplete && <span className="text-[10px]">&#x2B50;</span>}
            </div>
            <div className="flex flex-wrap gap-0.5">
              {cards.map(card => (
                <button
                  key={card.id}
                  onClick={onPropertyClick ? () => onPropertyClick(color, card.id, player.id) : undefined}
                  className={`${compact ? 'text-[8px] px-1 py-0' : 'text-[9px] px-1.5 py-0.5'} rounded bg-gradient-to-r ${
                    color === 'brown' ? 'from-amber-800 to-amber-900' :
                    color === 'blue' ? 'from-blue-600 to-blue-800' :
                    color === 'green' ? 'from-green-600 to-green-800' :
                    color === 'red' ? 'from-red-600 to-red-800' :
                    color === 'yellow' ? 'from-yellow-500 to-yellow-700' :
                    color === 'orange' ? 'from-orange-500 to-orange-700' :
                    color === 'pink' ? 'from-pink-500 to-pink-700' :
                    color === 'teal' ? 'from-teal-500 to-teal-700' :
                    color === 'purple' ? 'from-purple-600 to-purple-800' :
                    'from-gray-700 to-gray-900'
                  } text-white font-medium ${onPropertyClick ? 'hover:brightness-125 cursor-pointer active:scale-95' : 'cursor-default'}`}
                >
                  {card.name}
                </button>
              ))}
            </div>
            {!compact && (
              <div className="text-[9px] text-gray-400 mt-0.5">
                Rent: ${rent}M
                {player.hasHouse[color] && ' +🏡'}
                {player.hasHotel[color] && ' +🏨'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
