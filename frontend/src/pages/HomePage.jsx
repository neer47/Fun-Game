import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SinglePlayerInterface from './SinglePlayerInterface';
import GameLobby from '../components/GameLobby';

const HomePage = () => {
  const [playerNames, setPlayerNames] = useState(["", "", "", ""]);
  const [rounds, setRounds] = useState(1);
  const [mode, setMode] = useState(null);
  const navigate = useNavigate();

   // Log the updated playerNames when they change
   useEffect(() => {
    console.log("Updated Player Names:", playerNames);
  }, [playerNames]);


  const handleStartGame = () => {
    if (playerNames.some(name => name.trim() === "")) {
      alert("All player names must be filled!");
      return;
    }

    // Use a timeout to ensure the state update is reflected
    setTimeout(() => {
      console.log("Final Player Names before navigation:", playerNames);
      navigate("/game", {state: { playerNames, rounds }});
    }, 100); // Small delay allows React to update the state
  };

  const incrementRounds = () => {
    if (rounds < 10) setRounds(rounds + 1);
  };

  const decrementRounds = () => {
    if (rounds > 1) setRounds(rounds - 1);
  };

  const handleSinglePlayer = () => {
    navigate('/singleplayer');
  };

  const handleMultiplayer = () => {
    navigate('/multiplayer');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <h1 className="text-4xl font-bold text-yellow-400 mb-8">Raja Mantri Chor Sipahi</h1>
      <div className="bg-gray-800 shadow-lg rounded-lg p-6">
        <button 
          onClick={handleSinglePlayer} 
          className="px-4 py-2 bg-blue-500 text-white rounded mr-4 hover:bg-blue-600 transition"
        >
          Single Player
        </button>
        <button 
          onClick={handleMultiplayer} 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Multiplayer
        </button>
      </div>
    </div>
  );
};

export default HomePage;
