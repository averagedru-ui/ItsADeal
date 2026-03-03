import React, { useEffect, useRef } from 'react';
import { useCardGame } from '../useCardGame';
import { PlayerHand } from './PlayerHand';
import { OpponentArea } from './OpponentArea';
import { PropertyArea } from './PropertyArea';
import { ActionPanel } from './ActionPanel';
import { GameOverScreen } from './GameOverScreen';
import { PropertyColor } from '../types';
import { getCompleteSets, getTotalBankValue } from '../engine';

export const GameBoard: React.FC = () => {
  const phase = useCardGame(s => s.phase);
  const players = useCardGame(s => s.players);
  const currentPlayerIndex = useCardGame(s => s.currentPlayerIndex);
  const message = useCardGame(s => s.message);
  const turnNumber = useCardGame(s => s.turnNumber);
  const cardsPlayedThisTurn = useCardGame(s => s.cardsPlayedThisTurn);
  const drawPile = useCardGame(s => s.drawPile);
  const discardPile = useCardGame(s => s.discardPile);
  const pendingAction = useCardGame(s => s.pendingAction);
  const processAITurns = useCardGame(s => s.processAITurns);
  const selectTarget = useCardGame(s => s.selectTarget);

  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (phase === 'game_over') return;

    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer?.isAI) return;

    if (phase === 'pay_debt' && pendingAction?.currentResponder !== undefined) {
      const responder = players.find(p => p.id === pendingAction.currentResponder);
      if (responder && !responder.isAI) return;
    }

    aiTimerRef.current = setTimeout(() => {
      if (phase === 'draw') {
        useCardGame.getState().draw();
      } else {
        processAITurns();
      }
    }, 800);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [phase, currentPlayerIndex, turnNumber, cardsPlayedThisTurn, pendingAction?.currentResponder]);

  useEffect(() => {
    if (phase !== 'pay_debt') return;
    if (pendingAction?.currentResponder === undefined) return;
    const responder = players.find(p => p.id === pendingAction.currentResponder);
    if (!responder?.isAI) return;

    const timer = setTimeout(() => {
      processAITurns();
    }, 800);

    return () => clearTimeout(timer);
  }, [phase, pendingAction?.currentResponder]);

  if (phase === 'game_over') {
    return <GameOverScreen />;
  }

  const humanPlayer = players[0];
  const opponents = players.slice(1);
  const completeSets = humanPlayer ? getCompleteSets(humanPlayer) : [];
  const bankValue = humanPlayer ? getTotalBankValue(humanPlayer) : 0;

  const handleOpponentPropertyClick = (color: PropertyColor, cardId: string, playerId: number) => {
    if (phase === 'action_target' && pendingAction && currentPlayerIndex === 0) {
      if (pendingAction.type === 'sly_deal' || pendingAction.type === 'forced_deal') {
        selectTarget(playerId, color, cardId);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900 overflow-hidden">
      <div className="bg-gray-900/90 border-b border-gray-700 px-3 py-1.5 flex items-center justify-between text-xs md:text-sm">
        <div className="flex items-center gap-3">
          <span className="text-yellow-500 font-black text-sm md:text-base tracking-tight">CARD TYCOON</span>
          <span className="text-gray-500">Turn {turnNumber}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <span>Deck: {drawPile.length}</span>
          <span>Discard: {discardPile.length}</span>
        </div>
      </div>

      <div className={`text-center py-1.5 px-4 text-sm font-medium ${
        currentPlayerIndex === 0 ? 'bg-indigo-900/50 text-indigo-300' : 'bg-gray-800/50 text-gray-400'
      }`}>
        {message}
        {phase === 'play' && currentPlayerIndex === 0 && (
          <span className="ml-2 text-gray-500">({3 - cardsPlayedThisTurn} plays left)</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2">
        <div className={`grid gap-2 ${opponents.length === 1 ? 'grid-cols-1' : opponents.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
          {opponents.map(opp => (
            <OpponentArea
              key={opp.id}
              player={opp}
              isCurrentTurn={currentPlayerIndex === opp.id}
              onPropertyClick={handleOpponentPropertyClick}
            />
          ))}
        </div>

        {humanPlayer && (
          <div className={`rounded-xl border p-2 md:p-3 ${
            currentPlayerIndex === 0
              ? 'border-indigo-500 bg-indigo-500/5'
              : 'border-gray-700 bg-gray-800/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentPlayerIndex === 0 ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300'
                }`}>
                  Y
                </div>
                <span className="text-white text-sm font-semibold">You</span>
                {currentPlayerIndex === 0 && <span className="text-indigo-400 text-[10px] animate-pulse">YOUR TURN</span>}
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-emerald-400 font-bold">Bank: ${bankValue}M</span>
                <span className="text-yellow-400 font-bold">Sets: {completeSets.length}/3</span>
              </div>
            </div>

            <PropertyArea player={humanPlayer} highlightComplete />

            {humanPlayer.bank.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-gray-500 text-[10px] mr-1">Bank:</span>
                {humanPlayer.bank.map(card => (
                  <span key={card.id} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                    ${card.value}M
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <PlayerHand />

      <ActionPanel />
    </div>
  );
};
