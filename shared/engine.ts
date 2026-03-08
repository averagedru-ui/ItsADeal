import { Card, GameState, Player, PropertyColor, GameLogEntry, TradeProposal } from './gameTypes';
import { createDeck, shuffleDeck, PROPERTY_SETS } from './cards';

let logIdCounter = 0;

function addLog(state: GameState, message: string, type: GameLogEntry['type'] = 'system') {
  state.gameLog.push({ id: ++logIdCounter, message, type });
  if (state.gameLog.length > 50) state.gameLog = state.gameLog.slice(-30);
}

function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function createPlayer(id: number, name: string, isAI: boolean): Player {
  const properties: Record<PropertyColor, Card[]> = {} as any;
  const hasHouse: Record<PropertyColor, boolean> = {} as any;
  const hasHotel: Record<PropertyColor, boolean> = {} as any;
  for (const color of Object.keys(PROPERTY_SETS) as PropertyColor[]) {
    properties[color] = [];
    hasHouse[color] = false;
    hasHotel[color] = false;
  }
  return { id, name, isAI, hand: [], bank: [], properties, hasHouse, hasHotel };
}

export function initializeGame(playerCount: number, playerNames?: string[]): GameState {
  const deck = shuffleDeck(createDeck());
  const players: Player[] = [];
  const defaultNames = ['You', 'Alex', 'Blake', 'Casey'];

  for (let i = 0; i < playerCount; i++) {
    const name = playerNames ? playerNames[i] : defaultNames[i];
    const isAI = playerNames ? false : i > 0;
    players.push(createPlayer(i, name, isAI));
  }

  let drawPile = [...deck];
  for (const player of players) {
    player.hand = drawPile.splice(0, 5);
  }

  const state: GameState = {
    phase: 'draw',
    players,
    currentPlayerIndex: 0,
    drawPile,
    discardPile: [],
    cardsPlayedThisTurn: 0,
    pendingAction: null,
    pendingTrade: null,
    winner: null,
    turnNumber: 1,
    message: players[0].isAI ? `${players[0].name}'s turn...` : 'Your turn! Draw 2 cards.',
    animatingCard: null,
    gameLog: [],
  };

  addLog(state, 'Game started!', 'system');
  return state;
}

export function drawCards(state: GameState, count: number = 2): GameState {
  const newState = deepCopy(state);
  const player = newState.players[newState.currentPlayerIndex];

  // Rule: if player has no cards, draw 5 instead of 2
  const actualCount = player.hand.length === 0 ? 5 : count;

  for (let i = 0; i < actualCount; i++) {
    if (newState.drawPile.length === 0) {
      newState.drawPile = shuffleDeck(newState.discardPile);
      newState.discardPile = [];
      addLog(newState, 'Deck reshuffled!', 'system');
    }
    if (newState.drawPile.length > 0) {
      player.hand.push(newState.drawPile.pop()!);
    }
  }

  addLog(newState, `${player.name} drew ${actualCount} card${actualCount !== 1 ? 's' : ''}`, 'system');
  newState.phase = 'play';
  newState.message = player.isAI
    ? `${player.name} is thinking...`
    : `Play up to 3 cards (${3 - newState.cardsPlayedThisTurn} remaining)`;
  return newState;
}

export function getCompleteSets(player: Player): PropertyColor[] {
  const complete: PropertyColor[] = [];
  for (const [color, cards] of Object.entries(player.properties) as [PropertyColor, Card[]][]) {
    if (cards.length >= PROPERTY_SETS[color].needed) {
      complete.push(color);
    }
  }
  return complete;
}

export function checkWinCondition(player: Player): boolean {
  return getCompleteSets(player).length >= 3;
}

export function getRentAmount(player: Player, color: PropertyColor): number {
  const count = player.properties[color].length;
  if (count === 0) return 0;
  const setInfo = PROPERTY_SETS[color];
  const baseRent = setInfo.rent[Math.min(count, setInfo.rent.length) - 1];
  let bonus = 0;
  if (player.hasHouse[color]) bonus += 3;
  if (player.hasHotel[color]) bonus += 4;
  return baseRent + bonus;
}

export function getTotalBankValue(player: Player): number {
  return player.bank.reduce((sum, c) => sum + c.value, 0);
}

export function getTotalAssetValue(player: Player): number {
  let total = getTotalBankValue(player);
  for (const cards of Object.values(player.properties)) {
    total += (cards as Card[]).reduce((sum: number, c: Card) => sum + c.value, 0);
  }
  return total;
}

function playerHasJustSayNo(player: Player): boolean {
  return player.hand.some(c => c.actionType === 'just_say_no');
}

function transitionToPayOrResponse(state: GameState): GameState {
  const responderId = state.pendingAction!.currentResponder!;
  const responder = state.players.find(p => p.id === responderId)!;
  const source = state.players.find(p => p.id === state.pendingAction!.sourcePlayerId)!;

  if (playerHasJustSayNo(responder)) {
    state.phase = 'action_response';
    state.pendingAction!.targetPlayerId = responderId;
    state.message = responder.isAI
      ? `${responder.name} considers blocking...`
      : `${source.name} charges you $${state.pendingAction!.amount}M! Play Just Say No?`;
    return state;
  }

  state.phase = 'pay_debt';
  state.message = responder.isAI
    ? `${responder.name} must pay $${state.pendingAction!.amount}M...`
    : `You must pay $${state.pendingAction!.amount}M!`;
  return state;
}

function returnToPlay(state: GameState): GameState {
  const source = state.players.find(p => p.id === state.pendingAction!.sourcePlayerId)!;
  state.pendingAction = null;
  if (state.cardsPlayedThisTurn >= 3) return endTurn(state);
  state.phase = 'play';
  state.message = source.isAI
    ? `${source.name} is thinking...`
    : `Play up to 3 cards (${3 - state.cardsPlayedThisTurn} remaining)`;
  return state;
}

export function playCardToBank(state: GameState, cardId: string): GameState {
  const newState = deepCopy(state);
  const player = newState.players[newState.currentPlayerIndex];
  const cardIndex = player.hand.findIndex((c: Card) => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = player.hand.splice(cardIndex, 1)[0];
  player.bank.push({ ...card, type: 'money' as const });
  newState.cardsPlayedThisTurn++;
  addLog(newState, `${player.name} banked ${card.name} ($${card.value}M)`, 'money');

  if (checkWinCondition(player)) {
    newState.phase = 'game_over';
    newState.winner = player.id;
    addLog(newState, `${player.name} wins!`, 'system');
    return newState;
  }

  if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);

  newState.message = player.isAI
    ? `${player.name} is thinking...`
    : `Play up to 3 cards (${3 - newState.cardsPlayedThisTurn} remaining)`;
  return newState;
}

export function playPropertyCard(state: GameState, cardId: string, targetColor?: PropertyColor): GameState {
  const newState = deepCopy(state);
  const player = newState.players[newState.currentPlayerIndex];
  const cardIndex = player.hand.findIndex((c: Card) => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = player.hand.splice(cardIndex, 1)[0];

  if (card.type === 'wildcard' && targetColor && card.colors?.includes(targetColor)) {
    card.color = targetColor;
    player.properties[targetColor].push(card);
    addLog(newState, `${player.name} played wild ${PROPERTY_SETS[targetColor].label} property`, 'property');
  } else if (card.type === 'property' && card.color) {
    player.properties[card.color].push(card);
    addLog(newState, `${player.name} played ${card.name}`, 'property');
  } else {
    player.hand.splice(cardIndex, 0, card);
    return state;
  }

  newState.cardsPlayedThisTurn++;

  if (checkWinCondition(player)) {
    newState.phase = 'game_over';
    newState.winner = player.id;
    addLog(newState, `${player.name} wins with 3 complete sets!`, 'system');
    return newState;
  }

  if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);

  newState.message = player.isAI
    ? `${player.name} is thinking...`
    : `Play up to 3 cards (${3 - newState.cardsPlayedThisTurn} remaining)`;
  return newState;
}

// Colors that cannot have houses or hotels
const NO_HOUSE_HOTEL_COLORS: PropertyColor[] = ['black', 'purple'];

export function playActionCard(state: GameState, cardId: string): GameState | { state: GameState; needsTarget: boolean; needsColorChoice?: boolean } {
  const newState = deepCopy(state);
  const player = newState.players[newState.currentPlayerIndex];
  const cardIndex = player.hand.findIndex((c: Card) => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = player.hand[cardIndex];

  switch (card.actionType) {
    case 'pass_go': {
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
      addLog(newState, `${player.name} played Pass Go`, 'action');
      const result = drawCards(newState, 2);
      if (result.cardsPlayedThisTurn >= 3) return endTurn(result);
      return result;
    }

    case 'debt_collector': {
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
      addLog(newState, `${player.name} played Debt Collector!`, 'action');
      newState.pendingAction = {
        type: 'debt_collector',
        sourcePlayerId: player.id,
        amount: 5,
        card,
      };
      newState.phase = 'action_target';
      newState.message = player.isAI ? `${player.name} plays Debt Collector!` : 'Choose a player to charge $5M';
      return { state: newState, needsTarget: true };
    }

    case 'birthday': {
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
      addLog(newState, `${player.name} says Happy Birthday!`, 'action');
      const otherPlayers = newState.players.filter((p: Player) => p.id !== player.id).map((p: Player) => p.id);
      newState.pendingAction = {
        type: 'birthday',
        sourcePlayerId: player.id,
        amount: 2,
        card,
        respondingPlayers: [...otherPlayers],
        currentResponder: otherPlayers[0],
      };
      newState.message = `${player.name} says Happy Birthday! Everyone pays $2M`;
      return transitionToPayOrResponse(newState);
    }

    case 'sly_deal': {
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
      addLog(newState, `${player.name} played Sly Deal!`, 'action');
      newState.pendingAction = {
        type: 'sly_deal',
        sourcePlayerId: player.id,
        card,
      };
      newState.phase = 'action_target';
      newState.message = player.isAI ? `${player.name} plays Sly Deal!` : 'Choose a property to steal';
      return { state: newState, needsTarget: true };
    }

    case 'forced_deal': {
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
      addLog(newState, `${player.name} played Forced Deal!`, 'action');
      newState.pendingAction = {
        type: 'forced_deal',
        sourcePlayerId: player.id,
        card,
      };
      newState.phase = 'forced_deal_pick';
      newState.message = player.isAI ? `${player.name} plays Forced Deal!` : 'Choose one of your properties to offer';
      return { state: newState, needsTarget: true };
    }

    case 'deal_breaker': {
      // Check if any opponent has a complete set before consuming the card play
      const anyCompleteSet = newState.players
        .filter((p: Player) => p.id !== player.id)
        .some((p: Player) => getCompleteSets(p).length > 0);
      if (!anyCompleteSet) {
        newState.message = 'No opponent has a complete set to steal!';
        newState.phase = 'play';
        return newState;
      }
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
      addLog(newState, `${player.name} played Deal Breaker!`, 'action');
      newState.pendingAction = {
        type: 'deal_breaker',
        sourcePlayerId: player.id,
        card,
      };
      newState.phase = 'action_target';
      newState.message = player.isAI ? `${player.name} plays Deal Breaker!` : 'Choose a complete set to steal';
      return { state: newState, needsTarget: true };
    }

    case 'just_say_no': {
      player.hand.splice(cardIndex, 1);
      player.bank.push({ ...card, type: 'money' as const });
      newState.cardsPlayedThisTurn++;
      addLog(newState, `${player.name} banked Just Say No ($${card.value}M)`, 'money');
      if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
      newState.phase = 'play';
      newState.message = player.isAI
        ? `${player.name} is thinking...`
        : `Play up to 3 cards (${3 - newState.cardsPlayedThisTurn} remaining)`;
      return newState;
    }

    case 'rent':
    case 'wild_rent': {
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
      addLog(newState, `${player.name} played ${card.name}!`, 'action');
      newState.pendingAction = {
        type: card.actionType!,
        sourcePlayerId: player.id,
        card,
        // doubleRent: check if player has double rent in hand (will be applied at color selection)
        canSayNo: false,
      };
      newState.phase = 'action_target';
      newState.message = player.isAI ? `${player.name} charges rent!` : 'Choose which color to charge rent on';
      return { state: newState, needsTarget: true, needsColorChoice: true };
    }

    case 'double_rent': {
      // Double Rent must be played right after a Rent card. Check if a rent was just set up.
      // If the pending action is a rent color selection, apply double. Otherwise bank it.
      // In practice, double_rent is played FROM HAND during the play phase, triggering a
      // "pending double rent" that applies to the next rent card played this turn.
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
      // Mark that next rent played this turn is doubled
      (newState as any).pendingDoubleRent = ((newState as any).pendingDoubleRent || 0) + 1;
      addLog(newState, `${player.name} played Double Rent! Next rent is doubled`, 'action');
      if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
      newState.phase = 'play';
      newState.message = player.isAI
        ? `${player.name} is thinking...`
        : `Double Rent active! Play a Rent card now (${3 - newState.cardsPlayedThisTurn} plays left)`;
      return newState;
    }

    case 'house': {
      const completeSets = getCompleteSets(player).filter(c => !NO_HOUSE_HOTEL_COLORS.includes(c));
      const eligible = completeSets.filter((c: PropertyColor) => !player.hasHouse[c]);
      if (eligible.length === 0) {
        newState.message = 'No eligible complete sets to add a house to! (Railroads and Utilities cannot have houses)';
        return newState;
      }
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
      if (eligible.length === 1) {
        player.hasHouse[eligible[0]] = true;
        addLog(newState, `${player.name} added house to ${PROPERTY_SETS[eligible[0]].label}`, 'property');
        if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
        newState.phase = 'play';
        return newState;
      }
      newState.pendingAction = {
        type: 'house',
        sourcePlayerId: player.id,
        card,
      };
      newState.phase = 'action_target';
      newState.message = 'Choose a set to add a house to';
      return { state: newState, needsTarget: true };
    }

    case 'hotel': {
      const completeSetsH = getCompleteSets(player).filter(c => !NO_HOUSE_HOTEL_COLORS.includes(c));
      const eligibleH = completeSetsH.filter((c: PropertyColor) => player.hasHouse[c] && !player.hasHotel[c]);
      if (eligibleH.length === 0) {
        newState.message = 'No sets with houses to add a hotel to! (Railroads and Utilities cannot have hotels)';
        return newState;
      }
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
      if (eligibleH.length === 1) {
        player.hasHotel[eligibleH[0]] = true;
        addLog(newState, `${player.name} added hotel to ${PROPERTY_SETS[eligibleH[0]].label}`, 'property');
        if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
        newState.phase = 'play';
        return newState;
      }
      newState.pendingAction = {
        type: 'hotel',
        sourcePlayerId: player.id,
        card,
      };
      newState.phase = 'action_target';
      newState.message = 'Choose a set to add a hotel to';
      return { state: newState, needsTarget: true };
    }
  }

  return state;
}

function performSlyDeal(state: GameState, sourceId: number, targetId: number, targetColor: PropertyColor, targetCardId: string): GameState {
  const source = state.players.find((p: Player) => p.id === sourceId)!;
  const target = state.players.find((p: Player) => p.id === targetId)!;
  const completeSets = getCompleteSets(target);
  if (completeSets.includes(targetColor)) {
    state.message = "Can't steal from a complete set with Sly Deal!";
    state.pendingAction = null;
    state.phase = 'play';
    return state;
  }
  const propIdx = target.properties[targetColor].findIndex((c: Card) => c.id === targetCardId);
  if (propIdx === -1) return state;
  const card = target.properties[targetColor].splice(propIdx, 1)[0];
  const destColor = card.color || targetColor;
  source.properties[destColor].push(card);
  addLog(state, `${source.name} stole ${card.name} from ${target.name}!`, 'steal');
  state.pendingAction = null;
  if (checkWinCondition(source)) {
    state.phase = 'game_over';
    state.winner = source.id;
    addLog(state, `${source.name} wins!`, 'system');
    return state;
  }
  return returnToPlay(state);
}

function performDealBreaker(state: GameState, sourceId: number, targetId: number, targetColor: PropertyColor): GameState {
  const source = state.players.find((p: Player) => p.id === sourceId)!;
  const target = state.players.find((p: Player) => p.id === targetId)!;
  const stolen = target.properties[targetColor].splice(0);
  source.properties[targetColor].push(...stolen);
  if (target.hasHouse[targetColor]) {
    source.hasHouse[targetColor] = true;
    target.hasHouse[targetColor] = false;
  }
  if (target.hasHotel[targetColor]) {
    source.hasHotel[targetColor] = true;
    target.hasHotel[targetColor] = false;
  }
  addLog(state, `${source.name} stole ${PROPERTY_SETS[targetColor].label} set from ${target.name}!`, 'steal');
  state.pendingAction = null;
  if (checkWinCondition(source)) {
    state.phase = 'game_over';
    state.winner = source.id;
    addLog(state, `${source.name} wins!`, 'system');
    return state;
  }
  return returnToPlay(state);
}

function performForcedDeal(state: GameState, sourceId: number, targetId: number, targetColor: PropertyColor, targetCardId: string, offered: { color: PropertyColor; card: Card }): GameState {
  const source = state.players.find((p: Player) => p.id === sourceId)!;
  const target = state.players.find((p: Player) => p.id === targetId)!;
  const completeSetsTarget = getCompleteSets(target);
  if (completeSetsTarget.includes(targetColor)) {
    state.message = "Can't force deal from a complete set!";
    state.pendingAction = null;
    state.phase = 'play';
    return state;
  }
  const tPropIdx = target.properties[targetColor].findIndex((c: Card) => c.id === targetCardId);
  if (tPropIdx === -1) return state;
  const targetCard = target.properties[targetColor].splice(tPropIdx, 1)[0];
  const srcPropIdx = source.properties[offered.color].findIndex((c: Card) => c.id === offered.card.id);
  if (srcPropIdx !== -1) {
    source.properties[offered.color].splice(srcPropIdx, 1);
  }
  const destColor1 = targetCard.color || targetColor;
  source.properties[destColor1].push(targetCard);
  target.properties[offered.color].push(offered.card);
  addLog(state, `${source.name} swapped properties with ${target.name}!`, 'steal');
  state.pendingAction = null;
  if (checkWinCondition(source)) {
    state.phase = 'game_over';
    state.winner = source.id;
    addLog(state, `${source.name} wins!`, 'system');
    return state;
  }
  return returnToPlay(state);
}

export function cancelPendingAction(state: GameState): GameState {
  const newState = deepCopy(state);
  const action = newState.pendingAction;
  if (!action) return state;

  const player = newState.players.find((p: Player) => p.id === action.sourcePlayerId)!;

  // Return the card from discard pile back to hand
  if (action.card) {
    const discardIdx = newState.discardPile.findIndex((c: Card) => c.id === action.card!.id);
    if (discardIdx !== -1) {
      const [card] = newState.discardPile.splice(discardIdx, 1);
      player.hand.push(card);
      newState.cardsPlayedThisTurn--;
      addLog(newState, `${player.name} cancelled the action`, 'system');
    }
  }

  newState.pendingAction = null;
  newState.phase = 'play';
  newState.message = player.isAI
    ? `${player.name} is thinking...`
    : `Play up to 3 cards (${3 - newState.cardsPlayedThisTurn} remaining)`;
  return newState;
}
  const newState = deepCopy(state);
  const payer = newState.players.find((p: Player) => p.id === payerId)!;
  const receiver = newState.players.find((p: Player) => p.id === newState.pendingAction!.sourcePlayerId)!;
  let totalPaid = 0;

  for (const cardId of cardIds) {
    let found = false;
    const bankIdx = payer.bank.findIndex((c: Card) => c.id === cardId);
    if (bankIdx !== -1) {
      const card = payer.bank.splice(bankIdx, 1)[0];
      totalPaid += card.value;
      receiver.bank.push(card);
      found = true;
    }
    if (!found) {
      for (const color of Object.keys(payer.properties) as PropertyColor[]) {
        const propIdx = payer.properties[color].findIndex((c: Card) => c.id === cardId);
        if (propIdx !== -1) {
          const card = payer.properties[color].splice(propIdx, 1)[0];
          totalPaid += card.value;
          if (card.color) {
            receiver.properties[card.color].push(card);
          } else {
            receiver.bank.push(card);
          }
          break;
        }
      }
    }
  }

  addLog(newState, `${payer.name} paid $${totalPaid}M to ${receiver.name}`, 'rent');

  if (newState.pendingAction?.respondingPlayers) {
    const idx = newState.pendingAction.respondingPlayers.indexOf(payerId);
    if (idx !== -1) {
      newState.pendingAction.respondingPlayers.splice(idx, 1);
    }
    if (newState.pendingAction.respondingPlayers.length > 0) {
      newState.pendingAction.currentResponder = newState.pendingAction.respondingPlayers[0];
      return transitionToPayOrResponse(newState);
    }
  }

  return returnToPlay(newState);
}

export function resolveTargetAction(state: GameState, targetPlayerId: number, targetColor?: PropertyColor, targetCardId?: string): GameState {
  const newState = deepCopy(state);
  const action = newState.pendingAction!;
  const source = newState.players.find((p: Player) => p.id === action.sourcePlayerId)!;
  const target = newState.players.find((p: Player) => p.id === targetPlayerId)!;

  switch (action.type) {
    case 'debt_collector': {
      newState.pendingAction!.targetPlayerId = targetPlayerId;
      newState.pendingAction!.respondingPlayers = [targetPlayerId];
      newState.pendingAction!.currentResponder = targetPlayerId;
      addLog(newState, `${source.name} charges ${target.name} $5M!`, 'rent');
      return transitionToPayOrResponse(newState);
    }

    case 'sly_deal': {
      if (!targetColor || !targetCardId) return state;
      if (playerHasJustSayNo(target)) {
        newState.phase = 'action_response';
        newState.pendingAction!.targetPlayerId = targetPlayerId;
        newState.pendingAction!.pendingTargets = [{ playerId: targetPlayerId, color: targetColor, cardId: targetCardId }];
        newState.message = target.isAI
          ? `${target.name} considers blocking the steal...`
          : `${source.name} wants to steal your property! Play Just Say No?`;
        return newState;
      }
      return performSlyDeal(newState, action.sourcePlayerId, targetPlayerId, targetColor, targetCardId);
    }

    case 'deal_breaker': {
      if (!targetColor) return state;
      if (playerHasJustSayNo(target)) {
        newState.phase = 'action_response';
        newState.pendingAction!.targetPlayerId = targetPlayerId;
        newState.pendingAction!.pendingTargets = [{ playerId: targetPlayerId, color: targetColor }];
        newState.message = target.isAI
          ? `${target.name} considers blocking the steal...`
          : `${source.name} wants to steal your ${PROPERTY_SETS[targetColor].label} set! Play Just Say No?`;
        return newState;
      }
      return performDealBreaker(newState, action.sourcePlayerId, targetPlayerId, targetColor);
    }

    case 'rent':
    case 'wild_rent': {
      if (!targetColor) return state;
      let rentAmount = getRentAmount(source, targetColor);
      if (rentAmount === 0) {
        newState.pendingAction = null;
        newState.message = 'No rent to charge!';
        if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
        newState.phase = 'play';
        return newState;
      }
      // Apply Double Rent multiplier if active
      const doubleCount = (newState as any).pendingDoubleRent || 0;
      if (doubleCount > 0) {
        rentAmount = rentAmount * Math.pow(2, doubleCount);
        (newState as any).pendingDoubleRent = 0;
        addLog(newState, `Double Rent applied! Rent is now $${rentAmount}M`, 'action');
      }

      // Wild Rent = charge ONE chosen player. Dual-color Rent = charge ALL other players.
      if (action.type === 'wild_rent') {
        // targetPlayerId was set when the player chose the opponent in UI
        const targetId = targetPlayerId ?? newState.players.find((p: Player) => p.id !== source.id)?.id;
        if (targetId === undefined) {
          newState.pendingAction = null;
          if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
          newState.phase = 'play';
          return newState;
        }
        const wildTarget = newState.players.find((p: Player) => p.id === targetId)!;
        newState.pendingAction = {
          type: 'rent',
          sourcePlayerId: source.id,
          amount: rentAmount,
          respondingPlayers: [targetId],
          currentResponder: targetId,
          card: action.card,
        };
        addLog(newState, `${source.name} charges ${wildTarget.name} $${rentAmount}M rent on ${PROPERTY_SETS[targetColor].label}!`, 'rent');
        return transitionToPayOrResponse(newState);
      } else {
        // Standard dual-color rent — all other players pay
        const otherPlayers = newState.players.filter((p: Player) => p.id !== source.id).map((p: Player) => p.id);
        newState.pendingAction = {
          type: 'rent',
          sourcePlayerId: source.id,
          amount: rentAmount,
          respondingPlayers: [...otherPlayers],
          currentResponder: otherPlayers[0],
          card: action.card,
        };
        addLog(newState, `${source.name} charges $${rentAmount}M rent on ${PROPERTY_SETS[targetColor].label}!`, 'rent');
        return transitionToPayOrResponse(newState);
      }
    }

    case 'house': {
      if (!targetColor) return state;
      source.hasHouse[targetColor] = true;
      addLog(newState, `${source.name} added house to ${PROPERTY_SETS[targetColor].label}`, 'property');
      newState.pendingAction = null;
      if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
      newState.phase = 'play';
      return newState;
    }

    case 'hotel': {
      if (!targetColor) return state;
      source.hasHotel[targetColor] = true;
      addLog(newState, `${source.name} added hotel to ${PROPERTY_SETS[targetColor].label}`, 'property');
      newState.pendingAction = null;
      if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
      newState.phase = 'play';
      return newState;
    }

    case 'forced_deal': {
      if (!targetColor || !targetCardId) return state;
      const offered = action.offeredProperty;
      if (!offered) return state;
      if (playerHasJustSayNo(target)) {
        newState.phase = 'action_response';
        newState.pendingAction!.targetPlayerId = targetPlayerId;
        newState.pendingAction!.pendingTargets = [{ playerId: targetPlayerId, color: targetColor, cardId: targetCardId }];
        newState.message = target.isAI
          ? `${target.name} considers blocking the swap...`
          : `${source.name} wants to swap properties! Play Just Say No?`;
        return newState;
      }
      return performForcedDeal(newState, action.sourcePlayerId, targetPlayerId, targetColor, targetCardId, offered);
    }
  }

  return newState;
}

export function resolveActionResponse(state: GameState, useJustSayNo: boolean): GameState {
  const newState = deepCopy(state);
  const action = newState.pendingAction!;
  const targetId = action.targetPlayerId!;
  const target = newState.players.find((p: Player) => p.id === targetId)!;
  const source = newState.players.find((p: Player) => p.id === action.sourcePlayerId)!;

  if (useJustSayNo) {
    const jsnIdx = target.hand.findIndex((c: Card) => c.actionType === 'just_say_no');
    if (jsnIdx !== -1) {
      const jsnCard = target.hand.splice(jsnIdx, 1)[0];
      newState.discardPile.push(jsnCard);
    }
    addLog(newState, `${target.name} blocks with Just Say No!`, 'action');

    // Check if the SOURCE (original attacker) has a JSN to counter
    if (playerHasJustSayNo(source)) {
      // Swap roles: now source can respond to target's JSN
      newState.phase = 'action_response';
      // Temporarily swap targetPlayerId to point at source so ActionPanel shows for them
      newState.pendingAction!.targetPlayerId = source.id;
      // Store who blocked so we know what to do if source also says no
      newState.pendingAction!.blockedPlayers = [...(action.blockedPlayers || []), targetId];
      newState.message = source.isAI
        ? `${source.name} considers countering the Just Say No...`
        : `${target.name} blocked with Just Say No! Play your own Just Say No to counter?`;
      return newState;
    }

    // No counter available — action is fully blocked
    if (['debt_collector', 'sly_deal', 'deal_breaker', 'forced_deal'].includes(action.type)) {
      return returnToPlay(newState);
    }

    if (action.respondingPlayers) {
      const idx = action.respondingPlayers.indexOf(targetId);
      if (idx !== -1) action.respondingPlayers.splice(idx, 1);
      if (action.respondingPlayers.length === 0) {
        return returnToPlay(newState);
      }
      action.currentResponder = action.respondingPlayers[0];
      return transitionToPayOrResponse(newState);
    }

    return returnToPlay(newState);
  } else {
    // Check if we're resolving a counter-JSN situation (source declining to counter)
    if (action.blockedPlayers && action.blockedPlayers.length > 0) {
      // Source chose NOT to counter — action remains blocked, return to play
      addLog(newState, `${source.name} accepts the block`, 'system');
      newState.pendingAction!.blockedPlayers = [];
      return returnToPlay(newState);
    }

    addLog(newState, `${target.name} accepts the action`, 'system');

    switch (action.type) {
      case 'debt_collector': {
        newState.phase = 'pay_debt';
        newState.message = target.isAI ? `${target.name} must pay $5M...` : 'You must pay $5M!';
        return newState;
      }
      case 'sly_deal': {
        const pt = action.pendingTargets?.[0];
        if (pt?.color && pt?.cardId) {
          return performSlyDeal(newState, action.sourcePlayerId, targetId, pt.color, pt.cardId);
        }
        break;
      }
      case 'deal_breaker': {
        const pt = action.pendingTargets?.[0];
        if (pt?.color) {
          return performDealBreaker(newState, action.sourcePlayerId, targetId, pt.color);
        }
        break;
      }
      case 'forced_deal': {
        const pt = action.pendingTargets?.[0];
        if (pt?.color && pt?.cardId && action.offeredProperty) {
          return performForcedDeal(newState, action.sourcePlayerId, targetId, pt.color, pt.cardId, action.offeredProperty);
        }
        break;
      }
      case 'rent':
      case 'birthday': {
        newState.phase = 'pay_debt';
        newState.message = target.isAI
          ? `${target.name} must pay $${action.amount}M...`
          : `You must pay $${action.amount}M!`;
        return newState;
      }
    }
  }

  return returnToPlay(newState);
}

export function endTurn(state: GameState): GameState {
  const newState = deepCopy(state);
  const currentPlayer = newState.players[newState.currentPlayerIndex];

  if (currentPlayer.hand.length > 7) {
    newState.phase = 'discard';
    newState.message = currentPlayer.isAI
      ? `${currentPlayer.name} is discarding...`
      : `You have ${currentPlayer.hand.length} cards. Discard down to 7.`;
    return newState;
  }

  return advanceToNextPlayer(newState);
}

export function discardCard(state: GameState, cardId: string): GameState {
  const newState = deepCopy(state);
  const player = newState.players[newState.currentPlayerIndex];
  const cardIndex = player.hand.findIndex((c: Card) => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = player.hand.splice(cardIndex, 1)[0];
  newState.discardPile.push(card);

  if (player.hand.length <= 7) {
    return advanceToNextPlayer(newState);
  }

  newState.message = player.isAI
    ? `${player.name} is discarding...`
    : `You have ${player.hand.length} cards. Discard down to 7.`;
  return newState;
}

function advanceToNextPlayer(state: GameState): GameState {
  const newState = deepCopy(state);
  newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
  newState.cardsPlayedThisTurn = 0;
  newState.pendingAction = null;
  newState.pendingTrade = null;
  newState.turnNumber++;
  // Clear any pending double rent from previous turn
  (newState as any).pendingDoubleRent = 0;

  const nextPlayer = newState.players[newState.currentPlayerIndex];
  newState.phase = 'draw';
  newState.message = nextPlayer.isAI
    ? `${nextPlayer.name}'s turn...`
    : 'Your turn! Draw 2 cards.';
  addLog(newState, `${nextPlayer.name}'s turn`, 'system');
  return newState;
}

export function proposeTrade(state: GameState, trade: TradeProposal): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (trade.fromPlayerId !== currentPlayer.id) return state;
  if (trade.fromPlayerId === trade.toPlayerId) return state;
  if (trade.offeredCards.length === 0 || trade.requestedCards.length === 0) return state;

  const newState = deepCopy(state);
  const from = newState.players.find((p: Player) => p.id === trade.fromPlayerId)!;
  const to = newState.players.find((p: Player) => p.id === trade.toPlayerId)!;

  for (const item of trade.offeredCards) {
    if (!from.properties[item.color].some((c: Card) => c.id === item.cardId)) return state;
  }
  for (const item of trade.requestedCards) {
    if (!to.properties[item.color].some((c: Card) => c.id === item.cardId)) return state;
  }

  newState.pendingTrade = trade;
  newState.phase = 'trade_response';
  newState.message = to.isAI
    ? `${to.name} is considering the trade...`
    : `${from.name} wants to trade with you!`;
  addLog(newState, `${from.name} proposes a trade with ${to.name}`, 'action');
  return newState;
}

export function resolveTradeResponse(state: GameState, accepted: boolean): GameState {
  const newState = deepCopy(state);
  const trade = newState.pendingTrade;
  if (!trade) return state;

  const from = newState.players.find((p: Player) => p.id === trade.fromPlayerId)!;
  const to = newState.players.find((p: Player) => p.id === trade.toPlayerId)!;

  if (accepted) {
    for (const item of trade.offeredCards) {
      const idx = from.properties[item.color].findIndex((c: Card) => c.id === item.cardId);
      if (idx !== -1) {
        const [card] = from.properties[item.color].splice(idx, 1);
        to.properties[item.color].push(card);
      }
    }
    for (const item of trade.requestedCards) {
      const idx = to.properties[item.color].findIndex((c: Card) => c.id === item.cardId);
      if (idx !== -1) {
        const [card] = to.properties[item.color].splice(idx, 1);
        from.properties[item.color].push(card);
      }
    }
    addLog(newState, `${to.name} accepted the trade with ${from.name}!`, 'action');
    // Trades do NOT count as a card play (it's a negotiation, not a card action)
  } else {
    addLog(newState, `${to.name} rejected ${from.name}'s trade offer`, 'action');
  }

  newState.pendingTrade = null;
  const currentPlayer = newState.players[newState.currentPlayerIndex];

  // Check win condition after trade
  for (const p of newState.players) {
    if (checkWinCondition(p)) {
      newState.phase = 'game_over';
      newState.winner = p.id;
      newState.message = `${p.name} wins!`;
      return newState;
    }
  }

  // Return to play — trades don't consume play actions
  newState.phase = 'play';
  newState.message = currentPlayer.isAI
    ? `${currentPlayer.name} is playing...`
    : `Play up to 3 cards (${3 - newState.cardsPlayedThisTurn} remaining)`;

  return newState;
}

function aiEvaluateTrade(state: GameState, trade: TradeProposal): boolean {
  const to = state.players.find((p: Player) => p.id === trade.toPlayerId)!;
  let offeredValue = 0;
  for (const item of trade.offeredCards) {
    const from = state.players.find((p: Player) => p.id === trade.fromPlayerId)!;
    const card = from.properties[item.color].find((c: Card) => c.id === item.cardId);
    if (card) offeredValue += card.value;
  }
  let requestedValue = 0;
  for (const item of trade.requestedCards) {
    const card = to.properties[item.color].find((c: Card) => c.id === item.cardId);
    if (card) {
      requestedValue += card.value;
      const completeSets = getCompleteSets(to);
      if (completeSets.includes(item.color)) requestedValue += 5;
    }
  }
  return offeredValue >= requestedValue;
}

export function getAIAction(state: GameState): { action: string; cardId?: string; targetColor?: PropertyColor; targetPlayerId?: number; targetCardId?: string; useJustSayNo?: boolean } {
  const player = state.players[state.currentPlayerIndex];

  if (state.phase === 'action_response') {
    const responderId = state.pendingAction?.targetPlayerId;
    const responder = state.players.find((p: Player) => p.id === responderId);
    const isCounterJsn = (state.pendingAction as any)?.blockedPlayers?.length > 0;
    if (responder?.isAI && playerHasJustSayNo(responder)) {
      const actionType = state.pendingAction?.type;
      // Counter JSN: attacker deciding whether to counter the block
      if (isCounterJsn) {
        // AI attacker: always counter if they have a JSN and it's a powerful action
        const shouldCounter = actionType === 'deal_breaker' || actionType === 'sly_deal' || Math.random() < 0.6;
        return { action: 'respond_jsn', useJustSayNo: shouldCounter };
      }
      const shouldBlock = actionType === 'deal_breaker' ||
        actionType === 'sly_deal' ||
        (actionType === 'debt_collector') ||
        (actionType === 'forced_deal') ||
        Math.random() < 0.5;
      return { action: 'respond_jsn', useJustSayNo: shouldBlock };
    }
    if (isCounterJsn && responder?.isAI) {
      return { action: 'respond_jsn', useJustSayNo: false };
    }
    return { action: 'respond_jsn', useJustSayNo: false };
  }

  if (state.phase === 'discard') {
    const lowest = [...player.hand].sort((a, b) => a.value - b.value);
    return { action: 'discard', cardId: lowest[0].id };
  }

  if (state.phase === 'pay_debt' && state.pendingAction?.currentResponder === player.id) {
    const amount = state.pendingAction.amount || 0;
    const bankSorted = [...player.bank].sort((a, b) => a.value - b.value);
    const toPayIds: string[] = [];
    let paid = 0;

    for (const card of bankSorted) {
      if (paid >= amount) break;
      toPayIds.push(card.id);
      paid += card.value;
    }

    if (paid < amount) {
      for (const color of Object.keys(player.properties) as PropertyColor[]) {
        const completeSetsCheck = getCompleteSets(player);
        if (completeSetsCheck.includes(color)) continue;
        for (const card of player.properties[color]) {
          if (paid >= amount) break;
          toPayIds.push(card.id);
          paid += card.value;
        }
      }
    }

    if (toPayIds.length === 0 && player.bank.length > 0) {
      toPayIds.push(player.bank[0].id);
    }

    return { action: 'pay_debt', cardId: toPayIds.join(',') };
  }

  for (const card of player.hand) {
    if (card.actionType === 'pass_go') {
      return { action: 'play_action', cardId: card.id };
    }
  }

  for (const card of player.hand) {
    if (card.type === 'property' && card.color) {
      return { action: 'play_property', cardId: card.id, targetColor: card.color };
    }
    if (card.type === 'wildcard' && card.colors && card.colors.length > 0) {
      const bestColor = card.colors.reduce((best: PropertyColor, c: PropertyColor) => {
        return player.properties[c].length > player.properties[best].length ? c : best;
      }, card.colors[0]);
      return { action: 'play_property', cardId: card.id, targetColor: bestColor };
    }
  }

  for (const card of player.hand) {
    if (card.actionType === 'rent' || card.actionType === 'wild_rent') {
      const ownedColors = (Object.keys(player.properties) as PropertyColor[]).filter(c => player.properties[c].length > 0);
      if (card.actionType === 'wild_rent' && ownedColors.length > 0) {
        const bestColor = ownedColors.reduce((best: PropertyColor, c: PropertyColor) =>
          getRentAmount(player, c) > getRentAmount(player, best) ? c : best, ownedColors[0]);
        // Wild rent charges one player — pick the richest opponent
        const richestOpponent = state.players
          .filter(p => p.id !== player.id && getTotalAssetValue(p) > 0)
          .sort((a, b) => getTotalAssetValue(b) - getTotalAssetValue(a))[0];
        if (richestOpponent) {
          return { action: 'play_action', cardId: card.id, targetColor: bestColor, targetPlayerId: richestOpponent.id };
        }
      }
      if (card.actionType === 'rent' && card.colors) {
        const matchingColors = card.colors.filter(c => player.properties[c].length > 0);
        if (matchingColors.length > 0) {
          const bestColor = matchingColors.reduce((best: PropertyColor, c: PropertyColor) =>
            getRentAmount(player, c) > getRentAmount(player, best) ? c : best, matchingColors[0]);
          return { action: 'play_action', cardId: card.id, targetColor: bestColor };
        }
      }
    }
  }

  for (const card of player.hand) {
    if (card.actionType === 'debt_collector') {
      const richest = state.players
        .filter(p => p.id !== player.id && getTotalAssetValue(p) > 0)
        .sort((a, b) => getTotalAssetValue(b) - getTotalAssetValue(a))[0];
      if (richest) {
        return { action: 'play_action', cardId: card.id, targetPlayerId: richest.id };
      }
    }
  }

  for (const card of player.hand) {
    if (card.actionType === 'birthday') {
      return { action: 'play_action', cardId: card.id };
    }
  }

  for (const card of player.hand) {
    if (card.actionType === 'sly_deal') {
      for (const opponent of state.players.filter(p => p.id !== player.id)) {
        for (const color of Object.keys(opponent.properties) as PropertyColor[]) {
          const completeSetsOpp = getCompleteSets(opponent);
          if (completeSetsOpp.includes(color)) continue;
          if (opponent.properties[color].length > 0) {
            return {
              action: 'play_action',
              cardId: card.id,
              targetPlayerId: opponent.id,
              targetColor: color,
              targetCardId: opponent.properties[color][0].id,
            };
          }
        }
      }
    }
  }

  for (const card of player.hand) {
    if (card.actionType === 'deal_breaker') {
      for (const opponent of state.players.filter(p => p.id !== player.id)) {
        const completeSetsOpp = getCompleteSets(opponent);
        if (completeSetsOpp.length > 0) {
          return {
            action: 'play_action',
            cardId: card.id,
            targetPlayerId: opponent.id,
            targetColor: completeSetsOpp[0],
          };
        }
      }
    }
  }

  for (const card of player.hand) {
    if (card.actionType === 'house') {
      const sets = getCompleteSets(player);
      const eligible = sets.filter(c => !player.hasHouse[c]);
      if (eligible.length > 0) {
        return { action: 'play_action', cardId: card.id, targetColor: eligible[0] };
      }
    }
    if (card.actionType === 'hotel') {
      const sets = getCompleteSets(player);
      const eligible = sets.filter(c => player.hasHouse[c] && !player.hasHotel[c]);
      if (eligible.length > 0) {
        return { action: 'play_action', cardId: card.id, targetColor: eligible[0] };
      }
    }
  }

  for (const card of player.hand) {
    if (card.type === 'money' || (card.type === 'action' && !['just_say_no'].includes(card.actionType || ''))) {
      return { action: 'play_bank', cardId: card.id };
    }
  }

  return { action: 'end_turn' };
}
