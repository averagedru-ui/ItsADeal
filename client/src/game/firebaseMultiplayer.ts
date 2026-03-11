import { db } from './firebase';
import {
  ref,
  set,
  update,
  get,
  push,
  onValue,
  onChildAdded,
  off,
  remove,
  onDisconnect,
  serverTimestamp,
  runTransaction,
} from 'firebase/database';
import type { GameState } from './types';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateSessionId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export interface FirebaseRoom {
  host: string;
  hostSession: string;
  password: string | null;
  isStarted: boolean;
  maxPlayers: number;
  players: Record<string, { name: string; index: number; sessionId: string }>;
  gameState?: any;
}

export interface FirebaseCallbacks {
  onPlayersChanged: (players: string[]) => void;
  onGameStarted: (gameState: GameState, playerIndex: number) => void;
  onGameUpdate: (gameState: GameState, playerIndex: number) => void;
  onChatMessage: (msg: { sender: string; text: string; timestamp: number }) => void;
  onError: (message: string) => void;
  onPlayerLeft: (players: string[], leftPlayer: string) => void;
  onHostChanged: (isHost: boolean) => void;
}

let currentRoomId: string | null = null;
let currentSessionId: string | null = null;
let currentPlayerName: string = '';
let currentPlayerIndex: number = -1;
let unsubscribers: (() => void)[] = [];

function cleanup() {
  for (const unsub of unsubscribers) {
    unsub();
  }
  unsubscribers = [];
  currentRoomId = null;
  currentSessionId = null;
  currentPlayerName = '';
  currentPlayerIndex = -1;
}

export async function createRoom(
  playerName: string,
  password: string | null,
  callbacks: FirebaseCallbacks
): Promise<string> {
  let roomCode = generateRoomCode();
  let attempts = 0;

  while (attempts < 10) {
    const roomRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) break;
    roomCode = generateRoomCode();
    attempts++;
  }

  const sessionId = generateSessionId();
  currentRoomId = roomCode;
  currentSessionId = sessionId;
  currentPlayerName = playerName;
  currentPlayerIndex = 0;

  const roomData: FirebaseRoom = {
    host: playerName,
    hostSession: sessionId,
    password: password || null,
    isStarted: false,
    maxPlayers: 4,
    players: {},
  };

  await set(ref(db, `rooms/${roomCode}`), roomData);

  const playerRef = push(ref(db, `rooms/${roomCode}/players`));
  await set(playerRef, {
    name: playerName,
    index: 0,
    sessionId,
  });

  const disconnectRef = onDisconnect(playerRef);
  disconnectRef.remove();

  setupRoomListeners(roomCode, sessionId, callbacks);

  return roomCode;
}

export async function joinRoom(
  roomCode: string,
  playerName: string,
  password: string | null,
  callbacks: FirebaseCallbacks
): Promise<boolean> {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    callbacks.onError('Room not found');
    return false;
  }

  const roomData = snapshot.val() as FirebaseRoom;

  if (roomData.password && roomData.password !== (password || '')) {
    callbacks.onError('Incorrect password');
    return false;
  }

  if (roomData.isStarted) {
    callbacks.onError('Game already started');
    return false;
  }

  const sessionId = generateSessionId();
  let assignedIndex = -1;

  const playersRef = ref(db, `rooms/${roomCode}/players`);
  const txResult = await runTransaction(playersRef, (currentPlayers) => {
    const players = currentPlayers || {};
    const playerList = Object.values(players) as { index: number }[];
    if (playerList.length >= roomData.maxPlayers) {
      return;
    }
    const maxIndex = playerList.reduce((max, p) => Math.max(max, p.index), -1);
    assignedIndex = maxIndex + 1;
    const newKey = push(ref(db, 'temp')).key!;
    players[newKey] = {
      name: playerName,
      index: assignedIndex,
      sessionId,
    };
    return players;
  });

  if (!txResult.committed || assignedIndex < 0) {
    callbacks.onError('Room is full');
    return false;
  }

  currentRoomId = roomCode;
  currentSessionId = sessionId;
  currentPlayerName = playerName;
  currentPlayerIndex = assignedIndex;

  const txPlayers = txResult.snapshot.val() || {};
  let myPlayerKey: string | null = null;
  for (const [key, player] of Object.entries(txPlayers)) {
    const p = player as { sessionId: string };
    if (p.sessionId === sessionId) {
      myPlayerKey = key;
      break;
    }
  }

  if (myPlayerKey) {
    const myRef = ref(db, `rooms/${roomCode}/players/${myPlayerKey}`);
    onDisconnect(myRef).remove();
  }

  setupRoomListeners(roomCode, sessionId, callbacks);

  return true;
}

function setupRoomListeners(roomCode: string, sessionId: string, callbacks: FirebaseCallbacks) {
  let previousPlayerNames: string[] = [];

  const playersRef = ref(db, `rooms/${roomCode}/players`);
  const playersUnsub = onValue(playersRef, async (snapshot) => {
    const players = snapshot.val();
    if (!players) return;
    const playerList = Object.values(players) as { name: string; index: number; sessionId: string }[];
    playerList.sort((a, b) => a.index - b.index);

    const myEntry = playerList.find(p => p.sessionId === sessionId);
    if (myEntry) {
      currentPlayerIndex = myEntry.index;
    }

    const currentNames = playerList.map(p => p.name);
    const leftPlayers = previousPlayerNames.filter(n => !currentNames.includes(n));
    for (const left of leftPlayers) {
      callbacks.onPlayerLeft(currentNames, left);
    }
    previousPlayerNames = currentNames;

    callbacks.onPlayersChanged(currentNames);

    const roomSnap = await get(ref(db, `rooms/${roomCode}`));
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.val();
    const hostSession = roomData.hostSession;
    const hostStillPresent = playerList.some(p => p.sessionId === hostSession);

    if (!hostStillPresent && playerList.length > 0) {
      const newHost = playerList[0];
      await set(ref(db, `rooms/${roomCode}/host`), newHost.name);
      await set(ref(db, `rooms/${roomCode}/hostSession`), newHost.sessionId);
    }

    const updatedRoomSnap = await get(ref(db, `rooms/${roomCode}/hostSession`));
    const currentHostSession = updatedRoomSnap.val();
    callbacks.onHostChanged(currentHostSession === sessionId);
  });
  unsubscribers.push(() => off(playersRef));

  // Single source of truth: listen to the whole room object.
  // startGame writes gameState + isStarted atomically, so when isStarted flips true
  // the gameState is guaranteed to be present in the same snapshot.
  let gameHasStarted = false;
  const roomDataRef = ref(db, `rooms/${roomCode}`);
  const roomDataUnsub = onValue(roomDataRef, (snapshot) => {
    const room = snapshot.val();
    if (!room) return;

    if (room.isStarted && room.gameState) {
      const gameState = deserializeGameState(room.gameState);
      if (!gameState) return;

      if (!gameHasStarted) {
        // First time we see the game started — fire onGameStarted
        gameHasStarted = true;
        callbacks.onGameStarted(gameState, currentPlayerIndex);
      } else {
        // Subsequent updates (other players' moves)
        callbacks.onGameUpdate(gameState, currentPlayerIndex);
      }
    }
  });
  unsubscribers.push(() => off(roomDataRef));

  const chatRef = ref(db, `rooms/${roomCode}/chat`);
  const chatUnsub = onChildAdded(chatRef, (snapshot) => {
    const msg = snapshot.val();
    if (msg) {
      callbacks.onChatMessage(msg);
    }
  });
  unsubscribers.push(() => off(chatRef));
}

export async function startGame(gameState: GameState): Promise<boolean> {
  if (!currentRoomId) return false;

  const serialized = serializeGameState(gameState);
  // Write atomically so listeners never see isStarted=true without gameState present
  await update(ref(db, `rooms/${currentRoomId}`), {
    gameState: serialized,
    isStarted: true,
  });

  return true;
}

export async function sendGameAction(newState: GameState): Promise<boolean> {
  if (!currentRoomId) return false;

  const serialized = serializeGameState(newState);
  await set(ref(db, `rooms/${currentRoomId}/gameState`), serialized);

  return true;
}

export async function sendChatMessage(sender: string, text: string): Promise<void> {
  if (!currentRoomId) return;

  const chatRef = ref(db, `rooms/${currentRoomId}/chat`);
  await push(chatRef, {
    sender,
    text,
    timestamp: Date.now(),
  });
}

export async function leaveRoom(): Promise<void> {
  if (!currentRoomId) return;

  const roomCode = currentRoomId;
  const playersRef = ref(db, `rooms/${roomCode}/players`);
  const snapshot = await get(playersRef);

  if (snapshot.exists()) {
    const players = snapshot.val();
    for (const [key, player] of Object.entries(players)) {
      const p = player as { sessionId: string };
      if (p.sessionId === currentSessionId) {
        await remove(ref(db, `rooms/${roomCode}/players/${key}`));
        break;
      }
    }

    const remaining = await get(playersRef);
    if (!remaining.exists() || Object.keys(remaining.val() || {}).length === 0) {
      await remove(ref(db, `rooms/${roomCode}`));
    }
  }

  cleanup();
}

export function getCurrentPlayerIndex(): number {
  return currentPlayerIndex;
}

export function getCurrentRoomId(): string | null {
  return currentRoomId;
}

export function isConnected(): boolean {
  return currentRoomId !== null;
}


function serializeGameState(state: GameState): any {
  const clean = JSON.parse(JSON.stringify(state));
  return replaceUndefined(clean);
}

function replaceUndefined(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) return obj.map(replaceUndefined);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceUndefined(value);
    }
    return result;
  }
  return obj;
}

function deserializeGameState(data: any): GameState | null {
  try {
    if (!data || !data.players || !data.phase) return null;

    if (data.players && !Array.isArray(data.players)) {
      data.players = Object.values(data.players);
    }

    for (const player of data.players) {
      if (player.hand && !Array.isArray(player.hand)) {
        player.hand = Object.values(player.hand);
      }
      if (player.bank && !Array.isArray(player.bank)) {
        player.bank = Object.values(player.bank);
      }
      if (player.properties) {
        for (const color of Object.keys(player.properties)) {
          if (player.properties[color] && !Array.isArray(player.properties[color])) {
            player.properties[color] = Object.values(player.properties[color]);
          }
          if (!player.properties[color]) {
            player.properties[color] = [];
          }
        }
      }
    }

    if (data.drawPile && !Array.isArray(data.drawPile)) {
      data.drawPile = Object.values(data.drawPile);
    }
    if (data.discardPile && !Array.isArray(data.discardPile)) {
      data.discardPile = Object.values(data.discardPile);
    }
    if (data.gameLog && !Array.isArray(data.gameLog)) {
      data.gameLog = Object.values(data.gameLog);
    }
    if (!data.gameLog) {
      data.gameLog = [];
    }

    return data as GameState;
  } catch {
    return null;
  }
}

export async function rejoinRoom(
  roomCode: string,
  playerName: string,
  callbacks: FirebaseCallbacks
): Promise<{ success: boolean; isHost: boolean; error?: string }> {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    return { success: false, isHost: false, error: 'Room not found' };
  }

  const roomData = snapshot.val() as FirebaseRoom;

  if (roomData.isStarted) {
    return { success: false, isHost: false, error: 'Game already started' };
  }

  const players = roomData.players ? Object.values(roomData.players) as { name: string; index: number; sessionId: string }[] : [];
  const existingPlayer = players.find(p => p.name === playerName);

  if (existingPlayer) {
    // Already in room — re-setup listeners with existing session
    const sessionId = generateSessionId();
    currentRoomId = roomCode;
    currentSessionId = sessionId;
    currentPlayerName = playerName;
    currentPlayerIndex = existingPlayer.index;

    // Update our session ID
    const playersRef = ref(db, `rooms/${roomCode}/players`);
    const pSnap = await get(playersRef);
    if (pSnap.exists()) {
      const pData = pSnap.val();
      for (const [key, p] of Object.entries(pData)) {
        const player = p as { name: string; index: number; sessionId: string };
        if (player.name === playerName) {
          await set(ref(db, `rooms/${roomCode}/players/${key}/sessionId`), sessionId);
          onDisconnect(ref(db, `rooms/${roomCode}/players/${key}`)).remove();
          break;
        }
      }
    }

    const isHost = roomData.hostSession === existingPlayer.sessionId ||
      players.sort((a, b) => a.index - b.index)[0]?.name === playerName;
    setupRoomListeners(roomCode, sessionId, callbacks);
    return { success: true, isHost };
  }

  // Not in room yet — do a normal join
  const joined = await joinRoom(roomCode, playerName, null, callbacks);
  if (joined) {
    const newRoomSnap = await get(roomRef);
    const newRoom = newRoomSnap.val() as FirebaseRoom;
    const newPlayers = Object.values(newRoom.players || {}) as { name: string; index: number; sessionId: string }[];
    const isHost = newPlayers.sort((a, b) => a.index - b.index)[0]?.name === playerName;
    return { success: true, isHost };
  }

  return { success: false, isHost: false, error: 'Could not join room' };
}
