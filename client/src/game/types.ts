export type CardType = 'property' | 'money' | 'action' | 'wildcard';

export type PropertyColor =
  | 'brown' | 'blue' | 'green' | 'red'
  | 'yellow' | 'orange' | 'pink' | 'teal'
  | 'purple' | 'black';

export interface PropertySetInfo {
  color: PropertyColor;
  label: string;
  needed: number;
  rent: number[];
  bgClass: string;
  borderClass: string;
}

export type ActionType =
  | 'pass_go'
  | 'debt_collector'
  | 'birthday'
  | 'sly_deal'
  | 'forced_deal'
  | 'deal_breaker'
  | 'just_say_no'
  | 'rent'
  | 'wild_rent'
  | 'house'
  | 'hotel'
  | 'double_rent';

export interface Card {
  id: string;
  type: CardType;
  name: string;
  value: number;
  color?: PropertyColor;
  colors?: PropertyColor[];
  actionType?: ActionType;
  description?: string;
}

export interface Player {
  id: number;
  name: string;
  isAI: boolean;
  hand: Card[];
  bank: Card[];
  properties: Record<PropertyColor, Card[]>;
  hasHouse: Record<PropertyColor, boolean>;
  hasHotel: Record<PropertyColor, boolean>;
}

export type GamePhase =
  | 'menu'
  | 'playing'
  | 'draw'
  | 'play'
  | 'discard'
  | 'action_target'
  | 'action_response'
  | 'pay_debt'
  | 'forced_deal_pick'
  | 'game_over';

export interface PendingAction {
  type: ActionType;
  sourcePlayerId: number;
  targetPlayerId?: number;
  amount?: number;
  card?: Card;
  selectedProperty?: { color: PropertyColor; card: Card };
  offeredProperty?: { color: PropertyColor; card: Card };
  respondingPlayers?: number[];
  currentResponder?: number;
  canSayNo?: boolean;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  drawPile: Card[];
  discardPile: Card[];
  cardsPlayedThisTurn: number;
  pendingAction: PendingAction | null;
  winner: number | null;
  turnNumber: number;
  message: string;
  animatingCard: string | null;
}
