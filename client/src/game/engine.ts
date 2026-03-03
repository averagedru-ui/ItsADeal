import { Card, GameState, Player, PropertyColor, PendingAction } from './types';
import { createDeck, shuffleDeck, PROPERTY_SETS } from './cards';

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

export function initializeGame(playerCount: number): GameState {
  const deck = shuffleDeck(createDeck());
  const players: Player[] = [
    createPlayer(0, 'You', false),
  ];
  const aiNames = ['Alex', 'Blake', 'Casey'];
  for (let i = 1; i < playerCount; i++) {
    players.push(createPlayer(i, aiNames[i - 1], true));
  }

  let drawPile = [...deck];
  for (const player of players) {
    player.hand = drawPile.splice(0, 5);
  }

  return {
    phase: 'draw',
    players,
    currentPlayerIndex: 0,
    drawPile,
    discardPile: [],
    cardsPlayedThisTurn: 0,
    pendingAction: null,
    winner: null,
    turnNumber: 1,
    message: 'Your turn! Draw 2 cards.',
    animatingCard: null,
  };
}

export function drawCards(state: GameState, count: number = 2): GameState {
  const newState = deepCopy(state);
  const player = newState.players[newState.currentPlayerIndex];

  for (let i = 0; i < count; i++) {
    if (newState.drawPile.length === 0) {
      newState.drawPile = shuffleDeck(newState.discardPile);
      newState.discardPile = [];
    }
    if (newState.drawPile.length > 0) {
      player.hand.push(newState.drawPile.pop()!);
    }
  }

  newState.phase = 'play';
  const p = newState.players[newState.currentPlayerIndex];
  newState.message = p.isAI
    ? `${p.name} is thinking...`
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

export function playCardToBank(state: GameState, cardId: string): GameState {
  const newState = deepCopy(state);
  const player = newState.players[newState.currentPlayerIndex];
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = player.hand.splice(cardIndex, 1)[0];
  player.bank.push({ ...card, type: 'money' });
  newState.cardsPlayedThisTurn++;

  if (checkWinCondition(player)) {
    newState.phase = 'game_over';
    newState.winner = player.id;
    newState.message = `${player.name} wins!`;
    return newState;
  }

  if (newState.cardsPlayedThisTurn >= 3) {
    return endTurn(newState);
  }

  newState.message = player.isAI
    ? `${player.name} is thinking...`
    : `Play up to 3 cards (${3 - newState.cardsPlayedThisTurn} remaining)`;
  return newState;
}

export function playPropertyCard(state: GameState, cardId: string, targetColor?: PropertyColor): GameState {
  const newState = deepCopy(state);
  const player = newState.players[newState.currentPlayerIndex];
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = player.hand.splice(cardIndex, 1)[0];

  if (card.type === 'wildcard' && targetColor && card.colors?.includes(targetColor)) {
    card.color = targetColor;
    player.properties[targetColor].push(card);
  } else if (card.type === 'property' && card.color) {
    player.properties[card.color].push(card);
  } else {
    player.hand.splice(cardIndex, 0, card);
    return state;
  }

  newState.cardsPlayedThisTurn++;

  if (checkWinCondition(player)) {
    newState.phase = 'game_over';
    newState.winner = player.id;
    newState.message = `${player.name} wins!`;
    return newState;
  }

  if (newState.cardsPlayedThisTurn >= 3) {
    return endTurn(newState);
  }

  newState.message = player.isAI
    ? `${player.name} is thinking...`
    : `Play up to 3 cards (${3 - newState.cardsPlayedThisTurn} remaining)`;
  return newState;
}

export function playActionCard(state: GameState, cardId: string): GameState | { state: GameState; needsTarget: boolean; needsColorChoice?: boolean } {
  const newState = deepCopy(state);
  const player = newState.players[newState.currentPlayerIndex];
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = player.hand[cardIndex];

  switch (card.actionType) {
    case 'pass_go': {
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
      const result = drawCards(newState, 2);
      if (newState.cardsPlayedThisTurn >= 3) {
        return endTurn(result);
      }
      return result;
    }

    case 'debt_collector': {
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
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
      const otherPlayers = newState.players.filter(p => p.id !== player.id).map(p => p.id);
      newState.pendingAction = {
        type: 'birthday',
        sourcePlayerId: player.id,
        amount: 2,
        card,
        respondingPlayers: otherPlayers,
        currentResponder: otherPlayers[0],
      };
      newState.phase = 'pay_debt';
      newState.message = `${player.name} says Happy Birthday! Everyone pays $2M`;
      return newState;
    }

    case 'sly_deal': {
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
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
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
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
      player.bank.push({ ...card, type: 'money' });
      newState.cardsPlayedThisTurn++;
      newState.message = `${player.name} banked Just Say No ($${card.value}M)`;
      if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
      newState.phase = 'play';
      return newState;
    }

    case 'rent':
    case 'wild_rent': {
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
      newState.pendingAction = {
        type: card.actionType!,
        sourcePlayerId: player.id,
        card,
      };
      newState.phase = 'action_target';
      newState.message = player.isAI ? `${player.name} charges rent!` : 'Choose which color to charge rent on';
      return { state: newState, needsTarget: true, needsColorChoice: true };
    }

    case 'house': {
      const completeSets = getCompleteSets(player);
      const eligible = completeSets.filter(c => !player.hasHouse[c]);
      if (eligible.length === 0) {
        newState.message = 'No complete sets to add a house to!';
        return newState;
      }
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
      if (eligible.length === 1) {
        player.hasHouse[eligible[0]] = true;
        newState.message = `Added house to ${PROPERTY_SETS[eligible[0]].label} set!`;
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
      const completeSetsH = getCompleteSets(player);
      const eligibleH = completeSetsH.filter(c => player.hasHouse[c] && !player.hasHotel[c]);
      if (eligibleH.length === 0) {
        newState.message = 'No sets with houses to add a hotel to!';
        return newState;
      }
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.cardsPlayedThisTurn++;
      if (eligibleH.length === 1) {
        player.hasHotel[eligibleH[0]] = true;
        newState.message = `Added hotel to ${PROPERTY_SETS[eligibleH[0]].label} set!`;
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

    case 'double_rent': {
      player.hand.splice(cardIndex, 1);
      player.bank.push({ ...card, type: 'money' });
      newState.cardsPlayedThisTurn++;
      newState.message = `${player.name} banked Double Rent ($${card.value}M)`;
      if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
      newState.phase = 'play';
      return newState;
    }
  }

  return state;
}

export function resolveDebtPayment(state: GameState, payerId: number, cardIds: string[]): GameState {
  const newState = deepCopy(state);
  const payer = newState.players.find(p => p.id === payerId)!;
  const receiver = newState.players.find(p => p.id === newState.pendingAction!.sourcePlayerId)!;

  for (const cardId of cardIds) {
    let found = false;
    const bankIdx = payer.bank.findIndex(c => c.id === cardId);
    if (bankIdx !== -1) {
      const card = payer.bank.splice(bankIdx, 1)[0];
      receiver.bank.push(card);
      found = true;
    }
    if (!found) {
      for (const color of Object.keys(payer.properties) as PropertyColor[]) {
        const propIdx = payer.properties[color].findIndex(c => c.id === cardId);
        if (propIdx !== -1) {
          const card = payer.properties[color].splice(propIdx, 1)[0];
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

  if (newState.pendingAction?.respondingPlayers) {
    const idx = newState.pendingAction.respondingPlayers.indexOf(payerId);
    if (idx !== -1) {
      newState.pendingAction.respondingPlayers.splice(idx, 1);
    }
    if (newState.pendingAction.respondingPlayers.length > 0) {
      newState.pendingAction.currentResponder = newState.pendingAction.respondingPlayers[0];
      return newState;
    }
  }

  newState.pendingAction = null;
  if (newState.cardsPlayedThisTurn >= 3) {
    return endTurn(newState);
  }
  newState.phase = 'play';
  const cp = newState.players[newState.currentPlayerIndex];
  newState.message = cp.isAI ? `${cp.name} is thinking...` : `Play up to 3 cards (${3 - newState.cardsPlayedThisTurn} remaining)`;
  return newState;
}

export function resolveTargetAction(state: GameState, targetPlayerId: number, targetColor?: PropertyColor, targetCardId?: string): GameState {
  const newState = deepCopy(state);
  const action = newState.pendingAction!;
  const source = newState.players.find(p => p.id === action.sourcePlayerId)!;
  const target = newState.players.find(p => p.id === targetPlayerId)!;

  switch (action.type) {
    case 'debt_collector': {
      newState.pendingAction!.targetPlayerId = targetPlayerId;
      newState.pendingAction!.respondingPlayers = [targetPlayerId];
      newState.pendingAction!.currentResponder = targetPlayerId;
      newState.phase = 'pay_debt';
      newState.message = target.isAI ? `${target.name} must pay $5M...` : 'You must pay $5M!';
      return newState;
    }

    case 'sly_deal': {
      if (!targetColor || !targetCardId) return state;
      const completeSets = getCompleteSets(target);
      if (completeSets.includes(targetColor)) {
        newState.message = "Can't steal from a complete set with Sly Deal!";
        newState.pendingAction = null;
        newState.phase = 'play';
        return newState;
      }
      const propIdx = target.properties[targetColor].findIndex(c => c.id === targetCardId);
      if (propIdx === -1) return state;
      const card = target.properties[targetColor].splice(propIdx, 1)[0];
      const destColor = card.color || targetColor;
      source.properties[destColor].push(card);
      newState.pendingAction = null;
      newState.message = `${source.name} stole ${card.name}!`;
      if (checkWinCondition(source)) {
        newState.phase = 'game_over';
        newState.winner = source.id;
        return newState;
      }
      if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
      newState.phase = 'play';
      return newState;
    }

    case 'deal_breaker': {
      if (!targetColor) return state;
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
      newState.pendingAction = null;
      newState.message = `${source.name} stole the ${PROPERTY_SETS[targetColor].label} set!`;
      if (checkWinCondition(source)) {
        newState.phase = 'game_over';
        newState.winner = source.id;
        return newState;
      }
      if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
      newState.phase = 'play';
      return newState;
    }

    case 'rent':
    case 'wild_rent': {
      if (!targetColor) return state;
      const rentAmount = getRentAmount(source, targetColor);
      if (rentAmount === 0) {
        newState.pendingAction = null;
        newState.message = 'No rent to charge - you have no properties of that color!';
        if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
        newState.phase = 'play';
        return newState;
      }
      const otherPlayers = newState.players.filter(p => p.id !== source.id).map(p => p.id);
      newState.pendingAction = {
        type: 'rent',
        sourcePlayerId: source.id,
        amount: rentAmount,
        respondingPlayers: [...otherPlayers],
        currentResponder: otherPlayers[0],
        card: action.card,
      };
      newState.phase = 'pay_debt';
      newState.message = `${source.name} charges $${rentAmount}M rent on ${PROPERTY_SETS[targetColor].label}!`;
      return newState;
    }

    case 'house': {
      if (!targetColor) return state;
      source.hasHouse[targetColor] = true;
      newState.pendingAction = null;
      newState.message = `Added house to ${PROPERTY_SETS[targetColor].label} set!`;
      if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
      newState.phase = 'play';
      return newState;
    }

    case 'hotel': {
      if (!targetColor) return state;
      source.hasHotel[targetColor] = true;
      newState.pendingAction = null;
      newState.message = `Added hotel to ${PROPERTY_SETS[targetColor].label} set!`;
      if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
      newState.phase = 'play';
      return newState;
    }

    case 'forced_deal': {
      if (!targetColor || !targetCardId) return state;
      const offered = action.offeredProperty;
      if (!offered) return state;
      const completeSetsTarget = getCompleteSets(target);
      if (completeSetsTarget.includes(targetColor)) {
        newState.message = "Can't force deal from a complete set!";
        newState.pendingAction = null;
        newState.phase = 'play';
        return newState;
      }
      const tPropIdx = target.properties[targetColor].findIndex(c => c.id === targetCardId);
      if (tPropIdx === -1) return state;
      const targetCard = target.properties[targetColor].splice(tPropIdx, 1)[0];
      const srcPropIdx = source.properties[offered.color].findIndex(c => c.id === offered.card.id);
      if (srcPropIdx !== -1) {
        source.properties[offered.color].splice(srcPropIdx, 1);
      }
      const destColor1 = targetCard.color || targetColor;
      source.properties[destColor1].push(targetCard);
      target.properties[offered.color].push(offered.card);
      newState.pendingAction = null;
      newState.message = `${source.name} swapped properties!`;
      if (checkWinCondition(source)) {
        newState.phase = 'game_over';
        newState.winner = source.id;
        return newState;
      }
      if (newState.cardsPlayedThisTurn >= 3) return endTurn(newState);
      newState.phase = 'play';
      return newState;
    }
  }

  return newState;
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
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
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
  newState.turnNumber++;

  const nextPlayer = newState.players[newState.currentPlayerIndex];
  newState.phase = 'draw';
  newState.message = nextPlayer.isAI
    ? `${nextPlayer.name}'s turn...`
    : 'Your turn! Draw 2 cards.';
  return newState;
}

function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function getAIAction(state: GameState): { action: string; cardId?: string; targetColor?: PropertyColor; targetPlayerId?: number; targetCardId?: string } {
  const player = state.players[state.currentPlayerIndex];

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
        const completeSets = getCompleteSets(player);
        if (completeSets.includes(color)) continue;
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
      const bestColor = card.colors.reduce((best, c) => {
        return player.properties[c].length > player.properties[best].length ? c : best;
      }, card.colors[0]);
      return { action: 'play_property', cardId: card.id, targetColor: bestColor };
    }
  }

  for (const card of player.hand) {
    if (card.actionType === 'rent' || card.actionType === 'wild_rent') {
      const ownedColors = (Object.keys(player.properties) as PropertyColor[]).filter(c => player.properties[c].length > 0);
      if (card.actionType === 'wild_rent' && ownedColors.length > 0) {
        const bestColor = ownedColors.reduce((best, c) =>
          getRentAmount(player, c) > getRentAmount(player, best) ? c : best, ownedColors[0]);
        return { action: 'play_action', cardId: card.id, targetColor: bestColor };
      }
      if (card.actionType === 'rent' && card.colors) {
        const matchingColors = card.colors.filter(c => player.properties[c].length > 0);
        if (matchingColors.length > 0) {
          const bestColor = matchingColors.reduce((best, c) =>
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
          const completeSets = getCompleteSets(opponent);
          if (completeSets.includes(color)) continue;
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
        const completeSets = getCompleteSets(opponent);
        if (completeSets.length > 0) {
          return {
            action: 'play_action',
            cardId: card.id,
            targetPlayerId: opponent.id,
            targetColor: completeSets[0],
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
