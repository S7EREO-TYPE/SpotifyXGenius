# Spotify × Genius

A React TypeScript application that integrates Spotify's playback API with Genius lyrics API to display synchronized lyrics while playing music.

## Features

- 🎵 Spotify authentication and playback control
- 🎤 Real-time lyrics fetching from Genius
- 🔍 Search and play tracks directly from the app
- ⏯️ Full playback controls (play, pause, next, previous)
- 📱 Responsive design for mobile and desktop
- 🎨 Beautiful UI with Spotify-inspired theme

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- A Spotify Premium account (required for playback control)

## Setup Instructions

### 1. Clone the Repository

```bash
cd SpotifyXGenius
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Get Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the app name and description
5. Once created, you'll see your **Client ID** and **Client Secret**
6. Click "Edit Settings"
7. Add `http://localhost:3000/callback` to the Redirect URIs
8. Save the settings

### 4. Get Genius API Token

1. Go to [Genius API Clients](https://genius.com/api-clients)
2. Sign in or create a Genius account
3. Click "New API Client"
4. Fill in the required information
5. Once created, click "Generate Access Token"
6. Copy the access token

### 5. Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` and fill in your credentials:
   ```
   REACT_APP_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   REACT_APP_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   REACT_APP_REDIRECT_URI=http://localhost:3000/callback
   REACT_APP_GENIUS_ACCESS_TOKEN=your_genius_access_token_here
   ```

### 6. Start the Application

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Usage

1. Click "Login with Spotify" to authenticate
2. Grant the necessary permissions
3. Open Spotify on any device and start playing music
4. The app will display the currently playing track
5. Lyrics will automatically load from Genius
6. Use the controls to play, pause, skip tracks
7. Search for songs using the search bar

## Important Notes

### Spotify Playback

- Requires **Spotify Premium** subscription
- You need an active Spotify session (app, web player, or device)
- The app controls your active Spotify session

### Lyrics Limitation

The Genius API doesn't provide direct lyrics access. The current implementation:
- Searches for songs on Genius
- Provides a link to view lyrics on Genius website
- Shows implementation notes for adding full lyrics

**To get full lyrics functionality**, you need to:
1. Set up a backend server (Node.js/Express)
2. Use a library like `genius-lyrics` for web scraping
3. Or integrate a dedicated lyrics API service

## Project Structure

```
SpotifyXGenius/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Player.tsx          # Music player component
│   │   ├── Player.css
│   │   ├── Lyrics.tsx          # Lyrics display component
│   │   └── Lyrics.css
│   ├── services/
│   │   ├── spotifyService.ts   # Spotify API integration
│   │   └── geniusService.ts    # Genius API integration
│   ├── App.tsx                 # Main app component
│   ├── App.css
│   ├── index.tsx
│   └── index.css
├── .env                        # Your API credentials (not in git)
├── .env.example               # Template for environment variables
├── package.json
└── README.md
```

## Technologies Used

- **React 18** with TypeScript
- **Spotify Web API** for music playback
- **Genius API** for lyrics
- **Axios** for HTTP requests
- **CSS3** for styling

## Troubleshooting

### "No track currently playing"
- Make sure Spotify is open and playing music on any device
- Ensure you have an active Spotify Premium subscription
- Check that the app has the necessary permissions

### Authentication Issues
- Verify your Spotify Client ID and Redirect URI are correct
- Make sure the Redirect URI in your .env matches the one in Spotify Dashboard
- Clear browser cache and try logging in again

### Lyrics Not Loading
- Check that your Genius Access Token is valid
- Some songs may not be available on Genius
- Network issues can prevent lyrics from loading

## Future Enhancements

- [ ] Backend server for full lyrics scraping
- [ ] Synchronized lyrics highlighting
- [ ] Playlist management
- [ ] User library integration
- [ ] Dark/light theme toggle
- [ ] Queue management
- [ ] Volume control

## License

This project is for educational purposes. Make sure to comply with Spotify and Genius API terms of service.

## Contributing

Feel free to fork this project and submit pull requests for any improvements!
