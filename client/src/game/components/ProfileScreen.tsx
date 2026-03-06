import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '../useProfile';

interface ProfileScreenProps {
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const profile = useProfile();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.playerName);
  const [friendInput, setFriendInput] = useState('');

  const winRate = profile.gamesPlayed > 0
    ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100)
    : 0;

  const handleSaveName = () => {
    profile.setPlayerName(nameInput);
    setEditingName(false);
  };

  const handleAddFriend = () => {
    if (friendInput.trim()) {
      profile.addFriend(friendInput.trim());
      setFriendInput('');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-800 active:bg-gray-700 text-gray-300">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-white font-bold text-lg">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/60 rounded-2xl p-5 border border-gray-700/40 flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
            {profile.playerName[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            {editingName ? (
              <div className="flex gap-2">
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  maxLength={20}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                />
                <button onClick={handleSaveName} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl active:scale-95">Save</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-lg">{profile.playerName}</p>
                <button
                  onClick={() => { setNameInput(profile.playerName); setEditingName(true); }}
                  className="text-gray-400 active:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-gray-500 text-xs mt-0.5">Property Rush Player</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/40"
        >
          <h2 className="text-white font-bold text-sm mb-3">Stats</h2>
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Games Played" value={profile.gamesPlayed} color="text-indigo-400" />
            <StatBox label="Win Rate" value={`${winRate}%`} color="text-yellow-400" />
            <StatBox label="Wins" value={profile.gamesWon} color="text-emerald-400" />
            <StatBox label="Losses" value={profile.gamesLost} color="text-red-400" />
            <StatBox label="Current Streak" value={profile.currentStreak} color="text-orange-400" />
            <StatBox label="Best Streak" value={profile.bestStreak} color="text-amber-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/40"
        >
          <h2 className="text-white font-bold text-sm mb-3">Friends</h2>
          <div className="flex gap-1.5 mb-3">
            <input
              value={friendInput}
              onChange={e => setFriendInput(e.target.value)}
              placeholder="Add a friend..."
              maxLength={20}
              className="flex-1 px-3 py-2 rounded-xl bg-gray-700 border border-gray-600 text-white text-xs placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
            />
            <button
              onClick={handleAddFriend}
              disabled={!friendInput.trim()}
              className="px-3 py-2 bg-indigo-600 active:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-bold rounded-xl"
            >
              Add
            </button>
          </div>
          {profile.friends.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-2 italic">No friends added yet</p>
          ) : (
            <div className="space-y-1.5">
              {profile.friends.map(name => (
                <div key={name} className="flex items-center justify-between bg-gray-700/40 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {name[0]?.toUpperCase()}
                    </div>
                    <span className="text-white text-xs font-medium">{name}</span>
                  </div>
                  <button
                    onClick={() => profile.removeFriend(name)}
                    className="text-gray-500 active:text-red-400 text-lg leading-none px-1"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: string | number; color: string }> = ({ label, value, color }) => (
  <div className="bg-gray-700/40 rounded-xl py-2.5 px-3 text-center">
    <p className={`${color} font-bold text-lg`}>{value}</p>
    <p className="text-gray-500 text-[10px]">{label}</p>
  </div>
);
