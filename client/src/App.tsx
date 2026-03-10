import React, { useState, useEffect } from 'react';
import { CardHouseHome } from './game/components/CardHouseHome';
import { MultiplayerLobby } from './game/components/MultiplayerLobby';
import { GameBoard } from './game/components/GameBoard';
import { RulesScreen } from './game/components/RulesScreen';
import { ProfileScreen } from './game/components/ProfileScreen';
import { QuestScreen } from './game/components/QuestScreen';
import { useCardGame } from './game/useCardGame';

type Screen = 'home' | 'multiplayer' | 'rules' | 'profile' | 'quests';

function App() {
  const phase = useCardGame(s => s.phase);
  const isMultiplayer = useCardGame(s => s.isMultiplayer);
  const startGame = useCardGame(s => s.startGame);
  const [screen, setScreen] = useState<Screen>('home');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) {
      setScreen('multiplayer');
    }
  }, []);

  if (phase !== 'menu') {
    return <GameBoard />;
  }

  if (screen === 'multiplayer' || isMultiplayer) {
    return <MultiplayerLobby onBack={() => setScreen('home')} />;
  }

  if (screen === 'rules') {
    return <RulesScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'profile') {
    return <ProfileScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'quests') {
    return <QuestScreen onBack={() => setScreen('home')} />;
  }

  return (
    <CardHouseHome
      onPlayItsADeal={(playerCount, playerName) => startGame(playerCount, playerName)}
      onMultiplayerItsADeal={() => setScreen('multiplayer')}
      onRules={() => setScreen('rules')}
      onProfile={() => setScreen('profile')}
      onQuests={() => setScreen('quests')}
    />
  );
}

export default App;
