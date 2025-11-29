import React, { useState, useEffect, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import './YouTubePlayer.css';

interface YouTubePlayerProps {
    currentTrack: {
        name: string;
        artist: string;
    } | null;
    playbackData: {
        progressMs: number;
        isPlaying: boolean;
    } | null;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ currentTrack, playbackData }) => {
    const [videoId, setVideoId] = useState<string | null>(null);
    const [player, setPlayer] = useState<any>(null);
    const [isReady, setIsReady] = useState(false);
    const lastVideoId = useRef<string | null>(null);

    // Fetch YouTube video when track changes
    useEffect(() => {
        const fetchVideo = async () => {
            if (!currentTrack) {
                setVideoId(null);
                setPlayer(null);
                setIsReady(false);
                return;
            }

            const trackKey = `${currentTrack.artist}-${currentTrack.name}`;
            if (trackKey === lastVideoId.current) return;

            try {
                const response = await fetch(
                    `http://localhost:5000/api/youtube?artist=${encodeURIComponent(currentTrack.artist)}&title=${encodeURIComponent(currentTrack.name)}`
                );

                // Mark this track as fetched regardless of outcome to prevent infinite retries
                lastVideoId.current = trackKey;

                if (response.ok) {
                    const data = await response.json();
                    // Reset player state before changing video ID to prevent using old player
                    setPlayer(null);
                    setIsReady(false);
                    setVideoId(data.videoId);
                } else {
                    console.error('Failed to fetch YouTube video');
                    setVideoId(null);
                    setPlayer(null);
                    setIsReady(false);
                }
            } catch (error) {
                console.error('Error fetching YouTube video:', error);
                setVideoId(null);
                setPlayer(null);
                setIsReady(false);
                lastVideoId.current = trackKey; // Also mark as fetched on network error
            }
        };

        fetchVideo();
    }, [currentTrack]);

    // Sync player with Spotify
    useEffect(() => {
        if (!player || !isReady || !playbackData) return;

        // Safety check: ensure iframe exists
        try {
            // Some versions of react-youtube/API might not expose getIframe directly or it might be null
            if (typeof player.getIframe === 'function') {
                const iframe = player.getIframe();
                if (!iframe) return;
            }
        } catch (e) {
            return;
        }

        const { progressMs, isPlaying } = playbackData;

        try {
            const playerTime = player.getCurrentTime(); // in seconds
            const spotifyTime = progressMs / 1000; // convert to seconds

            // Sync play/pause state
            const playerState = player.getPlayerState();
            // 1 = playing, 2 = paused

            if (isPlaying && playerState !== 1) {
                player.playVideo();
            } else if (!isPlaying && playerState === 1) {
                player.pauseVideo();
            }

            // Sync time if drift is > 2 seconds
            if (Math.abs(playerTime - spotifyTime) > 2) {
                player.seekTo(spotifyTime, true);
            }
        } catch (error) {
            console.warn('Error syncing YouTube player:', error);
        }

    }, [playbackData, player, isReady]);

    const onReady: YouTubeProps['onReady'] = (event) => {
        setPlayer(event.target);
        setIsReady(true);
        event.target.mute(); // Mute by default to avoid audio clash
    };

    const onError: YouTubeProps['onError'] = (event) => {
        console.error('YouTube Player Error:', event.data);
        // Error 101 or 150 means video owner blocked embedding
        if (event.data === 101 || event.data === 150) {
            console.warn('Video owner has blocked embedding for this video.');
        }
    };

    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin,
        },
    };

    return (
        <div className="youtube-player-container">
            {videoId ? (
                <YouTube
                    videoId={videoId}
                    opts={opts}
                    onReady={onReady}
                    onError={onError}
                    className="youtube-iframe"
                    iframeClassName="youtube-iframe"
                />
            ) : (
                <div className="youtube-placeholder">
                    <h3>No Video Available</h3>
                    <p>Play a song on Spotify to see the music video.</p>
                </div>
            )}
        </div>
    );
};

export default YouTubePlayer;
