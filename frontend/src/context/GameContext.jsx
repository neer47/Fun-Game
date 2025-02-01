import React, { createContext, useContext, useState } from 'react';
import { db } from '../config/firebase';
import { 
  collection, 
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

const GameContext = createContext();

export function useGame() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Save game data
  const saveGameData = async (gameData) => {
    try {
      setLoading(true);
      const gameRef = collection(db, 'games', gameData.sessionId, 'rounds');
      
      if (gameData.gameCompleted) {
        await setDoc(doc(db, 'games', gameData.sessionId), {
          totalRounds: gameData.totalRounds,
          finalScores: gameData.finalScores,
          completedAt: serverTimestamp(),
          playerNames: gameData.players.map(p => p.name),
          gameSettings: gameData.gameSettings,
          status: 'completed'
        });
      } else {
        // Update game status document
        await setDoc(doc(db, 'games', gameData.sessionId), {
          currentRound: gameData.roundNumber,
          totalRounds: gameData.gameSettings.totalRounds,
          playerNames: gameData.gameSettings.playerNames,
          status: 'in-progress',
          lastUpdated: serverTimestamp()
        }, { merge: true });

        // Save round data
        await addDoc(gameRef, {
          roundNumber: gameData.roundNumber,
          roundData: gameData.roundData,
          players: gameData.players,
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error saving game data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to game updates
  const subscribeToGame = (sessionId, onUpdate) => {
    if (!sessionId) {
      console.error("subscribeToGame called with undefined sessionId");
      return () => {}; // Return a no-op cleanup function
    }

    // Listen to game document changes
    const gameDoc = doc(db, 'games', sessionId);
    const gameUnsubscribe = onSnapshot(gameDoc, (doc) => {
      if (doc.exists()) {
        const gameData = doc.data();
        onUpdate({ type: 'gameUpdate', data: gameData });
      }
    });

    // Listen to rounds collection changes
    const roundsRef = collection(db, 'games', sessionId, 'rounds');
    const q = query(roundsRef, orderBy('roundNumber'));
    const roundsUnsubscribe = onSnapshot(q, (snapshot) => {
      const rounds = [];
      snapshot.forEach((doc) => {
        rounds.push(doc.data());
      });
      onUpdate({ type: 'roundsUpdate', data: rounds });
    });

    // Return cleanup function
    return () => {
      gameUnsubscribe();
      roundsUnsubscribe();
    };
  };

  const value = {
    saveGameData,
    subscribeToGame,
    loading,
    error
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}