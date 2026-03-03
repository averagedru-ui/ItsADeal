import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useCardGame } from '../useCardGame';

interface MultiplayerLobbyProps {
  onBack: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ onBack }) => {
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [status, setStatus] = useState<'idle' | 'creating' | 'joining' | 'waiting' | 'error'>('idle');
  const [error, setError] = useState('');
  const [roomPlayers, setRoomPlayers] = useState<string[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const setMultiplayerWs = useCardGame(s => s.setMultiplayerWs);
  const setMultiplayerState = useCardGame(s => s.setMultiplayerState);

  const connectWs = useCallback((action: string, room?: string, name?: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: action, roomId: room, playerName: name || playerName }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'room_created':
          setRoomId(msg.roomId);
          setIsHost(true);
          setStatus('waiting');
          setRoomPlayers(msg.players || [name || playerName]);
          break;
        case 'room_joined':
          setRoomId(msg.roomId);
          setIsHost(false);
          setStatus('waiting');
          setRoomPlayers(msg.players || []);
          break;
        case 'player_joined':
          setRoomPlayers(msg.players || []);
          break;
        case 'player_left':
          setRoomPlayers(msg.players || []);
          break;
        case 'game_started':
          setMultiplayerWs(ws);
          setMultiplayerState(msg.gameState, msg.playerIndex);
          break;
        case 'game_update':
          setMultiplayerState(msg.gameState, msg.playerIndex);
          break;
        case 'error':
          setError(msg.message);
          setStatus('error');
          break;
      }
    };

    ws.onclose = () => {
      if (status === 'waiting') {
        setError('Connection lost');
        setStatus('error');
      }
    };

    ws.onerror = () => {
      setError('Connection failed');
      setStatus('error');
    };
  }, [playerName, status]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setJoinCode(room);
    }
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  const createRoom = () => {
    if (!playerName.trim()) {
      setError('Enter your name');
      return;
    }
    setStatus('creating');
    setError('');
    connectWs('create_room', undefined, playerName.trim());
  };

  const joinRoom = () => {
    if (!playerName.trim()) {
      setError('Enter your name');
      return;
    }
    if (!joinCode.trim()) {
      setError('Enter a room code');
      return;
    }
    setStatus('joining');
    setError('');
    connectWs('join_room', joinCode.trim().toUpperCase(), playerName.trim());
  };

  const startGame = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_game' }));
    }
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
          <p className="text-center text-gray-400 text-sm mb-4">
            Room Code: <span className="text-yellow-400 font-bold text-lg">{roomId}</span>
          </p>

          <button onClick={copyLink}
            className={`w-full py-3 rounded-xl font-bold text-sm mb-4 transition-all ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
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
              onClick={startGame}
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

          <button onClick={() => { wsRef.current?.close(); onBack(); }}
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

        <button onClick={createRoom}
          disabled={status === 'creating'}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-bold text-lg rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/20 mb-4">
          {status === 'creating' ? 'Creating...' : 'Create Room'}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-600"></div></div>
          <div className="relative flex justify-center"><span className="bg-gray-800 px-3 text-gray-500 text-sm">or join</span></div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="ROOM CODE"
            className="flex-1 px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-center font-bold tracking-widest placeholder-gray-500 focus:border-indigo-500 focus:outline-none uppercase transition-colors"
          />
          <button onClick={joinRoom}
            disabled={status === 'joining'}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 active:scale-95 transition-all">
            Join
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
