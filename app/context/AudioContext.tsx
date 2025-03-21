import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

interface Song {
  id: number;
  title: string;
  artist: string;
  image: any;
  audio: any;
  sound?: Audio.Sound;
  isPlaying?: boolean;
  position?: number;
  duration?: number;
}

interface AudioContextType {
  currentlyPlaying: number | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  currentSong: Song | null;
  playSong: (song: Song) => Promise<void>;
  pauseSong: () => Promise<void>;
  resumeSong: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  getSongStatus: (songId: number) => { isPlaying: boolean; position: number; duration: number };
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [loadedSongs, setLoadedSongs] = useState<Map<number, Song>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [lastPlayAttempt, setLastPlayAttempt] = useState<number>(0);

  useEffect(() => {
    setupAudio();
    return () => {
      cleanupAudio();
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
      Alert.alert('Error', 'Failed to set up audio playback');
    }
  };

  const cleanupAudio = async () => {
    if (sound) {
      await sound.unloadAsync();
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      // Only update position and duration if they've actually changed
      if (status.positionMillis !== position * 1000) {
        setPosition(status.positionMillis / 1000);
      }
      if (status.durationMillis !== duration * 1000) {
        setDuration(status.durationMillis / 1000);
      }
      
      // Only update isPlaying if it's actually changed
      if (status.isPlaying !== isPlaying) {
        setIsPlaying(status.isPlaying);
      }
      
      // Update the current song's status
      if (currentSong) {
        setLoadedSongs(prev => {
          const currentStatus = prev.get(currentSong.id);
          if (currentStatus && 
              currentStatus.isPlaying === status.isPlaying &&
              currentStatus.position === status.positionMillis / 1000 &&
              currentStatus.duration === status.durationMillis / 1000) {
            return prev; // No changes needed
          }
          
          const newMap = new Map(prev);
          newMap.set(currentSong.id, {
            ...currentSong,
            isPlaying: status.isPlaying,
            position: status.positionMillis / 1000,
            duration: status.durationMillis / 1000,
          });
          return newMap;
        });
      }
    }
  };

  const getSongStatus = (songId: number) => {
    const song = loadedSongs.get(songId);
    if (song) {
      return {
        isPlaying: song.isPlaying || false,
        position: song.position || 0,
        duration: song.duration || 0,
      };
    }
    return { isPlaying: false, position: 0, duration: 0 };
  };

  const playSong = async (song: Song) => {
    try {
      // Prevent rapid repeated play attempts
      const now = Date.now();
      if (now - lastPlayAttempt < 500) { // 500ms debounce
        return;
      }
      setLastPlayAttempt(now);

      // If already playing this song, don't restart
      if (currentlyPlaying === song.id && isPlaying) {
        return;
      }

      // If loading, don't start another load
      if (isLoading) {
        return;
      }

      setIsLoading(true);
      console.log('Attempting to play song:', song);
      console.log('Audio source:', song.audio);

      if (!song.audio) {
        throw new Error('Audio source is null or undefined');
      }

      // If there's already a sound playing, unload it first
      if (sound) {
        console.log('Unloading previous sound');
        await sound.unloadAsync();
      }

      // Configure audio session
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('Creating new sound with source:', song.audio);
      // Create and load the new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        song.audio,
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      console.log('Sound created successfully');
      setSound(newSound);
      setCurrentSong(song);
      setCurrentlyPlaying(song.id);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);

      // Update the song's status
      setLoadedSongs(prev => {
        const newMap = new Map(prev);
        newMap.set(song.id, {
          ...song,
          isPlaying: false,
          position: 0,
          duration: 0,
        });
        return newMap;
      });

      // Don't automatically play the sound
      // await newSound.playAsync();
    } catch (error) {
      console.error('Error playing song:', error);
      console.error('Error details:', {
        song,
        audioSource: song.audio,
        errorMessage: error.message
      });
      // Reset state on error
      setSound(null);
      setCurrentSong(null);
      setCurrentlyPlaying(null);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSong = async () => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.pauseAsync();
          setIsPlaying(false);
          
          // Update the current song's status
          if (currentSong) {
            setLoadedSongs(prev => {
              const newMap = new Map(prev);
              newMap.set(currentSong.id, {
                ...currentSong,
                isPlaying: false,
              });
              return newMap;
            });
          }
        }
      } catch (error) {
        console.error('Error pausing song:', error);
        // Reset state on error
        setSound(null);
        setCurrentSong(null);
        setCurrentlyPlaying(null);
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);
      }
    }
  };

  const resumeSong = async () => {
    if (sound && currentSong) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.playAsync();
          setIsPlaying(true);
          
          // Update the current song's status
          setLoadedSongs(prev => {
            const newMap = new Map(prev);
            newMap.set(currentSong.id, {
              ...currentSong,
              isPlaying: true,
            });
            return newMap;
          });
        } else {
          console.warn('Sound is not loaded, attempting to reload...');
          await playSong(currentSong);
        }
      } catch (error) {
        console.error('Error resuming song:', error);
        // Reset state on error
        setSound(null);
        setCurrentSong(null);
        setCurrentlyPlaying(null);
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);
      }
    }
  };

  const seekTo = async (position: number) => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.setPositionAsync(position);
        }
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };

  return (
    <AudioContext.Provider
      value={{
        currentlyPlaying,
        isPlaying,
        position,
        duration,
        currentSong,
        playSong,
        pauseSong,
        resumeSong,
        seekTo,
        getSongStatus,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export default AudioProvider;

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
} 