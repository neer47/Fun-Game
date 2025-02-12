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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { logEvent } from "firebase/analytics";
import { analytics } from "../config/firebase";

const roles = [
  { name: "Raja", points: 1000, image: "/images/King.jpg" },
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
  totalRounds,
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
  const roundsHistoryRef = useRef([]);

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
      if (!isHost) return null;
    }

    let basePlayers =
      gameMode === "single"
        ? playerNames.map((name) => ({ name, points: 0, isHost: false }))
        : players.map((player) => ({ ...player, role: null, image: null }));

    const availableRoles = [...roles];
    const assignedPlayers = basePlayers.map((player) => {
      const randomIndex = Math.floor(Math.random() * availableRoles.length);
      const role = availableRoles.splice(randomIndex, 1)[0];
      return {
        ...player,
        role: role.name,
        image: role.image,
      };
    });

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
    if(!mantriSelected)
    await updatePoints(null);
  };

  // Points calculation with global roundsHistory update
  const updatePoints = async (selectedIndex) => {
    if (gameMode === "multi") {
      const snapshot = await get(ref(db, `games/${sessionId}`));
      const currentData = snapshot.val();
      
      // If already processing or round completed, return
      if (currentData?.processing || currentData?.roundCompleted) {
        return;
      }
    }
    logEvent(analytics, 'points_update', {
      round_number: currentRound,
      players: players.map(p => p.name)
    });
    const isCorrect = selectedIndex === indexes.chor;
    const roundEntry = {};

    // Get latest data first
    let currentData;
    if (gameMode === "multi") {
      const snapshot = await get(ref(db, `games/${sessionId}`));
      currentData = snapshot.val() || {};
    }

    // Calculate points using latest data
    const currentPlayers =
      gameMode === "multi" ? currentData.players || players : players;
    const updatedPlayers = currentPlayers.map((player) => {
      const roundPoints = calculateRoundPoints(player.role, isCorrect);
      roundEntry[player.name] = roundPoints;
      const currentPoints = player.points || 0;
      return {
        ...player,
        points: currentPoints + roundPoints,
      };
    });

    try {
      isUpdatingRef.current = true;
      const serverRoundsHistory =
        gameMode === "multi"
          ? currentData.roundsHistory || []
          : roundsHistory || [];

      const updatedRoundsHistory = [...serverRoundsHistory, roundEntry];

      if (gameMode === "multi") {
        // Atomic update
        const updates = {
          players: updatedPlayers,
          roundsHistory: updatedRoundsHistory,
          roundCompleted: true,
          gameStarted: false,
          mantriSelected: true,
          lastUpdated: serverTimestamp(),
        };

        await update(ref(db, `games/${sessionId}`), updates);
      }

      // Update local state
      setPlayers(updatedPlayers);
      setRoundsHistory(updatedRoundsHistory);
      updateRoundsHistory(updatedRoundsHistory);
      setRoundCompleted(true);
    } catch (error) {
      console.error("Points update failed:", error);
      logEvent(analytics, 'error', {
        error_message: error.message,
        component: 'GameBoard'
      });
      // Retry logic could be added here
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const calculateRoundPoints = (role, isCorrect) => {
    switch (role) {
      case "Raja":
        return 1000;
      case "Sipahi":
        return 300;
      case "Mantri":
        return isCorrect ? 500 : 0;
      case "Chor":
        return isCorrect ? 0 : 500;
      default:
        return 0;
    }
  };
  // Player selection handler with improved synchronization
  const handlePlayerSelection = async (index) => {
    const isCorrect = index === indexes.chor;
    logEvent(analytics, 'role_selection', {
      player_role: 'Mantri',
      correct_choice: isCorrect,
      time_remaining: timeLeft
    });
    if (
      (!isCurrentMantri ||
        mantriSelected ||
        !gameStarted ||
        timeLeft === 0 ||
        index === indexes.mantri) &&
      gameMode === "multi"
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
      toast(
        isCorrect
          ? "✅ Correct! The Chor has been identified."
          : "❌ Wrong choice! Mantri's points are swapped with Chor."
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
    logEvent(analytics, 'round_complete', {
      round_number: currentRound,
      total_points: players.reduce((sum, p) => sum + p.points, 0)
    });
    if (gameMode === "multi" && !isHost) return;
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      isUpdatingRef.current = true;
      const newRound = currentRound + 1;

      // Check game over condition FIRST
      if (newRound > totalRounds) {
        // Prevent further updates after final round

        await updateGameInFirebase({
          gameOver: true,
          roundCompleted: true,
          gameStarted: false,
          currentRound: totalRounds, // Lock to final round
        });

        // Force final state sync
        if (gameMode === "multi") {
          const gameRef = ref(db, `games/${sessionId}`);
          await update(gameRef, {
            roundsHistory: roundsHistoryRef.current,
            lastUpdated: serverTimestamp(),
          });
        }

        onRoundComplete({ final: true, gameOver: true });
        return;
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
      toast.error("Next round error: " + error.message);
      logEvent(analytics, 'error', {
        error_message: error.message,
        component: 'GameBoard'
      });
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
        Round {Math.min(currentRound, rounds)} / {rounds}
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
              isProcessing
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-600"
            }`}
            disabled={isProcessing}
          >
            {currentRound < rounds ? "Next Round" : "Show Result"}
          </button>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default GameBoard;
