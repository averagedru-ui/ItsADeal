import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCardGame } from '../useCardGame';
import { PropertyColor, TradeProposal } from '../types';
import { PROPERTY_SETS } from '../cards';
import { getCompleteSets, getRentAmount, getTotalBankValue } from '../engine';

export const ActionPanel: React.FC = () => {
  const phase = useCardGame(s => s.phase);
  const players = useCardGame(s => s.players);
  const pendingAction = useCardGame(s => s.pendingAction);
  const pendingTrade = useCardGame(s => s.pendingTrade);
  const selectTarget = useCardGame(s => s.selectTarget);
  const payDebt = useCardGame(s => s.payDebt);
  const setForcedDealOffer = useCardGame(s => s.setForcedDealOffer);
  const respondAction = useCardGame(s => s.respondAction);
  const startTrade = useCardGame(s => s.startTrade);
  const respondTrade = useCardGame(s => s.respondTrade);
  const currentPlayerIndex = useCardGame(s => s.currentPlayerIndex);
  const myPlayerIndex = useCardGame(s => s.myPlayerIndex);
  const cardsPlayedThisTurn = useCardGame(s => s.cardsPlayedThisTurn);

  const [selectedPayCards, setSelectedPayCards] = useState<string[]>([]);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeStep, setTradeStep] = useState<'pick_mine' | 'pick_opponent' | 'pick_theirs'>('pick_mine');
  const [tradeMyCard, setTradeMyCard] = useState<{ color: PropertyColor; cardId: string } | null>(null);
  const [tradeOpponentId, setTradeOpponentId] = useState<number | null>(null);

  useEffect(() => {
    const handler = () => setShowTradeModal(true);
    window.addEventListener('open-trade-modal', handler);
    return () => window.removeEventListener('open-trade-modal', handler);
  }, []);

  const humanPlayer = players[myPlayerIndex];
  if (!humanPlayer) return null;

  if (phase === 'action_response' && pendingAction?.targetPlayerId === myPlayerIndex) {
    const source = players.find(p => p.id === pendingAction.sourcePlayerId);
    const isCounterJsn = (pendingAction as any).blockedPlayers?.length > 0;
    const hasJSN = humanPlayer.hand.some(c => c.actionType === 'just_say_no');
    const actionLabels: Record<string, string> = {
      debt_collector: 'Debt Collector ($5M)',
      sly_deal: 'Sly Deal (steal property)',
      deal_breaker: 'Deal Breaker (steal set)',
      forced_deal: 'Forced Deal (swap)',
      rent: `Rent ($${pendingAction.amount}M)`,
      birthday: 'Birthday ($2M)',
    };

    // Counter-JSN scenario: attacker (now shown as "target") can No the No
    if (isCounterJsn) {
      const blocker = players.find(p => (pendingAction as any).blockedPlayers?.includes(p.id));
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-5 md:p-6 max-w-md w-full border border-cyan-500/30 shadow-2xl shadow-cyan-500/10"
          >
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🚫↔🚫</div>
              <h3 className="text-white text-xl font-bold">Just Say No Standoff!</h3>
              <p className="text-gray-400 text-sm mt-1">
                <span className="text-cyan-400 font-semibold">{blocker?.name}</span> blocked your action with Just Say No!
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {hasJSN && (
                <button
                  onClick={() => respondAction(true)}
                  className="py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl hover:from-yellow-400 hover:to-orange-500 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span className="text-xl">🚫</span>
                  Counter with Just Say No!
                </button>
              )}
              <button
                onClick={() => respondAction(false)}
                className="py-3 px-4 bg-gray-700 text-gray-300 font-semibold rounded-xl hover:bg-gray-600 active:scale-95 transition-all"
              >
                Accept the block
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-800 rounded-2xl p-5 md:p-6 max-w-md w-full border border-red-500/30 shadow-2xl shadow-red-500/10"
        >
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">🚨</div>
            <h3 className="text-white text-xl font-bold">Incoming Action!</h3>
            <p className="text-gray-400 text-sm mt-1">
              {source?.name} plays <span className="text-yellow-400 font-semibold">{actionLabels[pendingAction.type] || pendingAction.type}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {hasJSN && (
              <button
                onClick={() => respondAction(true)}
                className="py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold rounded-xl hover:from-cyan-500 hover:to-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span className="text-xl">🚫</span>
                Play Just Say No!
              </button>
            )}
            <button
              onClick={() => respondAction(false)}
              className="py-3 px-4 bg-gray-700 text-gray-300 font-semibold rounded-xl hover:bg-gray-600 active:scale-95 transition-all"
            >
              {hasJSN ? "Accept (Don't Block)" : 'Accept'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'pay_debt' && pendingAction?.currentResponder === myPlayerIndex) {
    const amount = pendingAction.amount || 0;
    const selectedTotal = selectedPayCards.reduce((sum, id) => {
      const bankCard = humanPlayer.bank.find(c => c.id === id);
      if (bankCard) return sum + bankCard.value;
      for (const color of Object.keys(humanPlayer.properties) as PropertyColor[]) {
        const propCard = humanPlayer.properties[color].find(c => c.id === id);
        if (propCard) return sum + propCard.value;
      }
      return sum;
    }, 0);

    const totalAssets = getTotalBankValue(humanPlayer) +
      (Object.values(humanPlayer.properties) as any[]).flat().reduce((s: number, c: any) => s + c.value, 0);

    const canPay = selectedTotal >= amount || selectedTotal >= totalAssets;

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-lg w-full border border-gray-600 max-h-[80vh] overflow-y-auto"
        >
          <h3 className="text-white text-lg font-bold mb-1">Pay ${amount}M</h3>
          <p className="text-gray-400 text-sm mb-3">
            Selected: ${selectedTotal}M {selectedTotal >= amount ? '(enough!)' : `(need $${amount - selectedTotal}M more)`}
          </p>

          {humanPlayer.bank.length > 0 && (
            <div className="mb-3">
              <h4 className="text-gray-300 text-xs font-semibold mb-1">Your Bank</h4>
              <div className="flex flex-wrap gap-1">
                {humanPlayer.bank.map(card => (
                  <button
                    key={card.id}
                    onClick={() => {
                      setSelectedPayCards(prev =>
                        prev.includes(card.id) ? prev.filter(id => id !== card.id) : [...prev, card.id]
                      );
                    }}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                      selectedPayCards.includes(card.id)
                        ? 'bg-yellow-500 text-yellow-900 scale-105'
                        : 'bg-emerald-700 text-emerald-200 hover:bg-emerald-600'
                    }`}
                  >
                    ${card.value}M
                  </button>
                ))}
              </div>
            </div>
          )}

          {(Object.keys(humanPlayer.properties) as PropertyColor[])
            .filter(c => humanPlayer.properties[c].length > 0)
            .map(color => (
              <div key={color} className="mb-2">
                <div className="flex items-center gap-1 mb-0.5">
                  <div className={`w-2 h-2 rounded-full ${PROPERTY_SETS[color].bgClass}`} />
                  <span className="text-gray-300 text-xs font-semibold">{PROPERTY_SETS[color].label}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {humanPlayer.properties[color].map(card => (
                    <button
                      key={card.id}
                      onClick={() => {
                        setSelectedPayCards(prev =>
                          prev.includes(card.id) ? prev.filter(id => id !== card.id) : [...prev, card.id]
                        );
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        selectedPayCards.includes(card.id)
                          ? 'bg-yellow-500 text-yellow-900 scale-105'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {card.name} (${card.value}M)
                    </button>
                  ))}
                </div>
              </div>
            ))}

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                if (canPay) {
                  payDebt(selectedPayCards);
                  setSelectedPayCards([]);
                }
              }}
              disabled={!canPay}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                canPay
                  ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-400 active:scale-95'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Pay ${selectedTotal}M
            </button>
            {totalAssets === 0 && (
              <button
                onClick={() => {
                  payDebt([]);
                  setSelectedPayCards([]);
                }}
                className="flex-1 py-2 rounded-lg font-bold bg-red-700 text-white hover:bg-red-600"
              >
                Can't Pay
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'action_target' && currentPlayerIndex === myPlayerIndex && pendingAction) {
    if (pendingAction.type === 'debt_collector') {
      const opponents = players.filter(p => p.id !== myPlayerIndex);
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-white text-lg font-bold mb-3">Choose a player to charge $5M</h3>
            <div className="flex flex-col gap-2">
              {opponents.map(opp => (
                <button key={opp.id} onClick={() => selectTarget(opp.id)}
                  className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 active:scale-95 flex justify-between items-center transition-all">
                  <span>{opp.name}</span>
                  <span className="text-emerald-400 text-sm">Bank: ${getTotalBankValue(opp)}M</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      );
    }

    if (pendingAction.type === 'sly_deal') {
      const opponents = players.filter(p => p.id !== myPlayerIndex);
      const stealable: { playerId: number; playerName: string; color: PropertyColor; cardId: string; cardName: string }[] = [];
      for (const opp of opponents) {
        const completeSets = getCompleteSets(opp);
        for (const color of Object.keys(opp.properties) as PropertyColor[]) {
          if (completeSets.includes(color)) continue;
          for (const card of opp.properties[color]) {
            stealable.push({ playerId: opp.id, playerName: opp.name, color, cardId: card.id, cardName: card.name });
          }
        }
      }

      if (stealable.length === 0) {
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
              <h3 className="text-white text-lg font-bold mb-3">No properties to steal!</h3>
              <button
                onClick={() => {
                  useCardGame.setState((s) => ({
                    pendingAction: null,
                    phase: 'play' as const,
                    message: `Play up to 3 cards (${3 - s.cardsPlayedThisTurn} remaining)`,
                  }));
                }}
                className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                OK
              </button>
            </motion.div>
          </div>
        );
      }

      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600 max-h-[80vh] overflow-y-auto">
            <h3 className="text-white text-lg font-bold mb-3">Choose a property to steal</h3>
            <div className="flex flex-col gap-1.5">
              {stealable.map(item => (
                <button key={item.cardId} onClick={() => selectTarget(item.playerId, item.color, item.cardId)}
                  className="py-2 px-3 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 active:scale-95 flex justify-between items-center transition-all">
                  <span>{item.cardName}</span>
                  <span className="text-gray-400 text-xs">{item.playerName} - {PROPERTY_SETS[item.color].label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      );
    }

    if (pendingAction.type === 'forced_deal' && pendingAction.offeredProperty) {
      const opponents = players.filter(p => p.id !== myPlayerIndex);
      const stealable: { playerId: number; playerName: string; color: PropertyColor; cardId: string; cardName: string }[] = [];
      for (const opp of opponents) {
        const completeSets = getCompleteSets(opp);
        for (const color of Object.keys(opp.properties) as PropertyColor[]) {
          if (completeSets.includes(color)) continue;
          for (const card of opp.properties[color]) {
            stealable.push({ playerId: opp.id, playerName: opp.name, color, cardId: card.id, cardName: card.name });
          }
        }
      }

      if (stealable.length === 0) {
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
              <h3 className="text-white text-lg font-bold mb-3">No properties to swap with!</h3>
              <button
                onClick={() => {
                  useCardGame.setState((s) => ({
                    pendingAction: null,
                    phase: 'play' as const,
                    message: `Play up to 3 cards (${3 - s.cardsPlayedThisTurn} remaining)`,
                  }));
                }}
                className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                OK
              </button>
            </motion.div>
          </div>
        );
      }

      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600 max-h-[80vh] overflow-y-auto">
            <h3 className="text-white text-lg font-bold mb-1">Choose opponent's property to take</h3>
            <p className="text-gray-400 text-sm mb-3">Offering: {pendingAction.offeredProperty.card.name}</p>
            <div className="flex flex-col gap-1.5">
              {stealable.map(item => (
                <button key={item.cardId} onClick={() => selectTarget(item.playerId, item.color, item.cardId)}
                  className="py-2 px-3 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 active:scale-95 flex justify-between items-center transition-all">
                  <span>{item.cardName}</span>
                  <span className="text-gray-400 text-xs">{item.playerName} - {PROPERTY_SETS[item.color].label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      );
    }

    if (pendingAction.type === 'deal_breaker') {
      const opponents = players.filter(p => p.id !== myPlayerIndex);
      const stealableSets: { playerId: number; playerName: string; color: PropertyColor }[] = [];
      for (const opp of opponents) {
        const completeSets = getCompleteSets(opp);
        for (const color of completeSets) {
          stealableSets.push({ playerId: opp.id, playerName: opp.name, color });
        }
      }

      if (stealableSets.length === 0) {
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
              <h3 className="text-white text-lg font-bold mb-3">No complete sets to steal!</h3>
              <button
                onClick={() => {
                  useCardGame.setState((s) => ({
                    pendingAction: null,
                    phase: 'play' as const,
                    message: `Play up to 3 cards (${3 - s.cardsPlayedThisTurn} remaining)`,
                  }));
                }}
                className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                OK
              </button>
            </motion.div>
          </div>
        );
      }

      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-white text-lg font-bold mb-3">Choose a complete set to steal</h3>
            <div className="flex flex-col gap-2">
              {stealableSets.map(item => (
                <button key={`${item.playerId}-${item.color}`} onClick={() => selectTarget(item.playerId, item.color)}
                  className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 active:scale-95 flex justify-between items-center transition-all">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${PROPERTY_SETS[item.color].bgClass}`} />
                    <span>{PROPERTY_SETS[item.color].label} Set</span>
                  </div>
                  <span className="text-gray-400 text-sm">{item.playerName}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      );
    }

    if (pendingAction.type === 'rent' || pendingAction.type === 'wild_rent') {
      const ownedColors = (Object.keys(humanPlayer.properties) as PropertyColor[]).filter(c => humanPlayer.properties[c].length > 0);
      const availableColors = pendingAction.type === 'wild_rent'
        ? ownedColors
        : (pendingAction.card?.colors || []).filter(c => ownedColors.includes(c));

      const isWildRent = pendingAction.type === 'wild_rent';
      const doubleRentActive = (useCardGame.getState() as any).pendingDoubleRent > 0;

      // For Wild Rent, if a color is already chosen (stored in pendingAction.selectedProperty), show player picker
      const chosenColor = (pendingAction as any).chosenRentColor as PropertyColor | undefined;

      if (isWildRent && chosenColor) {
        // Step 2: pick which player to charge
        const opponents = players.filter(p => p.id !== myPlayerIndex);
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
              <h3 className="text-white text-lg font-bold mb-1">Choose a player to charge</h3>
              <p className="text-gray-400 text-sm mb-3">
                {PROPERTY_SETS[chosenColor].label} rent: ${getRentAmount(humanPlayer, chosenColor)}M
                {doubleRentActive && <span className="text-yellow-400 font-bold ml-1">(×2 doubled!)</span>}
              </p>
              <div className="flex flex-col gap-2">
                {opponents.map(opp => (
                  <button key={opp.id} onClick={() => selectTarget(opp.id, chosenColor)}
                    className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 active:scale-95 flex justify-between items-center transition-all">
                    <span>{opp.name}</span>
                    <span className="text-emerald-400 text-sm">Bank: ${getTotalBankValue(opp)}M</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        );
      }

      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-white text-lg font-bold mb-1">
              {isWildRent ? 'Wild Rent — Choose a color' : 'Choose a color to charge rent on'}
            </h3>
            {isWildRent && <p className="text-gray-400 text-xs mb-2">You'll then choose which player pays</p>}
            {doubleRentActive && <p className="text-yellow-400 text-xs font-bold mb-2">🎉 Double Rent active! Rent will be doubled!</p>}
            <div className="flex flex-col gap-2">
              {availableColors.map(color => (
                <button key={color}
                  onClick={() => {
                    if (isWildRent) {
                      // Store chosen color in pendingAction for next step
                      useCardGame.setState(s => ({
                        pendingAction: s.pendingAction ? { ...s.pendingAction, chosenRentColor: color } as any : null,
                      }));
                    } else {
                      selectTarget(humanPlayer.id, color);
                    }
                  }}
                  className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 active:scale-95 flex justify-between items-center transition-all">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${PROPERTY_SETS[color].bgClass}`} />
                    <span>{PROPERTY_SETS[color].label}</span>
                  </div>
                  <span className="text-emerald-400">${getRentAmount(humanPlayer, color)}M rent</span>
                </button>
              ))}
              {availableColors.length === 0 && (
                <>
                  <p className="text-gray-400 text-sm">No matching properties to charge rent on!</p>
                  <button
                    onClick={() => {
                      useCardGame.setState((s) => ({
                        pendingAction: null,
                        phase: 'play' as const,
                        message: `Play up to 3 cards (${3 - s.cardsPlayedThisTurn} remaining)`,
                      }));
                    }}
                    className="py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    OK
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      );
    }

    if (pendingAction.type === 'house') {
      const completeSets = getCompleteSets(humanPlayer).filter(c => !humanPlayer.hasHouse[c]);
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-white text-lg font-bold mb-3">Add house to which set?</h3>
            <div className="flex flex-col gap-2">
              {completeSets.map(color => (
                <button key={color} onClick={() => selectTarget(humanPlayer.id, color)}
                  className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 active:scale-95 flex items-center gap-2 transition-all">
                  <div className={`w-3 h-3 rounded-full ${PROPERTY_SETS[color].bgClass}`} />
                  <span>{PROPERTY_SETS[color].label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      );
    }

    if (pendingAction.type === 'hotel') {
      const eligible = getCompleteSets(humanPlayer).filter(c => humanPlayer.hasHouse[c] && !humanPlayer.hasHotel[c]);
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-white text-lg font-bold mb-3">Add hotel to which set?</h3>
            <div className="flex flex-col gap-2">
              {eligible.map(color => (
                <button key={color} onClick={() => selectTarget(humanPlayer.id, color)}
                  className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 active:scale-95 flex items-center gap-2 transition-all">
                  <div className={`w-3 h-3 rounded-full ${PROPERTY_SETS[color].bgClass}`} />
                  <span>{PROPERTY_SETS[color].label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      );
    }
  }

  if (phase === 'forced_deal_pick' && currentPlayerIndex === myPlayerIndex && pendingAction) {
    const myProperties: { color: PropertyColor; cardId: string; cardName: string }[] = [];
    for (const color of Object.keys(humanPlayer.properties) as PropertyColor[]) {
      for (const card of humanPlayer.properties[color]) {
        myProperties.push({ color, cardId: card.id, cardName: card.name });
      }
    }

    if (!pendingAction.offeredProperty) {
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600 max-h-[80vh] overflow-y-auto">
            <h3 className="text-white text-lg font-bold mb-3">Choose your property to offer</h3>
            <div className="flex flex-col gap-1.5">
              {myProperties.map(item => (
                <button key={item.cardId} onClick={() => setForcedDealOffer(item.color, item.cardId)}
                  className="py-2 px-3 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 active:scale-95 flex justify-between items-center transition-all">
                  <span>{item.cardName}</span>
                  <span className="text-gray-400 text-xs">{PROPERTY_SETS[item.color].label}</span>
                </button>
              ))}
              {myProperties.length === 0 && (
                <>
                  <p className="text-gray-400 text-sm">No properties to offer!</p>
                  <button
                    onClick={() => {
                      useCardGame.setState((s) => ({
                        pendingAction: null,
                        phase: 'play' as const,
                        message: `Play up to 3 cards (${3 - s.cardsPlayedThisTurn} remaining)`,
                      }));
                    }}
                    className="w-full py-2 mt-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      );
    }
  }

  if (phase === 'trade_response' && pendingTrade && pendingTrade.toPlayerId === humanPlayer.id) {
    const fromPlayer = players.find(p => p.id === pendingTrade.fromPlayerId);
    const offeredCards = pendingTrade.offeredCards.map(item => {
      const card = fromPlayer?.properties[item.color]?.find(c => c.id === item.cardId);
      return { ...item, name: card?.name || 'Unknown', label: PROPERTY_SETS[item.color].label };
    });
    const requestedCards = pendingTrade.requestedCards.map(item => {
      const card = humanPlayer.properties[item.color]?.find(c => c.id === item.cardId);
      return { ...item, name: card?.name || 'Unknown', label: PROPERTY_SETS[item.color].label };
    });

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-800 rounded-2xl p-5 max-w-md w-full border border-purple-500/30">
          <h3 className="text-white text-lg font-bold mb-3 text-center">Trade Proposal</h3>
          <p className="text-gray-400 text-sm text-center mb-4">{fromPlayer?.name} wants to trade with you</p>
          <div className="mb-3">
            <p className="text-purple-400 text-xs font-semibold mb-1">They offer:</p>
            {offeredCards.map(c => (
              <div key={c.cardId} className="py-1.5 px-3 rounded-lg bg-gray-700 text-white text-sm mb-1 flex justify-between">
                <span>{c.name}</span>
                <span className="text-gray-400 text-xs">{c.label}</span>
              </div>
            ))}
          </div>
          <div className="mb-4">
            <p className="text-red-400 text-xs font-semibold mb-1">They want:</p>
            {requestedCards.map(c => (
              <div key={c.cardId} className="py-1.5 px-3 rounded-lg bg-gray-700 text-white text-sm mb-1 flex justify-between">
                <span>{c.name}</span>
                <span className="text-gray-400 text-xs">{c.label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => respondTrade(false)}
              className="flex-1 py-2.5 rounded-xl bg-gray-700 text-white font-bold active:scale-95 transition-transform">
              Reject
            </button>
            <button onClick={() => respondTrade(true)}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold active:scale-95 transition-transform">
              Accept
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'play' && currentPlayerIndex === myPlayerIndex && showTradeModal) {
    const myProperties: { color: PropertyColor; cardId: string; cardName: string }[] = [];
    for (const color of Object.keys(humanPlayer.properties) as PropertyColor[]) {
      for (const card of humanPlayer.properties[color]) {
        myProperties.push({ color, cardId: card.id, cardName: card.name });
      }
    }

    const opponents = players.filter(p => p.id !== humanPlayer.id);

    const resetTrade = () => {
      setShowTradeModal(false);
      setTradeStep('pick_mine');
      setTradeMyCard(null);
      setTradeOpponentId(null);
    };

    if (tradeStep === 'pick_mine') {
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-4 max-w-md w-full border border-purple-500/30 max-h-[80vh] overflow-y-auto">
            <h3 className="text-white text-lg font-bold mb-3">Choose your property to offer</h3>
            {myProperties.length === 0 ? (
              <p className="text-gray-400 text-sm mb-3">You have no properties to trade!</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {myProperties.map(item => (
                  <button key={item.cardId} onClick={() => { setTradeMyCard({ color: item.color, cardId: item.cardId }); setTradeStep('pick_opponent'); }}
                    className="py-2 px-3 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 active:scale-95 flex justify-between items-center transition-all">
                    <span>{item.cardName}</span>
                    <span className="text-gray-400 text-xs">{PROPERTY_SETS[item.color].label}</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={resetTrade} className="w-full mt-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Cancel</button>
          </motion.div>
        </div>
      );
    }

    if (tradeStep === 'pick_opponent') {
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-4 max-w-md w-full border border-purple-500/30">
            <h3 className="text-white text-lg font-bold mb-3">Trade with who?</h3>
            <div className="flex flex-col gap-1.5">
              {opponents.map(opp => {
                const hasProps = (Object.keys(opp.properties) as PropertyColor[]).some(c => opp.properties[c].length > 0);
                return (
                  <button key={opp.id} onClick={() => { if (hasProps) { setTradeOpponentId(opp.id); setTradeStep('pick_theirs'); } }}
                    disabled={!hasProps}
                    className={`py-2 px-3 rounded-lg text-sm font-medium flex justify-between items-center transition-all ${hasProps ? 'bg-gray-700 text-white hover:bg-gray-600 active:scale-95' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}>
                    <span>{opp.name}</span>
                    {!hasProps && <span className="text-gray-500 text-xs">No properties</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setTradeStep('pick_mine')} className="w-full mt-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Back</button>
          </motion.div>
        </div>
      );
    }

    if (tradeStep === 'pick_theirs' && tradeOpponentId !== null) {
      const opponent = players.find(p => p.id === tradeOpponentId)!;
      const oppProperties: { color: PropertyColor; cardId: string; cardName: string }[] = [];
      for (const color of Object.keys(opponent.properties) as PropertyColor[]) {
        for (const card of opponent.properties[color]) {
          oppProperties.push({ color, cardId: card.id, cardName: card.name });
        }
      }

      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-4 max-w-md w-full border border-purple-500/30 max-h-[80vh] overflow-y-auto">
            <h3 className="text-white text-lg font-bold mb-3">Choose what you want from {opponent.name}</h3>
            <div className="flex flex-col gap-1.5">
              {oppProperties.map(item => (
                <button key={item.cardId} onClick={() => {
                  if (tradeMyCard) {
                    startTrade({
                      fromPlayerId: humanPlayer.id,
                      toPlayerId: tradeOpponentId,
                      offeredCards: [tradeMyCard],
                      requestedCards: [{ color: item.color, cardId: item.cardId }],
                    });
                    resetTrade();
                  }
                }}
                  className="py-2 px-3 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 active:scale-95 flex justify-between items-center transition-all">
                  <span>{item.cardName}</span>
                  <span className="text-gray-400 text-xs">{PROPERTY_SETS[item.color].label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setTradeStep('pick_opponent')} className="w-full mt-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Back</button>
          </motion.div>
        </div>
      );
    }
  }

  return null;
};
