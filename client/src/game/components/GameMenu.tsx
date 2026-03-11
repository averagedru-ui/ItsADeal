import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCardGame } from '../useCardGame';
import { getCompleteSets, getTotalBankValue } from '../engine';
import { RulesScreen } from './RulesScreen';
import { getCurrentRoomId } from '../firebaseMultiplayer';

export const GameMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const players = useCardGame(s => s.players);
  const myPlayerIndex = useCardGame(s => s.myPlayerIndex);
  const isMultiplayer = useCardGame(s => s.isMultiplayer);
  const saveGame = useCardGame(s => s.saveGame);
  const returnToMenu = useCardGame(s => s.returnToMenu);
  const clearSavedGame = useCardGame(s => s.clearSavedGame);

  const humanPlayer = players[myPlayerIndex];
  const completeSets = humanPlayer ? getCompleteSets(humanPlayer) : [];
  const bankValue = humanPlayer ? getTotalBankValue(humanPlayer) : 0;
  const roomCode = isMultiplayer ? getCurrentRoomId() : null;

  const handleSaveAndQuit = () => {
    if (!isMultiplayer) saveGame();
    // For multiplayer: session is already auto-saved in setMultiplayerState.
    // Pass false so we DON'T wipe the MP save — they can resume later.
    returnToMenu(false);
    setIsOpen(false);
  };

  const handleQuitWithoutSaving = () => {
    if (!isMultiplayer) clearSavedGame();
    returnToMenu(true); // wipe MP save
    setIsOpen(false);
  };

  const copyRoomCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (showRules) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900">
        <RulesScreen onBack={() => setShowRules(false)} />
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-800 active:bg-gray-700 transition-colors"
        aria-label="Menu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect y="2" width="16" height="1.5" rx="0.75" fill="currentColor" className="text-gray-400" />
          <rect y="7.25" width="16" height="1.5" rx="0.75" fill="currentColor" className="text-gray-400" />
          <rect y="12.5" width="16" height="1.5" rx="0.75" fill="currentColor" className="text-gray-400" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-gray-800 rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-700/60 shadow-2xl w-full sm:max-w-sm overflow-hidden pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex justify-center pt-2 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-600" />
            </div>

            <div className="px-5 py-3 border-b border-gray-700/40">
              <h2 className="text-white text-lg font-bold text-center">Menu</h2>
            </div>

            {/* Room code strip for multiplayer */}
            {roomCode && (
              <button
                onClick={copyRoomCode}
                className="w-full px-5 py-2.5 bg-indigo-900/40 border-b border-indigo-800/30 flex items-center justify-between active:bg-indigo-900/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wide">Room Code</span>
                  <span className="text-white font-black text-base tracking-widest">{roomCode}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md transition-colors ${codeCopied ? 'bg-green-600 text-white' : 'bg-indigo-700/60 text-indigo-300'}`}>
                  {codeCopied ? 'Copied!' : 'Copy'}
                </span>
              </button>
            )}

            {humanPlayer && (
              <div className="px-5 py-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {humanPlayer.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-base">{humanPlayer.name}</p>
                    <p className="text-gray-400 text-xs">{isMultiplayer ? 'Online Game' : 'vs AI'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-700/40 rounded-xl py-2.5 text-center">
                    <p className="text-yellow-400 font-bold text-lg">{completeSets.length}</p>
                    <p className="text-gray-500 text-[10px]">Sets</p>
                  </div>
                  <div className="bg-gray-700/40 rounded-xl py-2.5 text-center">
                    <p className="text-emerald-400 font-bold text-lg">${bankValue}M</p>
                    <p className="text-gray-500 text-[10px]">Bank</p>
                  </div>
                  <div className="bg-gray-700/40 rounded-xl py-2.5 text-center">
                    <p className="text-indigo-400 font-bold text-lg">{humanPlayer.hand.length}</p>
                    <p className="text-gray-500 text-[10px]">Cards</p>
                  </div>
                </div>
              </div>
            )}

            <div className="px-5 pb-5 pt-1 space-y-2">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3.5 bg-indigo-600 active:bg-indigo-500 text-white font-bold rounded-2xl transition-colors text-sm"
              >
                Resume Game
              </button>

              <button
                onClick={() => { setIsOpen(false); setShowRules(true); }}
                className="w-full py-3.5 bg-gray-700/80 active:bg-gray-600 text-gray-200 font-bold rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                <span>📖</span> Rules
              </button>

              {/* Save & quit — works for both solo and multiplayer */}
              <button
                onClick={handleSaveAndQuit}
                className="w-full py-3.5 bg-emerald-600 active:bg-emerald-500 text-white font-bold rounded-2xl transition-colors text-sm"
              >
                {isMultiplayer ? '💾 Save & Leave (Rejoin Later)' : 'Save & Quit'}
              </button>

              <button
                onClick={handleQuitWithoutSaving}
                className="w-full py-3.5 bg-gray-700 active:bg-gray-600 text-gray-300 font-bold rounded-2xl transition-colors text-sm"
              >
                {isMultiplayer ? 'Leave Game (No Save)' : 'Quit Without Saving'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
