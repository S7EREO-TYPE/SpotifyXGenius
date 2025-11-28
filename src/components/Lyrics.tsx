import React, { useState, useEffect, useRef } from 'react';
import { fetchLyrics, LyricsData, SyncedLyricLine } from '../services/geniusService';
import './Lyrics.css';

interface LyricsProps {
  currentTrack: {
    name: string;
    artist: string;
    album?: string;
    duration?: number;
  } | null;
  playbackData?: {
    progressMs: number;
    durationMs: number;
    isPlaying: boolean;
  } | null;
}

const Lyrics: React.FC<LyricsProps> = ({ currentTrack, playbackData }) => {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const lastFetchedTrack = useRef<string>('');
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSongLyrics = async () => {
      if (!currentTrack) {
        setLyricsData(null);
        lastFetchedTrack.current = '';
        return;
      }

      const trackKey = `${currentTrack.artist}-${currentTrack.name}`;
      
      if (trackKey === lastFetchedTrack.current) {
        return;
      }

      setLoading(true);
      lastFetchedTrack.current = trackKey;
      
      try {
        const data = await fetchLyrics(
          currentTrack.artist, 
          currentTrack.name,
          currentTrack.album,
          currentTrack.duration
        );
        
        setLyricsData(data);
        setCurrentLineIndex(0);
      } catch (error) {
        console.error('Error fetching lyrics:', error);
        setLyricsData({
          source: 'genius',
          title: currentTrack.name,
          artist: currentTrack.artist,
          synced: false,
          lyrics: 'Error loading lyrics. Make sure the backend server is running.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSongLyrics();
  }, [currentTrack]);

  // Precise sync for timestamped lyrics
  useEffect(() => {
    if (!playbackData || !lyricsData?.synced || !lyricsData.syncedLyrics) return;

    const { progressMs, isPlaying } = playbackData;
    
    if (!isPlaying) return;

    // Find the current line based on exact timestamps
    const currentIndex = lyricsData.syncedLyrics.findIndex((line, index) => {
      const nextLine = lyricsData.syncedLyrics![index + 1];
      return progressMs >= line.time && (!nextLine || progressMs < nextLine.time);
    });

    if (currentIndex !== -1 && currentIndex !== currentLineIndex) {
      setCurrentLineIndex(currentIndex);

      // Auto-scroll to current line
      if (lyricsContainerRef.current) {
        const lineElements = lyricsContainerRef.current.querySelectorAll('.lyric-line');
        const currentElement = lineElements[currentIndex];
        
        if (currentElement) {
          currentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    }
  }, [playbackData, lyricsData, currentLineIndex]);

  // Fallback sync for non-timestamped lyrics
  useEffect(() => {
    if (!playbackData || !lyricsData || lyricsData.synced) return;

    const plainLyrics = lyricsData.plainLyrics || lyricsData.lyrics || '';
    const lines = plainLyrics.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) return;

    const { progressMs, durationMs, isPlaying } = playbackData;
    
    if (!isPlaying) return;

    const progressRatio = progressMs / durationMs;
    const estimatedLineIndex = Math.floor(progressRatio * lines.length);
    const clampedIndex = Math.min(estimatedLineIndex, lines.length - 1);
    
    if (clampedIndex !== currentLineIndex) {
      setCurrentLineIndex(clampedIndex);

      if (lyricsContainerRef.current) {
        const lineElements = lyricsContainerRef.current.querySelectorAll('.lyric-line');
        const currentElement = lineElements[clampedIndex];
        
        if (currentElement) {
          currentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    }
  }, [playbackData, lyricsData, currentLineIndex]);

  return (
    <div className="lyrics">
      <h2>Lyrics</h2>
      
      {loading ? (
        <div className="loading">Loading lyrics...</div>
      ) : currentTrack ? (
        <div className="lyrics-content">
          <div className="lyrics-header">
            <h3>{currentTrack.name}</h3>
            <p>{currentTrack.artist}</p>
            {lyricsData?.synced && (
              <span className="synced-badge">✨ Synced Lyrics</span>
            )}
            {lyricsData?.source && (
              <span className="source-badge">Source: {lyricsData.source.toUpperCase()}</span>
            )}
          </div>
          
          {lyricsData?.synced && lyricsData.syncedLyrics ? (
            <div className="lyrics-text animated" ref={lyricsContainerRef}>
              {lyricsData.syncedLyrics.map((line, index) => (
                <div
                  key={index}
                  className={`lyric-line ${index === currentLineIndex ? 'active' : ''} ${
                    index < currentLineIndex ? 'past' : ''
                  } ${index > currentLineIndex ? 'future' : ''}`}
                >
                  {line.text}
                </div>
              ))}
            </div>
          ) : (
            <div className="lyrics-text animated" ref={lyricsContainerRef}>
              {(lyricsData?.plainLyrics || lyricsData?.lyrics || '').split('\n').filter(l => l.trim()).map((line, index) => (
                <div
                  key={index}
                  className={`lyric-line ${index === currentLineIndex ? 'active' : ''} ${
                    index < currentLineIndex ? 'past' : ''
                  } ${index > currentLineIndex ? 'future' : ''}`}
                >
                  {line}
                </div>
              ))}
            </div>
          )}

          {lyricsData?.url && (
            <div className="genius-link">
              <a href={lyricsData.url} target="_blank" rel="noopener noreferrer">
                View on Genius →
              </a>
            </div>
          )}

          <div className="implementation-note">
            <h4>✅ Backend Server Required</h4>
            <p>
              To see lyrics, start the backend server:
            </p>
            <ol>
              <li>Open a new terminal</li>
              <li>Run: <code>cd server && npm start</code></li>
              <li>Keep the server running while using the app</li>
            </ol>
          </div>
        </div>
      ) : (
        <p className="no-lyrics">Play a song to see lyrics</p>
      )}
    </div>
  );
};

export default Lyrics;
