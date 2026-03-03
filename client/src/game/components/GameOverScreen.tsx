import React from 'react';
import { useCardGame } from '../useCardGame';
import { getCompleteSets, getTotalBankValue } from '../engine';

export const GameOverScreen: React.FC = () => {
  const players = useCardGame(s => s.players);
  const winner = useCardGame(s => s.winner);
  const startGame = useCardGame(s => s.startGame);

  const winnerPlayer = players.find(p => p.id === winner);
  const isHumanWinner = winner === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">{isHumanWinner ? '🏆' : '😔'}</div>
        <h1 className={`text-4xl md:text-5xl font-black mb-2 ${
          isHumanWinner
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500'
            : 'text-gray-300'
        }`}>
          {isHumanWinner ? 'YOU WIN!' : 'GAME OVER'}
        </h1>
        <p className="text-xl text-gray-400">
          {isHumanWinner
            ? 'You collected 3 complete property sets!'
            : `${winnerPlayer?.name} collected 3 complete property sets`}
        </p>
      </div>

      <div className="bg-gray-800/80 rounded-2xl p-4 md:p-6 w-full max-w-md border border-gray-700 mb-6">
        <h2 className="text-white font-bold mb-3">Final Standings</h2>
        <div className="space-y-2">
          {players
            .sort((a, b) => {
              const aComplete = getCompleteSets(a).length;
              const bComplete = getCompleteSets(b).length;
              if (bComplete !== aComplete) return bComplete - aComplete;
              return getTotalBankValue(b) - getTotalBankValue(a);
            })
            .map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.id === winner ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-bold w-6">{index + 1}.</span>
                  <span className={`font-semibold ${player.id === winner ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {player.name}
                  </span>
                  {player.id === winner && <span className="text-sm">👑</span>}
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-yellow-400">Sets: {getCompleteSets(player).length}</span>
                  <span className="text-emerald-400">Bank: ${getTotalBankValue(player)}M</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => startGame(players.length)}
          className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-900 font-black text-lg rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          Play Again
        </button>
        <button
          onClick={() => useCardGame.setState({ phase: 'menu' })}
          className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold text-lg rounded-xl transition-all hover:scale-105 active:scale-95"
        >
          Menu
        </button>
      </div>
    </div>
  );
};
