import React from 'react';
import { Card, PropertyColor } from '../types';
import { PROPERTY_SETS } from '../cards';

interface CardComponentProps {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
  faceDown?: boolean;
  disabled?: boolean;
}

const colorMap: Record<PropertyColor, string> = {
  brown: 'from-amber-800 to-amber-900',
  blue: 'from-blue-500 to-blue-700',
  green: 'from-green-500 to-green-700',
  red: 'from-red-500 to-red-700',
  yellow: 'from-yellow-400 to-yellow-600',
  orange: 'from-orange-400 to-orange-600',
  pink: 'from-pink-400 to-pink-600',
  teal: 'from-teal-400 to-teal-600',
  purple: 'from-purple-500 to-purple-700',
  black: 'from-gray-700 to-gray-900',
};

const textColorMap: Record<PropertyColor, string> = {
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

export const CardComponent: React.FC<CardComponentProps> = ({ card, onClick, selected, small, faceDown, disabled }) => {
  if (faceDown) {
    return (
      <div className={`${small ? 'w-14 h-20 md:w-16 md:h-24' : 'w-20 h-28 md:w-24 md:h-36'} rounded-lg border-2 border-gray-600 bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center shadow-md cursor-default select-none`}>
        <div className="text-2xl md:text-3xl opacity-50">🃏</div>
      </div>
    );
  }

  const baseClasses = `${small ? 'w-14 h-20 md:w-16 md:h-24 text-[9px] md:text-[10px]' : 'w-20 h-28 md:w-24 md:h-36 text-[10px] md:text-xs'} rounded-lg border-2 flex flex-col overflow-hidden shadow-md transition-all duration-150 select-none`;
  const interactiveClasses = onClick && !disabled
    ? 'cursor-pointer hover:scale-105 hover:-translate-y-1 hover:shadow-lg active:scale-95'
    : disabled ? 'cursor-not-allowed opacity-50' : 'cursor-default';
  const selectedClasses = selected ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-gray-900 -translate-y-2 scale-105' : '';

  if (card.type === 'money') {
    return (
      <div
        className={`${baseClasses} ${interactiveClasses} ${selectedClasses} border-emerald-600 bg-gradient-to-br from-emerald-800 to-emerald-950`}
        onClick={disabled ? undefined : onClick}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-1">
          <div className="text-emerald-300 font-bold text-lg md:text-2xl">{card.name}</div>
          <div className="text-emerald-400 mt-1 opacity-80">CASH</div>
        </div>
        <div className="bg-emerald-950/50 text-emerald-300 text-center py-0.5 font-mono">
          ${card.value}M
        </div>
      </div>
    );
  }

  if (card.type === 'property') {
    const color = card.color!;
    return (
      <div
        className={`${baseClasses} ${interactiveClasses} ${selectedClasses} border-white/30 bg-gradient-to-br ${colorMap[color]}`}
        onClick={disabled ? undefined : onClick}
      >
        <div className={`bg-white/20 text-center py-0.5 ${textColorMap[color]} font-bold uppercase tracking-wide`}>
          {PROPERTY_SETS[color].label}
        </div>
        <div className={`flex-1 flex items-center justify-center px-1 ${textColorMap[color]}`}>
          <span className="font-semibold text-center leading-tight">{card.name}</span>
        </div>
        <div className="bg-black/30 text-white text-center py-0.5 font-mono">
          ${card.value}M
        </div>
      </div>
    );
  }

  if (card.type === 'wildcard') {
    const colors = card.colors || [];
    return (
      <div
        className={`${baseClasses} ${interactiveClasses} ${selectedClasses} border-yellow-400 bg-gradient-to-br ${colors.length >= 2 ? colorMap[colors[0]] : 'from-gray-600 to-gray-800'}`}
        onClick={disabled ? undefined : onClick}
      >
        <div className="bg-yellow-500 text-yellow-900 text-center py-0.5 font-bold uppercase tracking-wide">
          WILD
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-1">
          {colors.map(c => (
            <div key={c} className={`${textColorMap[c]} font-semibold`}>{PROPERTY_SETS[c].label}</div>
          ))}
        </div>
        <div className="bg-black/30 text-white text-center py-0.5 font-mono">
          ${card.value}M
        </div>
      </div>
    );
  }

  if (card.type === 'action') {
    const actionColors: Record<string, string> = {
      pass_go: 'from-sky-600 to-sky-800 border-sky-400',
      debt_collector: 'from-rose-600 to-rose-800 border-rose-400',
      birthday: 'from-fuchsia-600 to-fuchsia-800 border-fuchsia-400',
      sly_deal: 'from-violet-600 to-violet-800 border-violet-400',
      forced_deal: 'from-amber-600 to-amber-800 border-amber-400',
      deal_breaker: 'from-red-700 to-red-900 border-red-400',
      just_say_no: 'from-cyan-600 to-cyan-800 border-cyan-400',
      rent: 'from-lime-600 to-lime-800 border-lime-400',
      wild_rent: 'from-lime-700 to-lime-900 border-lime-300',
      house: 'from-green-700 to-green-900 border-green-400',
      hotel: 'from-red-600 to-red-800 border-red-400',
      double_rent: 'from-yellow-600 to-yellow-800 border-yellow-400',
    };

    const actionEmoji: Record<string, string> = {
      pass_go: '🎯',
      debt_collector: '💰',
      birthday: '🎂',
      sly_deal: '🤏',
      forced_deal: '🔄',
      deal_breaker: '💎',
      just_say_no: '🚫',
      rent: '🏠',
      wild_rent: '🏘️',
      house: '🏡',
      hotel: '🏨',
      double_rent: '⚡',
    };

    return (
      <div
        className={`${baseClasses} ${interactiveClasses} ${selectedClasses} bg-gradient-to-br ${actionColors[card.actionType || ''] || 'from-gray-600 to-gray-800 border-gray-400'}`}
        onClick={disabled ? undefined : onClick}
      >
        <div className="bg-white/20 text-white text-center py-0.5 font-bold uppercase tracking-wide">
          ACTION
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-1 text-white">
          <div className="text-lg md:text-xl mb-0.5">{actionEmoji[card.actionType || ''] || '⚡'}</div>
          <div className="font-bold text-center leading-tight">{card.name}</div>
          {!small && (
            <div className="text-[8px] md:text-[9px] opacity-75 text-center mt-0.5 leading-tight px-0.5">
              {card.description}
            </div>
          )}
        </div>
        <div className="bg-black/30 text-white text-center py-0.5 font-mono">
          ${card.value}M
        </div>
      </div>
    );
  }

  return null;
};
