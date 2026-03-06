import React, { useState, useEffect } from 'react';
import { MainMenu } from './game/components/MainMenu';
import { MultiplayerLobby } from './game/components/MultiplayerLobby';
import { GameBoard } from './game/components/GameBoard';
import { RulesScreen } from './game/components/RulesScreen';
import { ProfileScreen } from './game/components/ProfileScreen';
import { QuestScreen } from './game/components/QuestScreen';
import { useCardGame } from './game/useCardGame';

type Screen = 'menu' | 'multiplayer' | 'rules' | 'profile' | 'quests';

function App() {
  const phase = useCardGame(s => s.phase);
  const isMultiplayer = useCardGame(s => s.isMultiplayer);
  const [screen, setScreen] = useState<Screen>('menu');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) {
      setScreen('multiplayer');
    }
  }, []);

  if (phase !== 'menu' || isMultiplayer) {
    return <GameBoard />;
  }

  if (screen === 'multiplayer') {
    return <MultiplayerLobby onBack={() => setScreen('menu')} />;
  }

  if (screen === 'rules') {
    return <RulesScreen onBack={() => setScreen('menu')} />;
  }

  if (screen === 'profile') {
    return <ProfileScreen onBack={() => setScreen('menu')} />;
  }

  if (screen === 'quests') {
    return <QuestScreen onBack={() => setScreen('menu')} />;
  }

  return (
    <MainMenu
      onMultiplayer={() => setScreen('multiplayer')}
      onRules={() => setScreen('rules')}
      onProfile={() => setScreen('profile')}
      onQuests={() => setScreen('quests')}
    />
  );
}

export default App;
