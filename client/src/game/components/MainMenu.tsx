import React, { useState, useEffect } from 'react';
import { useCardGame } from '../useCardGame';
import { useProfile } from '../useProfile';

interface MainMenuProps {
  onMultiplayer?: () => void;
  onRules?: () => void;
  onProfile?: () => void;
  onQuests?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onMultiplayer, onRules, onProfile, onQuests }) => {
  const startGame = useCardGame(s => s.startGame);
  const loadGame = useCardGame(s => s.loadGame);
  const getSavedGameInfo = useCardGame(s => s.getSavedGameInfo);
  const clearSavedGame = useCardGame(s => s.clearSavedGame);
  const playerName = useProfile(s => s.playerName);
  const resetGameFlags = useProfile(s => s.resetGameFlags);
  const [playerCount, setPlayerCount] = useState(2);
  const [savedInfo, setSavedInfo] = useState<{ turnNumber: number; playerCount: number } | null>(null);

  useEffect(() => {
    setSavedInfo(getSavedGameInfo());
  }, []);

  const handleResume = () => {
    const success = loadGame();
    if (!success) {
      clearSavedGame();
      setSavedInfo(null);
    }
  };

  const handleStart = () => {
    resetGameFlags();
    startGame(playerCount, playerName);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center py-6 px-4 overflow-y-auto"
         style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))', WebkitOverflowScrolling: 'touch' }}>
      <div className="flex-shrink-0 my-auto w-full max-w-md flex flex-col items-center">
        <div className="text-center mb-5">
          <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 mb-1 tracking-tight">
            IT'S A DEAL
          </h1>
          <p className="text-sm md:text-lg text-indigo-300 font-medium">
            The Property Card Game
          </p>
        </div>

        <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-5 md:p-6 w-full max-w-md border border-gray-700 shadow-2xl">
          {playerName === 'Player' && (
            <div className="flex items-center gap-3 mb-4 bg-gray-700/30 rounded-xl p-3" onClick={onProfile}>
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {playerName[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{playerName}</p>
                <p className="text-gray-500 text-[10px]">Tap to set your name</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          )}

          {savedInfo && (
            <button
              onClick={handleResume}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 active:from-emerald-400 active:to-teal-500 text-white font-black text-base rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/30 mb-3"
            >
              <div className="flex flex-col items-center">
                <span>RESUME GAME</span>
                <span className="text-emerald-100/70 text-[10px] font-medium mt-0.5">
                  Turn {savedInfo.turnNumber} - {savedInfo.playerCount} Players
                </span>
              </div>
            </button>
          )}

          <div className="mb-3">
            <label className="text-white text-xs font-semibold mb-1.5 block">Solo vs AI</label>
            <div className="flex gap-2 mb-1.5">
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setPlayerCount(n)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-base transition-all ${
                    playerCount === n
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-gray-700 text-gray-400 active:bg-gray-600'
                  }`}
                >
                  {n}P
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-[10px]">You vs {playerCount - 1} AI opponent{playerCount > 2 ? 's' : ''}</p>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 active:from-yellow-400 active:to-amber-500 text-gray-900 font-black text-lg rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-500/30 mb-3"
          >
            PLAY vs AI
          </button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-600"></div></div>
            <div className="relative flex justify-center"><span className="bg-gray-800 px-3 text-gray-500 text-xs">or</span></div>
          </div>

          <button
            onClick={onMultiplayer}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-700 active:from-indigo-500 active:to-purple-600 text-white font-black text-base rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-500/20 mb-4"
          >
            PLAY WITH FRIENDS
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onRules}
              className="py-2.5 bg-gray-700/60 active:bg-gray-600 text-gray-300 font-semibold text-xs rounded-xl transition-colors flex flex-col items-center gap-1"
            >
              <span className="text-base">📖</span>
              Rules
            </button>
            <button
              onClick={onQuests}
              className="py-2.5 bg-gray-700/60 active:bg-gray-600 text-gray-300 font-semibold text-xs rounded-xl transition-colors flex flex-col items-center gap-1"
            >
              <span className="text-base">🎯</span>
              Quests
            </button>
            <button
              onClick={onProfile}
              className="py-2.5 bg-gray-700/60 active:bg-gray-600 text-gray-300 font-semibold text-xs rounded-xl transition-colors flex flex-col items-center gap-1"
            >
              <span className="text-base">👤</span>
              Profile
            </button>
          </div>
        </div>
        <p className="text-gray-600 text-[10px] mt-3">v1.1.4</p>
      </div>
    </div>
  );
};
