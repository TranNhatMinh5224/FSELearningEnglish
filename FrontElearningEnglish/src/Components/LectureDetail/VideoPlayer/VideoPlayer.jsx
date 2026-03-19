import React, { useRef, useState, useCallback } from "react";
import { FaPlay, FaPause, FaExpand, FaVolumeUp, FaVolumeMute, FaClock } from "react-icons/fa";
import "./VideoPlayer.css";

/**
 * VideoPlayer Component
 * Modern video player with custom controls for lecture videos
 */
export default function VideoPlayer({
    mediaUrl,
    title,
    duration,
    onProgress,
    onComplete
}) {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(duration || 0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Format time to mm:ss
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Play/Pause toggle
    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying]);

    // Handle time update
    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            setCurrentTime(current);

            // Callback for progress tracking
            if (onProgress && videoDuration > 0) {
                const progress = (current / videoDuration) * 100;
                onProgress(progress, current);
            }
        }
    }, [onProgress, videoDuration]);

    // Handle video loaded
    const handleLoadedMetadata = useCallback(() => {
        if (videoRef.current) {
            setVideoDuration(videoRef.current.duration);
        }
    }, []);

    // Handle video ended
    const handleEnded = useCallback(() => {
        setIsPlaying(false);
        if (onComplete) {
            onComplete();
        }
    }, [onComplete]);

    // Handle seek
    const handleSeek = useCallback((e) => {
        if (videoRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const newTime = pos * videoDuration;
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    }, [videoDuration]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    }, [isMuted]);

    // Handle volume change
    const handleVolumeChange = useCallback((e) => {
        const newVolume = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    }, []);

    // Toggle fullscreen
    const toggleFullscreen = useCallback(() => {
        const container = document.querySelector('.video-player-container');
        if (container) {
            if (!isFullscreen) {
                if (container.requestFullscreen) {
                    container.requestFullscreen();
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
            setIsFullscreen(!isFullscreen);
        }
    }, [isFullscreen]);

    // Progress percentage
    const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

    if (!mediaUrl) {
        return (
            <div className="video-player-empty">
                <FaPlay className="empty-icon" />
                <p>Video chưa được tải lên</p>
            </div>
        );
    }

    return (
        <div
            className={`video-player-container ${isFullscreen ? 'fullscreen' : ''}`}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                className="video-element"
                src={mediaUrl}
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                preload="metadata"
            />

            {/* Play overlay (shown when paused) */}
            {!isPlaying && (
                <div className="video-play-overlay" onClick={togglePlay}>
                    <div className="play-button-large">
                        <FaPlay />
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className={`video-controls ${showControls ? 'visible' : 'hidden'}`}>
                {/* Progress bar */}
                <div className="progress-bar-container" onClick={handleSeek}>
                    <div className="progress-bar-track">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${progress}%` }}
                        />
                        <div
                            className="progress-bar-thumb"
                            style={{ left: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Control buttons */}
                <div className="controls-row">
                    <div className="controls-left">
                        {/* Play/Pause */}
                        <button className="control-btn" onClick={togglePlay}>
                            {isPlaying ? <FaPause /> : <FaPlay />}
                        </button>

                        {/* Volume */}
                        <button className="control-btn" onClick={toggleMute}>
                            {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
                        </button>
                        <input
                            type="range"
                            className="volume-slider"
                            min="0"
                            max="1"
                            step="0.1"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                        />

                        {/* Time display */}
                        <span className="time-display">
                            <FaClock className="time-icon" />
                            {formatTime(currentTime)} / {formatTime(videoDuration)}
                        </span>
                    </div>

                    <div className="controls-right">
                        {/* Fullscreen */}
                        <button className="control-btn" onClick={toggleFullscreen}>
                            <FaExpand />
                        </button>
                    </div>
                </div>
            </div>

            {/* Video title overlay */}
            {title && showControls && (
                <div className="video-title-overlay">
                    {title}
                </div>
            )}
        </div>
    );
}
