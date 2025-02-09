import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SinglePlayerInterface from './pages/SinglePlayerInterface';
import GameLobby from './components/GameLobby';
import GamePage from './pages/GamePage';
import { GameProvider } from './context/GameContext';
import { logEvent } from "firebase/analytics";
import { analytics } from "./config/firebase";

const App = () => {
  useEffect(() => {
    logEvent(analytics, 'user_engagement', {
      session_start: new Date().toISOString()
    });
  }, []);

  return (
    <Router>
      <GameProvider>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/singleplayer" element={<SinglePlayerInterface />} />
            <Route path="/singleplayer/game" element={<GamePage />} />
            <Route path="/multiplayer" element={<GameLobby />} />
            <Route path="/multiplayer/game" element={<GamePage />} />
          </Routes>
        </div>
      </GameProvider>
    </Router>
  );
};

export default App;
