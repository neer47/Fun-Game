import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import PlayerCard from "./PlayerCard";
import { useGame } from "../context/GameContext";
import {
  ref,
  onValue,
  update,
  set,
  serverTimestamp,
  get,
} from "firebase/database";
import { db } from "../config/firebase";

const roles = [
  { name: "Raja", points: 1000, image: "/images/king.jpg" },
  { name: "Mantri", points: 500, image: "/images/minister.avif" },
  { name: "Sipahi", points: 300, image: "/images/soldier.avif" },
  { name: "Chor", points: 0, image: "/images/thief.jpg" },
];

const GameBoard = ({
  players,
  setPlayers,
  onRoundComplete,
  updateRoundsHistory,
  sessionId: propSessionId,
}) => {
  const timerIdRef = useRef(null);
  const location = useLocation();
  const {
    playerNames = [],
    gameMode = "single",
    rounds = 1,
  } = location.state || {};
  const { gameSessionId, playerName } = useGame();

  // State variables
  const [flippedIndexes, setFlippedIndexes] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [roundsHistory, setRoundsHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [indexes, setIndexes] = useState({
    raja: null,
    mantri: null,
    chor: null,
    sipahi: null,
  });
  const [mantriSelected, setMantriSelected] = useState(false);
  const sessionId = propSessionId || gameSessionId || `game_${Date.now()}`;
  const isHost =
    gameMode === "multi"
      ? players.find((p) => p.name === playerName)?.isHost
      : true;
  const isCurrentMantri = players.some(
    (p) => p.name === playerName && p.role === "Mantri"
  );

  // Firebase synchronization with improved roundsHistory handling
  const isUpdatingRef = useRef(false);

  // Modified Firebase synchronization
  useEffect(() => {
    if (gameMode === "multi" && sessionId) {
      const gameRef = ref(db, `games/${sessionId}`);
      const unsubscribe = onValue(gameRef, (snapshot) => {
        if (snapshot.exists()) {
          const gameData = snapshot.val();
          
          // Only update if we're not currently updating Firebase
          if (!isUpdatingRef.current) {
            setPlayers([...(gameData.players || [])]);
            
            // Only update roundsHistory if it exists and is non-empty
            if (gameData.roundsHistory && gameData.roundsHistory.length > 0) {
              setRoundsHistory(gameData.roundsHistory);
              updateRoundsHistory(gameData.roundsHistory);
            }
            setIsProcessing(false);
            setIndexes((prev) => gameData.indexes || prev);
            setFlippedIndexes((prev) => gameData.flippedIndexes || prev);
            setTimeLeft(gameData.timeLeft ?? 30);
            setGameStarted(!!gameData.gameStarted);
            setCurrentRound((prev) => gameData.currentRound ?? prev);
            setRoundCompleted(!!gameData.roundCompleted);
            setMantriSelected(!!gameData.mantriSelected);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [gameMode, sessionId]);
  // Modified assignRoles to handle role reassignment
  const assignRoles = async () => {
    if (gameMode === "multi") {
      const gameRef = ref(db, `games/${sessionId}`);
      const snapshot = await get(gameRef);
      const gameData = snapshot.val();

      // Only proceed if we're the host
      if (!isHost) return null;
    }

    let shuffledPlayers = [];
    if (gameMode === "single") {
      shuffledPlayers = playerNames.map((name) => ({
        name,
        points: 0,
        isHost: false,
      }));
    } else {
      // In multiplayer, preserve points and host status but reset roles
      shuffledPlayers = players.map((player) => ({
        ...player,
        role: null, // Clear existing role
        image: null, // Clear existing image
      }));
    }

    // Shuffle roles and assign to players
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);
    shuffledPlayers = shuffledPlayers.sort(() => Math.random() - 0.5);

    const assignedPlayers = shuffledPlayers.map((player, index) => ({
      ...player,
      role: shuffledRoles[index].name,
      image: shuffledRoles[index].image,
    }));

    const newIndexes = {
      raja: assignedPlayers.findIndex((p) => p.role === "Raja"),
      mantri: assignedPlayers.findIndex((p) => p.role === "Mantri"),
      chor: assignedPlayers.findIndex((p) => p.role === "Chor"),
      sipahi: assignedPlayers.findIndex((p) => p.role === "Sipahi"),
    };

    setPlayers(assignedPlayers);
    setIndexes(newIndexes);

    if (gameMode === "multi") {
      await updateGameInFirebase({
        players: assignedPlayers,
        indexes: newIndexes,
      });
    }

    return { players: assignedPlayers, indexes: newIndexes };
  };
  // Start game flow
  const handleStartGame = async () => {
    if (gameMode === "multi" && !isHost) return;

    // Always assign new roles when starting a new round
    const result = await assignRoles();
    if (!result) return;

    if (gameMode === "multi") {
      await updateGameInFirebase({
        gameStarted: true,
        flippedIndexes: [result.indexes.raja],
        currentRound,
        mantriSelected: false,
        roundCompleted: false,
        indexes: result.indexes,
        players: result.players,
        timeLeft: 30,
      });
    } else {
      setGameStarted(true);
      setFlippedIndexes([result.indexes.raja]);
      setIndexes(result.indexes);
      setTimeLeft(30);
    }

    // After 2 seconds, reveal Mantri and start timer
    setTimeout(async () => {
      const mantriIndex = result.indexes.mantri;
      setFlippedIndexes([mantriIndex]);
      if (gameMode === "multi") {
        await updateGameInFirebase({
          flippedIndexes: [mantriIndex],
        });
      }
      startTimer();
    }, 2000);
  };

  // Timer management
  const startTimer = () => {
    // Clear any existing timer
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
    }

    // For multiplayer, update time directly in Firebase
    if (gameMode === "multi" && sessionId) {
      timerIdRef.current = setInterval(async () => {
        const gameRef = ref(db, `games/${sessionId}`);
        const snapshot = await get(gameRef);
        const currentTime = snapshot.val()?.timeLeft ?? 0;

        if (currentTime <= 0) {
          clearInterval(timerIdRef.current);
          handleTimeOut();
          return;
        }

        await update(gameRef, {
          timeLeft: currentTime - 1,
          lastTimerUpdate: serverTimestamp(),
        });
      }, 1000);
    } else {
      // Single player timer remains the same
      timerIdRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            clearInterval(timerIdRef.current);
            handleTimeOut();
          }
          return newTime;
        });
      }, 1000);
    }
  };

  // Handle timer expiration
  const handleTimeOut = async () => {
    await updatePoints(indexes.mantri);
    if (gameMode === "multi") {
      await updateGameInFirebase({
        roundCompleted: true,
        gameStarted: false,
        flippedIndexes: [],
      });
    } else {
      setFlippedIndexes([]);
    }
  };

  // Points calculation with global roundsHistory update
  const updatePoints = async (selectedIndex) => {
    const isCorrect = selectedIndex === indexes.chor;
    const roundEntry = {};

    const updatedPlayers = players.map((player) => {
      let points = player.points || 0;
      let roundPoints = 0;
      
      switch (player.role) {
        case "Raja":
          roundPoints = 1000;
          break;
        case "Sipahi":
          roundPoints = 300;
          break;
        case "Mantri":
          roundPoints = isCorrect ? 500 : 0;
          break;
        case "Chor":
          roundPoints = isCorrect ? 0 : 500;
          break;
      }
      
      points += roundPoints;
      roundEntry[player.name] = roundPoints;
      return { ...player, points };
    });

    try {
      isUpdatingRef.current = true;

      // Get current state from Firebase
      let updatedRoundsHistory = [];
      if (gameMode === "multi") {
        const gameRef = ref(db, `games/${sessionId}`);
        const snapshot = await get(gameRef);
        const currentData = snapshot.val() || {};
        updatedRoundsHistory = [...(currentData.roundsHistory || []), roundEntry];

        // Update Firebase atomically
        await update(gameRef, {
          players: updatedPlayers,
          roundsHistory: updatedRoundsHistory,
          roundCompleted: true,
          gameStarted: false,
          mantriSelected: true,
          lastUpdated: serverTimestamp(),
        });
      } else {
        updatedRoundsHistory = [...roundsHistory, roundEntry];
      }

      // Update local state
      setRoundsHistory(updatedRoundsHistory);
      updateRoundsHistory(updatedRoundsHistory);
      setPlayers(updatedPlayers);
      setRoundCompleted(true);
    } finally {
      isUpdatingRef.current = false;
    }
  };
  // Player selection handler
  // Player selection handler with improved synchronization
  const handlePlayerSelection = async (index) => {
    if (
      !isCurrentMantri ||
      mantriSelected ||
      !gameStarted ||
      timeLeft === 0 ||
      index === indexes.mantri
    )
      return;

    // Update selection state immediately
    setMantriSelected(true);
    setFlippedIndexes([index]);
    clearInterval(timerIdRef.current);
    setTimeLeft(0);

    if (gameMode === "multi") {
      await updateGameInFirebase({
        mantriSelected: true,
        flippedIndexes: [index],
        timeLeft: 0,
      });
    }

    // Show result and update points
    setTimeout(() => {
      const isCorrect = index === indexes.chor;
      alert(
        isCorrect
          ? "Correct! The Chor has been identified."
          : "Wrong choice! Mantri's points are swapped with Chor."
      );
    }, 100);

    // Update points and complete round
    await updatePoints(index);

    // Flip cards back after delay
    setTimeout(() => {
      setFlippedIndexes([]);
      if (gameMode === "multi") {
        updateGameInFirebase({ flippedIndexes: [] });
      }
    }, 1500);
  };

  // Next round handler
  const handleNextRound = async () => {
    if(gameMode === "multi" && !isHost) return;
    if (isProcessing) return;
    setIsProcessing(true);
  
    try {
      isUpdatingRef.current = true;
      const newRound = currentRound + 1;
  
      // Check game over condition FIRST
      if (newRound > rounds) {
        alert("Game Over!");
        return; // Exit early but finally block will still execute
      }
  
      const updates = {
        currentRound: newRound,
        gameStarted: false,
        roundCompleted: false,
        mantriSelected: false,
        flippedIndexes: [],
        timeLeft: 30,
      };
  
      if (gameMode === "multi") {
        const gameRef = ref(db, `games/${sessionId}`);
        await update(gameRef, {
          ...updates,
          lastUpdated: serverTimestamp(),
        });
        // Force immediate local update for responsiveness
        setCurrentRound(newRound);
        setGameStarted(false);
        setRoundCompleted(false);
        setFlippedIndexes([]);
      } else {
        setCurrentRound(newRound);
        setGameStarted(false);
        setRoundCompleted(false);
        setFlippedIndexes([]);
        setTimeLeft(30);
      }
    } catch (error) {
      console.error("Next round error:", error);
    } finally {
      setIsProcessing(false); // Critical reset
      isUpdatingRef.current = false;
    }
  };

  const updateGameInFirebase = async (updates) => {
    if (gameMode === "multi" && sessionId) {
      const gameRef = ref(db, `games/${sessionId}`);
      await update(gameRef, { ...updates, lastUpdated: serverTimestamp() });
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-center text-xl font-semibold text-yellow-400 mb-4">
        Round {currentRound} / {rounds}
      </h2>

      {gameStarted && (
        <div className="text-center text-lg text-white mb-4">
          Time Left: {timeLeft}s
          {isCurrentMantri && !mantriSelected && (
            <div className="text-yellow-300 animate-pulse mt-2">
              Mantri: Select the Chor!
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 place-items-center">
        {players?.map((player, index) => (
          <PlayerCard
            key={index}
            name={player.name}
            role={player.role}
            image={player.image}
            isFlipped={flippedIndexes.includes(index)}
            onClick={() => handlePlayerSelection(index)}
            isClickable={isCurrentMantri && !mantriSelected && timeLeft > 0}
          />
        ))}
      </div>

      <div className="mt-6 flex space-x-4 justify-center">
        {!gameStarted &&
          !roundCompleted &&
          currentRound <= rounds &&
          (isHost || gameMode === "single") && (
            <button
              onClick={handleStartGame}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
            >
              Start Game
            </button>
          )}

        {roundCompleted && (isHost || gameMode === "single") && (
          <button
          onClick={handleNextRound}
          className={`bg-blue-500 text-white px-6 py-3 rounded-lg ${
            isProcessing ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
          disabled={isProcessing}
        >
          {currentRound < rounds ? "Next Round" : "Finish Game"}
        </button>
        
        )}
      </div>
    </div>
  );
};

export default GameBoard;
