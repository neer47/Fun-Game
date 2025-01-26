import React, { useState, useEffect } from 'react';
import GameBoard from '../components/GameBoard';
import PointsTable from '../components/PointsTable';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const GamePage = () => {
  const [players, setPlayers] = useState([]);
  const [roundsHistory, setRoundsHistory] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { createNewGame, currentGame } = useGame();

  useEffect(() => {
    const initializeGame = async () => {
      if (!location.state?.playerNames) {
        navigate('/');
        return;
      }

      try {
        const { playerNames, rounds } = location.state;
        // Create new game in Firebase
        const gameId = await createNewGame(playerNames, rounds);
        
        // Initialize players
        const initialPlayers = playerNames.map(name => ({
          name,
          points: 0,
          roundsHistory: [],
        }));
        setPlayers(initialPlayers);
      } catch (error) {
        console.error('Error initializing game:', error);
        alert('Failed to initialize game. Please try again.');
        navigate('/');
      }
    };

    initializeGame();
  }, [location.state, navigate, createNewGame]);

  const handleRoundComplete = async (roundData) => {
    setRoundsHistory(prev => {
      if (prev.includes(roundData)) return prev;
      return [...prev, roundData];
    });
  
    setPlayers(prevPlayers =>
      prevPlayers.map(player => ({
        ...player,
        roundsHistory: [...(player.roundsHistory || []), roundData[player.name]], 
      }))
    );
  };

  const updateRoundsHistory = (history) => {
    setRoundsHistory(history);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-800 py-8">
      <h1 className="text-4xl font-bold text-yellow-500 mb-6">Game Page</h1>
      <div className="flex w-full max-w-7xl justify-between">
        <GameBoard
          players={players}
          setPlayers={setPlayers}
          onRoundComplete={handleRoundComplete}
          updateRoundsHistory={updateRoundsHistory}
        />
        <PointsTable players={players} roundsHistory={roundsHistory} />
      </div>
    </div>
  );
};

export default GamePage;