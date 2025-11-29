import React from 'react';
import { Music2 } from 'lucide-react';
import { getAuthUrl } from '../services/spotifyService';

const Login: React.FC = () => {
    const handleLogin = async () => {
        try {
            const authUrl = await getAuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            console.error('Login error:', error);
            alert(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return (
        <div className="login-container">
            <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <Music2 size={80} color="#1db954" />
                <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 800 }}>SpotifyXGenius</h1>
                <p style={{ fontSize: '1.2rem', color: '#b3b3b3', maxWidth: '400px', lineHeight: '1.6' }}>
                    Experience your music with synchronized lyrics and music videos.
                </p>
            </div>
            <button className="login-btn" onClick={handleLogin}>
                LOGIN WITH SPOTIFY
            </button>
        </div>
    );
};

export default Login;
