import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCardGame } from '../useCardGame';

const typeColors: Record<string, string> = {
  action: 'text-purple-300',
  property: 'text-green-300',
  money: 'text-emerald-300',
  system: 'text-gray-400',
  steal: 'text-red-300',
  rent: 'text-yellow-300',
};

const typeIcons: Record<string, string> = {
  action: '⚡',
  property: '🏠',
  money: '💰',
  system: '📋',
  steal: '🤏',
  rent: '💵',
};

export const GameLog: React.FC = () => {
  const gameLog = useCardGame(s => s.gameLog);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameLog.length]);

  return (
    <div className="fixed top-auto bottom-[calc(10.5rem+env(safe-area-inset-bottom))] left-2 z-30">
      {isOpen ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-56 bg-gray-900/95 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl"
        >
          <div className="px-3 py-1.5 bg-gray-800/60 border-b border-gray-700/30 flex items-center justify-between">
            <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Activity</span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 flex items-center justify-center text-gray-400 active:text-white"
            >
              &times;
            </button>
          </div>
          <div
            ref={scrollRef}
            className="max-h-40 overflow-y-auto p-2 space-y-0.5"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <AnimatePresence initial={false}>
              {gameLog.slice(-15).map(entry => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-1 py-0.5"
                >
                  <span className="text-[10px] flex-shrink-0">{typeIcons[entry.type] || '📋'}</span>
                  <span className={`text-[10px] leading-tight ${typeColors[entry.type] || 'text-gray-400'}`}>
                    {entry.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {gameLog.length === 0 && (
              <div className="text-gray-600 text-[10px] text-center py-2 italic">Game starting...</div>
            )}
          </div>
        </motion.div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-9 h-9 bg-gray-800/90 active:bg-gray-700 rounded-full shadow-lg flex items-center justify-center border border-gray-700/50"
        >
          <span className="text-xs">📋</span>
        </button>
      )}
    </div>
  );
};
