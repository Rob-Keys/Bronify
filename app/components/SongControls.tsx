import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';
import { useMusic } from '@/app/context/MusicContext';
import { Ionicons } from '@expo/vector-icons';

interface SongControlsProps {
  songId?: number; // Optional song ID to check if this is the current song
  onSkip?: () => void;
  onRestart?: () => void;
  showProgress?: boolean; // Whether to show a progress bar
}

const SongControls: React.FC<SongControlsProps> = ({
  songId,
  onSkip,
  onRestart,
  showProgress = false,
}) => {
  const { colors } = useTheme();
  const { isPlaying, togglePlayPause, currentSong, progress, duration, seekTo } = useMusic();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef<boolean>(true);
  
  // Check if this is the current song
  const isCurrentSong = currentSong?.id === songId;
  const songIsPlaying = isCurrentSong && isPlaying;
  
  // Update local progress state for smooth UI updates
  useEffect(() => {
    if (isCurrentSong) {
      // For the first song, be more aggressive with updates
      if (isFirstRender.current && isPlaying) {
        console.log('First song playback detected in SongControls');
        // Always update immediately for the first song
        setDisplayProgress(progress);
        
        // Create a timer that increments progress slightly every 100ms for smoother UI
        if (!progressTimerRef.current && duration > 0) {
          progressTimerRef.current = setInterval(() => {
            setDisplayProgress(prev => {
              // Never exceed actual progress (stay slightly behind)
              const safeProgress = Math.min(prev + 0.05, progress);
              return safeProgress;
            });
          }, 100);
          
          isFirstRender.current = false;
        }
      } else {
        // Throttle updates for better performance
        const now = Date.now();
        if (now - lastUpdateTime > 100) {
          setDisplayProgress(progress);
          setLastUpdateTime(now);
        }
      }
    } else {
      // Reset progress when not the current song
      setDisplayProgress(0);
    }
    
    // Cleanup timer on unmount or song change
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [progress, isCurrentSong, lastUpdateTime, isPlaying, duration]);
  
  // Reset first render flag when song changes
  useEffect(() => {
    if (currentSong) {
      isFirstRender.current = true;
      console.log('Song changed, resetting first render flag');
    }
    
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [currentSong?.id]);
  
  const handlePlayPause = () => {
    if (isCurrentSong) {
      togglePlayPause();
    } else if (songId !== undefined) {
      // If we have a songId, we should be able to play it
      // But this would require having the song object
      console.log('Cannot play song - need full song object');
    } else {
      // Just toggle whatever is currently playing
      togglePlayPause();
    }
  };
  
  // Calculate progress percentage for the progress bar
  // Ensure we don't attempt to calculate when duration is zero
  const progressPercentage = isCurrentSong && duration > 0 
    ? (displayProgress / duration) * 100 
    : 0;
  
  // Log duration on changes if this is the active song
  useEffect(() => {
    if (isCurrentSong && duration > 0) {
      console.log(`SongControls: Duration updated to ${duration.toFixed(2)}s`);
    }
  }, [duration, isCurrentSong]);
  
  // Additional logging for debug
  useEffect(() => {
    if (isCurrentSong && songIsPlaying && Math.floor(displayProgress) % 5 === 0 && displayProgress > 0) {
      console.log(`SongControls display progress: ${displayProgress.toFixed(2)}s / ${duration.toFixed(2)}s (${progressPercentage.toFixed(1)}%)`);
    }
  }, [displayProgress, isCurrentSong, songIsPlaying, duration, progressPercentage]);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {showProgress && (
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                backgroundColor: colors.neutral,
                width: '100%'
              }
            ]} 
          />
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.button,
                width: duration > 0 ? `${progressPercentage}%` : '0%'
              }
            ]} 
          />
        </View>
      )}
      
      <View style={styles.controlsContainer}>
        {onRestart && (
          <TouchableOpacity onPress={onRestart} style={[styles.button, { backgroundColor: colors.button }]}>
            <Ionicons name="refresh" size={24} color={colors.background} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity onPress={handlePlayPause} style={[styles.button, { backgroundColor: colors.button }]}>
          <Ionicons 
            name={songIsPlaying ? "pause" : "play"} 
            size={24} 
            color={colors.background}
          />
        </TouchableOpacity>
        
        {onSkip && (
          <TouchableOpacity onPress={onSkip} style={[styles.button, { backgroundColor: colors.button }]}>
            <Ionicons name="play-skip-forward" size={24} color={colors.background} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarContainer: {
    width: '100%',
    height: 3,
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    opacity: 0.3,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SongControls;
