const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // Try server/.env
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Try root .env
const express = require('express');
const cors = require('cors');
const Genius = require('genius-lyrics');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Genius client
const Client = new Genius.Client(process.env.GENIUS_ACCESS_TOKEN);

// LRCLIB API endpoint
const LRCLIB_API = 'https://lrclib.net/api';

// Security: Rate limiting configuration
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

// Simple rate limiting middleware
const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  const data = requestCounts.get(ip);

  if (now > data.resetTime) {
    data.count = 1;
    data.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }

  if (data.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  data.count++;
  next();
};

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' })); // Limit payload size
app.use(rateLimiter);

// Spotify Auth Config
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:5000/auth/callback';
const querystring = require('querystring');

console.log('Current working directory:', process.cwd());
console.log('Loading .env from:', require('path').resolve(__dirname, '../.env'));
console.log('SPOTIFY_CLIENT_ID loaded:', CLIENT_ID ? 'Yes (' + CLIENT_ID.substring(0, 5) + '...)' : 'No');
console.log('SPOTIFY_REDIRECT_URI:', REDIRECT_URI);

let accessToken = '';

app.get('/auth/login', (req, res) => {
  if (!CLIENT_ID) {
    console.error('ERROR: SPOTIFY_CLIENT_ID is missing!');
    return res.status(500).send('Server Error: SPOTIFY_CLIENT_ID is not configured.');
  }

  const scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
    }));
});

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code || null;

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
      },
      body: new URLSearchParams({
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const data = await response.json();

    if (response.ok) {
      accessToken = data.access_token;
      res.redirect('http://localhost:3000');
    } else {
      res.redirect('/#' + querystring.stringify({ error: 'invalid_token' }));
    }
  } catch (error) {
    console.error('Error in auth callback:', error);
    res.redirect('/#' + querystring.stringify({ error: 'invalid_token' }));
  }
});

app.get('/auth/token', (req, res) => {
  res.json({ access_token: accessToken });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

// Search for a song
app.get('/api/search', async (req, res) => {
  try {
    const { artist, title } = req.query;

    if (!artist || !title) {
      return res.status(400).json({ error: 'Artist and title are required' });
    }

    const query = `${artist} ${title}`;
    const searches = await Client.songs.search(query);

    if (searches.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const song = searches[0];

    res.json({
      id: song.id,
      title: song.title,
      artist: song.artist.name,
      url: song.url,
      albumArt: song.image,
    });
  } catch (error) {
    console.error('Error searching for song:', error);
    res.status(500).json({ error: 'Failed to search for song' });
  }
});

// Get lyrics for a song with LRC timestamps
app.get('/api/lyrics', async (req, res) => {
  try {
    const { artist, title, album, duration } = req.query;

    if (!artist || !title) {
      return res.status(400).json({ error: 'Artist and title are required' });
    }

    // Try LRCLIB first for timestamped lyrics
    try {
      const lrcUrl = `${LRCLIB_API}/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}${album ? `&album_name=${encodeURIComponent(album)}` : ''}${duration ? `&duration=${Math.floor(duration / 1000)}` : ''}`;

      const lrcResponse = await fetch(lrcUrl);

      if (lrcResponse.ok) {
        const lrcData = await lrcResponse.json();

        if (lrcData.syncedLyrics) {
          // Parse LRC format
          const parsedLyrics = parseLRC(lrcData.syncedLyrics);

          return res.json({
            source: 'lrclib',
            title: lrcData.trackName || title,
            artist: lrcData.artistName || artist,
            album: lrcData.albumName || album,
            duration: lrcData.duration,
            syncedLyrics: parsedLyrics,
            plainLyrics: lrcData.plainLyrics,
          });
        } else if (lrcData.plainLyrics) {
          // Has plain lyrics but no timestamps
          return res.json({
            source: 'lrclib',
            title: lrcData.trackName || title,
            artist: lrcData.artistName || artist,
            album: lrcData.albumName || album,
            lyrics: lrcData.plainLyrics,
            synced: false,
          });
        }
      }
    } catch (lrcError) {
      console.log('LRCLIB not available, falling back to Genius:', lrcError.message);
    }

    // Fallback to Genius if LRCLIB doesn't have the song
    const query = `${artist} ${title}`;
    const searches = await Client.songs.search(query);

    if (searches.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const song = searches[0];
    let lyrics = await song.lyrics();

    // Remove contributor sections and metadata
    lyrics = lyrics
      .replace(/\d+\s*Contributors?.*?Lyrics/gi, '')
      .replace(/\d+\s*Contributor.*?\n/gi, '')
      .replace(/.*?Lyrics\s*$/gim, '')
      .replace(/You might also like/gi, '')
      .replace(/See.*?Live/gi, '')
      .replace(/Get tickets as low as \$\d+/gi, '')
      .replace(/Embed$/gim, '')
      .replace(/^\s*\n/gm, '\n')
      .trim();

    res.json({
      source: 'genius',
      id: song.id,
      title: song.title,
      artist: song.artist.name,
      url: song.url,
      albumArt: song.image,
      lyrics: lyrics,
      synced: false,
    });
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
});

// Search for a YouTube video
app.get('/api/youtube', async (req, res) => {
  try {
    const { artist, title } = req.query;

    if (!artist || !title) {
      return res.status(400).json({ error: 'Artist and title are required' });
    }

    const query = `${artist} ${title} music video`;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'YouTube API key is not configured' });
    }

    // Reverted to videoCategoryId=10 (Music) or just general search with videoEmbeddable=true
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoEmbeddable=true&maxResults=1&key=${apiKey}`;

    const response = await fetch(youtubeUrl);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      res.json({
        videoId: video.id.videoId,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.high.url,
      });
    } else {
      res.status(404).json({ error: 'Video not found' });
    }
  } catch (error) {
    console.error('Error searching YouTube:', error);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

// Helper function to parse LRC format
function parseLRC(lrcText) {
  const lines = lrcText.split('\n');
  const syncedLyrics = [];

  lines.forEach(line => {
    // Match [mm:ss.xx] or [mm:ss.xxx] timestamp format
    const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const centiseconds = parseInt(match[3].padEnd(2, '0').substring(0, 2));
      const text = match[4].trim();

      const timeMs = (minutes * 60 * 1000) + (seconds * 1000) + (centiseconds * 10);

      if (text) {
        syncedLyrics.push({
          time: timeMs,
          text: text,
        });
      }
    }
  });

  return syncedLyrics;
}

app.listen(PORT, () => {
  console.log(`🎵 Lyrics server running on http://localhost:${PORT}`);
});
