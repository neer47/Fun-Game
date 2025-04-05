import React, { useState, useEffect, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GameBoard from "../components/GameBoard";
import PointsTable from "../components/PointsTable";
import GameLobby from "../components/GameLobby";
import { GameContext } from "../context/GameContext";
import { ref, onValue, update } from "firebase/database";
import { db } from "../config/firebase";
import { logEvent } from "firebase/analytics";
import { analytics } from "../config/firebase";

const GamePage = () => {
  // Get routing information and navigation function
  const location = useLocation();
  const navigate = useNavigate();
  const gameState = location.state;

  // Access game context for player and room information
  const { playerName, roomLink, gameSessionId } = useContext(GameContext);

  // State management for game status and data
  const [gameStatus, setGameStatus] = useState(gameState?.status || "playing");
  const [players, setPlayers] = useState(gameState?.players || []);
  const [roundsHistory, setRoundsHistory] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [showPointsTable, setShowPointsTable] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  // Ref to track rounds history and prevent duplicate updates
  const roundsHistoryRef = useRef([]);

  // Determine total rounds from game state or default to 1
  const totalRounds =
    gameState?.rounds || gameState?.gameSettings?.totalRounds || 1;

  // Ref to store game data and optimize re-renders
  const gameDataRef = useRef(null);

  // Show points table when game ends
  useEffect(() => {
    if (gameOver) {
      setShowPointsTable(true);
    }
  }, [gameOver]);

  // Real-time game updates subscription for multiplayer
  useEffect(() => {
    if (gameState?.gameMode === "multi" && gameState?.sessionId) {
      const gameRef = ref(db, `games/${gameState.sessionId}`);
      
      // Listen for database changes
      const unsubscribe = onValue(gameRef, (snapshot) => {
        if (snapshot.exists()) {
          const gameData = snapshot.val();
          gameDataRef.current = gameData;

          // Redirect to multiplayer lobby if game is waiting
          if (gameData.status === "waiting") {
            navigate("/multiplayer");
          } else {
            // Update game state from database
            if (gameData.players) setPlayers(gameData.players);
            setGameStatus(gameData.status || "playing");
            if (gameData.currentRound) setCurrentRound(gameData.currentRound);
            setGameOver(gameData.gameOver || false);
          }
        }
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    }
  }, [gameState?.gameMode, gameState?.sessionId, navigate]);

  // Handle initial game setup and validation
  useEffect(() => {
    const isSinglePlayer = location.pathname.includes("singleplayer");

    // Redirect if game state is invalid
    if (isSinglePlayer && !gameState?.playerNames) {
      navigate("/singleplayer");
    } else if (!isSinglePlayer && !gameState?.sessionId) {
      navigate("/multiplayer");
    }

    // Initialize players for single player mode
    if (isSinglePlayer && gameState?.playerNames) {
      setPlayers(
        gameState.playerNames.map((name) => ({
          name,
          points: 0,
        }))
      );
    }
  }, [location, navigate, gameState]);

  // Handle completion of a round
  const handleRoundComplete = async (roundData) => {
    if (roundData.final && roundData.gameOver) {
      // Log game over analytics
      logEvent(analytics, "game_over", {
        total_rounds: totalRounds,
        winner: players.reduce((prev, current) =>
          prev.points > current.points ? prev : current
        ).name,
      });
      setCurrentRound(totalRounds);
      setGameOver(true);
      setShowPointsTable(true);

      // Log game completion analytics
      logEvent(analytics, "game_completion", {
        total_rounds: totalRounds,
        players: players.length,
      });
      return;
    }

    // Prepare new round data
    const newRoundData = {
      roundNumber: roundsHistory.length + 1,
      ...roundData,
    };

    // Prevent duplicate round updates
    if (
      JSON.stringify(roundsHistoryRef.current) ===
      JSON.stringify([...roundsHistory, newRoundData])
    ) {
      console.log("Skipping duplicate round update");
      return;
    }

    // Update rounds history
    setRoundsHistory((prevHistory) => {
      const updatedHistory = [...prevHistory, newRoundData];
      roundsHistoryRef.current = updatedHistory;
      return updatedHistory;
    });

    // Update Firebase for multiplayer games
    if (gameState?.gameMode === "multi") {
      const gameRef = ref(db, `games/${gameState.sessionId}`);

      try {
        await update(gameRef, {
          currentRound: roundData.currentRound,
          players: players.map((player) => ({
            ...player,
            points: roundData.points[player.name] || 0,
          })),
          roundsHistory: roundsHistoryRef.current,
        });
      } catch (error) {
        console.error("Error updating game state:", error);
      }
    }
  };

  // Toggle points table visibility
  const handleClosePointsTable = () => {
    setShowPointsTable(false);
  };

  // Render game UI
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-800 py-8 relative">
      {/* Game title with player name */}
      <h1 className="text-2xl md:text-4xl font-bold text-yellow-500 mb-4 md:mb-6 px-4 text-center">
        Welcome to the Game, {playerName}
      </h1>
      
      {/* Show room link for multiplayer */}
      {gameState?.gameMode === "multi" && (
        <p className="text-sm md:text-base text-gray-300 mb-4 md:mb-6">
          Room: {roomLink}
        </p>
      )}

      {/* Render lobby or game content */}
      {gameStatus === "lobby" ? (
        <GameLobby
          sessionId={gameState?.sessionId}
          playerName={playerName}
          onGameStart={() => setGameStatus("playing")}
        />
      ) : (
        <>
          {/* Mobile points table toggle button */}
          {!gameOver && (
            <button
              className="md:hidden fixed bottom-4 right-4 bg-yellow-500 text-white p-3 rounded-full shadow-lg z-50 hover:bg-yellow-600 transition-all"
              onClick={() => setShowPointsTable(!showPointsTable)}
            >
              {showPointsTable ? "📉 Hide Scores" : "📊 Show Scores"}
            </button>
          )}

          {/* Main game layout */}
          <div className="w-full max-w-7xl flex flex-col md:flex-row gap-4 md:gap-8 px-4">
            {/* Game board section */}
            <div
              className={`w-full md:w-2/3 transition-opacity duration-300 
                ${
                  showPointsTable || gameOver
                    ? "md:opacity-100 opacity-100"
                    : "opacity-100"
                }`}
            >
              <GameBoard
                players={players}
                setPlayers={setPlayers}
                totalRounds={totalRounds}
                onRoundComplete={handleRoundComplete}
                updateRoundsHistory={setRoundsHistory}
                sessionId={gameState?.sessionId || gameSessionId}
              />
            </div>

            {/* Points table section */}
            <div
              className={`
                w-full md:w-1/3 transition-all duration-300
                ${
                  showPointsTable
                    ? "block md:relative fixed inset-0 md:inset-auto"
                    : "hidden md:block"
                }
                ${
                  showPointsTable
                    ? "md:bg-transparent bg-gray-800/80 md:p-0 p-4"
                    : ""
                }
                ${showPointsTable ? "md:static z-40" : ""}
                ${
                  gameOver
                    ? "md:relative fixed inset-0 md:inset-auto z-40 bg-gray-800/80 md:bg-transparent p-4 md:p-0"
                    : ""
                }
              `}
            >
              <div className="relative">
                {/* Close button for mobile view */}
                {(showPointsTable || gameOver) && (
                  <button
                    className="md:hidden absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-yellow-500 text-gray-900 rounded-full shadow-lg z-50 hover:bg-yellow-600 transition-colors"
                    onClick={handleClosePointsTable}
                  >
                    ✕
                  </button>
                )}
                <PointsTable
                  players={players}
                  roundsHistory={roundsHistory}
                  totalRounds={totalRounds}
                  currentRound={currentRound}
                  gameOver={gameOver}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GamePage;