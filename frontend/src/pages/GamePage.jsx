import React, { useState, useEffect, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GameBoard from "../components/GameBoard";
import PointsTable from "../components/PointsTable";
import GameLobby from "../components/GameLobby";
import { GameContext, useGame } from "../context/GameContext";
import { ref, onValue, update } from "firebase/database";
import { db } from "../config/firebase";

const GamePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const gameState = location.state;
  const { playerName, roomLink, gameSessionId } = useContext(GameContext);
  const [gameStatus, setGameStatus] = useState(gameState?.status || "playing");
  const [players, setPlayers] = useState(
    gameState?.players || [] // Use players from gameState directly
  );
  const [roundsHistory, setRoundsHistory] = useState([]);
  const { saveGameData } = useGame();
  const [currentRound, setCurrentRound] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [flippedIndexes, setFlippedIndexes] = useState([]);
  const [mantriSelected, setMantriSelected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  // Store game data in a ref to prevent unnecessary re-renders
  const gameDataRef = useRef(null);

  // Subscribe to game updates for multiplayer mode
  useEffect(() => {
    if (gameState?.gameMode === "multi" && gameState?.sessionId) {
      setIsSyncing(true);
      const gameRef = ref(db, `games/${gameState.sessionId}`);
      const unsubscribe = onValue(gameRef, (snapshot) => {
        if (snapshot.exists()) {
          const gameData = snapshot.val();
          gameDataRef.current = gameData;

          if (gameData.status === "waiting") {
            navigate("/multiplayer");
          } else {
            if (gameData.players) {
              setPlayers(gameData.players);
            }
            setGameStatus(gameData.status || "playing");
            if (gameData.currentRound) {
              setCurrentRound(gameData.currentRound);
            }
            setGameStarted(gameData.gameStarted || false);
            setRoundCompleted(gameData.roundCompleted || false);
            setTimeLeft(gameData.timeLeft || 30);
            setFlippedIndexes(gameData.flippedIndexes || []);
            setMantriSelected(gameData.mantriSelected || false);
          }
        }
        setIsSyncing(false);
      });

      return () => unsubscribe();
    }
  }, [gameState?.gameMode, gameState?.sessionId, navigate]);

  // Add loading indicator in render
  {
    isSyncing && <div className="text-white">Syncing game state...</div>;
  }

  useEffect(() => {
    // Check if we're in single player or multiplayer mode based on the path
    const isSinglePlayer = location.pathname.includes("singleplayer");

    if (isSinglePlayer && !gameState?.playerNames) {
      // If single player but no player names, redirect back to single player setup
      navigate("/singleplayer");
    } else if (!isSinglePlayer && !gameState?.sessionId) {
      // If multiplayer but no game session, redirect back to multiplayer lobby
      navigate("/multiplayer");
    }

    // If we have player names in single player mode, set up the players
    if (isSinglePlayer && gameState?.playerNames) {
      setPlayers(
        gameState.playerNames.map((name) => ({
          name,
          points: 0,
        }))
      );
    }
  }, [location, navigate, gameState]);

  // Update Firebase when round completes
  const handleRoundComplete = async (roundData) => {
    if (gameState?.gameMode === "multi") {
      const gameRef = ref(db, `games/${gameState.sessionId}`);
      try {
        await update(gameRef, {
          currentRound: roundData.currentRound,
          players: players.map((player) => ({
            ...player,
            points: roundData.points[player.name] || 0,
          })),
          roundsHistory: roundsHistory,
        });
      } catch (error) {
        console.error("Error updating game state:", error);
      }
    } else {
      await saveGameData({
        gameMode: gameState.gameMode,
        roundNumber: roundsHistory.length + 1,
        roundData,
        players,
        gameSettings: {
          totalRounds: gameState.rounds,
          playerNames: gameState.playerNames,
        },
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-800 py-8">
      <h1 className="text-4xl font-bold text-yellow-500 mb-6">
        Welcome to the Game, {playerName}
      </h1>
      <p className="text-base text-gray-300 mb-6">Room: {roomLink}</p>

      {gameStatus === "lobby" ? (
        <GameLobby
          sessionId={gameState?.sessionId}
          playerName={playerName}
          onGameStart={() => setGameStatus("playing")}
        />
      ) : (
        <div className="flex w-full max-w-7xl justify-between">
          <GameBoard
            players={players}
            setPlayers={setPlayers}
            rounds={
              gameState?.rounds || gameState?.gameSettings?.totalRounds || 1
            }
            onRoundComplete={handleRoundComplete}
            updateRoundsHistory={setRoundsHistory}
            sessionId={gameState?.sessionId || gameSessionId}
            currentRound={currentRound}
            setCurrentRound={setCurrentRound}
            gameStarted={gameStarted}
            setGameStarted={setGameStarted}
            roundCompleted={roundCompleted}
            setRoundCompleted={setRoundCompleted}
            timeLeft={timeLeft}
            setTimeLeft={setTimeLeft}
            flippedIndexes={flippedIndexes}
            setFlippedIndexes={setFlippedIndexes}
            mantriSelected={mantriSelected}
            setMantriSelected={setMantriSelected}
          />
          <PointsTable players={players} roundsHistory={roundsHistory} />
        </div>
      )}
    </div>
  );
};

export default GamePage;
