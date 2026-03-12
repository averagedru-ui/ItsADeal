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
    <div className="flex items-center justify-center gap-6 py-2 mx-auto">
      {/* Draw pile */}
      <div className="flex flex-col items-center gap-0.5">
        <button
          type="button"
          className={`relative ${canDraw ? 'cursor-pointer' : ''}`}
          onClick={() => { if (canDraw) draw(); }}
          disabled={!canDraw}
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          {drawPile.length > 0 ? (
            <>
              <div className="absolute top-0.5 left-0.5 w-[4.5rem] h-[6rem] rounded-xl bg-indigo-950/80 border border-gray-700/50 pointer-events-none" />
              <div className={`relative z-10 w-[4.5rem] h-[6rem] rounded-xl border-2 bg-gradient-to-br from-indigo-800 to-purple-900 flex flex-col items-center justify-center shadow-md pointer-events-none ${
                canDraw ? 'border-yellow-400 shadow-yellow-500/20' : 'border-gray-600/60'
              }`}>
                <div className="text-lg opacity-50">🃏</div>
                <div className="text-white text-[10px] font-bold mt-0.5">{drawPile.length}</div>
              </div>
              {canDraw && (
                <motion.div
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-xl border-2 border-yellow-400 pointer-events-none z-20"
                />
              )}
            </>
          ) : (
            <div className="w-[4.5rem] h-[6rem] rounded-xl border-2 border-dashed border-gray-700/50 flex items-center justify-center">
              <span className="text-gray-600 text-[10px]">Empty</span>
            </div>
          )}
        </button>
        <span className="text-gray-500 text-[9px] font-medium">Draw</span>
        {canDraw && (
          <span className="text-yellow-400 text-[9px] font-bold animate-pulse">Tap to draw</span>
        )}
      </div>

      {/* Discard pile */}
      <div className="flex flex-col items-center gap-0.5">
        {topDiscard ? (
          <CardComponent card={topDiscard} small />
        ) : (
          <div className="w-[4.5rem] h-[6rem] rounded-xl border-2 border-dashed border-gray-700/50 flex items-center justify-center">
            <span className="text-gray-600 text-[10px]">Empty</span>
          </div>
        )}
        <span className="text-gray-500 text-[9px] font-medium">
          Discard {discardPile.length > 0 && `(${discardPile.length})`}
        </span>
      </div>
    </div>
  );
};
