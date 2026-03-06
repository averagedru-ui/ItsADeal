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
    <div className="fixed bottom-16 left-3 z-30 md:bottom-4">
      {isOpen ? (
        <div className="w-64 bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden shadow-2xl">
          <div className="px-3 py-1.5 bg-gray-800/80 border-b border-gray-700/50 flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Activity</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
            >
              &times;
            </button>
          </div>
          <div
            ref={scrollRef}
            className="max-h-48 overflow-y-auto p-2 space-y-0.5"
          >
            <AnimatePresence initial={false}>
              {gameLog.slice(-20).map(entry => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex items-start gap-1.5 py-0.5"
                >
                  <span className="text-xs flex-shrink-0">{typeIcons[entry.type] || '📋'}</span>
                  <span className={`text-[11px] leading-tight ${typeColors[entry.type] || 'text-gray-400'}`}>
                    {entry.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {gameLog.length === 0 && (
              <div className="text-gray-600 text-xs text-center py-2 italic">Game starting...</div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full shadow-lg flex items-center justify-center transition-all border border-gray-700 hover:scale-105"
        >
          <span className="text-sm">📋</span>
        </button>
      )}
    </div>
  );
};
