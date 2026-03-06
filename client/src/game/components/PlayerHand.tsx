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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const player = players[myPlayerIndex];

  useEffect(() => {
    if (selectedCard && player) {
      const stillInHand = player.hand.some(c => c.id === selectedCard.id);
      if (!stillInHand) {
        setSelectedCard(null);
        setShowColorPicker(false);
        setExpandedIndex(null);
      }
    }
  }, [player?.hand, selectedCard]);

  useEffect(() => {
    if (phase !== 'play') {
      setSelectedCard(null);
      setShowColorPicker(false);
      setExpandedIndex(null);
    }
  }, [phase]);

  if (!player) return null;

  const isMyTurn = currentPlayerIndex === myPlayerIndex;
  const canPlay = isMyTurn && phase === 'play';
  const mustDiscard = isMyTurn && phase === 'discard';

  const handleCardClick = (card: Card, index: number) => {
    if (mustDiscard) {
      discard(card.id);
      setSelectedCard(null);
      setExpandedIndex(null);
      return;
    }
    if (!canPlay) return;
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
      setExpandedIndex(null);
      return;
    }
    setSelectedCard(card);
    setExpandedIndex(index);
  };

  const handlePlayToBank = () => {
    if (!selectedCard) return;
    playToBank(selectedCard.id);
    setSelectedCard(null);
    setExpandedIndex(null);
  };

  const handlePlayAsProperty = () => {
    if (!selectedCard) return;
    if (selectedCard.type === 'wildcard') {
      setShowColorPicker(true);
      return;
    }
    playProperty(selectedCard.id, selectedCard.color);
    setSelectedCard(null);
    setExpandedIndex(null);
  };

  const handlePlayAction = () => {
    if (!selectedCard) return;
    playAction(selectedCard.id);
    setSelectedCard(null);
    setExpandedIndex(null);
  };

  const handleColorChoice = (color: PropertyColor) => {
    if (!selectedCard) return;
    playProperty(selectedCard.id, color);
    setSelectedCard(null);
    setShowColorPicker(false);
    setExpandedIndex(null);
  };

  const canPlayAsProperty = selectedCard && (selectedCard.type === 'property' || selectedCard.type === 'wildcard');
  const canPlayAsAction = selectedCard && selectedCard.type === 'action' && selectedCard.actionType !== 'just_say_no';
  const canBankIt = selectedCard !== null;

  const cardCount = player.hand.length;
  const cardWidth = 88;
  const minOverlap = 28;
  const maxOverlap = cardWidth;
  const containerWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth - 24, 640) : 360;
  const overlapPx = cardCount > 1
    ? Math.max(minOverlap, Math.min(maxOverlap, (containerWidth - cardWidth) / (cardCount - 1)))
    : maxOverlap;
  const totalWidth = cardCount > 0 ? (cardCount - 1) * overlapPx + cardWidth : 0;

  return (
    <div className="bg-gray-900/95 border-t border-gray-700/50 pb-[env(safe-area-inset-bottom)] pt-1.5 px-2">
      {canPlay && (
        <div className="flex gap-1.5 justify-center mb-1.5 flex-wrap">
          <AnimatePresence>
            {selectedCard && (
              <>
                {canPlayAsProperty && (
                  <motion.button
                    key="prop"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={handlePlayAsProperty}
                    className="px-3.5 py-2 bg-green-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform">
                    Property
                  </motion.button>
                )}
                {canPlayAsAction && (
                  <motion.button
                    key="action"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={handlePlayAction}
                    className="px-3.5 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform">
                    Action
                  </motion.button>
                )}
                {canBankIt && (
                  <motion.button
                    key="bank"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={handlePlayToBank}
                    className="px-3.5 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform">
                    Bank ${selectedCard.value}M
                  </motion.button>
                )}
                <motion.button
                  key="cancel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={() => { setSelectedCard(null); setExpandedIndex(null); }}
                  className="px-3 py-2 bg-gray-700 text-gray-300 text-xs rounded-xl active:scale-95 transition-transform">
                  Cancel
                </motion.button>
              </>
            )}
          </AnimatePresence>
          <button onClick={() => { setSelectedCard(null); setExpandedIndex(null); endCurrentTurn(); }}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform shadow-sm">
            End Turn
          </button>
        </div>
      )}

      {mustDiscard && (
        <div className="text-center mb-1.5">
          <span className="text-red-400 text-xs font-bold animate-pulse">Tap a card to discard (hand limit: 7)</span>
        </div>
      )}

      <div className="flex justify-center overflow-x-auto pb-1 -mx-2 px-2"
           style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="relative mx-auto" style={{ width: `${totalWidth}px`, height: '135px' }}>
          <AnimatePresence>
            {player.hand.map((card, i) => {
              const isSelected = selectedCard?.id === card.id;
              const isExpanded = expandedIndex === i;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{
                    opacity: 1,
                    y: isSelected ? -24 : isExpanded ? -12 : 0,
                    scale: isSelected ? 1.1 : 1,
                    x: 0,
                  }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="absolute top-2"
                  style={{
                    left: `${i * overlapPx}px`,
                    zIndex: isSelected ? 100 : isExpanded ? 50 : i,
                  }}
                  onPointerEnter={() => {
                    if (!isSelected && (canPlay || mustDiscard)) setExpandedIndex(i);
                  }}
                  onPointerLeave={() => {
                    if (!isSelected && expandedIndex === i) setExpandedIndex(null);
                  }}
                >
                  <CardComponent
                    card={card}
                    onClick={() => handleCardClick(card, i)}
                    selected={isSelected}
                    disabled={!canPlay && !mustDiscard}
                    small
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {player.hand.length === 0 && (
          <div className="text-gray-500 text-xs py-6">No cards in hand</div>
        )}
      </div>

      {showColorPicker && selectedCard?.colors && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 pb-8" onClick={() => setShowColorPicker(false)}>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-5 border border-gray-600 w-full max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white font-bold mb-4 text-center text-base">Choose a color</h3>
            <div className="grid grid-cols-2 gap-2">
              {selectedCard.colors.map(color => (
                <button key={color} onClick={() => handleColorChoice(color)}
                  className={`px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-br ${
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
                  } active:scale-95 transition-transform text-sm`}
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
