import React from 'react';
import { motion } from 'framer-motion';
import { useCardGame } from '../useCardGame';
import { CardComponent } from './CardComponent';

export const TableCenter: React.FC = () => {
  const drawPile = useCardGame(s => s.drawPile);
  const discardPile = useCardGame(s => s.discardPile);
  const phase = useCardGame(s => s.phase);
  const currentPlayerIndex = useCardGame(s => s.currentPlayerIndex);
  const myPlayerIndex = useCardGame(s => s.myPlayerIndex);
  const draw = useCardGame(s => s.draw);

  const isMyTurn = currentPlayerIndex === myPlayerIndex;
  const canDraw = isMyTurn && phase === 'draw';
  const topDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  return (
    <div className="flex items-center justify-center gap-6 md:gap-10 py-2">
      <div className="flex flex-col items-center gap-1">
        <div
          className={`relative ${canDraw ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={canDraw ? draw : undefined}
        >
          {drawPile.length > 0 ? (
            <>
              <div className="absolute top-1 left-0.5 w-16 h-[5.5rem] md:w-20 md:h-28 rounded-lg bg-indigo-950 border border-gray-700 opacity-60" />
              <div className="absolute top-0.5 left-0.5 w-16 h-[5.5rem] md:w-20 md:h-28 rounded-lg bg-indigo-900 border border-gray-600 opacity-80" />
              <div className={`relative w-16 h-[5.5rem] md:w-20 md:h-28 rounded-lg border-2 bg-gradient-to-br from-indigo-800 to-purple-900 flex flex-col items-center justify-center shadow-lg ${
                canDraw ? 'border-yellow-400 shadow-yellow-500/30' : 'border-gray-600'
              }`}>
                <div className="text-2xl md:text-3xl opacity-60">🃏</div>
                <div className="text-white text-[10px] md:text-xs font-bold mt-1">{drawPile.length}</div>
              </div>
              {canDraw && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-lg border-2 border-yellow-400 pointer-events-none"
                />
              )}
            </>
          ) : (
            <div className="w-16 h-[5.5rem] md:w-20 md:h-28 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center">
              <span className="text-gray-600 text-[10px]">Empty</span>
            </div>
          )}
        </div>
        <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Draw</span>
        {canDraw && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-yellow-400 text-[10px] font-bold animate-pulse"
          >
            Tap to draw
          </motion.span>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          {topDiscard ? (
            <div className="scale-[0.8] md:scale-[0.85] origin-top">
              <CardComponent card={topDiscard} small />
            </div>
          ) : (
            <div className="w-16 h-[5.5rem] md:w-20 md:h-28 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center">
              <span className="text-gray-600 text-[10px]">Empty</span>
            </div>
          )}
        </div>
        <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">
          Discard {discardPile.length > 0 && `(${discardPile.length})`}
        </span>
      </div>
    </div>
  );
};
