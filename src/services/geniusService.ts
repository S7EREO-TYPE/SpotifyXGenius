// Genius API service for fetching lyrics via backend server

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export interface SyncedLyricLine {
  time: number;
  text: string;
}

export interface LyricsData {
  source: 'lrclib' | 'genius';
  title: string;
  artist: string;
  album?: string;
  url?: string;
  albumArt?: string;
  synced: boolean;
  syncedLyrics?: SyncedLyricLine[];
  plainLyrics?: string;
  lyrics?: string;
}

export const fetchLyrics = async (artist: string, title: string, album?: string, duration?: number): Promise<LyricsData> => {
  try {
    let url = `${BACKEND_URL}/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`;
    if (album) url += `&album=${encodeURIComponent(album)}`;
    if (duration) url += `&duration=${duration}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        source: 'genius',
        title,
        artist,
        synced: false,
        lyrics: 'Lyrics not found.',
      };
    }
    
    const data = await response.json();
    return {
      ...data,
      synced: data.synced !== false && !!data.syncedLyrics,
    };
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return {
      source: 'genius',
      title,
      artist,
      synced: false,
      lyrics: 'Error loading lyrics. Make sure the backend server is running.',
    };
  }
};
