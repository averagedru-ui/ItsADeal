import React from 'react';
import { motion } from 'framer-motion';
import { useProfile, QUESTS } from '../useProfile';

interface QuestScreenProps {
  onBack: () => void;
}

export const QuestScreen: React.FC<QuestScreenProps> = ({ onBack }) => {
  const questsCompleted = useProfile(s => s.questsCompleted);

  const completedCount = QUESTS.filter(q => questsCompleted[q.id]).length;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-800 active:bg-gray-700 text-gray-300">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-white font-bold text-lg">Quests</h1>
        <span className="ml-auto text-xs text-gray-400 font-medium">{completedCount}/{QUESTS.length} completed</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="bg-gray-800/40 rounded-2xl p-3 border border-gray-700/30 mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs font-medium">Progress</span>
            <span className="text-yellow-400 text-xs font-bold">{Math.round((completedCount / QUESTS.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / QUESTS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {QUESTS.map((quest, i) => {
          const done = !!questsCompleted[quest.id];
          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-2xl p-3.5 border transition-all ${
                done
                  ? 'bg-emerald-900/20 border-emerald-500/30'
                  : 'bg-gray-800/60 border-gray-700/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                  done ? 'bg-emerald-600/30' : 'bg-gray-700/50'
                }`}>
                  {done ? '✅' : quest.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${done ? 'text-emerald-300' : 'text-white'}`}>{quest.name}</p>
                  <p className="text-gray-400 text-[11px] mt-0.5">{quest.description}</p>
                </div>
                {done && (
                  <span className="text-emerald-400 text-[10px] font-bold flex-shrink-0">DONE</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
