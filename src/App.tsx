import React, { useState, useEffect } from 'react';
import './App.css';
import { getAuthUrl, getAccessTokenFromUrl } from './services/spotifyService';
import Player from './components/Player';
import Lyrics from './components/Lyrics';

interface CurrentTrack {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  uri: string;
  duration?: number;
}

interface PlaybackData {
  progressMs: number;
  durationMs: number;
  isPlaying: boolean;
}

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [playbackData, setPlaybackData] = useState<PlaybackData | null>(null);

  useEffect(() => {
    // Check for token in URL hash
    const checkAuth = async () => {
      const accessToken = await getAccessTokenFromUrl();
      
      if (accessToken) {
        setToken(accessToken);
        // Clean up URL
        window.history.pushState({}, '', '/');
        // Store token in session storage
        sessionStorage.setItem('spotify_token', accessToken);
      } else {
        // Check session storage
        const storedToken = sessionStorage.getItem('spotify_token');
        if (storedToken) {
          setToken(storedToken);
        }
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = async () => {
    const authUrl = await getAuthUrl();
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentTrack(null);
    sessionStorage.removeItem('spotify_token');
  };

  return (
    <div className="app">
      {!token ? (
        <div className="login-container">
          <h1>Spotify × Genius</h1>
          <p style={{ color: 'white', marginBottom: '2rem', fontSize: '1.2rem' }}>
            Play music with synchronized lyrics
          </p>
          <button className="login-button" onClick={handleLogin}>
            Login with Spotify
          </button>
        </div>
      ) : (
        <>
          <div className="header">
            <h1>Spotify × Genius</h1>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
          <div className="main-container">
            <div className="player-section">
              <Player token={token} onTrackChange={setCurrentTrack} onPlaybackUpdate={setPlaybackData} playbackData={playbackData} />
            </div>
            <div className="lyrics-section">
              <Lyrics currentTrack={currentTrack} playbackData={playbackData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
