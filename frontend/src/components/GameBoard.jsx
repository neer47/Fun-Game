import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import PlayerCard from "./PlayerCard";
import { useGame } from '../context/GameContext';

const roles = [
  { name: "Raja", points: 1000, image: "/images/king.jpg" },
  { name: "Mantri", points: 500, image: "/images/minister.avif" },
  { name: "Sipahi", points: 300, image: "/images/soilder.avif" },
  { name: "Chor", points: 0, image: "/images/thief.jpg" },
];

const GameBoard = ({ players, setPlayers, onRoundComplete, updateRoundsHistory }) => {
  const timerIdRef = useRef(null);
  const location = useLocation();
  const { playerNames, rounds } = location.state || {
    playerNames: [],
    rounds: 1,
  };

  // console.log("playerNames", playerNames);
  // console.log("rounds", rounds);

  const [flippedIndexes, setFlippedIndexes] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [indexes, setIndexes] = useState({
    mantri: null,
    chor: null,
    sipahi: null,
    raja: null,
  });
  const [mantriSelected, setMantriSelected] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [roundsHistory, setRoundsHistory] = useState([]);
  const { currentGame, saveRound, updateGameStatus } = useGame();

  useEffect(() => {
    if (playerNames.length === 4) assignRoles();
  }, [playerNames, currentRound]);

  // console.log("assignRoles called");

  const assignRoles = () => {
    let shuffledPlayers = [...players].length
      ? [...players]
      : playerNames.map((name) => ({ name, points: 0, lastRole: null }));
  
    let shuffledRoles = [...roles];
  
    // Fisher-Yates Shuffle for players
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }
  
    // Fisher-Yates Shuffle for roles
    for (let i = shuffledRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRoles[i], shuffledRoles[j]] = [shuffledRoles[j], shuffledRoles[i]];
    }
  
    // Assign shuffled roles to shuffled players
    const assignedPlayers = shuffledPlayers.map((player, index) => ({
      ...player,
      role: shuffledRoles[index].name,
      image: shuffledRoles[index].image,
      lastRole: player.role, // Track previous role
      roundsHistory: player.roundsHistory || [],
    }));
  
    setPlayers(assignedPlayers);
  
    setIndexes({
      raja: assignedPlayers.findIndex((p) => p.role === "Raja"),
      mantri: assignedPlayers.findIndex((p) => p.role === "Mantri"),
      chor: assignedPlayers.findIndex((p) => p.role === "Chor"),
      sipahi: assignedPlayers.findIndex((p) => p.role === "Sipahi"),
    });
  
    setFlippedIndexes([]);
  };
  
  
  const handleStartGame = () => {
    if (currentRound > rounds) return alert("Game Over! No more rounds left.");

    setGameStarted(true);
    setRoundCompleted(false);
    setMantriSelected(false);
    setFlippedIndexes([indexes.raja]);

    // console.log("handleStartGame called");

    setTimeout(() => {
      setFlippedIndexes([]);
      revealMantri();
    }, 2000);
  };

  const revealMantri = () => {
    setFlippedIndexes([indexes.mantri]);
    setTimeLeft(30);

    // console.log("revealMantri called");

    timerIdRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIdRef.current);
          setFlippedIndexes([]);
          if (!mantriSelected) handlePlayerSelection();
          setRoundCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const updatePoints = async () => {
    const updatedPlayers = players.map((player) => {
      const role = roles.find((r) => r.name === player.role);
      player.points = role ? role.points : 0;
      player.roundsHistory.push({ round: currentRound, points: role.points });
      return player;
    });

    setPlayers(updatedPlayers);

    // Create round data for Firebase and local state
    const roundData = {};
    const firebaseRoundData = {};
    updatedPlayers.forEach((player) => {
      // For local state (PointsTable)
      roundData[player.name] = player.points;

      // For Firebase
      firebaseRoundData[player.name] = {
        points: player.points,
        role: player.role,
        roundPoints: player.roundsHistory[player.roundsHistory.length - 1].points
      };
    });

    try {
      if (currentGame) {
        await saveRound(currentGame.id, currentRound, firebaseRoundData);
      }
    } catch (error) {
      console.error('Error saving round data:', error);
      alert('Failed to save round data');
    }

    return roundData; // Return the simplified version for local state
  };

  const handlePlayerSelection = (index) => {
    if (!gameStarted || timeLeft === 0 || index == indexes.mantri) return;

    setFlippedIndexes([index]);
    setMantriSelected(true);
    clearInterval(timerIdRef.current);
    setTimeLeft(0);

    // console.log("handlePlayerSelection called");

    setTimeout(() => {
      if (index == indexes.chor) {
        alert("Correct! The Chor has been identified.");
        updatePoints(indexes.mantri, indexes.chor, indexes.raja);
      } else {
        alert("Wrong choice! Mantri's points are swapped with Chor.");
        updatePoints(indexes.chor, indexes.mantri, indexes.raja);
      }
    }, 100); // delay the alert by 100ms

    setTimeout(() => {
      setFlippedIndexes([]); // flip the card back to its original state
    }, 1500); // delay the flip back by 1500ms

    setRoundCompleted(true);
  };

  const handleNextRound = async () => {
    if (currentRound <= rounds) {
      // Create round data
      const roundData = {};
      const firebaseRoundData = {};
      players.forEach((player) => {
        // For local state (PointsTable)
        roundData[player.name] = player.points;

        // For Firebase
        firebaseRoundData[player.name] = {
          points: player.points,
          role: player.role,
          totalPoints: player.points
        };
      });

      try {
        // Update local roundsHistory
        const newRoundsHistory = [...roundsHistory, roundData];
        setRoundsHistory(newRoundsHistory);
    
        // Send updated roundsHistory to parent (GamePage)
        updateRoundsHistory(newRoundsHistory);
        onRoundComplete(roundData);
    
        // Save detailed data to Firebase
        if (currentGame) {
          await saveRound(currentGame.id, currentRound, firebaseRoundData);
        }

        // Prepare for the next round
        setCurrentRound((prev) => prev + 1);
        assignRoles();
        setGameStarted(false);
        setRoundCompleted(false);

        // If this was the last round, update game status
        if (currentRound === rounds && currentGame) {
          await updateGameStatus(currentGame.id, 'completed');
        }
      } catch (error) {
        console.error('Error handling next round:', error);
        alert('Error saving round data. Please try again.');
      }
    } else {
      alert("Game Over! All rounds completed.");
      setGameStarted(false);
    }
  };
  
  // console.log("rendered GameBoard component");

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-center text-xl font-semibold text-yellow-400 mb-4">
        {currentRound <= rounds ? `Round ${currentRound} / ${rounds}` : `${rounds} Rounds Completed`}
      </h2>

      <div className="text-center text-lg text-white mb-4">
        Time Left: {timeLeft}s
      </div>

      <div className="grid grid-cols-2 gap-6 place-items-center">
        {players.map((player, index) => (
          <PlayerCard
            key={index}
            name={player.name}
            role={player.role}
            image={player.image}
            isFlipped={flippedIndexes.includes(index)}
            onClick={() => handlePlayerSelection(index)}
          />
        ))}
      </div>

      <div className="mt-6 flex space-x-4 justify-center">
        {!gameStarted && !roundCompleted && (
          <button
            onClick={handleStartGame}
            className={`${currentRound <= rounds ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white px-6 py-3 rounded-lg shadow-md transition`}
          >
            {currentRound <= rounds ? 'Start Game' : 'Game Over'}
          </button>
        )}

        {roundCompleted && currentRound <= rounds && (
          <button
            onClick={handleNextRound}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition"
          >
            Next Round
          </button>
        )}
      </div>

    </div>
  );
};

export default GameBoard;
