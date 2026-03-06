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
      <div className={`${small ? 'w-20 h-[6.5rem]' : 'w-24 h-[8.5rem] md:w-28 md:h-40'} rounded-xl border-2 border-gray-600 bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center shadow-md cursor-default select-none`}>
        <div className="text-2xl opacity-50">🃏</div>
      </div>
    );
  }

  const sizeClasses = small
    ? 'w-20 h-[6.5rem] text-[10px]'
    : 'w-24 h-[8.5rem] md:w-28 md:h-40 text-xs md:text-sm';
  const baseClasses = `${sizeClasses} rounded-xl border-2 flex flex-col overflow-hidden shadow-md select-none`;
  const interactiveClasses = onClick && !disabled
    ? 'cursor-pointer active:scale-95'
    : disabled ? 'opacity-50' : 'cursor-default';
  const selectedClasses = selected
    ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-900 scale-105 shadow-lg shadow-yellow-500/20'
    : '';

  if (card.type === 'money') {
    return (
      <div
        className={`${baseClasses} ${interactiveClasses} ${selectedClasses} border-emerald-500/80 bg-gradient-to-br from-emerald-700 to-emerald-950`}
        onClick={disabled ? undefined : onClick}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-1">
          <div className={`text-emerald-200 font-bold ${small ? 'text-lg' : 'text-xl md:text-3xl'}`}>{card.name}</div>
          <div className="text-emerald-400/70 text-[9px] uppercase font-semibold mt-0.5">Cash</div>
        </div>
        <div className="bg-emerald-950/60 text-emerald-300 text-center py-0.5 font-mono text-[10px]">
          ${card.value}M
        </div>
      </div>
    );
  }

  if (card.type === 'property') {
    const color = card.color!;
    return (
      <div
        className={`${baseClasses} ${interactiveClasses} ${selectedClasses} border-white/25 bg-gradient-to-br ${colorMap[color]}`}
        onClick={disabled ? undefined : onClick}
      >
        <div className={`bg-white/20 text-center py-0.5 ${textColorMap[color]} font-bold uppercase tracking-wide ${small ? 'text-[9px]' : 'text-[10px]'}`}>
          {PROPERTY_SETS[color].label}
        </div>
        <div className={`flex-1 flex items-center justify-center px-1.5 ${textColorMap[color]}`}>
          <span className={`font-semibold text-center leading-tight ${small ? 'text-[9px]' : 'text-xs'}`}>{card.name}</span>
        </div>
        <div className={`bg-black/30 text-white text-center py-0.5 font-mono ${small ? 'text-[9px]' : 'text-[10px]'}`}>
          ${card.value}M
        </div>
      </div>
    );
  }

  if (card.type === 'wildcard') {
    const colors = card.colors || [];
    return (
      <div
        className={`${baseClasses} ${interactiveClasses} ${selectedClasses} border-yellow-400/80 bg-gradient-to-br ${colors.length >= 2 ? colorMap[colors[0]] : 'from-gray-600 to-gray-800'}`}
        onClick={disabled ? undefined : onClick}
      >
        <div className={`bg-yellow-500 text-yellow-900 text-center py-0.5 font-bold uppercase tracking-wide ${small ? 'text-[9px]' : 'text-[10px]'}`}>
          Wild
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-1 gap-0.5">
          {colors.map(c => (
            <div key={c} className={`${textColorMap[c]} font-semibold ${small ? 'text-[9px]' : 'text-[10px]'}`}>{PROPERTY_SETS[c].label}</div>
          ))}
        </div>
        <div className={`bg-black/30 text-white text-center py-0.5 font-mono ${small ? 'text-[9px]' : 'text-[10px]'}`}>
          ${card.value}M
        </div>
      </div>
    );
  }

  if (card.type === 'action') {
    const actionColors: Record<string, string> = {
      pass_go: 'from-sky-600 to-sky-800 border-sky-400/80',
      debt_collector: 'from-rose-600 to-rose-800 border-rose-400/80',
      birthday: 'from-fuchsia-600 to-fuchsia-800 border-fuchsia-400/80',
      sly_deal: 'from-violet-600 to-violet-800 border-violet-400/80',
      forced_deal: 'from-amber-600 to-amber-800 border-amber-400/80',
      deal_breaker: 'from-red-700 to-red-900 border-red-400/80',
      just_say_no: 'from-cyan-600 to-cyan-800 border-cyan-400/80',
      rent: 'from-lime-600 to-lime-800 border-lime-400/80',
      wild_rent: 'from-lime-700 to-lime-900 border-lime-300/80',
      house: 'from-green-700 to-green-900 border-green-400/80',
      hotel: 'from-red-600 to-red-800 border-red-400/80',
      double_rent: 'from-yellow-600 to-yellow-800 border-yellow-400/80',
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
        <div className={`bg-white/15 text-white text-center py-0.5 font-bold uppercase tracking-wide ${small ? 'text-[8px]' : 'text-[9px]'}`}>
          Action
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-1 text-white">
          <div className={`${small ? 'text-base' : 'text-xl md:text-2xl'} mb-0.5`}>{actionEmoji[card.actionType || ''] || '⚡'}</div>
          <div className={`font-bold text-center leading-tight ${small ? 'text-[8px]' : 'text-[10px]'}`}>{card.name}</div>
        </div>
        <div className={`bg-black/30 text-white text-center py-0.5 font-mono ${small ? 'text-[9px]' : 'text-[10px]'}`}>
          ${card.value}M
        </div>
      </div>
    );
  }

  return null;
};
