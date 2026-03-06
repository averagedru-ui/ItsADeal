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

const colorGradients: Record<PropertyColor, string> = {
  brown: 'from-amber-800 to-amber-900',
  blue: 'from-blue-500 to-blue-700',
  green: 'from-green-500 to-green-700',
  red: 'from-red-500 to-red-700',
  yellow: 'from-yellow-400 to-yellow-600',
  orange: 'from-orange-400 to-orange-600',
  pink: 'from-pink-400 to-pink-600',
  teal: 'from-teal-400 to-teal-600',
  purple: 'from-purple-500 to-purple-700',
  black: 'from-gray-600 to-gray-800',
};

const textColors: Record<PropertyColor, string> = {
  brown: 'text-amber-100',
  blue: 'text-blue-100',
  green: 'text-green-100',
  red: 'text-red-100',
  yellow: 'text-yellow-900',
  orange: 'text-orange-100',
  pink: 'text-pink-100',
  teal: 'text-teal-100',
  purple: 'text-purple-100',
  black: 'text-gray-100',
};

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

  const cardW = compact ? 'w-12 md:w-14' : 'w-16 md:w-20';
  const cardH = compact ? 'h-16 md:h-20' : 'h-[5.5rem] md:h-28';
  const headerText = compact ? 'text-[7px] md:text-[8px]' : 'text-[8px] md:text-[10px]';
  const nameText = compact ? 'text-[6px] md:text-[7px]' : 'text-[7px] md:text-[9px]';
  const valueText = compact ? 'text-[6px]' : 'text-[7px] md:text-[8px]';
  const overlapOffset = compact ? 14 : 20;

  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {colors.map(color => {
        const setInfo = PROPERTY_SETS[color];
        const cards = player.properties[color];
        const isComplete = completeSets.includes(color);
        const rent = getRentAmount(player, color);
        const stackWidth = cards.length > 1
          ? `calc(${compact ? '3rem' : '4rem'} + ${(cards.length - 1) * overlapOffset}px)`
          : undefined;

        return (
          <div key={color} className="flex flex-col items-start">
            <div
              className={`relative rounded-lg p-0.5 ${
                isComplete
                  ? 'ring-2 ring-yellow-400 shadow-md shadow-yellow-500/20'
                  : ''
              } ${highlightComplete && isComplete ? 'animate-pulse' : ''}`}
              style={{ width: stackWidth, minWidth: compact ? '3rem' : '4rem' }}
            >
              <div className="relative overflow-hidden" style={{ height: compact ? '4rem' : '5.5rem' }}>
                {cards.map((card, i) => (
                  <div
                    key={card.id}
                    className={`absolute top-0 ${cardW} ${cardH} rounded-md border bg-gradient-to-br ${colorGradients[color]} shadow-md flex flex-col overflow-hidden ${
                      isComplete ? 'border-yellow-400/60' : 'border-white/20'
                    } ${onPropertyClick ? 'cursor-pointer hover:brightness-125 hover:-translate-y-0.5 transition-all' : ''}`}
                    style={{ left: `${i * overlapOffset}px`, zIndex: i }}
                    onClick={onPropertyClick ? () => onPropertyClick(color, card.id, player.id) : undefined}
                  >
                    <div className={`bg-white/20 text-center py-px ${headerText} ${textColors[color]} font-bold uppercase tracking-wide truncate px-0.5`}>
                      {card.type === 'wildcard' ? 'WILD' : setInfo.label}
                    </div>
                    <div className={`flex-1 flex items-center justify-center px-0.5 ${nameText} ${textColors[color]} font-semibold text-center leading-tight`}>
                      {card.type === 'wildcard' ? 'Wild' : card.name}
                    </div>
                    <div className={`bg-black/30 text-white text-center py-px ${valueText} font-mono`}>
                      ${card.value}M
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 mt-0.5 px-0.5">
              <span className={`${compact ? 'text-[8px]' : 'text-[9px]'} text-gray-400`}>
                {cards.length}/{setInfo.needed}
              </span>
              {isComplete && <span className="text-[8px]">&#x2B50;</span>}
              {!compact && (
                <span className="text-[8px] text-gray-500">
                  ${rent}M
                  {player.hasHouse[color] && ' 🏡'}
                  {player.hasHotel[color] && ' 🏨'}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
