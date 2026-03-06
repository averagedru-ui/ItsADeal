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
    <div className="h-[100dvh] flex flex-col bg-gray-900 overflow-hidden">
      <TurnBanner />
      <ActionNotification />

      <div className="bg-gray-900 border-b border-gray-800 px-3 py-2 flex items-center justify-between" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-2.5">
          <GameMenu />
          <span className="text-yellow-500 font-black text-sm tracking-tight">PROPERTY RUSH</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-[11px]">T{turnNumber}</span>
          <div className="flex items-center gap-1 bg-emerald-900/30 rounded-lg px-2 py-0.5">
            <span className="text-emerald-400 text-[11px] font-bold">${bankValue}M</span>
          </div>
          <div className="flex items-center gap-1 bg-yellow-900/30 rounded-lg px-2 py-0.5">
            <span className="text-yellow-400 text-[11px] font-bold">{completeSets.length}/3</span>
          </div>
          {isMultiplayer && <span className="text-indigo-400 text-[9px] font-semibold px-1.5 py-0.5 bg-indigo-900/40 rounded-md">LIVE</span>}
        </div>
      </div>

      <div className={`text-center py-1 px-3 text-xs font-medium ${
        isMyTurn ? 'bg-indigo-900/30 text-indigo-300' : 'bg-gray-800/30 text-gray-400'
      }`}>
        {message}
        {phase === 'play' && isMyTurn && (
          <span className="ml-1.5 text-gray-500">({3 - cardsPlayedThisTurn} left)</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain p-2 flex flex-col"
           style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className={`grid gap-1.5 ${opponents.length === 1 ? 'grid-cols-1' : 'grid-cols-1'}`}>
          {opponents.map(opp => (
            <OpponentArea
              key={opp.id}
              player={opp}
              isCurrentTurn={currentPlayerIndex === opp.id}
              onPropertyClick={handleOpponentPropertyClick}
            />
          ))}
        </div>

        <div className="flex-1 flex items-center justify-center">
          <TableCenter />
        </div>
      </div>

      {humanPlayer && (
        <div className={`border-t px-2 py-1.5 transition-all ${
          isMyTurn
            ? 'border-indigo-500/40 bg-indigo-950/30'
            : 'border-gray-800 bg-gray-900/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isMyTurn ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}>
                {humanPlayer.name[0]}
              </div>
              <span className="text-white text-xs font-semibold">{humanPlayer.name}</span>
              {isMyTurn && <span className="text-indigo-400 text-[9px] font-medium animate-pulse">Your Turn</span>}
            </div>
            <div className="flex items-center gap-2">
              {humanPlayer.bank.length > 0 && (
                <div className="flex items-center gap-0.5">
                  <div className="flex">
                    {humanPlayer.bank.slice(0, 4).map((card, i) => (
                      <div
                        key={card.id}
                        className="w-5 h-7 rounded border border-emerald-600/40 bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-emerald-300 text-[6px] font-bold"
                        style={{ marginLeft: i > 0 ? '-3px' : 0, zIndex: i }}
                      >
                        ${card.value}M
                      </div>
                    ))}
                    {humanPlayer.bank.length > 4 && (
                      <span className="text-gray-500 text-[7px] ml-0.5">+{humanPlayer.bank.length - 4}</span>
                    )}
                  </div>
                  <span className="text-emerald-400 text-[10px] font-bold">${bankValue}M</span>
                </div>
              )}
              <PropertyArea player={humanPlayer} compact highlightComplete />
            </div>
          </div>
        </div>
      )}

      <PlayerHand />
      <ActionPanel />
      <GameLog />
      <ChatPanel />
    </div>
  );
};
