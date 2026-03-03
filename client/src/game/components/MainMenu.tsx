import React, { useState } from 'react';
import { useCardGame } from '../useCardGame';

export const MainMenu: React.FC = () => {
  const startGame = useCardGame(s => s.startGame);
  const [playerCount, setPlayerCount] = useState(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 mb-2 tracking-tight">
          CARD TYCOON
        </h1>
        <p className="text-lg md:text-xl text-indigo-300 font-medium">
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
            <li>Charge rent, steal properties, and block attacks</li>
          </ul>
        </div>

        <div className="mb-6">
          <label className="text-white text-sm font-semibold mb-2 block">Players</label>
          <div className="flex gap-2">
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
                {n}
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-1.5">You vs {playerCount - 1} AI opponent{playerCount > 2 ? 's' : ''}</p>
        </div>

        <button
          onClick={() => startGame(playerCount)}
          className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-900 font-black text-xl rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-amber-500/30"
        >
          START GAME
        </button>
      </div>

      <p className="text-gray-600 text-xs mt-6">A property dealing card game</p>
    </div>
  );
};
