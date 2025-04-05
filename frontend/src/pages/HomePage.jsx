import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  // Function to navigate to the single-player mode
  const handleSinglePlayer = () => {
    navigate('/singleplayer');
  };

  // Function to navigate to the multiplayer mode
  const handleMultiplayer = () => {
    navigate('/multiplayer');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      {/* Game title */}
      <h1 className="text-4xl font-bold text-yellow-400 mb-8">Raja Mantri Chor Sipahi</h1>
      
      {/* Container for buttons */}
      <div className="bg-gray-800 shadow-lg rounded-lg p-6">
        {/* Button to start single-player mode */}
        <button 
          onClick={handleSinglePlayer} 
          className="px-4 py-2 bg-blue-500 text-white rounded mr-4 hover:bg-blue-600 transition"
        >
          Single Screen
        </button>
        
        {/* Button to start multiplayer mode */}
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
