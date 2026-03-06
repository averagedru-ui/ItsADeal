import React, { useEffect, useRef } from 'react';
import { useCardGame } from '../useCardGame';
import { PlayerHand } from './PlayerHand';
import { OpponentArea } from './OpponentArea';
import { PropertyArea } from './PropertyArea';
import { ActionPanel } from './ActionPanel';
import { GameOverScreen } from './GameOverScreen';
import { GameLog } from './GameLog';
import { TurnBanner } from './TurnBanner';
import { ActionNotification } from './ActionNotification';
import { GameMenu } from './GameMenu';
import { ChatPanel } from './ChatPanel';
import { TableCenter } from './TableCenter';
import { PropertyColor } from '../types';
import { getCompleteSets, getTotalBankValue } from '../engine';

export const GameBoard: React.FC = () => {
  const phase = useCardGame(s => s.phase);
  const players = useCardGame(s => s.players);
  const currentPlayerIndex = useCardGame(s => s.currentPlayerIndex);
  const message = useCardGame(s => s.message);
  const turnNumber = useCardGame(s => s.turnNumber);
  const cardsPlayedThisTurn = useCardGame(s => s.cardsPlayedThisTurn);
  const pendingAction = useCardGame(s => s.pendingAction);
  const processAITurns = useCardGame(s => s.processAITurns);
  const selectTarget = useCardGame(s => s.selectTarget);
  const myPlayerIndex = useCardGame(s => s.myPlayerIndex);
  const isMultiplayer = useCardGame(s => s.isMultiplayer);

  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (phase === 'game_over' || isMultiplayer) return;

    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer?.isAI && phase !== 'action_response') return;

    if (phase === 'action_response') {
      const responderId = pendingAction?.targetPlayerId;
      const responder = players.find(p => p.id === responderId);
      if (!responder?.isAI) return;
    }

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
  }, [phase, currentPlayerIndex, turnNumber, cardsPlayedThisTurn, pendingAction?.currentResponder, pendingAction?.targetPlayerId]);

  useEffect(() => {
    if (isMultiplayer) return;
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

  const humanPlayer = players[myPlayerIndex];
  const opponents = players.filter((_, i) => i !== myPlayerIndex);
  const completeSets = humanPlayer ? getCompleteSets(humanPlayer) : [];
  const bankValue = humanPlayer ? getTotalBankValue(humanPlayer) : 0;
  const isMyTurn = currentPlayerIndex === myPlayerIndex;

  const handleOpponentPropertyClick = (color: PropertyColor, cardId: string, playerId: number) => {
    if (phase === 'action_target' && pendingAction && isMyTurn) {
      if (pendingAction.type === 'sly_deal' || pendingAction.type === 'forced_deal') {
        selectTarget(playerId, color, cardId);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900 overflow-hidden">
      <TurnBanner />
      <ActionNotification />

      <div className="bg-gray-900/90 border-b border-gray-700 px-3 py-1.5 flex items-center justify-between text-xs md:text-sm">
        <div className="flex items-center gap-3">
          <GameMenu />
          <span className="text-yellow-500 font-black text-sm md:text-base tracking-tight">PROPERTY RUSH</span>
          <span className="text-gray-500">Turn {turnNumber}</span>
          {isMultiplayer && <span className="text-indigo-400 text-[10px] font-semibold px-1.5 py-0.5 bg-indigo-900/50 rounded">ONLINE</span>}
        </div>
        <div className="flex gap-3 text-xs">
          <span className="text-emerald-400 font-bold">Bank: ${bankValue}M</span>
          <span className="text-yellow-400 font-bold">Sets: {completeSets.length}/3</span>
        </div>
      </div>

      <div className={`text-center py-1 px-4 text-sm font-medium transition-colors ${
        isMyTurn ? 'bg-indigo-900/50 text-indigo-300' : 'bg-gray-800/50 text-gray-400'
      }`}>
        {message}
        {phase === 'play' && isMyTurn && (
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

        <TableCenter />

        {humanPlayer && (
          <div className={`rounded-xl border p-2 md:p-3 transition-all ${
            isMyTurn
              ? 'border-indigo-500 bg-indigo-500/5 shadow-sm shadow-indigo-500/10'
              : 'border-gray-700 bg-gray-800/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isMyTurn ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300'
                }`}>
                  {humanPlayer.name[0]}
                </div>
                <span className="text-white text-sm font-semibold">{humanPlayer.name}</span>
                {isMyTurn && <span className="text-indigo-400 text-[10px] animate-pulse">YOUR TURN</span>}
              </div>
            </div>

            <PropertyArea player={humanPlayer} highlightComplete />

            {humanPlayer.bank.length > 0 && (
              <div className="mt-2 pt-1.5 border-t border-gray-700/50">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-gray-500 text-[10px]">Bank:</span>
                  {humanPlayer.bank.map((card, i) => (
                    <div
                      key={card.id}
                      className="w-9 h-12 md:w-10 md:h-14 rounded border border-emerald-600/60 bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center shadow-sm text-emerald-300 text-[9px] md:text-[10px] font-bold"
                      style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: i }}
                    >
                      ${card.value}M
                    </div>
                  ))}
                  <span className="text-emerald-400 text-xs font-bold ml-1">${bankValue}M</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PlayerHand />
      <ActionPanel />
      <GameLog />
      {isMultiplayer && <ChatPanel />}
    </div>
  );
};
