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
  getCompleteSets,
  getTotalAssetValue,
  proposeTrade,
  resolveTradeResponse,
} from './engine';
import { TradeProposal } from './types';
import { useProfile } from './useProfile';
import {
  sendGameAction,
  sendChatMessage as fbSendChat,
  leaveRoom as fbLeaveRoom,
  isConnected as fbIsConnected,
} from './firebaseMultiplayer';

const SAVE_KEY = 'its_a_deal_save';

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
      pendingTrade: state.pendingTrade,
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
  startTrade: (trade: TradeProposal) => void;
  respondTrade: (accepted: boolean) => void;
  processAITurns: () => void;
  setMultiplayerState: (state: Partial<GameState>, playerIndex: number) => void;
  setMultiplayerWs: (ws: WebSocket | null) => void;
  setFirebaseMultiplayer: (active: boolean) => void;
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

function processAndSyncMultiplayer(newState: GameState, get: () => CardGameStore, set: (s: Partial<CardGameStore>) => void) {
  set(newState as any);
  sendGameAction(newState);
}

export const useCardGame = create<CardGameStore>((set, get) => ({
  phase: 'menu',
  players: [],
  currentPlayerIndex: 0,
  drawPile: [],
  discardPile: [],
  cardsPlayedThisTurn: 0,
  pendingAction: null,
  pendingTrade: null,
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
    set({ ...state, myPlayerIndex: 0, isMultiplayer: false, multiplayerWs: null, chatMessages: [], chatNextId: 1 });
    autoSave(state, false);
  },

  draw: () => {
    const state = get();
    if (state.isMultiplayer) {
      if (state.phase !== 'draw' || state.currentPlayerIndex !== state.myPlayerIndex) return;
      const newState = drawCards(state, 2);
      processAndSyncMultiplayer(newState, get, set);
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
      if (state.phase !== 'play' || state.currentPlayerIndex !== state.myPlayerIndex) return;
      const newState = playCardToBank(state, cardId);
      processAndSyncMultiplayer(newState, get, set);
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
      if (state.phase !== 'play' || state.currentPlayerIndex !== state.myPlayerIndex) return;
      const newState = playPropertyCard(state, cardId, color);
      processAndSyncMultiplayer(newState, get, set);
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
      if (state.phase !== 'play' || state.currentPlayerIndex !== state.myPlayerIndex) return;
      const result = playActionCard(state, cardId);
      if ('needsTarget' in result) {
        processAndSyncMultiplayer(result.state, get, set);
      } else {
        processAndSyncMultiplayer(result as GameState, get, set);
      }
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
      if (state.phase !== 'discard' || state.currentPlayerIndex !== state.myPlayerIndex) return;
      const newState = discardCard(state, cardId);
      processAndSyncMultiplayer(newState, get, set);
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
      if (state.phase !== 'play' || state.currentPlayerIndex !== state.myPlayerIndex) return;
      const newState = endTurn(state);
      processAndSyncMultiplayer(newState, get, set);
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
      const newState = resolveTargetAction(state, targetPlayerId, targetColor, targetCardId);
      processAndSyncMultiplayer(newState, get, set);
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
      const payerId = state.pendingAction?.currentResponder;
      if (payerId === undefined) return;
      const newState = resolveDebtPayment(state, payerId, cardIds);
      processAndSyncMultiplayer(newState, get, set);
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
      if (!state.pendingAction) return;
      const player = state.players[state.currentPlayerIndex];
      const card = player.properties[color].find(c => c.id === cardId);
      if (!card) return;
      const updated: Partial<GameState> = {
        pendingAction: {
          ...state.pendingAction,
          offeredProperty: { color, card },
        },
        phase: 'action_target' as const,
        message: 'Now choose an opponent\'s property to take',
      };
      set(updated as any);
      sendGameAction({ ...state, ...updated } as GameState);
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
      const newState = resolveActionResponse(state, useJustSayNo);
      processAndSyncMultiplayer(newState, get, set);
      return;
    }
    if (state.phase !== 'action_response') return;
    const newState = resolveActionResponse(state, useJustSayNo);
    set(newState);
    autoSave(newState, false);
  },

  startTrade: (trade: TradeProposal) => {
    const state = get();
    if (state.phase !== 'play') return;
    if (state.cardsPlayedThisTurn >= 3) return;
    if (state.isMultiplayer) {
      const newState = proposeTrade(state, trade);
      processAndSyncMultiplayer(newState, get, set);
      return;
    }
    const newState = proposeTrade(state, trade);
    set(newState);
    autoSave(newState, false);
  },

  respondTrade: (accepted: boolean) => {
    const state = get();
    if (state.phase !== 'trade_response') return;
    if (state.isMultiplayer) {
      const newState = resolveTradeResponse(state, accepted);
      processAndSyncMultiplayer(newState, get, set);
      return;
    }
    const newState = resolveTradeResponse(state, accepted);
    set(newState);
    autoSave(newState, false);
  },

  processAITurns: () => {
    const state = get();
    if (state.isMultiplayer) return;

    if (state.phase === 'trade_response') {
      const trade = state.pendingTrade;
      if (trade) {
        const target = state.players.find(p => p.id === trade.toPlayerId);
        if (target?.isAI) {
          let offeredValue = 0;
          for (const item of trade.offeredCards) {
            const from = state.players.find(p => p.id === trade.fromPlayerId);
            const card = from?.properties[item.color]?.find(c => c.id === item.cardId);
            if (card) offeredValue += card.value;
          }
          let requestedValue = 0;
          for (const item of trade.requestedCards) {
            const card = target.properties[item.color]?.find(c => c.id === item.cardId);
            if (card) requestedValue += card.value;
          }
          const accepted = offeredValue >= requestedValue;
          const newState = resolveTradeResponse(state, accepted);
          set(newState);
          autoSave(newState, false);
          return;
        }
      }
      return;
    }

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

    if (state.phase === 'pay_debt') {
      const payerId = state.pendingAction?.currentResponder;
      if (payerId === undefined) return;
      const payer = state.players.find(p => p.id === payerId);
      if (!payer?.isAI) return;

      const amount = state.pendingAction?.amount || 0;
      const bankSorted = [...payer.bank].sort((a, b) => a.value - b.value);
      const toPayIds: string[] = [];
      let paid = 0;

      for (const card of bankSorted) {
        if (paid >= amount) break;
        toPayIds.push(card.id);
        paid += card.value;
      }

      if (paid < amount) {
        for (const color of Object.keys(payer.properties) as PropertyColor[]) {
          const completeSetsCheck = getCompleteSets(payer);
          if (completeSetsCheck.includes(color)) continue;
          for (const card of payer.properties[color]) {
            if (paid >= amount) break;
            toPayIds.push(card.id);
            paid += card.value;
          }
        }
      }

      if (toPayIds.length === 0 && payer.bank.length > 0) {
        toPayIds.push(payer.bank[0].id);
      }

      if (toPayIds.length === 0) {
        const newState = resolveDebtPayment(state, payerId, []);
        set(newState);
        autoSave(newState, false);
        return;
      }

      const newState = resolveDebtPayment(state, payerId, toPayIds);
      set(newState);
      autoSave(newState, false);
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
            const rentCard = result.state.pendingAction?.card;
            const rentColors = rentCard?.colors;
            const actionType = result.state.pendingAction?.type;
            if (rentColors && rentColors.length > 0) {
              const ownedColors = rentColors.filter((c: PropertyColor) => player.properties[c].length > 0);
              if (ownedColors.length > 0) {
                const best = ownedColors.reduce((b: PropertyColor, c: PropertyColor) =>
                  getRentAmount(player, c) > getRentAmount(player, b) ? c : b, ownedColors[0]);
                // For wild_rent, target the richest opponent
                if (actionType === 'wild_rent') {
                  const richest = state.players
                    .filter(p => p.id !== player.id && getTotalAssetValue(p) > 0)
                    .sort((a, b) => getTotalAssetValue(b) - getTotalAssetValue(a))[0];
                  newState = resolveTargetAction(result.state, richest?.id ?? state.players.find(p => p.id !== player.id)!.id, best);
                } else {
                  newState = resolveTargetAction(result.state, player.id, best);
                }
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

  setFirebaseMultiplayer: (active: boolean) => {
    set({ isMultiplayer: active, multiplayerWs: null, chatMessages: [], chatNextId: 1 });
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
    if (state.isMultiplayer && fbIsConnected()) {
      fbLeaveRoom();
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
    if (state.isMultiplayer && fbIsConnected()) {
      const playerName = state.players[state.myPlayerIndex]?.name || 'You';
      fbSendChat(playerName, text);
      state.addChatMessage({ sender: playerName, text, timestamp: Date.now() });
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
