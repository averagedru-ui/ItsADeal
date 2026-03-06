import React, { useEffect, useRef } from 'react';
import { useCardGame } from '../useCardGame';
import { useProfile } from '../useProfile';
import { getCompleteSets, getTotalBankValue } from '../engine';

export const GameOverScreen: React.FC = () => {
  const players = useCardGame(s => s.players);
  const winner = useCardGame(s => s.winner);
  const turnNumber = useCardGame(s => s.turnNumber);
  const startGame = useCardGame(s => s.startGame);
  const isMultiplayer = useCardGame(s => s.isMultiplayer);
  const playerName = useProfile(s => s.playerName);
  const recordGameResult = useProfile(s => s.recordGameResult);
  const recorded = useRef(false);

  const winnerPlayer = players.find(p => p.id === winner);
  const isHumanWinner = winner === 0;
  const humanPlayer = players[0];

  useEffect(() => {
    if (recorded.current || isMultiplayer) return;
    recorded.current = true;

    const propertyColors = humanPlayer
      ? Object.keys(humanPlayer.properties).filter(c => humanPlayer.properties[c as any].length > 0).length
      : 0;
    const bankValue = humanPlayer ? getTotalBankValue(humanPlayer) : 0;

    recordGameResult(isHumanWinner, {
      turnNumber,
      playerCount: players.length,
      bankValue,
      propertyColors,
    });
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">{isHumanWinner ? '🏆' : '😔'}</div>
        <h1 className={`text-4xl md:text-5xl font-black mb-2 ${
          isHumanWinner
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500'
            : 'text-gray-300'
        }`}>
          {isHumanWinner ? 'YOU WIN!' : 'GAME OVER'}
        </h1>
        <p className="text-lg text-gray-400">
          {isHumanWinner
            ? 'You collected 3 complete property sets!'
            : `${winnerPlayer?.name} collected 3 complete property sets`}
        </p>
      </div>

      <div className="bg-gray-800/80 rounded-2xl p-4 w-full max-w-md border border-gray-700 mb-6">
        <h2 className="text-white font-bold text-sm mb-3">Final Standings</h2>
        <div className="space-y-2">
          {[...players]
            .sort((a, b) => {
              const aComplete = getCompleteSets(a).length;
              const bComplete = getCompleteSets(b).length;
              if (bComplete !== aComplete) return bComplete - aComplete;
              return getTotalBankValue(b) - getTotalBankValue(a);
            })
            .map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-2.5 rounded-xl ${
                  player.id === winner ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-bold w-5 text-xs">{index + 1}.</span>
                  <span className={`font-semibold text-sm ${player.id === winner ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {player.name}
                  </span>
                  {player.id === winner && <span className="text-xs">👑</span>}
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className="text-yellow-400">Sets: {getCompleteSets(player).length}</span>
                  <span className="text-emerald-400">Bank: ${getTotalBankValue(player)}M</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            useProfile.getState().resetGameFlags();
            startGame(players.length, playerName);
          }}
          className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 active:from-yellow-400 active:to-amber-500 text-gray-900 font-black text-base rounded-xl transition-all active:scale-95 shadow-lg"
        >
          Play Again
        </button>
        <button
          onClick={() => useCardGame.getState().returnToMenu()}
          className="px-6 py-3 bg-gray-700 active:bg-gray-600 text-gray-300 font-bold text-base rounded-xl transition-all active:scale-95"
        >
          Menu
        </button>
      </div>
    </div>
  );
};
