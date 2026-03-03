import React, { useState } from 'react';
import { useCardGame } from '../useCardGame';
import { PropertyColor } from '../types';
import { PROPERTY_SETS } from '../cards';
import { getCompleteSets, getRentAmount, getTotalBankValue } from '../engine';

export const ActionPanel: React.FC = () => {
  const phase = useCardGame(s => s.phase);
  const players = useCardGame(s => s.players);
  const pendingAction = useCardGame(s => s.pendingAction);
  const selectTarget = useCardGame(s => s.selectTarget);
  const payDebt = useCardGame(s => s.payDebt);
  const setForcedDealOffer = useCardGame(s => s.setForcedDealOffer);
  const currentPlayerIndex = useCardGame(s => s.currentPlayerIndex);

  const [selectedPayCards, setSelectedPayCards] = useState<string[]>([]);

  const humanPlayer = players[0];
  if (!humanPlayer) return null;

  if (phase === 'pay_debt' && pendingAction?.currentResponder === 0) {
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
        <div className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-lg w-full border border-gray-600 max-h-[80vh] overflow-y-auto">
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
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      selectedPayCards.includes(card.id)
                        ? 'bg-yellow-500 text-yellow-900'
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
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedPayCards.includes(card.id)
                          ? 'bg-yellow-500 text-yellow-900'
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
              className={`flex-1 py-2 rounded-lg font-bold ${
                canPay
                  ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-400'
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
        </div>
      </div>
    );
  }

  if (phase === 'action_target' && currentPlayerIndex === 0 && pendingAction) {
    if (pendingAction.type === 'debt_collector') {
      const opponents = players.filter(p => p.id !== 0);
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-white text-lg font-bold mb-3">Choose a player to charge $5M</h3>
            <div className="flex flex-col gap-2">
              {opponents.map(opp => (
                <button
                  key={opp.id}
                  onClick={() => selectTarget(opp.id)}
                  className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 active:scale-95 flex justify-between items-center"
                >
                  <span>{opp.name}</span>
                  <span className="text-emerald-400 text-sm">Bank: ${getTotalBankValue(opp)}M</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (pendingAction.type === 'sly_deal') {
      const opponents = players.filter(p => p.id !== 0);
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
            <div className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
              <h3 className="text-white text-lg font-bold mb-3">No properties to steal!</h3>
              <button onClick={() => selectTarget(0)} className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                OK
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600 max-h-[80vh] overflow-y-auto">
            <h3 className="text-white text-lg font-bold mb-3">Choose a property to steal</h3>
            <div className="flex flex-col gap-1.5">
              {stealable.map(item => (
                <button
                  key={item.cardId}
                  onClick={() => selectTarget(item.playerId, item.color, item.cardId)}
                  className={`py-2 px-3 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 active:scale-95 flex justify-between items-center`}
                >
                  <span>{item.cardName}</span>
                  <span className="text-gray-400 text-xs">{item.playerName} - {PROPERTY_SETS[item.color].label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (pendingAction.type === 'forced_deal' && pendingAction.offeredProperty) {
      const opponents = players.filter(p => p.id !== 0);
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
            <div className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
              <h3 className="text-white text-lg font-bold mb-3">No properties to swap with!</h3>
              <button onClick={() => selectTarget(0)} className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">OK</button>
            </div>
          </div>
        );
      }

      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600 max-h-[80vh] overflow-y-auto">
            <h3 className="text-white text-lg font-bold mb-1">Choose opponent's property to take</h3>
            <p className="text-gray-400 text-sm mb-3">Offering: {pendingAction.offeredProperty.card.name}</p>
            <div className="flex flex-col gap-1.5">
              {stealable.map(item => (
                <button
                  key={item.cardId}
                  onClick={() => selectTarget(item.playerId, item.color, item.cardId)}
                  className="py-2 px-3 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 active:scale-95 flex justify-between items-center"
                >
                  <span>{item.cardName}</span>
                  <span className="text-gray-400 text-xs">{item.playerName} - {PROPERTY_SETS[item.color].label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (pendingAction.type === 'deal_breaker') {
      const opponents = players.filter(p => p.id !== 0);
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
            <div className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
              <h3 className="text-white text-lg font-bold mb-3">No complete sets to steal!</h3>
              <button onClick={() => selectTarget(0)} className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                OK
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-white text-lg font-bold mb-3">Choose a complete set to steal</h3>
            <div className="flex flex-col gap-2">
              {stealableSets.map(item => (
                <button
                  key={`${item.playerId}-${item.color}`}
                  onClick={() => selectTarget(item.playerId, item.color)}
                  className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 active:scale-95 flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${PROPERTY_SETS[item.color].bgClass}`} />
                    <span>{PROPERTY_SETS[item.color].label} Set</span>
                  </div>
                  <span className="text-gray-400 text-sm">{item.playerName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (pendingAction.type === 'rent' || pendingAction.type === 'wild_rent') {
      const ownedColors = (Object.keys(humanPlayer.properties) as PropertyColor[]).filter(c => humanPlayer.properties[c].length > 0);
      const availableColors = pendingAction.type === 'wild_rent'
        ? ownedColors
        : (pendingAction.card?.colors || []).filter(c => ownedColors.includes(c));

      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-white text-lg font-bold mb-3">Choose a color to charge rent on</h3>
            <div className="flex flex-col gap-2">
              {availableColors.map(color => (
                <button
                  key={color}
                  onClick={() => selectTarget(humanPlayer.id, color)}
                  className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 active:scale-95 flex justify-between items-center"
                >
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
                  <button onClick={() => selectTarget(0)} className="py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">OK</button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (pendingAction.type === 'house') {
      const completeSets = getCompleteSets(humanPlayer).filter(c => !humanPlayer.hasHouse[c]);
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-white text-lg font-bold mb-3">Add house to which set?</h3>
            <div className="flex flex-col gap-2">
              {completeSets.map(color => (
                <button
                  key={color}
                  onClick={() => selectTarget(humanPlayer.id, color)}
                  className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 active:scale-95 flex items-center gap-2"
                >
                  <div className={`w-3 h-3 rounded-full ${PROPERTY_SETS[color].bgClass}`} />
                  <span>{PROPERTY_SETS[color].label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (pendingAction.type === 'hotel') {
      const eligible = getCompleteSets(humanPlayer).filter(c => humanPlayer.hasHouse[c] && !humanPlayer.hasHotel[c]);
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-white text-lg font-bold mb-3">Add hotel to which set?</h3>
            <div className="flex flex-col gap-2">
              {eligible.map(color => (
                <button
                  key={color}
                  onClick={() => selectTarget(humanPlayer.id, color)}
                  className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 active:scale-95 flex items-center gap-2"
                >
                  <div className={`w-3 h-3 rounded-full ${PROPERTY_SETS[color].bgClass}`} />
                  <span>{PROPERTY_SETS[color].label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
  }

  if (phase === 'forced_deal_pick' && currentPlayerIndex === 0 && pendingAction) {
    const myProperties: { color: PropertyColor; cardId: string; cardName: string }[] = [];
    for (const color of Object.keys(humanPlayer.properties) as PropertyColor[]) {
      for (const card of humanPlayer.properties[color]) {
        myProperties.push({ color, cardId: card.id, cardName: card.name });
      }
    }

    if (!pendingAction.offeredProperty) {
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600 max-h-[80vh] overflow-y-auto">
            <h3 className="text-white text-lg font-bold mb-3">Choose your property to offer</h3>
            <div className="flex flex-col gap-1.5">
              {myProperties.map(item => (
                <button
                  key={item.cardId}
                  onClick={() => setForcedDealOffer(item.color, item.cardId)}
                  className="py-2 px-3 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 active:scale-95 flex justify-between items-center"
                >
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
          </div>
        </div>
      );
    }
  }

  return null;
};
