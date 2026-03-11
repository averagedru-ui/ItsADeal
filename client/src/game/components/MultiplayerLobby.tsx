import React, { useEffect, useState, useRef } from 'react';
import { useCardGame } from '../useCardGame';
import {
  createRoom as fbCreateRoom,
  joinRoom as fbJoinRoom,
  rejoinRoom as fbRejoinRoom,
  leaveRoom as fbLeaveRoom,
  startGame as fbStartGame,
  resumeMultiplayerGame as fbResumeGame,
  getCurrentRoomId,
} from '../firebaseMultiplayer';
import { initializeGame } from '../engine';
import type { FirebaseCallbacks } from '../firebaseMultiplayer';

interface MultiplayerLobbyProps {
  onBack: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ onBack }) => {
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [password, setPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [roomHasPassword, setRoomHasPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'creating' | 'joining' | 'waiting' | 'error'>('idle');
  const [error, setError] = useState('');
  const [roomPlayers, setRoomPlayers] = useState<string[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);

  const setMultiplayerState = useCardGame(s => s.setMultiplayerState);
  const addChatMessage = useCardGame(s => s.addChatMessage);
  const hasSavedMPGame = useCardGame(s => s.hasSavedMPGame);
  const getSavedMPInfo = useCardGame(s => s.getSavedMPInfo);
  const clearSavedMPGame = useCardGame(s => s.clearSavedMPGame);
  const savedMP = getSavedMPInfo();

  // Stable refs so Firebase listeners never hold stale closures
  const setMultiplayerStateRef = useRef(setMultiplayerState);
  const addChatMessageRef = useRef(addChatMessage);
  setMultiplayerStateRef.current = setMultiplayerState;
  addChatMessageRef.current = addChatMessage;

  const setRoomPlayersRef = useRef(setRoomPlayers);
  const setErrorRef = useRef(setError);
  const setStatusRef = useRef(setStatus);
  const setIsHostRef = useRef(setIsHost);
  setRoomPlayersRef.current = setRoomPlayers;
  setErrorRef.current = setError;
  setStatusRef.current = setStatus;
  setIsHostRef.current = setIsHost;

  // Stable callbacks object — never recreated
  const callbacks = useRef<FirebaseCallbacks>({
    onPlayersChanged: (players) => setRoomPlayersRef.current(players),
    onGameStarted: (gameState, playerIndex) => setMultiplayerStateRef.current(gameState, playerIndex),
    onGameUpdate: (gameState, playerIndex) => setMultiplayerStateRef.current(gameState, playerIndex),
    onChatMessage: (msg) => addChatMessageRef.current({ sender: msg.sender, text: msg.text, timestamp: msg.timestamp }),
    onError: (message) => { setErrorRef.current(message); setStatusRef.current('error'); },
    onPlayerLeft: (players) => setRoomPlayersRef.current(players),
    onHostChanged: (newIsHost) => setIsHostRef.current(newIsHost),
  }).current;

  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) setJoinCode(room);
    return () => {
      if (statusRef.current === 'waiting' && getCurrentRoomId()) {
        fbLeaveRoom();
      }
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) { setError('Enter your name'); return; }
    setStatus('creating');
    setError('');
    try {
      const code = await fbCreateRoom(playerName.trim(), password.trim() || null, callbacks);
      setRoomId(code);
      setIsHost(true);
      setRoomHasPassword(!!password.trim());
      setStatus('waiting');
    } catch {
      setError('Failed to create room');
      setStatus('error');
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) { setError('Enter your name'); return; }
    if (!joinCode.trim()) { setError('Enter a room code'); return; }
    setStatus('joining');
    setError('');
    try {
      const success = await fbJoinRoom(
        joinCode.trim().toUpperCase(),
        playerName.trim(),
        joinPassword.trim() || null,
        callbacks
      );
      if (success) {
        setRoomId(joinCode.trim().toUpperCase());
        setIsHost(false);
        setStatus('waiting');
      } else {
        setStatus('idle');
      }
    } catch {
      setError('Failed to join room');
      setStatus('error');
    }
  };

  const handleRejoinRoom = async () => {
    if (!playerName.trim()) { setError('Enter your name'); return; }
    if (!joinCode.trim()) { setError('Enter a room code'); return; }
    setStatus('joining');
    setError('');
    try {
      const result = await fbRejoinRoom(
        joinCode.trim().toUpperCase(),
        playerName.trim(),
        callbacks
      );
      if (result.success) {
        setRoomId(joinCode.trim().toUpperCase());
        setIsHost(result.isHost);
        setStatus('waiting');
      } else {
        setError(result.error || 'Could not rejoin');
        setStatus('error');
      }
    } catch {
      setError('Failed to rejoin room');
      setStatus('error');
    }
  };

  const handleResumeGame = async () => {
    if (!savedMP) return;
    setStatus('joining');
    setError('');
    try {
      const result = await fbResumeGame(
        savedMP.roomCode,
        savedMP.playerName,
        savedMP.myPlayerIndex,
        callbacks
      );
      if (result.success) {
        setRoomId(savedMP.roomCode);
        setStatus('waiting');
      } else {
        clearSavedMPGame();
        setError(result.error || 'Could not resume — the room may have ended');
        setStatus('idle');
      }
    } catch {
      setError('Failed to resume game');
      setStatus('idle');
    }
  };

  const handleStartGame = async () => {
    if (roomPlayers.length < 2) return;
    const gameState = initializeGame(roomPlayers.length, roomPlayers);
    await fbStartGame(gameState);
  };

  const handleLeave = async () => {
    await fbLeaveRoom();
    onBack();
  };

  const copyLink = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center py-8 px-4 overflow-y-auto">
        <div className="flex-shrink-0 my-auto bg-gray-800/80 backdrop-blur rounded-2xl p-6 md:p-8 w-full max-w-md border border-gray-700 shadow-2xl">
          <h2 className="text-white text-2xl font-bold mb-1 text-center">Lobby</h2>
          <p className="text-center text-gray-400 text-sm mb-1">
            Room Code: <span className="text-yellow-400 font-bold text-lg tracking-widest">{roomId}</span>
          </p>
          {roomHasPassword && (
            <p className="text-center text-gray-500 text-xs mb-3">🔒 Password protected</p>
          )}
          {!roomHasPassword && (
            <p className="text-center text-gray-600 text-xs mb-3">Share the code above to invite friends</p>
          )}

          <button onClick={copyLink}
            className={`w-full py-3 rounded-xl font-bold text-sm mb-4 transition-all ${
              copied ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}>
            {copied ? 'Link Copied!' : 'Copy Invite Link'}
          </button>

          <div className="mb-4">
            <h3 className="text-gray-300 text-sm font-semibold mb-2">Players ({roomPlayers.length}/4)</h3>
            <div className="space-y-1.5">
              {roomPlayers.map((name, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {name[0]?.toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-medium">{name}</span>
                  {i === 0 && <span className="text-yellow-400 text-[10px] ml-auto">HOST</span>}
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={roomPlayers.length < 2}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all ${
                roomPlayers.length >= 2
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-900 shadow-lg shadow-amber-500/30'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}>
              {roomPlayers.length >= 2 ? 'START GAME' : 'Waiting for players...'}
            </button>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm animate-pulse">
              Waiting for host to start the game...
            </div>
          )}

          <button onClick={handleLeave}
            className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-gray-300 transition-colors">
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center py-8 px-4 overflow-y-auto">
      <div className="flex-shrink-0 my-auto bg-gray-800/80 backdrop-blur rounded-2xl p-6 md:p-8 w-full max-w-md border border-gray-700 shadow-2xl">
        <h2 className="text-white text-2xl font-bold mb-1 text-center">Play Online</h2>
        <p className="text-gray-400 text-sm text-center mb-6">Create a room or join with a code</p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="text-gray-300 text-sm font-semibold mb-1 block">Your Name</label>
          <input
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            maxLength={12}
            placeholder="Enter your name..."
            className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="mb-2">
          <label className="text-gray-300 text-sm font-semibold mb-1 block">Room Password <span className="text-gray-500 font-normal">(optional)</span></label>
          <input
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            maxLength={20}
            placeholder="Leave blank for no password"
            className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>

        {savedMP && (
          <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-700/50 rounded-xl">
            <p className="text-emerald-300 text-xs font-semibold mb-0.5">Saved game found</p>
            <p className="text-gray-400 text-xs mb-2">Room <span className="text-white font-bold tracking-widest">{savedMP.roomCode}</span> · as {savedMP.playerName}</p>
            <div className="flex gap-2">
              <button onClick={handleResumeGame}
                className="flex-1 py-2 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-500 active:scale-95 transition-all">
                Resume
              </button>
              <button onClick={() => { clearSavedMPGame(); }}
                className="py-2 px-3 bg-gray-700 text-gray-400 text-sm rounded-lg hover:bg-gray-600 active:scale-95 transition-all">
                Discard
              </button>
            </div>
          </div>
        )}

        <button onClick={handleCreateRoom}
          disabled={status === 'creating'}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-bold text-lg rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/20 mb-4">
          {status === 'creating' ? 'Creating...' : 'Create Room'}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-600"></div></div>
          <div className="relative flex justify-center"><span className="bg-gray-800 px-3 text-gray-500 text-sm">or join</span></div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="ROOM CODE"
              className="flex-1 px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-center font-bold tracking-widest placeholder-gray-500 focus:border-indigo-500 focus:outline-none uppercase transition-colors"
            />
            <button onClick={handleJoinRoom}
              disabled={status === 'joining'}
              className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 active:scale-95 transition-all">
              {status === 'joining' ? '...' : 'Join'}
            </button>
          </div>
          <input
            type="text"
            value={joinPassword}
            onChange={e => setJoinPassword(e.target.value)}
            maxLength={20}
            placeholder="Room password (if required)"
            className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
          />
          <button onClick={handleRejoinRoom}
            disabled={status === 'joining'}
            className="w-full py-2 text-indigo-400 text-sm hover:text-indigo-300 transition-colors underline-offset-2 hover:underline">
            Rejoin an existing lobby
          </button>
        </div>

        <button onClick={onBack}
          className="w-full mt-6 py-2 text-gray-500 text-sm hover:text-gray-300 transition-colors">
          Back to Menu
        </button>
      </div>
    </div>
  );
};
