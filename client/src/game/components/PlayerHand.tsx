import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, PropertyColor } from '../types';
import { CardComponent } from './CardComponent';
import { useCardGame } from '../useCardGame';
import { PROPERTY_SETS } from '../cards';

export const PlayerHand: React.FC = () => {
  const phase = useCardGame(s => s.phase);
  const players = useCardGame(s => s.players);
  const currentPlayerIndex = useCardGame(s => s.currentPlayerIndex);
  const myPlayerIndex = useCardGame(s => s.myPlayerIndex);
  const cardsPlayedThisTurn = useCardGame(s => s.cardsPlayedThisTurn);
  const playToBank = useCardGame(s => s.playToBank);
  const playProperty = useCardGame(s => s.playProperty);
  const playAction = useCardGame(s => s.playAction);
  const discard = useCardGame(s => s.discard);
  const endCurrentTurn = useCardGame(s => s.endCurrentTurn);

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const player = players[myPlayerIndex];

  useEffect(() => {
    if (selectedCard && player) {
      const stillInHand = player.hand.some(c => c.id === selectedCard.id);
      if (!stillInHand) {
        setSelectedCard(null);
        setShowColorPicker(false);
      }
    }
  }, [player?.hand, selectedCard]);

  useEffect(() => {
    if (phase !== 'play') {
      setSelectedCard(null);
      setShowColorPicker(false);
    }
  }, [phase]);

  if (!player) return null;

  const isMyTurn = currentPlayerIndex === myPlayerIndex;
  const canPlay = isMyTurn && phase === 'play';
  const mustDiscard = isMyTurn && phase === 'discard';

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

  const cardCount = player.hand.length;
  const overlapPx = cardCount <= 5 ? 70 : cardCount <= 8 ? 55 : cardCount <= 10 ? 45 : 36;
  const totalWidth = cardCount > 0 ? (cardCount - 1) * overlapPx + 80 : 0;

  return (
    <div className="bg-gray-900/95 border-t border-gray-700 p-2 md:p-3">
      {canPlay && (
        <div className="flex gap-2 justify-center mb-2 flex-wrap">
          <AnimatePresence>
            {selectedCard && (
              <>
                {canPlayAsProperty && (
                  <motion.button
                    key="prop"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={handlePlayAsProperty}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-500 active:scale-95 transition-all">
                    Play Property
                  </motion.button>
                )}
                {canPlayAsAction && (
                  <motion.button
                    key="action"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={handlePlayAction}
                    className="px-3 py-1.5 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-500 active:scale-95 transition-all">
                    Play Action
                  </motion.button>
                )}
                {canBankIt && (
                  <motion.button
                    key="bank"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={handlePlayToBank}
                    className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 active:scale-95 transition-all">
                    Bank It (${selectedCard.value}M)
                  </motion.button>
                )}
                <motion.button
                  key="cancel"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setSelectedCard(null)}
                  className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-500 active:scale-95 transition-all">
                  Cancel
                </motion.button>
              </>
            )}
          </AnimatePresence>
          <button onClick={() => { setSelectedCard(null); endCurrentTurn(); }}
            className="px-5 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold rounded-lg hover:from-orange-400 hover:to-red-500 active:scale-95 transition-all shadow-md shadow-orange-500/20 border border-orange-400/30">
            End Turn
          </button>
        </div>
      )}

      {mustDiscard && (
        <div className="text-center mb-2">
          <span className="text-red-400 text-sm font-bold animate-pulse">Select a card to discard (hand limit: 7)</span>
        </div>
      )}

      <div className="flex justify-center overflow-x-auto pb-1">
        <div className="relative" style={{ width: `${totalWidth}px`, height: '120px', minHeight: '120px' }}>
          <AnimatePresence>
            {player.hand.map((card, i) => {
              const isSelected = selectedCard?.id === card.id;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 40, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    y: isSelected ? -16 : 0,
                    scale: isSelected ? 1.08 : 1,
                  }}
                  exit={{ opacity: 0, y: -30, scale: 0.8 }}
                  transition={{ duration: 0.25, delay: i * 0.02 }}
                  whileHover={!isSelected && (canPlay || mustDiscard) ? { y: -10, scale: 1.05 } : {}}
                  className="absolute top-0"
                  style={{ left: `${i * overlapPx}px`, zIndex: isSelected ? 50 : i }}
                >
                  <CardComponent
                    card={card}
                    onClick={() => handleCardClick(card)}
                    selected={isSelected}
                    disabled={!canPlay && !mustDiscard}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {player.hand.length === 0 && (
          <div className="text-gray-500 text-sm py-8">No cards in hand</div>
        )}
      </div>

      {showColorPicker && selectedCard?.colors && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowColorPicker(false)}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-xl p-4 border border-gray-600"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white font-bold mb-3 text-center">Choose a color</h3>
            <div className="flex gap-2 flex-wrap justify-center">
              {selectedCard.colors.map(color => (
                <button key={color} onClick={() => handleColorChoice(color)}
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
                  } hover:scale-105 active:scale-95 transition-all`}
                >
                  {PROPERTY_SETS[color].label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
