import React from 'react';
import { useCardGame } from './game/useCardGame';
import { MainMenu } from './game/components/MainMenu';
import { GameBoard } from './game/components/GameBoard';
import "@fontsource/inter";

function App() {
  const phase = useCardGame(s => s.phase);

  if (phase === 'menu') {
    return <MainMenu />;
  }

  return <GameBoard />;
}

export default App;
