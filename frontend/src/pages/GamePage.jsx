import React, { useState, useEffect } from 'react';
import GameBoard from '../components/GameBoard';
import PointsTable from '../components/PointsTable';
import { useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const GamePage = () => {
  const { playerNames, rounds } = useLocation().state || { playerNames: [], rounds: 1 };
  const [players, setPlayers] = useState([]);
  const [roundsHistory, setRoundsHistory] = useState([]);
  const { currentUser, saveGameData } = useGame();
  
  useEffect(() => {    
    fetch('/api/game/players')
    .then(res => res.json())
    .then(data => setPlayers(data));
  }, []);
  
  const handleRoundComplete = (roundData) => {
    setRoundsHistory((prevRounds) => {
      // ✅ Prevent duplicate updates
      if (prevRounds.includes(roundData)) return prevRounds;
      return [...prevRounds, roundData];
    });
  
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => ({
        ...player,
        roundsHistory: [...(player.roundsHistory || []), roundData[player.name]], 
      }))
    );
  
    console.log("Updated Players:", JSON.stringify(players, null, 2));
    console.log("Rounds History:", JSON.stringify(roundsHistory, null, 2));
  };
  
  const handleGameEnd = async (gameResult) => {
    // Save game results to Firebase
    await saveGameData({
      won: gameResult.won,
      // other game data...
    });
  };
  
  console.log("The roundHistory in the game Page: ",roundsHistory);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-800 py-8">
      <h1 className="text-4xl font-bold text-yellow-500 mb-6">Game Page</h1>
      <div className="flex w-full max-w-7xl justify-between">
        <GameBoard
          players={players}
          setPlayers={setPlayers}
          rounds={rounds}
          onRoundComplete={handleRoundComplete}
          updateRoundsHistory={(newRoundsHistory) => setRoundsHistory(newRoundsHistory)}
        />
        <PointsTable players={players} roundsHistory={roundsHistory} />
      </div>
    </div>
  );
};

export default GamePage;