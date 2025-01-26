import React, { createContext, useState, useContext } from 'react';
import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [currentGame, setCurrentGame] = useState(null);

  const generateGameId = () => {
    const now = new Date();
    return `game_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  };

  const generateRoundId = (roundNumber) => {
    const now = new Date();
    return `round_${roundNumber}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  };

  const createNewGame = async (playerNames, totalRounds) => {
    try {
      const gameId = generateGameId();
      console.log('Creating new game with ID:', gameId);
      
      const gameData = {
        currentRound: 1,
        totalRounds: totalRounds,
        playerNames: playerNames,
        status: 'active',
        lastUpdated: serverTimestamp(),
      };

      console.log('Game data:', gameData);

      // Create the game document
      const gameRef = doc(db, 'games', gameId);
      await setDoc(gameRef, gameData);
      console.log('Game document created successfully');

      setCurrentGame({ id: gameId, ...gameData });
      return gameId;
    } catch (error) {
      console.error('Error creating new game:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  const saveRound = async (gameId, roundNumber, roundData) => {
    try {
      console.log(`Saving round ${roundNumber} for game ${gameId}`);
      console.log('Round data:', roundData);

      const roundId = generateRoundId(roundNumber);
      const roundDoc = {
        roundNumber,
        roundData,
        players: roundData,
        timestamp: serverTimestamp(),
      };

      // Save round in the rounds subcollection
      const roundRef = doc(db, 'games', gameId, 'rounds', roundId);
      await setDoc(roundRef, roundDoc);
      console.log('Round saved successfully');

      // Update the game document
      const gameRef = doc(db, 'games', gameId);
      await setDoc(gameRef, {
        currentRound: roundNumber + 1,
        lastUpdated: serverTimestamp(),
      }, { merge: true });
      console.log('Game document updated successfully');

    } catch (error) {
      console.error('Error saving round:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        gameId,
        roundNumber
      });
      throw error;
    }
  };

  const updateGameStatus = async (gameId, status) => {
    try {
      console.log(`Updating game ${gameId} status to ${status}`);
      const gameRef = doc(db, 'games', gameId);
      await setDoc(gameRef, {
        status,
        lastUpdated: serverTimestamp(),
      }, { merge: true });
      console.log('Game status updated successfully');
    } catch (error) {
      console.error('Error updating game status:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  return (
    <GameContext.Provider value={{
      currentGame,
      createNewGame,
      saveRound,
      updateGameStatus,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);