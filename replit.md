# Card Tycoon - Property Card Game

## Overview
A Monopoly Deal-inspired property card game built with React, TypeScript, and Tailwind CSS. Players compete against AI opponents to collect 3 complete property sets.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS (2D card game UI, no 3D/Canvas)
- **Backend**: Express.js server serving the React app via Vite
- **State Management**: Zustand for game state

## Project Structure
```
client/src/
  game/
    types.ts          - Card types, game state types, player types
    cards.ts          - Card definitions (properties, money, actions), deck creation
    engine.ts         - Core game logic (draw, play, actions, AI, win conditions)
    useCardGame.ts    - Zustand store binding engine to React
    components/
      CardComponent.tsx   - Individual card rendering (property, money, action, wildcard)
      MainMenu.tsx        - Start screen with player count selection
      GameBoard.tsx       - Main game layout with AI turn processing
      PlayerHand.tsx      - Player's hand with card selection and play options
      PropertyArea.tsx    - Property set display for any player
      OpponentArea.tsx    - AI opponent info display
      ActionPanel.tsx     - Modal UI for action card resolution (targeting, payments)
      GameOverScreen.tsx  - Win/lose screen with final standings
  App.tsx             - Root component routing between menu and game
```

## Game Rules
- 2-4 players (1 human + AI opponents)
- Draw 2 cards per turn, play up to 3
- Card types: Property, Money, Action, Wildcard
- Actions: Pass Go, Debt Collector, Birthday, Sly Deal, Forced Deal, Deal Breaker, Rent, House, Hotel, Just Say No
- Win by collecting 3 complete property sets
- Cards can be banked as money regardless of type

## Tech Stack
- React 18, TypeScript, Tailwind CSS, Zustand
- Vite dev server with Express backend
- Fully responsive (desktop + mobile)
