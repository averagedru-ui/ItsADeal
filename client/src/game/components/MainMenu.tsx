import React, { useState, useEffect } from 'react';
import { useCardGame } from '../useCardGame';

interface MainMenuProps {
  onMultiplayer?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onMultiplayer }) => {
  const startGame = useCardGame(s => s.startGame);
  const loadGame = useCardGame(s => s.loadGame);
  const getSavedGameInfo = useCardGame(s => s.getSavedGameInfo);
  const clearSavedGame = useCardGame(s => s.clearSavedGame);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center py-8 px-4 overflow-y-auto">
      <div className="flex-shrink-0 my-auto w-full max-w-md flex flex-col items-center">
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 mb-2 tracking-tight">
          PROPERTY RUSH
        </h1>
        <p className="text-base md:text-xl text-indigo-300 font-medium">
          The Property Card Game
        </p>
      </div>

      <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-6 md:p-8 w-full max-w-md border border-gray-700 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-white text-lg font-semibold mb-3">How to Play</h2>
          <ul className="text-gray-300 text-sm space-y-1.5">
            <li>Collect <span className="text-yellow-400 font-bold">3 complete property sets</span> to win!</li>
            <li>Each turn: draw 2, play up to 3 cards</li>
            <li>Play properties, bank money, or use action cards</li>
            <li>Use <span className="text-cyan-400 font-bold">Just Say No</span> to block attacks!</li>
          </ul>
        </div>

        {savedInfo && (
          <button
            onClick={handleResume}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-lg rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-500/30 mb-3"
          >
            <div className="flex flex-col items-center">
              <span>RESUME GAME</span>
              <span className="text-emerald-100/70 text-xs font-medium mt-0.5">
                Turn {savedInfo.turnNumber} - {savedInfo.playerCount} Players
              </span>
            </div>
          </button>
        )}

        <div className="mb-4">
          <label className="text-white text-sm font-semibold mb-2 block">Solo vs AI</label>
          <div className="flex gap-2 mb-2">
            {[2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
                  playerCount === n
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {n}P
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-xs">You vs {playerCount - 1} AI opponent{playerCount > 2 ? 's' : ''}</p>
        </div>

        <button
          onClick={() => startGame(playerCount)}
          className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-900 font-black text-xl rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-amber-500/30 mb-3"
        >
          PLAY vs AI
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-600"></div></div>
          <div className="relative flex justify-center"><span className="bg-gray-800 px-3 text-gray-500 text-sm">or</span></div>
        </div>

        <button
          onClick={onMultiplayer}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-black text-lg rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          PLAY WITH FRIENDS
        </button>
        <p className="text-gray-500 text-xs text-center mt-2">Share a link and play online together</p>
      </div>
      </div>
    </div>
  );
};
