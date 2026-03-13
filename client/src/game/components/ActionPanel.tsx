import React, { useState, useEffect, useMemo } from 'react';
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
  const [showDoubleRentPicker, setShowDoubleRentPicker] = useState(false);

  const player = players[myPlayerIndex];

  const hasTradeableProperties = useMemo(() => {
    if (!player) return false;
    const myProps = (Object.keys(player.properties) as PropertyColor[]).some(c => player.properties[c].length > 0);
    const oppProps = players.filter(p => p.id !== player.id).some(p =>
      (Object.keys(p.properties) as PropertyColor[]).some(c => p.properties[c].length > 0)
    );
    return myProps && oppProps;
  }, [player, players]);

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

  const pendingDoubleRent = useCardGame(s => (s as any).pendingDoubleRent || 0);
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
    // Double Rent: only playable if you have a rent card to pair it with
    if (selectedCard.actionType === 'double_rent') {
      const rentCards = player.hand.filter(c => (c.actionType === 'rent' || c.actionType === 'wild_rent') && c.id !== selectedCard.id);
      if (rentCards.length === 0) {
        // Can't play Double Rent without a Rent card — deselect and show message
        setSelectedCard(null);
        setExpandedIndex(null);
        useCardGame.setState({ message: "⚠️ You need a Rent card in hand to play Double Rent!" });
        return;
      }
      setShowDoubleRentPicker(true);
      return;
    }
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

  // Double Rent picker: play Double Rent + Rent in sequence
  if (showDoubleRentPicker && selectedCard) {
    const rentCards = player.hand.filter(c => (c.actionType === 'rent' || c.actionType === 'wild_rent') && c.id !== selectedCard.id);
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-2xl p-4 max-w-md w-full border border-yellow-500/40">
          <h3 className="text-white text-lg font-bold mb-1">⚡ Double Rent</h3>
          <p className="text-gray-400 text-xs mb-3">Choose which Rent card to play alongside it. The rent you charge will be doubled!</p>
          <div className="flex flex-col gap-2">
            {rentCards.map(card => (
              <button key={card.id}
                onPointerDown={() => {
                  setShowDoubleRentPicker(false);
                  setSelectedCard(null);
                  setExpandedIndex(null);
                  // Play Double Rent first (sets the pendingDoubleRent flag), then the Rent card
                  playAction(selectedCard.id);
                  setTimeout(() => { playAction(card.id); }, 80);
                }}
                className="py-3 px-4 rounded-xl bg-yellow-600 text-white font-semibold text-sm">
                {card.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button onPointerDown={() => setShowDoubleRentPicker(false)}
              className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-lg text-sm font-semibold">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/95 border-t border-gray-700/50 pb-[env(safe-area-inset-bottom)] pt-1.5 px-2">
      {canPlay && pendingDoubleRent > 0 && (
        <div className="flex items-center justify-center gap-1.5 mb-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-lg">
          <span className="text-lg">⚡</span>
          <span className="text-yellow-400 text-xs font-bold">Double Rent active — play a Rent card!</span>
        </div>
      )}
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
          {cardsPlayedThisTurn < 3 && hasTradeableProperties && (
            <button onClick={() => { setSelectedCard(null); setExpandedIndex(null); window.dispatchEvent(new Event('open-trade-modal')); }}
              className="px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform shadow-sm">
              Trade
            </button>
          )}
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
        <div className="relative mx-auto" style={{ width: `${totalWidth}px`, height: '145px', paddingTop: '10px' }}>
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
                    y: isSelected ? -8 : isExpanded ? -4 : 10,
                    scale: isSelected ? 1.08 : 1,
                    x: 0,
                  }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="absolute top-0"
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
                    style={pendingDoubleRent > 0 && card.actionType === 'rent' ? { boxShadow: '0 0 10px 2px rgba(234,179,8,0.6)' } : undefined}
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
            <div className={`grid gap-2 ${selectedCard.colors.length > 4 ? 'grid-cols-2' : 'grid-cols-2'}`}>
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
                    color === 'black' ? 'from-gray-700 to-gray-900' :
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
