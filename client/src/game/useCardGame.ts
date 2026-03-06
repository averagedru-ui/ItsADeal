import { create } from 'zustand';
import {
  GameState,
  PropertyColor,
  ChatMessage,
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
  resolveActionResponse,
  getAIAction,
  getRentAmount,
} from './engine';
import { useProfile } from './useProfile';

const SAVE_KEY = 'property_rush_save';

function saveToLocalStorage(state: GameState) {
  try {
    const serializable: GameState = {
      phase: state.phase,
      players: state.players,
      currentPlayerIndex: state.currentPlayerIndex,
      drawPile: state.drawPile,
      discardPile: state.discardPile,
      cardsPlayedThisTurn: state.cardsPlayedThisTurn,
      pendingAction: state.pendingAction,
      winner: state.winner,
      turnNumber: state.turnNumber,
      message: state.message,
      animatingCard: null,
      gameLog: state.gameLog,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(serializable));
  } catch {}
}

function loadFromLocalStorage(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

function clearSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {}
}

interface CardGameStore extends GameState {
  myPlayerIndex: number;
  isMultiplayer: boolean;
  multiplayerWs: WebSocket | null;
  chatMessages: ChatMessage[];
  chatNextId: number;
  startGame: (playerCount: number, playerName?: string) => void;
  draw: () => void;
  playToBank: (cardId: string) => void;
  playProperty: (cardId: string, color?: PropertyColor) => void;
  playAction: (cardId: string) => void;
  discard: (cardId: string) => void;
  endCurrentTurn: () => void;
  selectTarget: (targetPlayerId: number, targetColor?: PropertyColor, targetCardId?: string) => void;
  payDebt: (cardIds: string[]) => void;
  setForcedDealOffer: (color: PropertyColor, cardId: string) => void;
  respondAction: (useJustSayNo: boolean) => void;
  processAITurns: () => void;
  setMultiplayerState: (state: Partial<GameState>, playerIndex: number) => void;
  setMultiplayerWs: (ws: WebSocket | null) => void;
  sendMultiplayerAction: (action: any) => void;
  saveGame: () => void;
  loadGame: () => boolean;
  hasSavedGame: () => boolean;
  getSavedGameInfo: () => { turnNumber: number; playerCount: number } | null;
  clearSavedGame: () => void;
  returnToMenu: () => void;
  sendChat: (text: string) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id'>) => void;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function autoSave(state: GameState, isMultiplayer: boolean) {
  if (isMultiplayer) return;
  if (state.phase === 'menu' || state.phase === 'game_over') return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveToLocalStorage(state);
  }, 500);
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
  gameLog: [],
  myPlayerIndex: 0,
  isMultiplayer: false,
  multiplayerWs: null,
  chatMessages: [],
  chatNextId: 1,

  startGame: (playerCount: number, playerName?: string) => {
    clearSave();
    const names = [playerName || 'You', 'Alex', 'Blake', 'Casey'].slice(0, playerCount);
    const state = initializeGame(playerCount);
    if (playerName) {
      state.players[0].name = playerName;
    }
    state.message = `${state.players[0].name}'s turn - Draw 2 cards`;
    set({ ...state, myPlayerIndex: 0, isMultiplayer: false, chatMessages: [], chatNextId: 1 });
    autoSave(state, false);
  },

  draw: () => {
    const state = get();
    if (state.isMultiplayer) {
      state.sendMultiplayerAction({ type: 'draw' });
      return;
    }
    if (state.phase !== 'draw') return;
    const newState = drawCards(state, 2);
    set(newState);
    autoSave(newState, false);
  },

  playToBank: (cardId: string) => {
    const state = get();
    if (state.isMultiplayer) {
      state.sendMultiplayerAction({ type: 'play_bank', cardId });
      return;
    }
    if (state.phase !== 'play') return;
    const newState = playCardToBank(state, cardId);
    set(newState);
    autoSave(newState, false);
  },

  playProperty: (cardId: string, color?: PropertyColor) => {
    const state = get();
    if (state.isMultiplayer) {
      state.sendMultiplayerAction({ type: 'play_property', cardId, color });
      return;
    }
    if (state.phase !== 'play') return;
    const newState = playPropertyCard(state, cardId, color);
    set(newState);
    autoSave(newState, false);
  },

  playAction: (cardId: string) => {
    const state = get();
    if (state.isMultiplayer) {
      state.sendMultiplayerAction({ type: 'play_action', cardId });
      return;
    }
    if (state.phase !== 'play') return;
    const card = state.players[state.currentPlayerIndex]?.hand.find(c => c.id === cardId);
    if (card && state.currentPlayerIndex === state.myPlayerIndex) {
      useProfile.getState().setUsedAction();
      if (card.actionType === 'deal_breaker') {
        useProfile.getState().setUsedDealBreaker();
      }
    }
    const result = playActionCard(state, cardId);
    if ('needsTarget' in result) {
      set(result.state);
      autoSave(result.state, false);
    } else {
      set(result);
      autoSave(result as GameState, false);
    }
  },

  discard: (cardId: string) => {
    const state = get();
    if (state.isMultiplayer) {
      state.sendMultiplayerAction({ type: 'discard', cardId });
      return;
    }
    if (state.phase !== 'discard') return;
    const newState = discardCard(state, cardId);
    set(newState);
    autoSave(newState, false);
  },

  endCurrentTurn: () => {
    const state = get();
    if (state.isMultiplayer) {
      state.sendMultiplayerAction({ type: 'end_turn' });
      return;
    }
    if (state.phase !== 'play') return;
    const newState = endTurn(state);
    set(newState);
    if (newState.phase === 'game_over') {
      clearSave();
    } else {
      autoSave(newState, false);
    }
  },

  selectTarget: (targetPlayerId: number, targetColor?: PropertyColor, targetCardId?: string) => {
    const state = get();
    if (state.isMultiplayer) {
      state.sendMultiplayerAction({ type: 'select_target', targetPlayerId, targetColor, targetCardId });
      return;
    }
    if (state.phase !== 'action_target' && state.phase !== 'forced_deal_pick') return;
    const newState = resolveTargetAction(state, targetPlayerId, targetColor, targetCardId);
    set(newState);
    autoSave(newState, false);
  },

  payDebt: (cardIds: string[]) => {
    const state = get();
    if (state.isMultiplayer) {
      state.sendMultiplayerAction({ type: 'pay_debt', cardIds });
      return;
    }
    if (state.phase !== 'pay_debt') return;
    const payerId = state.pendingAction?.currentResponder;
    if (payerId === undefined) return;
    const newState = resolveDebtPayment(state, payerId, cardIds);
    set(newState);
    autoSave(newState, false);
  },

  setForcedDealOffer: (color: PropertyColor, cardId: string) => {
    const state = get();
    if (state.isMultiplayer) {
      state.sendMultiplayerAction({ type: 'forced_deal_offer', color, cardId });
      return;
    }
    if (!state.pendingAction) return;
    const player = state.players[state.currentPlayerIndex];
    const card = player.properties[color].find(c => c.id === cardId);
    if (!card) return;
    const updated = {
      pendingAction: {
        ...state.pendingAction,
        offeredProperty: { color, card },
      },
      phase: 'action_target' as const,
      message: 'Now choose an opponent\'s property to take',
    };
    set(updated);
  },

  respondAction: (useJustSayNo: boolean) => {
    const state = get();
    if (state.isMultiplayer) {
      state.sendMultiplayerAction({ type: 'respond_action', useJustSayNo });
      return;
    }
    if (state.phase !== 'action_response') return;
    const newState = resolveActionResponse(state, useJustSayNo);
    set(newState);
    autoSave(newState, false);
  },

  processAITurns: () => {
    const state = get();
    if (state.isMultiplayer) return;

    if (state.phase === 'action_response') {
      const responderId = state.pendingAction?.targetPlayerId;
      const responder = state.players.find(p => p.id === responderId);
      if (responder?.isAI) {
        const aiAction = getAIAction(state);
        const newState = resolveActionResponse(state, aiAction.useJustSayNo || false);
        set(newState);
        autoSave(newState, false);
        return;
      }
      return;
    }

    const player = state.players[state.currentPlayerIndex];
    if (!player?.isAI) return;

    const aiAction = getAIAction(state);
    let newState: GameState | null = null;

    switch (aiAction.action) {
      case 'play_property': {
        if (!aiAction.cardId) break;
        newState = playPropertyCard(state, aiAction.cardId, aiAction.targetColor);
        set(newState);
        break;
      }
      case 'play_bank': {
        if (!aiAction.cardId) break;
        newState = playCardToBank(state, aiAction.cardId);
        set(newState);
        break;
      }
      case 'play_action': {
        if (!aiAction.cardId) break;
        const result = playActionCard(state, aiAction.cardId);
        if ('needsTarget' in result) {
          if (aiAction.targetPlayerId !== undefined || aiAction.targetColor) {
            const targetId = aiAction.targetPlayerId ?? state.players.find(p => p.id !== player.id)!.id;
            newState = resolveTargetAction(result.state, targetId, aiAction.targetColor, aiAction.targetCardId);
            set(newState);
          } else {
            const rentColors = result.state.pendingAction?.card?.colors;
            if (rentColors && rentColors.length > 0) {
              const ownedColors = rentColors.filter((c: PropertyColor) => player.properties[c].length > 0);
              if (ownedColors.length > 0) {
                const best = ownedColors.reduce((b: PropertyColor, c: PropertyColor) =>
                  getRentAmount(player, c) > getRentAmount(player, b) ? c : b, ownedColors[0]);
                newState = resolveTargetAction(result.state, player.id, best);
                set(newState);
              } else {
                newState = endTurn(result.state);
                set(newState);
              }
            } else {
              set(result.state);
              newState = result.state;
            }
          }
        } else {
          set(result);
          newState = result as GameState;
        }
        break;
      }
      case 'discard': {
        if (!aiAction.cardId) break;
        newState = discardCard(state, aiAction.cardId);
        set(newState);
        break;
      }
      case 'pay_debt': {
        if (!aiAction.cardId) break;
        const ids = aiAction.cardId.split(',');
        const payerId = state.pendingAction?.currentResponder;
        if (payerId === undefined) break;
        newState = resolveDebtPayment(state, payerId, ids);
        set(newState);
        break;
      }
      case 'end_turn': {
        newState = endTurn(state);
        set(newState);
        break;
      }
    }

    if (newState) {
      if (newState.phase === 'game_over') {
        clearSave();
      } else {
        autoSave(newState, false);
      }
    }
  },

  setMultiplayerState: (serverState: Partial<GameState>, playerIndex: number) => {
    set({ ...serverState, myPlayerIndex: playerIndex, isMultiplayer: true } as any);
  },

  setMultiplayerWs: (ws: WebSocket | null) => {
    set({ multiplayerWs: ws, isMultiplayer: ws !== null, chatMessages: [], chatNextId: 1 });
  },

  sendMultiplayerAction: (action: any) => {
    const ws = get().multiplayerWs;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'game_action', action }));
    }
  },

  saveGame: () => {
    const state = get();
    if (state.isMultiplayer) return;
    saveToLocalStorage(state);
  },

  loadGame: () => {
    const saved = loadFromLocalStorage();
    if (!saved || !saved.players || !saved.phase || !saved.drawPile) {
      clearSave();
      return false;
    }
    if (saved.phase === 'menu' || saved.phase === 'game_over') {
      clearSave();
      return false;
    }
    set({ ...saved, myPlayerIndex: 0, isMultiplayer: false, multiplayerWs: null, chatMessages: [], chatNextId: 1 });
    return true;
  },

  hasSavedGame: () => {
    return loadFromLocalStorage() !== null;
  },

  getSavedGameInfo: () => {
    const saved = loadFromLocalStorage();
    if (!saved) return null;
    return { turnNumber: saved.turnNumber, playerCount: saved.players.length };
  },

  clearSavedGame: () => {
    clearSave();
  },

  returnToMenu: () => {
    const state = get();
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    if (state.multiplayerWs) {
      state.multiplayerWs.close();
    }
    set({
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
      gameLog: [],
      myPlayerIndex: 0,
      isMultiplayer: false,
      multiplayerWs: null,
      chatMessages: [],
      chatNextId: 1,
    });
  },

  sendChat: (text: string) => {
    const state = get();
    const ws = state.multiplayerWs;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'send_chat', text }));
    } else {
      const playerName = state.players[state.myPlayerIndex]?.name || 'You';
      state.addChatMessage({ sender: playerName, text, timestamp: Date.now() });
    }
  },

  addChatMessage: (msg: Omit<ChatMessage, 'id'>) => {
    const state = get();
    const id = state.chatNextId;
    set({
      chatMessages: [...state.chatMessages, { ...msg, id }],
      chatNextId: id + 1,
    });
  },
}));
