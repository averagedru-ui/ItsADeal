import { Card, PropertyColor, PropertySetInfo } from './gameTypes';

export const PROPERTY_SETS: Record<PropertyColor, PropertySetInfo> = {
  brown: { color: 'brown', label: 'Brown', needed: 2, rent: [1, 2], bgClass: 'bg-amber-800', borderClass: 'border-amber-900' },
  blue: { color: 'blue', label: 'Blue', needed: 2, rent: [3, 8], bgClass: 'bg-blue-600', borderClass: 'border-blue-800' },
  green: { color: 'green', label: 'Green', needed: 3, rent: [2, 4, 7], bgClass: 'bg-green-600', borderClass: 'border-green-800' },
  red: { color: 'red', label: 'Red', needed: 3, rent: [2, 3, 6], bgClass: 'bg-red-600', borderClass: 'border-red-800' },
  yellow: { color: 'yellow', label: 'Yellow', needed: 3, rent: [2, 4, 6], bgClass: 'bg-yellow-500', borderClass: 'border-yellow-700' },
  orange: { color: 'orange', label: 'Orange', needed: 3, rent: [1, 3, 5], bgClass: 'bg-orange-500', borderClass: 'border-orange-700' },
  pink: { color: 'pink', label: 'Pink', needed: 3, rent: [1, 2, 4], bgClass: 'bg-pink-500', borderClass: 'border-pink-700' },
  teal: { color: 'teal', label: 'Teal', needed: 3, rent: [1, 2, 3], bgClass: 'bg-teal-500', borderClass: 'border-teal-700' },
  purple: { color: 'purple', label: 'Purple', needed: 2, rent: [1, 2], bgClass: 'bg-purple-600', borderClass: 'border-purple-800' },
  black: { color: 'black', label: 'Railroad', needed: 4, rent: [1, 2, 3, 4], bgClass: 'bg-gray-800', borderClass: 'border-gray-900' },
};

let cardIdCounter = 0;
function makeId(): string {
  return `card_${++cardIdCounter}`;
}

function propertyCard(name: string, color: PropertyColor, value: number): Card {
  return { id: makeId(), type: 'property', name, value, color };
}

function moneyCard(value: number): Card {
  return { id: makeId(), type: 'money', name: `$${value}M`, value };
}

function actionCard(name: string, value: number, actionType: Card['actionType'], description: string, colors?: PropertyColor[]): Card {
  return { id: makeId(), type: 'action', name, value, actionType, description, colors };
}

function wildcardProperty(colors: PropertyColor[], value: number): Card {
  return { id: makeId(), type: 'wildcard', name: `Wild ${colors.map(c => PROPERTY_SETS[c].label).join('/')}`, value, colors };
}

export function createDeck(): Card[] {
  cardIdCounter = 0;
  const deck: Card[] = [];

  deck.push(propertyCard('Baltic Ave', 'brown', 1));
  deck.push(propertyCard('Mediterranean', 'brown', 1));
  deck.push(propertyCard('Boardwalk', 'blue', 4));
  deck.push(propertyCard('Park Place', 'blue', 4));
  deck.push(propertyCard('Pacific Ave', 'green', 4));
  deck.push(propertyCard('N. Carolina', 'green', 4));
  deck.push(propertyCard('Pennsylvania', 'green', 4));
  deck.push(propertyCard('Kentucky Ave', 'red', 3));
  deck.push(propertyCard('Indiana Ave', 'red', 3));
  deck.push(propertyCard('Illinois Ave', 'red', 3));
  deck.push(propertyCard('Ventnor Ave', 'yellow', 3));
  deck.push(propertyCard('Marvin Gdns', 'yellow', 3));
  deck.push(propertyCard('Atlantic Ave', 'yellow', 3));
  deck.push(propertyCard('St. James Pl', 'orange', 2));
  deck.push(propertyCard('Tennessee', 'orange', 2));
  deck.push(propertyCard('New York Ave', 'orange', 2));
  deck.push(propertyCard('Virginia Ave', 'pink', 2));
  deck.push(propertyCard('States Ave', 'pink', 2));
  deck.push(propertyCard('St. Charles', 'pink', 2));
  deck.push(propertyCard('Connecticut', 'teal', 1));
  deck.push(propertyCard('Vermont Ave', 'teal', 1));
  deck.push(propertyCard('Oriental Ave', 'teal', 1));
  deck.push(propertyCard('Electric Co', 'purple', 2));
  deck.push(propertyCard('Water Works', 'purple', 2));
  deck.push(propertyCard('Reading RR', 'black', 2));
  deck.push(propertyCard('Penn RR', 'black', 2));
  deck.push(propertyCard('B&O RR', 'black', 2));
  deck.push(propertyCard('Short Line', 'black', 2));

  deck.push(wildcardProperty(['pink', 'orange'], 2));
  deck.push(wildcardProperty(['pink', 'orange'], 2));
  deck.push(wildcardProperty(['teal', 'brown'], 1));
  deck.push(wildcardProperty(['teal', 'black'], 4));
  deck.push(wildcardProperty(['blue', 'green'], 4));
  deck.push(wildcardProperty(['black', 'green'], 4));
  deck.push(wildcardProperty(['red', 'yellow'], 3));
  deck.push(wildcardProperty(['red', 'yellow'], 3));
  deck.push(wildcardProperty(['purple', 'black'], 2));
  deck.push(wildcardProperty(['brown', 'teal', 'pink', 'orange', 'red', 'yellow', 'green', 'blue', 'black', 'purple'], 0));
  deck.push(wildcardProperty(['brown', 'teal', 'pink', 'orange', 'red', 'yellow', 'green', 'blue', 'black', 'purple'], 0));

  for (let i = 0; i < 6; i++) deck.push(moneyCard(1));
  for (let i = 0; i < 5; i++) deck.push(moneyCard(2));
  for (let i = 0; i < 3; i++) deck.push(moneyCard(3));
  for (let i = 0; i < 3; i++) deck.push(moneyCard(4));
  for (let i = 0; i < 2; i++) deck.push(moneyCard(5));
  for (let i = 0; i < 1; i++) deck.push(moneyCard(10));

  for (let i = 0; i < 10; i++) deck.push(actionCard('Pass Go', 1, 'pass_go', 'Draw 2 extra cards'));
  for (let i = 0; i < 3; i++) deck.push(actionCard('Debt Collector', 3, 'debt_collector', 'Force one player to pay you $5M'));
  for (let i = 0; i < 3; i++) deck.push(actionCard('Birthday!', 2, 'birthday', 'All players pay you $2M'));
  for (let i = 0; i < 3; i++) deck.push(actionCard('Sly Deal', 3, 'sly_deal', 'Steal a property from another player'));
  for (let i = 0; i < 3; i++) deck.push(actionCard('Forced Deal', 3, 'forced_deal', 'Swap a property with another player'));
  for (let i = 0; i < 2; i++) deck.push(actionCard('Deal Breaker', 5, 'deal_breaker', 'Steal a complete property set'));
  for (let i = 0; i < 3; i++) deck.push(actionCard('Just Say No', 4, 'just_say_no', 'Cancel any action against you'));
  for (let i = 0; i < 3; i++) deck.push(actionCard('House', 3, 'house', 'Add to a complete set: +$3M rent'));
  for (let i = 0; i < 3; i++) deck.push(actionCard('Hotel', 4, 'hotel', 'Add to a set with house: +$4M rent'));

  deck.push(actionCard('Rent: Brown/Teal', 1, 'rent', 'Charge rent on Brown or Teal', ['brown', 'teal']));
  deck.push(actionCard('Rent: Brown/Teal', 1, 'rent', 'Charge rent on Brown or Teal', ['brown', 'teal']));
  deck.push(actionCard('Rent: Green/Blue', 1, 'rent', 'Charge rent on Green or Blue', ['green', 'blue']));
  deck.push(actionCard('Rent: Green/Blue', 1, 'rent', 'Charge rent on Green or Blue', ['green', 'blue']));
  deck.push(actionCard('Rent: Red/Yellow', 1, 'rent', 'Charge rent on Red or Yellow', ['red', 'yellow']));
  deck.push(actionCard('Rent: Red/Yellow', 1, 'rent', 'Charge rent on Red or Yellow', ['red', 'yellow']));
  deck.push(actionCard('Rent: Orange/Pink', 1, 'rent', 'Charge rent on Orange or Pink', ['orange', 'pink']));
  deck.push(actionCard('Rent: Orange/Pink', 1, 'rent', 'Charge rent on Orange or Pink', ['orange', 'pink']));
  deck.push(actionCard('Rent: Railroad/Util', 1, 'rent', 'Charge rent on Railroad or Utility', ['black', 'purple']));
  deck.push(actionCard('Rent: Railroad/Util', 1, 'rent', 'Charge rent on Railroad or Utility', ['black', 'purple']));
  for (let i = 0; i < 3; i++) deck.push(actionCard('Wild Rent', 3, 'wild_rent', 'Charge rent on any color you own'));
  for (let i = 0; i < 2; i++) deck.push(actionCard('Double Rent', 1, 'double_rent', 'Double the rent you charge'));

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
