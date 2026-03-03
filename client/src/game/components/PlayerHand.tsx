import React, { useState } from 'react';
import { Card, PropertyColor } from '../types';
import { CardComponent } from './CardComponent';
import { useCardGame } from '../useCardGame';
import { PROPERTY_SETS } from '../cards';

export const PlayerHand: React.FC = () => {
  const phase = useCardGame(s => s.phase);
  const players = useCardGame(s => s.players);
  const currentPlayerIndex = useCardGame(s => s.currentPlayerIndex);
  const playToBank = useCardGame(s => s.playToBank);
  const playProperty = useCardGame(s => s.playProperty);
  const playAction = useCardGame(s => s.playAction);
  const discard = useCardGame(s => s.discard);
  const endCurrentTurn = useCardGame(s => s.endCurrentTurn);
  const draw = useCardGame(s => s.draw);

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const player = players[0];
  if (!player) return null;

  const isMyTurn = currentPlayerIndex === 0;
  const canPlay = isMyTurn && phase === 'play';
  const mustDiscard = isMyTurn && phase === 'discard';
  const canDraw = isMyTurn && phase === 'draw';

  const handleCardClick = (card: Card) => {
    if (mustDiscard) {
      discard(card.id);
      setSelectedCard(null);
      return;
    }

    if (!canPlay) return;

    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
      return;
    }
    setSelectedCard(card);
  };

  const handlePlayToBank = () => {
    if (!selectedCard) return;
    playToBank(selectedCard.id);
    setSelectedCard(null);
  };

  const handlePlayAsProperty = () => {
    if (!selectedCard) return;
    if (selectedCard.type === 'wildcard') {
      setShowColorPicker(true);
      return;
    }
    playProperty(selectedCard.id, selectedCard.color);
    setSelectedCard(null);
  };

  const handlePlayAction = () => {
    if (!selectedCard) return;
    playAction(selectedCard.id);
    setSelectedCard(null);
  };

  const handleColorChoice = (color: PropertyColor) => {
    if (!selectedCard) return;
    playProperty(selectedCard.id, color);
    setSelectedCard(null);
    setShowColorPicker(false);
  };

  const canPlayAsProperty = selectedCard && (selectedCard.type === 'property' || selectedCard.type === 'wildcard');
  const canPlayAsAction = selectedCard && selectedCard.type === 'action' && selectedCard.actionType !== 'just_say_no';
  const canBankIt = selectedCard !== null;

  return (
    <div className="bg-gray-900/95 border-t border-gray-700 p-2 md:p-3">
      {canDraw && (
        <div className="flex justify-center mb-2">
          <button
            onClick={draw}
            className="px-6 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-lg hover:from-sky-400 hover:to-blue-500 active:scale-95 transition-all shadow-lg animate-pulse"
          >
            Draw 2 Cards
          </button>
        </div>
      )}

      {selectedCard && canPlay && (
        <div className="flex gap-2 justify-center mb-2 flex-wrap">
          {canPlayAsProperty && (
            <button
              onClick={handlePlayAsProperty}
              className="px-3 py-1.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-500 active:scale-95"
            >
              Play Property
            </button>
          )}
          {canPlayAsAction && (
            <button
              onClick={handlePlayAction}
              className="px-3 py-1.5 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-500 active:scale-95"
            >
              Play Action
            </button>
          )}
          {canBankIt && (
            <button
              onClick={handlePlayToBank}
              className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 active:scale-95"
            >
              Bank It (${selectedCard.value}M)
            </button>
          )}
          <button
            onClick={() => setSelectedCard(null)}
            className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-500 active:scale-95"
          >
            Cancel
          </button>
        </div>
      )}

      {canPlay && !selectedCard && (
        <div className="flex justify-center mb-2">
          <button
            onClick={endCurrentTurn}
            className="px-4 py-1.5 bg-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-600 active:scale-95 border border-gray-600"
          >
            End Turn
          </button>
        </div>
      )}

      <div className="flex gap-1.5 md:gap-2 justify-center flex-wrap max-h-40 md:max-h-44 overflow-y-auto">
        {player.hand.map(card => (
          <CardComponent
            key={card.id}
            card={card}
            onClick={() => handleCardClick(card)}
            selected={selectedCard?.id === card.id}
            disabled={!canPlay && !mustDiscard && !canDraw}
          />
        ))}
        {player.hand.length === 0 && (
          <div className="text-gray-500 text-sm py-8">No cards in hand</div>
        )}
      </div>

      {showColorPicker && selectedCard?.colors && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowColorPicker(false)}>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-600" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold mb-3 text-center">Choose a color</h3>
            <div className="flex gap-2 flex-wrap justify-center">
              {selectedCard.colors.map(color => (
                <button
                  key={color}
                  onClick={() => handleColorChoice(color)}
                  className={`px-4 py-2 rounded-lg font-bold text-white bg-gradient-to-br ${
                    color === 'brown' ? 'from-amber-800 to-amber-900' :
                    color === 'blue' ? 'from-blue-500 to-blue-700' :
                    color === 'green' ? 'from-green-500 to-green-700' :
                    color === 'red' ? 'from-red-500 to-red-700' :
                    color === 'yellow' ? 'from-yellow-400 to-yellow-600 text-yellow-900' :
                    color === 'orange' ? 'from-orange-400 to-orange-600' :
                    color === 'pink' ? 'from-pink-400 to-pink-600' :
                    color === 'teal' ? 'from-teal-400 to-teal-600' :
                    color === 'purple' ? 'from-purple-500 to-purple-700' :
                    'from-gray-700 to-gray-900'
                  } hover:scale-105 active:scale-95`}
                >
                  {PROPERTY_SETS[color].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
