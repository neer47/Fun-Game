import React, { createContext, useContext, useState } from "react";
import { db as firebaseDb } from "../config/firebase";
import { ref, set, update, get } from "firebase/database";

// Create context for game state management
const GameContext = createContext();
const db = firebaseDb;

export { GameContext };

// Custom hook to access game context
export function useGame() {
  return useContext(GameContext);
}

// GameProvider component to wrap the app and provide game state
export function GameProvider({ children }) {
  // State for loading status
  const [loading, setLoading] = useState(false);
  // State for error messages
  const [error, setError] = useState(null);
  // State for player name, initialized from localStorage
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('playerName') || '';
  });
  // State for room link URL
  const [roomLink, setRoomLink] = useState("");
  // State to track room creation status
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  // State for game session ID
  const [gameSessionId, setGameSessionId] = useState(null);
  // State for list of players in the game
  const [players, setPlayers] = useState([]);

  // Function to create a new game room
  const createRoom = async (rounds = 1) => {
    const roomId = Math.random().toString(36).substr(2, 9); // Generate random room ID
    try {
      setLoading(true);
      const timestamp = new Date().toISOString();
      if (!db) {
        throw new Error("Database not initialized");
      }
      
      // Reference to game in Firebase
      const gameRef = ref(db, `/games/${roomId}`);
      
      // Initialize game data in database
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

  // Function to join an existing game room
  const joinRoom = async (roomId) => {
    try {
      setLoading(true);
      const roomRef = ref(db, `games/${roomId}`);
      const snapshot = await get(roomRef);

      // Check if room exists
      if (!snapshot.exists()) {
        alert("Room not found!");
        return null;
      }

      const gameData = snapshot.val();

      // Check if room is full
      if (gameData.players && gameData.players.length >= 4) {
        alert("Room is full!");
        return null;
      }

      // Define new player object
      const newPlayer = {
        name: playerName,
        isHost: false,
        points: 0,
      };

      // Update players list in database
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

  // Function to update player name and persist to localStorage
  const updatePlayerName = (name) => {
    localStorage.setItem('playerName', name);
    setPlayerName(name);
  };

  // Context value object containing all state and functions
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

  // Provide context value to children components
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}