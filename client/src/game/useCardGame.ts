import { create } from 'zustand';
import {
  GameState,
  PropertyColor,
} from './types';
import {
  initializeGame,
  drawCards,
  playCardToBank,
  playPropertyCard,
  playActionCard,
  discardCard,
  endTurn,
  resolveDebtPayment,
  resolveTargetAction,
  getAIAction,
  getCompleteSets,
  getRentAmount,
} from './engine';
import { PROPERTY_SETS } from './cards';

interface CardGameStore extends GameState {
  startGame: (playerCount: number) => void;
  draw: () => void;
  playToBank: (cardId: string) => void;
  playProperty: (cardId: string, color?: PropertyColor) => void;
  playAction: (cardId: string) => void;
  discard: (cardId: string) => void;
  endCurrentTurn: () => void;
  selectTarget: (targetPlayerId: number, targetColor?: PropertyColor, targetCardId?: string) => void;
  payDebt: (cardIds: string[]) => void;
  setForcedDealOffer: (color: PropertyColor, cardId: string) => void;
  processAITurns: () => void;
}

export const useCardGame = create<CardGameStore>((set, get) => ({
  phase: 'menu',
  players: [],
  currentPlayerIndex: 0,
  drawPile: [],
  discardPile: [],
  cardsPlayedThisTurn: 0,
  pendingAction: null,
  winner: null,
  turnNumber: 1,
  message: '',
  animatingCard: null,

  startGame: (playerCount: number) => {
    const state = initializeGame(playerCount);
    set(state);
  },

  draw: () => {
    const state = get();
    if (state.phase !== 'draw') return;
    const newState = drawCards(state, 2);
    set(newState);
  },

  playToBank: (cardId: string) => {
    const state = get();
    if (state.phase !== 'play') return;
    const newState = playCardToBank(state, cardId);
    set(newState);
  },

  playProperty: (cardId: string, color?: PropertyColor) => {
    const state = get();
    if (state.phase !== 'play') return;
    const newState = playPropertyCard(state, cardId, color);
    set(newState);
  },

  playAction: (cardId: string) => {
    const state = get();
    if (state.phase !== 'play') return;
    const result = playActionCard(state, cardId);
    if ('needsTarget' in result) {
      set(result.state);
    } else {
      set(result);
    }
  },

  discard: (cardId: string) => {
    const state = get();
    if (state.phase !== 'discard') return;
    const newState = discardCard(state, cardId);
    set(newState);
  },

  endCurrentTurn: () => {
    const state = get();
    if (state.phase !== 'play') return;
    const newState = endTurn(state);
    set(newState);
  },

  selectTarget: (targetPlayerId: number, targetColor?: PropertyColor, targetCardId?: string) => {
    const state = get();
    if (state.phase !== 'action_target' && state.phase !== 'forced_deal_pick') return;
    const newState = resolveTargetAction(state, targetPlayerId, targetColor, targetCardId);
    set(newState);
  },

  payDebt: (cardIds: string[]) => {
    const state = get();
    if (state.phase !== 'pay_debt') return;
    const payerId = state.pendingAction?.currentResponder;
    if (payerId === undefined) return;
    const newState = resolveDebtPayment(state, payerId, cardIds);
    set(newState);
  },

  setForcedDealOffer: (color: PropertyColor, cardId: string) => {
    const state = get();
    if (!state.pendingAction) return;
    const player = state.players[state.currentPlayerIndex];
    const card = player.properties[color].find(c => c.id === cardId);
    if (!card) return;
    set({
      pendingAction: {
        ...state.pendingAction,
        offeredProperty: { color, card },
      },
      phase: 'action_target',
      message: 'Now choose an opponent\'s property to take',
    });
  },

  processAITurns: () => {
    const state = get();
    const player = state.players[state.currentPlayerIndex];
    if (!player?.isAI) return;

    const aiAction = getAIAction(state);

    switch (aiAction.action) {
      case 'play_property': {
        if (!aiAction.cardId) break;
        const newState = playPropertyCard(state, aiAction.cardId, aiAction.targetColor);
        set(newState);
        break;
      }
      case 'play_bank': {
        if (!aiAction.cardId) break;
        const newState = playCardToBank(state, aiAction.cardId);
        set(newState);
        break;
      }
      case 'play_action': {
        if (!aiAction.cardId) break;
        const result = playActionCard(state, aiAction.cardId);
        if ('needsTarget' in result) {
          if (aiAction.targetPlayerId !== undefined || aiAction.targetColor) {
            const targetId = aiAction.targetPlayerId ?? state.players.find(p => p.id !== player.id)!.id;
            const resolved = resolveTargetAction(result.state, targetId, aiAction.targetColor, aiAction.targetCardId);
            set(resolved);
          } else {
            const rentColors = result.state.pendingAction?.card?.colors;
            if (rentColors && rentColors.length > 0) {
              const ownedColors = rentColors.filter((c: PropertyColor) => player.properties[c].length > 0);
              if (ownedColors.length > 0) {
                const best = ownedColors.reduce((b: PropertyColor, c: PropertyColor) =>
                  getRentAmount(player, c) > getRentAmount(player, b) ? c : b, ownedColors[0]);
                const resolved = resolveTargetAction(result.state, player.id, best);
                set(resolved);
              } else {
                set(result.state);
                const endState = endTurn(result.state);
                set(endState);
              }
            } else {
              set(result.state);
            }
          }
        } else {
          set(result);
        }
        break;
      }
      case 'discard': {
        if (!aiAction.cardId) break;
        const newState = discardCard(state, aiAction.cardId);
        set(newState);
        break;
      }
      case 'pay_debt': {
        if (!aiAction.cardId) break;
        const ids = aiAction.cardId.split(',');
        const payerId = state.pendingAction?.currentResponder;
        if (payerId === undefined) break;
        const newState = resolveDebtPayment(state, payerId, ids);
        set(newState);
        break;
      }
      case 'end_turn': {
        const newState = endTurn(state);
        set(newState);
        break;
      }
    }
  },
}));
