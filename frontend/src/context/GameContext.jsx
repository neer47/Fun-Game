import React, { createContext, useContext, useState } from "react";
import { db as firebaseDb } from "../config/firebase";
import { ref, set, push, onValue, update, get } from "firebase/database";

const GameContext = createContext();
const db = firebaseDb;

export { GameContext };

export function useGame() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('playerName') || '';
  });
  const [roomLink, setRoomLink] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [gameSessionId, setGameSessionId] = useState(null);
  const [players, setPlayers] = useState([]);

  const createRoom = async (rounds = 1) => {
    const roomId = Math.random().toString(36).substr(2, 9);
    try {
      setLoading(true);
      const timestamp = new Date().toISOString();
      if (!db) {
        throw new Error("Database not initialized");
      }
      const gameRef = ref(db, `/games/${roomId}`);
      await set(gameRef, {
        players: [
          {
            name: playerName,
            isHost: true,
            points: 0,
          },
        ],
        status: "waiting",
        currentRound: 1,
        createdAt: timestamp,
        totalRounds: rounds,
        playerCount: 4,
        gameStarted: false,
        mantriSelected: false,
        roundCompleted: false,
        timeLeft: 30,
      });

      setIsCreatingRoom(true);
      setGameSessionId(roomId);
      setRoomLink(`${window.location.origin}/multiplayer?join=${roomId}`);
      return roomId;
    } catch (error) {
      console.error("Error creating room:", error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId) => {
    try {
      setLoading(true);
      const roomRef = ref(db, `games/${roomId}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        alert("Room not found!");
        return null;
      }

      const gameData = snapshot.val();

      if (gameData.players && gameData.players.length >= 4) {
        alert("Room is full!");
        return null;
      }

      const newPlayer = {
        name: playerName,
        isHost: false,
        points: 0,
      };

      const updatedPlayers = gameData.players
        ? [...gameData.players, newPlayer]
        : [newPlayer];
      await update(roomRef, {
        players: updatedPlayers,
      });

      setRoomLink(`${window.location.origin}/multiplayer?join=${roomId}`);
      setGameSessionId(roomId);
      return roomId;
    } catch (error) {
      console.error("Error joining room:", error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePlayerName = (name) => {
    localStorage.setItem('playerName', name);
    setPlayerName(name);
  };

  const value = {
    loading,
    error,
    playerName,
    setPlayerName,
    roomLink,
    createRoom,
    joinRoom,
    isCreatingRoom,
    gameSessionId,
    setGameSessionId,
    players,
    setPlayers,
    updatePlayerName,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
