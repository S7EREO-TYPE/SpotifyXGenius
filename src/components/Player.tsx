import React, { useState, useEffect } from 'react';
import { getCurrentlyPlaying, getPlaybackState, play, pause, next, previous, searchTracks } from '../services/spotifyService';
import './Player.css';

interface PlayerProps {
  token: string;
  onTrackChange: (track: any) => void;
  onPlaybackUpdate?: (playbackData: any) => void;
  playbackData?: any;
}

const Player: React.FC<PlayerProps> = ({ token, onTrackChange, onPlaybackUpdate, playbackData }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchCurrentTrack = async () => {
      const playbackData = await getPlaybackState(token);

      if (playbackData && playbackData.item) {
        const track = {
          name: playbackData.item.name,
          artist: playbackData.item.artists.map((a: any) => a.name).join(', '),
          album: playbackData.item.album.name,
          albumArt: playbackData.item.album.images[0]?.url,
          uri: playbackData.item.uri,
          duration: playbackData.item.duration_ms,
        };

        // Only update if the track has actually changed
        if (track.uri !== currentTrack?.uri) {
          setCurrentTrack(track);
          onTrackChange(track);
        }

        setIsPlaying(playbackData.is_playing);

        // Send playback data to parent (for lyrics sync)
        if (onPlaybackUpdate) {
          onPlaybackUpdate({
            progressMs: playbackData.progress_ms,
            durationMs: playbackData.item.duration_ms,
            isPlaying: playbackData.is_playing,
          });
        }
      }
    };

    fetchCurrentTrack();
    const interval = setInterval(fetchCurrentTrack, 1000); // Update every second for sync

    return () => clearInterval(interval);
  }, [token, onTrackChange, onPlaybackUpdate]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pause(token);
      setIsPlaying(false);
    } else {
      await play(token);
      setIsPlaying(true);
    }
  };

  const handleNext = async () => {
    await next(token);
    setTimeout(async () => {
      const data = await getCurrentlyPlaying(token);
      if (data && data.item) {
        const track = {
          name: data.item.name,
          artist: data.item.artists.map((a: any) => a.name).join(', '),
          album: data.item.album.name,
          albumArt: data.item.album.images[0]?.url,
          uri: data.item.uri,
        };
        setCurrentTrack(track);
        onTrackChange(track);
      }
    }, 500);
  };

  const handlePrevious = async () => {
    await previous(token);
    setTimeout(async () => {
      const data = await getCurrentlyPlaying(token);
      if (data && data.item) {
        const track = {
          name: data.item.name,
          artist: data.item.artists.map((a: any) => a.name).join(', '),
          album: data.item.album.name,
          albumArt: data.item.album.images[0]?.url,
          uri: data.item.uri,
        };
        setCurrentTrack(track);
        onTrackChange(track);
      }
    }, 500);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const results = await searchTracks(token, searchQuery);
    if (results && results.tracks) {
      setSearchResults(results.tracks.items);
    }
  };

  const handlePlayTrack = async (uri: string) => {
    await play(token, [uri]);
    setIsPlaying(true);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="player">
      <h2>Now Playing</h2>

      {currentTrack ? (
        <div className="current-track">
          {currentTrack.albumArt && (
            <img src={currentTrack.albumArt} alt={currentTrack.album} className="album-art" />
          )}
          <div className="track-info">
            <h3>{currentTrack.name}</h3>
            <p>{currentTrack.artist}</p>
            <p className="album">{currentTrack.album}</p>
          </div>
        </div>
      ) : (
        <p className="no-track">No track currently playing. Open Spotify and start playing music!</p>
      )}

      <div className="controls">
        <button onClick={handlePrevious} className="control-btn">⏮</button>
        <button onClick={handlePlayPause} className="control-btn play-pause">
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={handleNext} className="control-btn">⏭</button>
      </div>

      {currentTrack && (
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((playbackData?.progressMs || 0) / currentTrack.duration) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="search-section">
        <h3>Search Tracks</h3>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for songs..."
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((track) => (
              <div
                key={track.id}
                className="search-result-item"
                onClick={() => handlePlayTrack(track.uri)}
              >
                <img src={track.album.images[2]?.url} alt={track.album.name} />
                <div>
                  <p className="track-name">{track.name}</p>
                  <p className="track-artist">{track.artists.map((a: any) => a.name).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Player;
