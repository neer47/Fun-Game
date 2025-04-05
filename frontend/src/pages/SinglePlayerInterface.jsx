import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SinglePlayerInterface = () => {
  const [playerNames, setPlayerNames] = useState(["", "", "", ""]);
  const [rounds, setRounds] = useState(1);
  const navigate = useNavigate();
  
  // Log player name updates in the console
  useEffect(() => {
    console.log("Updated Player Names:", playerNames);
  }, [playerNames]);

  // Start the game after validating player names
  const handleStartGame = () => {
    if (playerNames.some(name => name.trim() === "")) {
      alert("All player names must be filled!");
      return;
    }

    console.log("Final Player Names before navigation:", playerNames);
    navigate("/singleplayer/game", {
      state: { 
        playerNames, 
        rounds,
        gameMode: 'single',
        gameSettings: {
          totalRounds: rounds,
          playerCount: 4
        }
      }
    });
  };

  // Increase the number of rounds (max: 10)
  const incrementRounds = () => {
    if (rounds < 10) setRounds(rounds + 1);
  };

  // Decrease the number of rounds (min: 1)
  const decrementRounds = () => {
    if (rounds > 1) setRounds(rounds - 1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      {/* Game title */}
      <h1 className="text-4xl font-bold text-yellow-400 mb-8">
        Raja Mantri Chor Sipahi
      </h1>
      
      <div className="bg-gray-800 shadow-lg rounded-lg p-6 w-full max-w-lg">
        {/* Player name input section */}
        <h2 className="text-2xl font-semibold text-gray-100 mb-6">
          Enter Player Names
        </h2>
        {playerNames.map((name, index) => (
          <div key={index} className="mb-4">
            <input
              type="text"
              aria-label={`Player ${index + 1} Name`}
              placeholder={`Player ${index + 1} Name`}
              value={name}
              onChange={(e) => {
                const newNames = [...playerNames];
                newNames[index] = e.target.value;
                setPlayerNames(newNames);
              }}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        ))}

        {/* Round selection section */}
        <div className="mb-6">
          <label className="block text-gray-200 font-medium mb-2">
            Select Number of Rounds
          </label>
          <div className="flex items-center space-x-4">
            <button
              onClick={decrementRounds}
              aria-label="Decrement Rounds"
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={rounds === 1}
            >
              -
            </button>
            <span className="text-xl text-gray-100 font-bold">{rounds}</span>
            <button
              onClick={incrementRounds}
              aria-label="Increment Rounds"
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={rounds === 10}
            >
              +
            </button>
          </div>
        </div>

        {/* Start game button */}
        <button
          onClick={handleStartGame}
          aria-label="Start Game"
          className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition"
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

export default SinglePlayerInterface;
