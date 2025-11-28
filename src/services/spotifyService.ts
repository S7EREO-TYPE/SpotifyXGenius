// Spotify API service for authentication and playback control

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'user-library-read',
  'user-library-modify',
].join(' ');

// Generate a random code verifier for PKCE
const generateCodeVerifier = (): string => {
  const array = new Uint32Array(56);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
};

// Generate code challenge from verifier
const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(digest));
  return btoa(String.fromCharCode.apply(null, bytes as any))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const getAuthUrl = async (): Promise<string> => {
  const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.REACT_APP_REDIRECT_URI;
  
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Store code verifier for later use
  sessionStorage.setItem('code_verifier', codeVerifier);
  
  const params = new URLSearchParams({
    client_id: clientId!,
    response_type: 'code',
    redirect_uri: redirectUri!,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  return `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
};

export const getAccessTokenFromUrl = async (): Promise<string | null> => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (!code) {
    return null;
  }
  
  const codeVerifier = sessionStorage.getItem('code_verifier');
  if (!codeVerifier) {
    return null;
  }
  
  const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.REACT_APP_REDIRECT_URI;
  
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri!,
    client_id: clientId!,
    code_verifier: codeVerifier,
  });
  
  try {
    const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      // Store refresh token for later use
      if (data.refresh_token) {
        sessionStorage.setItem('refresh_token', data.refresh_token);
      }
      return data.access_token;
    }
    
    return null;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return null;
  }
};

export const getCurrentlyPlaying = async (token: string) => {
  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/player/currently-playing`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching currently playing:', error);
    return null;
  }
};

export const getPlaybackState = async (token: string) => {
  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/player`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching playback state:', error);
    return null;
  }
};

export const play = async (token: string, uris?: string[]) => {
  try {
    const body = uris ? JSON.stringify({ uris }) : undefined;
    
    await fetch(`${SPOTIFY_API_BASE}/me/player/play`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    });
  } catch (error) {
    console.error('Error playing track:', error);
  }
};

export const pause = async (token: string) => {
  try {
    await fetch(`${SPOTIFY_API_BASE}/me/player/pause`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error pausing track:', error);
  }
};

export const next = async (token: string) => {
  try {
    await fetch(`${SPOTIFY_API_BASE}/me/player/next`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error skipping to next track:', error);
  }
};

export const previous = async (token: string) => {
  try {
    await fetch(`${SPOTIFY_API_BASE}/me/player/previous`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error going to previous track:', error);
  }
};

export const searchTracks = async (token: string, query: string) => {
  try {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: '20',
    });

    const response = await fetch(`${SPOTIFY_API_BASE}/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Error searching tracks:', error);
    return null;
  }
};
