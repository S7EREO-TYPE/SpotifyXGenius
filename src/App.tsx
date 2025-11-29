import React, { useState, useEffect } from 'react';
import { Youtube, ExternalLink, Music2, MonitorPlay } from 'lucide-react';
import Login from './components/Login';
import Player from './components/Player';
import Lyrics from './components/Lyrics';
import YouTubePlayer from './components/YouTubePlayer';
import { getAccessToken, getAccessTokenFromUrl, setAccessToken } from './services/spotifyService';
import './App.css';

interface CurrentTrack {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  uri: string;
  duration: number;
}

interface PlaybackData {
  progressMs: number;
  durationMs: number;
  isPlaying: boolean;
  item: any;
  is_playing: boolean;
}

function App() {
  const [token, setToken] = useState<string>('');
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [playbackData, setPlaybackData] = useState<PlaybackData | null>(null);
  const [showVideo, setShowVideo] = useState<boolean>(true);

  useEffect(() => {
    // Check if we're returning from Spotify OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // Exchange code for access token
      getAccessTokenFromUrl()
        .then(accessToken => {
          if (accessToken) {
            setAccessToken(accessToken); // Store in sessionStorage
            setToken(accessToken);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch(error => {
          console.error('Failed to get access token:', error);
        });
    } else {
      // Check if we already have a token
      const existingToken = getAccessToken();
      if (existingToken) {
        setToken(existingToken);
      }
    }
  }, []);

  const handleTrackChange = (track: CurrentTrack) => {
    setCurrentTrack(track);
  };

  const handlePlaybackUpdate = (data: { progressMs: number; durationMs: number; isPlaying: boolean }) => {
    // We update the full playbackData object structure to match what YouTubePlayer expects
    // This is a bit of a hack, ideally we'd normalize the types better
    setPlaybackData({
      progressMs: data.progressMs,
      durationMs: data.durationMs,
      isPlaying: data.isPlaying,
      item: null, // Not used by YouTubePlayer
      is_playing: data.isPlaying
    });
  };

  const openGenius = () => {
    if (currentTrack) {
      const query = `${currentTrack.artist} ${currentTrack.name} lyrics`;
      window.open(`https://genius.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
  };

  const openYouTube = () => {
    if (currentTrack) {
      const query = `${currentTrack.artist} ${currentTrack.name}`;
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
    }
  };

  return (
    <div className="app-container">
      {!token ? (
        <Login />
      ) : (
        <div className="main-grid">
          {/* Header / Top Bar */}
          <header className="app-header">
            <div className="logo">
              <Music2 size={24} />
              <span>SpotifyXGenius</span>
            </div>
            <div className="controls">
              <button
                className={`icon-button ${showVideo ? 'active' : ''}`}
                onClick={() => setShowVideo(!showVideo)}
                title={showVideo ? "Hide Video" : "Show Video"}
              >
                <MonitorPlay size={20} />
                <span>{showVideo ? 'Hide Video' : 'Show Video'}</span>
              </button>
            </div>
          </header>

          {/* Main Content Grid */}
          <div className={`content-grid ${showVideo ? 'with-video' : 'no-video'}`}>

            {/* Left Column: Player & Video */}
            <div className="left-column">
              <div className="player-card">
                <Player
                  token={token}
                  onTrackChange={handleTrackChange}
                  onPlaybackUpdate={handlePlaybackUpdate}
                />
                {currentTrack && (
                  <div className="external-links">
                    <button onClick={openGenius} className="link-btn genius">
                      <ExternalLink size={14} /> Genius
                    </button>
                    <button onClick={openYouTube} className="link-btn youtube">
                      <Youtube size={14} /> YouTube
                    </button>
                  </div>
                )}
              </div>

              {showVideo && (
                <div className="video-card">
                  <YouTubePlayer
                    currentTrack={currentTrack}
                    playbackData={playbackData}
                  />
                </div>
              )}
            </div>

            {/* Right Column: Lyrics */}
            <div className="right-column">
              <div className="lyrics-card">
                <Lyrics
                  currentTrack={currentTrack}
                  playbackData={playbackData}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
