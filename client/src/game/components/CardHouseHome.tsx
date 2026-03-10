import React, { useState, useEffect } from 'react';
import { useCardGame } from '../useCardGame';
import { useProfile } from '../useProfile';

interface CardHouseHomeProps {
  onPlayItsADeal: (playerCount: number, playerName: string) => void;
  onMultiplayerItsADeal: () => void;
  onRules: () => void;
  onProfile: () => void;
  onQuests: () => void;
}

const FloatingCard: React.FC<{ suit: string; value: string; style: React.CSSProperties }> = ({ suit, value, style }) => (
  <div
    className="absolute select-none pointer-events-none"
    style={{
      ...style,
      fontFamily: 'Georgia, serif',
    }}
  >
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl flex flex-col items-center justify-center shadow-xl"
      style={{ width: 48, height: 68 }}>
      <div className="text-xs font-bold leading-none" style={{ color: style.color || '#fff' }}>{value}</div>
      <div className="text-lg leading-none" style={{ color: style.color || '#fff' }}>{suit}</div>
    </div>
  </div>
);

const ItsADealBanner: React.FC<{
  onPlay: (count: number) => void;
  onMultiplayer: () => void;
  playerName: string;
  savedInfo: { turnNumber: number; playerCount: number } | null;
  onResume: () => void;
}> = ({ onPlay, onMultiplayer, playerName, savedInfo, onResume }) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="relative rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #1a1200 0%, #2d1f00 40%, #1a0f00 100%)',
        boxShadow: '0 0 60px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b 0px, #f59e0b 1px, transparent 1px, transparent 12px)',
      }} />

      {/* Gold accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <div className="relative p-5 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-[0.2em] text-amber-400/60 uppercase">Card House</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 leading-none tracking-tight">
              IT'S A DEAL
            </h2>
            <p className="text-amber-200/40 text-xs mt-1 font-medium">The Property Card Game · 2–4 Players</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {['🏠','🏡','🏘️'].map((e, i) => (
              <span key={i} className="text-xl opacity-60" style={{ transform: `rotate(${(i-1)*8}deg)` }}>{e}</span>
            ))}
          </div>
        </div>

        {savedInfo && (
          <button
            onClick={onResume}
            className="w-full py-3 mb-3 rounded-2xl font-black text-sm text-emerald-900 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #34d399, #10b981)' }}
          >
            ▶ RESUME · Turn {savedInfo.turnNumber} · {savedInfo.playerCount}P
          </button>
        )}

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => setPlayerCount(n)}
              className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                playerCount === n
                  ? 'text-gray-900 shadow-lg'
                  : 'bg-white/5 text-gray-500 border border-white/10 active:bg-white/10'
              }`}
              style={playerCount === n ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)' } : {}}
            >
              {n}P
            </button>
          ))}
        </div>

        <button
          onClick={() => onPlay(playerCount)}
          className="w-full py-3.5 rounded-2xl font-black text-base text-gray-900 mb-2 transition-all active:scale-95 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)' }}
        >
          PLAY vs AI
        </button>

        <button
          onClick={onMultiplayer}
          className="w-full py-3 rounded-2xl font-bold text-sm text-amber-300 border border-amber-500/30 bg-amber-500/10 active:bg-amber-500/20 transition-all"
        >
          PLAY WITH FRIENDS
        </button>
      </div>
    </div>
  );
};

const UnoComingSoon: React.FC = () => (
  <div
    className="relative rounded-3xl overflow-hidden border border-red-500/20 shadow-2xl opacity-80"
    style={{
      background: 'linear-gradient(135deg, #1a0000 0%, #2d0a0a 40%, #1a0000 100%)',
      boxShadow: '0 0 60px rgba(239,68,68,0.1)',
    }}
  >
    <div className="absolute inset-0 opacity-5" style={{
      backgroundImage: 'repeating-linear-gradient(-45deg, #ef4444 0px, #ef4444 1px, transparent 1px, transparent 12px)',
    }} />
    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />

    <div className="relative p-5 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-[0.2em] text-red-400/50 uppercase">Card House</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-red-400 to-orange-400 leading-none tracking-tight">
            UNO
          </h2>
          <p className="text-red-200/30 text-xs mt-1 font-medium">The Classic Card Game · 2–10 Players</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {['🟥','🟦','🟨','🟩'].map((e, i) => (
            <span key={i} className="text-xl opacity-40" style={{ transform: `rotate(${(i-1)*8}deg)` }}>{e}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center py-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-400 text-xs font-bold tracking-widest uppercase">Coming Soon</span>
          </div>
          <p className="text-gray-600 text-xs">Being shuffled in...</p>
        </div>
      </div>
    </div>
  </div>
);

export const CardHouseHome: React.FC<CardHouseHomeProps> = ({
  onPlayItsADeal,
  onMultiplayerItsADeal,
  onRules,
  onProfile,
  onQuests,
}) => {
  const playerName = useProfile(s => s.playerName);
  const getSavedGameInfo = useCardGame(s => s.getSavedGameInfo);
  const loadGame = useCardGame(s => s.loadGame);
  const clearSavedGame = useCardGame(s => s.clearSavedGame);
  const resetGameFlags = useProfile(s => s.resetGameFlags);
  const [savedInfo, setSavedInfo] = useState<{ turnNumber: number; playerCount: number } | null>(null);

  useEffect(() => {
    setSavedInfo(getSavedGameInfo());
  }, []);

  const handleResume = () => {
    const success = loadGame();
    if (!success) {
      clearSavedGame();
      setSavedInfo(null);
    }
  };

  const handlePlay = (count: number) => {
    resetGameFlags();
    onPlayItsADeal(count, playerName);
  };

  // Floating background cards
  const floatingCards = [
    { suit: '♠', value: 'A', style: { top: '8%', left: '3%', color: '#fff', transform: 'rotate(-15deg)', opacity: 0.3 } },
    { suit: '♥', value: 'K', style: { top: '15%', right: '4%', color: '#ef4444', transform: 'rotate(12deg)', opacity: 0.25 } },
    { suit: '♦', value: '7', style: { top: '55%', left: '2%', color: '#f59e0b', transform: 'rotate(8deg)', opacity: 0.2 } },
    { suit: '♣', value: 'Q', style: { bottom: '12%', right: '3%', color: '#fff', transform: 'rotate(-10deg)', opacity: 0.2 } },
    { suit: '♥', value: '3', style: { bottom: '25%', left: '4%', color: '#ef4444', transform: 'rotate(20deg)', opacity: 0.15 } },
  ];

  return (
    <div
      className="min-h-[100dvh] relative flex flex-col overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 20% 20%, #0f1729 0%, #080c14 50%, #050810 100%)',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Floating cards */}
      {floatingCards.map((c, i) => (
        <FloatingCard key={i} suit={c.suit} value={c.value} style={c.style} />
      ))}

      {/* Header */}
      <div className="relative px-5 pt-2 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🃏</span>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight leading-none">CARD HOUSE</h1>
              <p className="text-gray-500 text-[10px] tracking-widest uppercase font-medium">Game Platform</p>
            </div>
          </div>
        </div>
        <button
          onClick={onProfile}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/10 active:bg-white/10 transition-all"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {playerName[0]?.toUpperCase()}
          </div>
          <span className="text-gray-300 text-xs font-semibold max-w-[80px] truncate">{playerName}</span>
        </button>
      </div>

      {/* Section label */}
      <div className="px-5 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-gray-600 text-[10px] font-bold tracking-[0.2em] uppercase">Games</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>
      </div>

      {/* Game banners */}
      <div className="flex-1 px-4 flex flex-col gap-4 overflow-y-auto">
        <ItsADealBanner
          onPlay={handlePlay}
          onMultiplayer={onMultiplayerItsADeal}
          playerName={playerName}
          savedInfo={savedInfo}
          onResume={handleResume}
        />
        <UnoComingSoon />
      </div>

      {/* Bottom nav */}
      <div className="px-4 pt-4">
        <div className="flex gap-2 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-2">
          {[
            { icon: '📖', label: 'Rules', action: onRules },
            { icon: '🎯', label: 'Quests', action: onQuests },
            { icon: '👤', label: 'Profile', action: onProfile },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex-1 py-2.5 rounded-xl text-gray-400 active:bg-white/10 transition-all flex flex-col items-center gap-0.5"
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
        <p className="text-center text-gray-700 text-[9px] mt-2 tracking-widest uppercase">Card House · v1.1.6</p>
      </div>
    </div>
  );
};
