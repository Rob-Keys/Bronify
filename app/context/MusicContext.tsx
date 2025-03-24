import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { AppState, AppStateStatus } from 'react-native';
import { Alert } from 'react-native';

// Define constants for the Audio module that might not be available in this version
const INTERRUPTION_MODE_IOS_DO_NOT_MIX = 1;
const INTERRUPTION_MODE_ANDROID_DO_NOT_MIX = 1;

// Audio quality constants
const AUDIO_QUALITY_HIGH = 16000 * 48; // High quality bitrate

interface Song {
  id: number;
  title: string;
  artist: string;
  image: any;
  audio: any;
  isLiked?: boolean;
  progress?: number;
  isPlaying?: boolean;
  duration?: number;
}

interface Playlist {
  id: number;
  name: string;
  songs: Song[];
}

interface SongState {
  song: Song;
  sound: Audio.Sound;
  isPlaying: boolean;
  progress: number;
  duration: number;
}

interface MusicContextType {
  likedSongs: Song[];
  playlists: Playlist[];
  queue: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  toggleLike: (song: Song) => void;
  addToPlaylist: (song: Song, playlistId: number) => void;
  removeFromPlaylist: (songId: number, playlistId: number) => void;
  createPlaylist: (name: string) => void;
  deletePlaylist: (playlistId: number) => void;
  updatePlaylistName: (playlistId: number, newName: string) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: number) => void;
  playSong: (song: Song) => void;
  togglePlayPause: () => void;
  playPlaylist: (playlistId: number, startIndex?: number, shuffle?: boolean) => void;
  reorderPlaylist: (playlistId: number, fromIndex: number, toIndex: number) => void;
  currentPlaylistId: number | null;
  playlistOrder: number[];
  getSongWithState: (song: Song) => Song;
  getSavedProgress: (songId: number) => Promise<number>;
  saveSongProgress: (songId: number, position: number) => Promise<void>;
  seekTo: (position: number) => Promise<void>;
}

export const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Singleton to manage song instances
class SongManager {
  private static instance: SongManager;
  private songs: { [key: number]: Song } = {};

  private constructor() {}

  static getInstance(): SongManager {
    if (!SongManager.instance) {
      SongManager.instance = new SongManager();
    }
    return SongManager.instance;
  }

  getSong(song: Song): Song {
    if (!this.songs[song.id]) {
      this.songs[song.id] = {
        ...song,
        progress: 0,
        isPlaying: false,
        duration: 0
      };
    }
    return this.songs[song.id];
  }

  updateSong(songId: number, updates: Partial<Song>) {
    if (this.songs[songId]) {
      this.songs[songId] = {
        ...this.songs[songId],
        ...updates
      };
    }
  }

  clearSong(songId: number) {
    delete this.songs[songId];
  }
}

// Interface for persisted song progress data
interface SongProgress {
  songId: number;
  position: number;
  timestamp: number;
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: 1, name: 'Favorites', songs: [] },
    { id: 2, name: 'Workout Mix', songs: [] },
    { id: 3, name: 'Chill Vibes', songs: [] },
  ]);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentSongState, setCurrentSongState] = useState<SongState | null>(null);
  const [soundObjects, setSoundObjects] = useState<{ [key: number]: Audio.Sound }>({});
  const [currentPlaylistId, setCurrentPlaylistId] = useState<number | null>(null);
  const [playlistOrder, setPlaylistOrder] = useState<number[]>([]);
  const songManager = SongManager.getInstance();

  // Add reference to track app state changes
  const appState = useRef(AppState.currentState);
  // Add progress save interval
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);

  // Add a loading state to prevent multiple playback attempts
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  // Add a buffer state to track when audio is buffering
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  // Add a ref to track initialization
  const isAudioInitialized = useRef<boolean>(false);

  // Add a ref to track if this is the very first song played
  const isFirstSongAfterReload = useRef<boolean>(true);
  const progressUpdateTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize Audio module on mount with optimized settings
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        if (isAudioInitialized.current) {
          return; // Prevent duplicate initialization
        }
        
        console.log('Initializing audio system with optimized settings...');
        
        // Configure audio with optimized settings for better quality
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          allowsRecordingIOS: false,
          interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        });
        
        isAudioInitialized.current = true;
        console.log('Audio system initialized successfully with optimized settings');
      } catch (error) {
        console.error('Error initializing audio module:', error);
        // Try one more time after a brief delay
        setTimeout(() => {
          Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
            allowsRecordingIOS: false,
            interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
            interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          }).catch(err => console.error('Error in retry of audio initialization:', err));
        }, 500);
      }
    };
    
    initializeAudio();
    
    // Preload the most likely-to-be-played songs
    preloadTopSongs();
    
    // Cleanup all sounds on unmount with improved approach
    return () => {
      console.log('Cleaning up audio resources with improved approach...');
      
      try {
        // Stop current song if it exists
        if (currentSongState?.sound) {
          currentSongState.sound.stopAsync()
            .then(() => currentSongState.sound.unloadAsync())
            .catch(error => console.error('Error cleaning up current song:', error));
        }
        
        // Stop all other sound objects
        Object.values(soundObjects).forEach(sound => {
          sound.stopAsync()
            .then(() => sound.unloadAsync())
            .catch(error => console.error('Error cleaning up sound:', error));
        });
        
        // Reset the audio module cleanly
        Audio.setIsEnabledAsync(false)
          .then(() => Audio.setIsEnabledAsync(true))
          .catch(err => console.error('Error resetting audio module:', err));
      } catch (error) {
        console.error('Error in audio cleanup:', error);
      }
      
      if (progressUpdateTimer.current) {
        clearInterval(progressUpdateTimer.current);
        progressUpdateTimer.current = null;
      }
    };
  }, []);

  // Preload common songs to avoid delay on first play
  const preloadTopSongs = async () => {
    // We'll only preload songs that are explicitly passed into the preloader
    // Instead of trying to reference songs by ID that may not exist yet
    console.log('Skipping automatic preloading to avoid errors');
    
    // The proper way to preload is to call this function manually
    // once you have actual song objects:
    // preloadSong(actualSongObject)
  };
  
  // Helper function to preload a specific song (safer approach)
  const preloadSong = async (song: Song) => {
    if (!song || !song.audio) {
      console.log('Cannot preload song with missing audio source');
      return;
    }
    
    try {
      console.log(`Attempting to preload song: ${song.title}`);
      
      // Check if this song is already loaded
      if (soundObjects[song.id]) {
        try {
          const status = await soundObjects[song.id].getStatusAsync();
          if (status.isLoaded) {
            console.log(`Song ${song.id} already preloaded`);
            
            // Log duration for diagnostic purposes
            if (status.durationMillis) {
              console.log(`Preloaded song ${song.id} duration: ${(status.durationMillis / 1000).toFixed(2)}s`);
            }
            
            return; // Already loaded
          }
        } catch (statusError) {
          console.log('Error checking preloaded song status:', statusError);
        }
        
        // Clean up if not properly loaded
        await soundObjects[song.id].unloadAsync().catch(e => console.log('Cleanup error:', e));
      }
      
      // Create an AbortController with a timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Preload timeout reached (8s), aborting preload');
        controller.abort();
      }, 8000); // 8 second timeout for preloading (slightly shorter than playback)
      
      try {
        // Create a new sound object with optimized settings
        const { sound } = await Promise.race([
          Audio.Sound.createAsync(
            song.audio,
            { 
              shouldPlay: false,
              progressUpdateIntervalMillis: 100,
              volume: 1.0,
              rate: 1.0,
            },
            onPlaybackStatusUpdate
          ),
          new Promise<never>((_, reject) => {
            // Listen for abort signal
            controller.signal.addEventListener('abort', () => {
              reject(new Error('Preloading timed out after 8 seconds'));
            });
          })
        ]);
        
        // Clear the timeout since loading succeeded
        clearTimeout(timeoutId);
        
        // Store for later use
        setSoundObjects(prev => ({
          ...prev,
          [song.id]: sound
        }));
        
        // Try to get the duration after loading
        try {
          const initialStatus = await sound.getStatusAsync();
          if (initialStatus.isLoaded && initialStatus.durationMillis) {
            const duration = initialStatus.durationMillis / 1000;
            console.log(`Preloaded song ${song.id} duration: ${duration.toFixed(2)}s`);
            
            // If this song is currently playing, update its duration
            if (currentSongState?.song.id === song.id && currentSongState.duration === 0) {
              setCurrentSongState(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  duration
                };
              });
            }
          } else {
            console.log(`Could not get duration for preloaded song ${song.id}`);
          }
        } catch (durationError) {
          console.error('Error getting duration for preloaded song:', durationError);
        }
        
        console.log(`Successfully preloaded song: ${song.title}`);
      } catch (preloadError) {
        // Clear the timeout to prevent memory leaks
        clearTimeout(timeoutId);
        
        if (preloadError instanceof Error && preloadError.message.includes('timed out')) {
          console.log(`Preloading timed out for song: ${song.title}`);
        } else {
          console.error(`Error preloading song ${song.title}:`, preloadError);
        }
      }
    } catch (err) {
      console.error(`Error in preload process for song ${song.title}:`, err);
    }
  };

  // Handle app state changes to save progress when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App is going to background, save progress
        if (currentSongState) {
          saveSongProgress(
            currentSongState.song.id, 
            currentSongState.progress
          );
        }
      }
      
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [currentSongState]);
  
  // Set up interval to periodically save progress for currently playing song
  useEffect(() => {
    // Clear any existing interval
    if (progressSaveInterval.current) {
      clearInterval(progressSaveInterval.current);
      progressSaveInterval.current = null;
    }
    
    // Only set up interval if there's a song playing
    if (currentSongState?.isPlaying) {
      progressSaveInterval.current = setInterval(() => {
        saveSongProgress(
          currentSongState.song.id,
          currentSongState.progress
        );
      }, 5000); // Save every 5 seconds
    }
    
    return () => {
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current);
      }
    };
  }, [currentSongState?.isPlaying, currentSongState?.song.id]);

  // Load saved state on mount
  useEffect(() => {
    loadSavedState();
  }, []);

  // Save state when it changes
  useEffect(() => {
    saveState();
  }, [likedSongs, playlists, queue]);

  const loadSavedState = async () => {
    try {
      const savedLikedSongs = await AsyncStorage.getItem('likedSongs');
      const savedPlaylists = await AsyncStorage.getItem('playlists');
      const savedQueue = await AsyncStorage.getItem('queue');

      if (savedLikedSongs) {
        setLikedSongs(JSON.parse(savedLikedSongs));
      }
      if (savedPlaylists) {
        setPlaylists(JSON.parse(savedPlaylists));
      }
      if (savedQueue) {
        setQueue(JSON.parse(savedQueue));
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  };

  const saveState = async () => {
    try {
      await AsyncStorage.setItem('likedSongs', JSON.stringify(likedSongs));
      await AsyncStorage.setItem('playlists', JSON.stringify(playlists));
      await AsyncStorage.setItem('queue', JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  const toggleLike = (song: Song) => {
    setLikedSongs(prev => {
      const isLiked = prev.some(s => s.id === song.id);
      if (isLiked) {
        return prev.filter(s => s.id !== song.id);
      } else {
        return [...prev, { ...song, isLiked: true }];
      }
    });
  };

  const addToPlaylist = (song: Song, playlistId: number) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        if (!playlist.songs.some(s => s.id === song.id)) {
          return {
            ...playlist,
            songs: [...playlist.songs, song]
          };
        }
      }
      return playlist;
    }));
  };

  const createPlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now(), // Use timestamp as unique ID
      name,
      songs: []
    };
    setPlaylists(prev => [...prev, newPlaylist]);
  };

  const removeFromPlaylist = (songId: number, playlistId: number) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          songs: playlist.songs.filter(s => s.id !== songId)
        };
      }
      return playlist;
    }));
  };

  const addToQueue = (song: Song) => {
    setQueue(prev => {
      if (!prev.some(s => s.id === song.id)) {
        return [...prev, song];
      }
      return prev;
    });
  };

  const removeFromQueue = (songId: number) => {
    setQueue(prev => prev.filter(s => s.id !== songId));
  };

  const deletePlaylist = (playlistId: number) => {
    setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
  };

  const updatePlaylistName = (playlistId: number, newName: string) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          name: newName
        };
      }
      return playlist;
    }));
  };

  const playPlaylist = async (playlistId: number, startIndex: number = 0, shuffle: boolean = false) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist || playlist.songs.length === 0) {
        console.log('Playlist is empty or not found');
        return;
      }

      console.log(`Playing playlist: ${playlist.name}, starting from index ${startIndex}, shuffle: ${shuffle}`);

      // First explicitly stop all currently playing sounds
      await stopAllSounds();

      // Create playlist order
      let order = Array.from({ length: playlist.songs.length }, (_, i) => i);
      if (shuffle) {
        order = order.sort(() => Math.random() - 0.5);
      }

      // Set playlist context
      setCurrentPlaylistId(playlistId);
      setPlaylistOrder(order);

      // Get the song to play
      const songToPlay = playlist.songs[order[startIndex]];
      
      // Clear any previous state before playing
      setCurrentSongState(null);
      
      // Play the first song
      await playSong(songToPlay);
      
      console.log(`Started playing song: ${songToPlay.title} from playlist: ${playlist.name}`);
    } catch (error) {
      console.error('Error playing playlist:', error);
    }
  };

  const reorderPlaylist = (playlistId: number, fromIndex: number, toIndex: number) => {
    setPlaylists(prevPlaylists => {
      return prevPlaylists.map(playlist => {
        if (playlist.id === playlistId) {
          const newSongs = [...playlist.songs];
          const [movedSong] = newSongs.splice(fromIndex, 1);
          newSongs.splice(toIndex, 0, movedSong);
          return { ...playlist, songs: newSongs };
        }
        return playlist;
      });
    });
  };

  const getSongWithState = (song: Song): Song => {
    return songManager.getSong(song);
  };

  const updateSongState = (songId: number, updates: Partial<Song>) => {
    songManager.updateSong(songId, updates);
    if (currentSongState?.song.id === songId) {
      setCurrentSongState(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) {
      // If the sound is not loaded, don't update anything
      return;
    }
    
    // Convert status to proper type for better handling
    const audioStatus = status as {
      isLoaded: true;
      positionMillis: number;
      durationMillis?: number;
      isPlaying: boolean;
      didJustFinish?: boolean;
      isBuffering?: boolean;
      rate?: number;
      volume?: number;
    };
    
    // Track buffering state
    if (audioStatus.isBuffering !== undefined && currentSongState) {
      setIsBuffering(audioStatus.isBuffering);
      
      // If it's buffering too long, try to recover playback
      if (audioStatus.isBuffering) {
        // Set a timeout to check if still buffering after 3 seconds
        setTimeout(() => {
          if (isBuffering && currentSongState?.sound) {
            // Try to pause and resume to fix buffering issues
            currentSongState.sound.playFromPositionAsync(audioStatus.positionMillis)
              .catch(err => console.error('Error recovering from buffer stall:', err));
          }
        }, 3000);
      }
    }
    
    // Handle song finishing
    if (audioStatus.didJustFinish) {
      console.log('Song finished playing');
      
      if (currentSongState) {
        // Clear saved progress since song finished
        try {
          AsyncStorage.removeItem(`songProgress_${currentSongState.song.id}`);
        } catch (error) {
          console.error('Error removing finished song progress:', error);
        }
        
        setCurrentSongState(prev => prev ? {
          ...prev,
          isPlaying: false,
          progress: 0
        } : null);
      }
      return;
    }
    
    // Only update if we have a current song playing
    if (currentSongState) {
      const newProgress = audioStatus.positionMillis / 1000;
      
      // Ensure we always get the duration if available
      let newDuration = currentSongState.duration;
      if (audioStatus.durationMillis && audioStatus.durationMillis > 0) {
        newDuration = audioStatus.durationMillis / 1000;
      }
      
      // Always update playback progress to ensure the progress bar moves
      // We'll only limit updates if position hasn't changed at all to prevent excessive rendering
      const hasProgressChanged = Math.abs(newProgress - currentSongState.progress) > 0.01;
      const hasDurationChanged = newDuration > 0 && Math.abs(newDuration - currentSongState.duration) > 0.1;
      const hasPlayStateChanged = audioStatus.isPlaying !== currentSongState.isPlaying;
      
      // Always update if we have a valid duration but the current duration is 0
      const shouldUpdateDuration = newDuration > 0 && currentSongState.duration === 0;
      
      // Create a fixed interval for progress updates to ensure smooth progression
      // Update every ~250ms during playback for optimal UI experience
      const shouldUpdateForInterval = audioStatus.isPlaying && (Math.floor(newProgress * 4) > Math.floor(currentSongState.progress * 4));
      
      // Update state if any relevant changes or we've hit our update interval
      if (hasProgressChanged || hasDurationChanged || hasPlayStateChanged || shouldUpdateDuration || shouldUpdateForInterval) {
        // Only log significant updates to avoid console spam
        if (hasDurationChanged || hasPlayStateChanged || shouldUpdateDuration || 
            Math.abs(newProgress - currentSongState.progress) > 1) {
          console.log(`Updating song state - progress: ${newProgress.toFixed(2)}s, duration: ${newDuration.toFixed(2)}s`);
        }
        
        setCurrentSongState(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            isPlaying: audioStatus.isPlaying,
            progress: newProgress,
            duration: newDuration
          };
        });
      }
    }
  };

  const getOrCreateSound = async (song: Song): Promise<Audio.Sound> => {
    try {
      // If we have a sound object for this song, check if it's loaded properly
      if (soundObjects[song.id]) {
        try {
          const status = await soundObjects[song.id].getStatusAsync();
          if (status.isLoaded) {
            // Sound is already loaded properly, return it
            return soundObjects[song.id];
          }
          
          // If it's not loaded correctly, unload it and recreate
          await soundObjects[song.id].unloadAsync();
        } catch (error) {
          console.error('Error checking sound status:', error);
          // Will fall through to recreate the sound
        }
      }

      // Create an AbortController with a timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Sound creation timeout reached (10s), aborting');
        controller.abort();
      }, 10000); // 10 second timeout
      
      try {
        // Create a new sound object with improved settings
        const { sound } = await Promise.race([
          Audio.Sound.createAsync(
            song.audio,
            { 
              shouldPlay: false,
              progressUpdateIntervalMillis: 100, // More frequent updates for smoother UI
              // Higher quality playback settings
              androidImplementation: 'MediaPlayer',
              volume: 1.0,
              rate: 1.0,
              // Set initial buffering settings
            },
            onPlaybackStatusUpdate
          ),
          new Promise<never>((_, reject) => {
            // Listen for abort signal
            controller.signal.addEventListener('abort', () => {
              reject(new Error('Sound creation timed out after 10 seconds'));
            });
          })
        ]);
        
        // Clear the timeout since sound creation succeeded
        clearTimeout(timeoutId);

        // Store the sound object
        setSoundObjects(prev => ({
          ...prev,
          [song.id]: sound
        }));

        return sound;
      } catch (createError) {
        // Clear the timeout to prevent memory leaks
        clearTimeout(timeoutId);
        
        if (createError instanceof Error && createError.message.includes('timed out')) {
          console.log(`Sound creation timed out for song: ${song.title}`);
        }
        throw createError; // Re-throw to let the caller handle it
      }
    } catch (error) {
      console.error('Error creating sound object:', error);
      throw error;
    }
  };

  const stopAllSounds = async () => {
    console.log('Stopping all sounds');
    
    try {
      // Set loading state to prevent new plays during cleanup
      setIsLoadingAudio(true);
      
      // Create an array to hold all stop/unload promises
      const stopPromises = [];
      
      // Stop and unload current song first if it exists
      if (currentSongState?.sound) {
        try {
          console.log('Stopping current song:', currentSongState.song.title);
          stopPromises.push(
            currentSongState.sound.stopAsync()
              .then(() => currentSongState.sound.unloadAsync())
              .catch(err => console.error('Error stopping current song:', err))
          );
        } catch (error) {
          console.error('Error stopping current song:', error);
        }
      }
      
      // Stop and unload all other sound objects
      for (const id in soundObjects) {
        if (currentSongState?.song.id !== Number(id)) {
          try {
            console.log(`Stopping sound object ${id}`);
            stopPromises.push(
              soundObjects[id].stopAsync()
                .then(() => soundObjects[id].unloadAsync())
                .catch(err => console.error(`Error stopping sound ${id}:`, err))
            );
          } catch (error) {
            console.error(`Error stopping sound ${id}:`, error);
          }
        }
      }
      
      // Wait for all stop/unload operations to complete
      await Promise.all(stopPromises);
      
      // Reset the state after ensuring all sounds are stopped
      setCurrentSongState(null);
      setSoundObjects({});
      
      // Final cleanup: ensure the Audio module is reset
      try {
        // Only try to reset Audio if needed (disabled)
        const audioStatus = await Audio.getPermissionsAsync();
        if (!audioStatus.granted) {
          await Audio.setIsEnabledAsync(false);
          await new Promise(resolve => setTimeout(resolve, 100));
          await Audio.setIsEnabledAsync(true);
        }
      } catch (resetError) {
        console.error('Error resetting Audio module:', resetError);
      }
      
      console.log('All sounds stopped and audio reset');
    } catch (error) {
      console.error('Error in stopAllSounds:', error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Save song progress to AsyncStorage
  const saveSongProgress = async (songId: number, position: number) => {
    try {
      if (position <= 0) return; // Don't save if at the beginning
      
      const progressData: SongProgress = {
        songId,
        position,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(`songProgress_${songId}`, JSON.stringify(progressData));
      console.log(`Saved progress for song ${songId}: ${position.toFixed(2)}s`);
    } catch (error) {
      console.error('Error saving song progress:', error);
    }
  };
  
  // Reset saved progress to prevent the progress bar from jumping
  const resetSavedProgress = async (songId: number) => {
    try {
      // Remove any saved progress for this song
      await AsyncStorage.removeItem(`songProgress_${songId}`);
      console.log(`Reset saved progress for song ${songId}`);
    } catch (error) {
      console.error('Error resetting song progress:', error);
    }
  };

  // Get saved progress for a song
  const getSavedProgress = async (songId: number): Promise<number> => {
    try {
      // For the first play after app reload, we'll start from the beginning
      // to prevent progress bar jumping issues
      const isFirstPlay = !currentSongState;
      if (isFirstPlay) {
        // Clear any saved progress to ensure we start from the beginning
        await resetSavedProgress(songId);
        return 0;
      }
      
      const savedData = await AsyncStorage.getItem(`songProgress_${songId}`);
      if (savedData) {
        const progressData: SongProgress = JSON.parse(savedData);
        
        // Check if the saved progress is still relevant (within 7 days)
        const now = Date.now();
        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
        
        if (now - progressData.timestamp < ONE_WEEK) {
          console.log(`Restored progress for song ${songId}: ${progressData.position.toFixed(2)}s`);
          return progressData.position;
        } else {
          // Data is too old, remove it
          AsyncStorage.removeItem(`songProgress_${songId}`);
        }
      }
    } catch (error) {
      console.error('Error getting saved song progress:', error);
    }
    
    return 0; // Default to start from beginning
  };

  // Update song duration explicitly - useful for ensuring duration is set correctly
  const updateSongDuration = async (sound: Audio.Sound) => {
    if (!sound || !currentSongState) return;
    
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.durationMillis && status.durationMillis > 0) {
        const updatedDuration = status.durationMillis / 1000;
        
        // Only update if we have a new duration
        if (currentSongState.duration === 0 || Math.abs(updatedDuration - currentSongState.duration) > 0.5) {
          console.log(`Explicitly updating duration to: ${updatedDuration.toFixed(2)}s`);
          
          setCurrentSongState(prev => {
            if (!prev) return null;
            return {
              ...prev,
              duration: updatedDuration
            };
          });
        }
      } else {
        console.log('Could not get duration from status, will retry later');
      }
    } catch (error) {
      console.error('Error updating song duration:', error);
    }
  };

  const playSong = async (song: Song) => {
    try {
      // Prevent multiple simultaneous calls
      if (isLoadingAudio) {
        console.log('Already loading audio, ignoring request');
        return;
      }
      
      console.log('Attempting to play song:', song.title);
      setIsLoadingAudio(true);
      
      // If this is the same song that's already playing, just toggle play/pause
      if (currentSongState?.song.id === song.id) {
        console.log('Toggling play/pause on current song');
        if (currentSongState.isPlaying) {
          await currentSongState.sound.pauseAsync();
          setCurrentSongState(prev => prev ? { ...prev, isPlaying: false } : null);
          
          // Save progress when pausing
          saveSongProgress(song.id, currentSongState.progress);
        } else {
          // Resume with improved fade-in
          await currentSongState.sound.setVolumeAsync(0.6);
          await currentSongState.sound.playAsync();
          
          // Gradually increase volume to full
          setTimeout(() => {
            currentSongState.sound.setVolumeAsync(1.0)
              .catch(e => console.error('Error setting volume on resume:', e));
          }, 50);
          
          setCurrentSongState(prev => prev ? { ...prev, isPlaying: true } : null);
        }
        setIsLoadingAudio(false);
        return;
      }

      console.log('Playing new song, stopping all current sounds first');
      
      // Save progress of current song before stopping
      if (currentSongState?.song) {
        saveSongProgress(currentSongState.song.id, currentSongState.progress);
      }
      
      // Clean up any existing progress update timer
      if (progressUpdateTimer.current) {
        clearInterval(progressUpdateTimer.current);
        progressUpdateTimer.current = null;
      }
      
      // Use the enhanced stopAllSounds to ensure complete cleanup
      await stopAllSounds();
      
      // Configure audio mode again to ensure clean state if needed
      if (!isAudioInitialized.current) {
        try {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
            allowsRecordingIOS: false,
            interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
            interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          });
          isAudioInitialized.current = true;
        } catch (initError) {
          console.error('Error initializing audio:', initError);
          // Continue anyway - we'll try to play the song
        }
      }

      // Always reset saved progress for any new song to ensure consistent behavior
      await resetSavedProgress(song.id);
      const startPosition = 0; // Always start from the beginning
      const startPositionMillis = 0;
      
      console.log(`Starting song from position: ${startPosition.toFixed(2)}s`);
      console.log('Creating or reusing sound object with optimized settings');
      
      // NEW: Ensure we have a clean state for the new playback
      let newSound: Audio.Sound | null = null;
      
      // Create an AbortController with a timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Audio loading timeout reached (10s), aborting load');
        controller.abort();
      }, 10000); // 10 second timeout
      
      try {
        // First, try to fully unload any existing instance of this song
        if (soundObjects[song.id]) {
          try {
            await soundObjects[song.id].stopAsync();
            await soundObjects[song.id].unloadAsync();
          } catch (unloadError) {
            console.log('Non-critical error unloading existing sound:', unloadError);
            // Continue - we'll create a new sound instance
          }
        }
      
        // Create a new sound object with minimal initial settings
        // Pass the AbortController signal if the Audio API supports it
        console.log('Starting audio load with timeout protection');
        const loadOptions = { shouldPlay: false, volume: 0 }; // Start with zero volume to avoid pops
        
        const { sound } = await Promise.race([
          Audio.Sound.createAsync(
            song.audio,
            loadOptions,
            onPlaybackStatusUpdate
          ),
          new Promise<never>((_, reject) => {
            // Listen for abort signal
            controller.signal.addEventListener('abort', () => {
              reject(new Error('Audio loading timed out after 10 seconds'));
            });
          })
        ]);
        
        // Clear the timeout since loading succeeded
        clearTimeout(timeoutId);
        
        newSound = sound;
        
        // Pre-load/prepare the sound before playing
        await newSound.setPositionAsync(startPositionMillis);
        
        // Get the initial status to retrieve duration
        const initialStatus = await newSound.getStatusAsync();
        const initialDuration = initialStatus.isLoaded && initialStatus.durationMillis 
          ? initialStatus.durationMillis / 1000 
          : 0;
        
        console.log(`Initial status - duration: ${initialDuration.toFixed(2)}s, position: ${(initialStatus.isLoaded ? initialStatus.positionMillis / 1000 : 0).toFixed(2)}s`);
        
        // Set status with all our optimized settings at once
        await newSound.setStatusAsync({
          progressUpdateIntervalMillis: 100,
          rate: 1.0,
          shouldCorrectPitch: true,
          volume: 0.1, // Very low initial volume
          // We don't set shouldPlay: true to allow for a cleaner start
        });
        
        // Allow audio system to fully prepare
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Create the new song state - initialize with the correct values
        const newSongState: SongState = {
          song,
          sound: newSound,
          isPlaying: false,
          progress: startPosition,
          duration: initialDuration
        };
        
        console.log(`Initial song duration: ${initialDuration.toFixed(2)}s`);
        
        // Update state before playing
        setCurrentSongState(newSongState);
        setSoundObjects(prev => ({ ...prev, [song.id]: newSound! }));
        
        // Set up a manual progress update timer specifically for the first song
        // to ensure UI updates even if the Audio API is not sending frequent updates
        if (isFirstSongAfterReload.current) {
          console.log('Setting up manual progress tracker for first song');
          
          // Start a timer that updates the progress manually every 100ms
          progressUpdateTimer.current = setInterval(() => {
            if (newSound) {
              newSound.getStatusAsync().then(status => {
                if (status.isLoaded && status.isPlaying) {
                  const currentPositionSec = status.positionMillis / 1000;
                  
                  // Only log occasionally to avoid console spam
                  if (Math.floor(currentPositionSec) % 2 === 0) {
                    console.log(`Manual progress update: ${currentPositionSec.toFixed(2)}s`);
                  }
                  
                  // Force update the state regardless of other conditions
                  setCurrentSongState(prev => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      progress: currentPositionSec,
                      // If we have a duration now, update it
                      duration: status.durationMillis ? status.durationMillis / 1000 : prev.duration
                    };
                  });
                }
              }).catch(err => {
                console.error('Error in manual progress update:', err);
              });
            }
          }, 100);
          
          // Reset the flag after the first song
          isFirstSongAfterReload.current = false;
        }
        
        // Start playback with ramp-up volume pattern
        console.log('Starting playback with smooth volume ramp-up');
        
        // Start playback 
        await newSound.playAsync();
        
        // Update with more frequent status update interval for better UI feedback
        await newSound.setStatusAsync({
          progressUpdateIntervalMillis: 50, // More frequent updates (50ms) for smoother slider movement
          shouldCorrectPitch: true,
        });
        
        // Multi-stage duration detection for the first song
        // Try to get duration immediately after loading
        if (initialDuration === 0) {
          console.log('Initial duration is zero, scheduling multiple detection attempts');
          
          // First attempt - immediately after loading
          await updateSongDuration(newSound!);
          
          // Second attempt - after a short delay
          setTimeout(async () => {
            if (currentSongState?.duration === 0 && newSound) {
              console.log('Second duration detection attempt (300ms)');
              await updateSongDuration(newSound);
            }
          }, 300);
          
          // Third attempt - after playback has started for a bit
          setTimeout(async () => {
            if (currentSongState?.duration === 0 && newSound) {
              console.log('Third duration detection attempt (1500ms)');
              await updateSongDuration(newSound);
            }
          }, 1500);
        } else {
          // Even with a non-zero initial duration, still try to get a more accurate one
          setTimeout(async () => {
            if (newSound) {
              await updateSongDuration(newSound);
            }
          }, 300);
        }
        
        // Immediately after playback starts, set a sequence of increasing volumes
        // This creates a smooth fade-in effect that eliminates pops/clicks
        setTimeout(() => {
          if (newSound) newSound.setVolumeAsync(0.3)
            .catch(e => console.log('Volume step error:', e));
          
          setTimeout(() => {
            if (newSound) newSound.setVolumeAsync(0.6)
              .catch(e => console.log('Volume step error:', e));
            
            setTimeout(() => {
              if (newSound) newSound.setVolumeAsync(0.8)
                .catch(e => console.log('Volume step error:', e));
              
              setTimeout(() => {
                if (newSound) newSound.setVolumeAsync(1.0)
                  .catch(e => console.log('Volume step error:', e));
              }, 30);
            }, 30);
          }, 30);
        }, 30);
        
        // Update state to reflect playing status
        setCurrentSongState(prev => {
          if (!prev) return null;
          return { 
            ...prev, 
            isPlaying: true 
          };
        });
        
        // Try to get a more accurate duration again after playback has started
        setTimeout(async () => {
          await updateSongDuration(newSound!);
        }, 1500);
        
        console.log('Song playback started successfully');
      } catch (playError) {
        // Clear the timeout to prevent memory leaks
        clearTimeout(timeoutId);
        
        console.error('Error during song playback setup:', playError);
        
        // Check if this was a timeout error
        if (playError instanceof Error && playError.message.includes('timed out')) {
          console.log('Audio loading timed out - attempting simplified playback');
          Alert.alert(
            'Playback Delay', 
            'The audio is taking longer than expected to load. Please try again or choose another song.',
            [{ text: 'OK' }]
          );
          setIsLoadingAudio(false);
          return;
        }
        
        // Recovery attempt with simplified approach
        try {
          // Clean up the failed sound if it exists
          if (newSound) {
            try {
              await newSound.stopAsync();
              await newSound.unloadAsync();
            } catch (cleanupError) {
              console.log('Error cleaning up failed sound:', cleanupError);
              // Continue with recovery
            }
          }
          
          console.log('Attempting recovery with simplified playback...');
          
          // Create a simpler sound object as a fallback
          const { sound: recoverySound } = await Audio.Sound.createAsync(
            song.audio,
            { 
              shouldPlay: true, 
              positionMillis: startPositionMillis,
              volume: 1.0
            }
          );
          
          // Update sound reference in state
          setCurrentSongState({
            song,
            sound: recoverySound,
            isPlaying: true,
            progress: startPosition,
            duration: 0
          });
          
          setSoundObjects(prev => ({ ...prev, [song.id]: recoverySound }));
          
          console.log('Recovery playback started');
        } catch (recoveryError) {
          console.error('Recovery attempt failed:', recoveryError);
          throw recoveryError; // Let the outer catch handle this
        }
      }
    } catch (error) {
      console.error('Error playing song:', error);
      // Reset state on error
      setCurrentSongState(null);
      Alert.alert('Playback Error', 'Could not play the selected song. Please try again.');
    } finally {
      setIsLoadingAudio(false);
      setIsBuffering(false);
    }
  };

  const togglePlayPause = async () => {
    if (!currentSongState?.sound) {
      console.log('No sound to toggle');
      return;
    }
    
    try {
      // First check if the sound is still loaded
      const status = await currentSongState.sound.getStatusAsync();
      
      if (!status.isLoaded) {
        console.log('Sound is no longer loaded, reloading song');
        // If the sound is not loaded anymore, reload the song
        if (currentSongState.song) {
          playSong(currentSongState.song);
        }
        return;
      }
      
      if (currentSongState.isPlaying) {
        console.log('Pausing current song');
        
        // Fade out before pausing for smoother transition
        await currentSongState.sound.setVolumeAsync(0.5);
        setTimeout(async () => {
          try {
            // Further reduce volume to near-zero before full pause
            await currentSongState.sound.setVolumeAsync(0.2);
            await currentSongState.sound.pauseAsync();
          } catch (pauseError) {
            console.error('Error during fade-out pause:', pauseError);
          }
        }, 30);
        
        setCurrentSongState(prev => prev ? { ...prev, isPlaying: false } : null);
        
        // Save progress when pausing
        saveSongProgress(currentSongState.song.id, currentSongState.progress);
      } else {
        console.log('Resuming current song');
        
        // Start at a lower volume and ramp up for smoother resume
        await currentSongState.sound.setVolumeAsync(0.2);
        
        // Resume playback
        await currentSongState.sound.playAsync();
        
        // Sequential volume increase for smoother transition
        setTimeout(() => {
          if (currentSongState?.sound) {
            currentSongState.sound.setVolumeAsync(0.5)
              .catch(e => console.error('Error in volume ramp step 1:', e));
            
            setTimeout(() => {
              if (currentSongState?.sound) {
                currentSongState.sound.setVolumeAsync(0.8)
                  .catch(e => console.error('Error in volume ramp step 2:', e));
                
                setTimeout(() => {
                  if (currentSongState?.sound) {
                    currentSongState.sound.setVolumeAsync(1.0)
                      .catch(e => console.error('Error in final volume ramp:', e));
                  }
                }, 30);
              }
            }, 30);
          }
        }, 30);
        
        setCurrentSongState(prev => prev ? { ...prev, isPlaying: true } : null);
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      
      // On error, try to reload the song
      if (currentSongState.song) {
        console.log('Error with sound, attempting to reload');
        playSong(currentSongState.song);
      }
    }
  };

  const seekTo = async (position: number) => {
    if (!currentSongState?.sound) {
      console.log('No sound to seek');
      return;
    }
    
    try {
      // Check if the sound is loaded
      const status = await currentSongState.sound.getStatusAsync();
      if (!status.isLoaded) {
        console.error('Cannot seek: sound is not loaded');
        return;
      }

      console.log(`Seeking to position: ${position.toFixed(2)}s`);
      
      // Convert position from seconds to milliseconds
      const positionMillis = Math.floor(position * 1000);
      
      // Temporarily lower volume to avoid pops/clicks during seeking
      const wasPlaying = currentSongState.isPlaying;
      
      // If it's playing, temporarily pause
      if (wasPlaying) {
        await currentSongState.sound.setVolumeAsync(0.3);
      }
      
      // Add a timeout for seek operation to prevent hanging
      const seekPromise = currentSongState.sound.setPositionAsync(positionMillis);
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Seek operation timed out after 5 seconds'));
          clearTimeout(timeoutId);
        }, 5000);
      });
      
      // Perform the seek with timeout protection
      try {
        await Promise.race([seekPromise, timeoutPromise]);
        console.log('Seek completed successfully');
        
        // After seeking, try to update the duration as seeking can help get the correct duration
        setTimeout(async () => {
          await updateSongDuration(currentSongState.sound);
        }, 200);
      } catch (seekError) {
        if (seekError instanceof Error && seekError.message.includes('timed out')) {
          console.error('Seek operation timed out');
          // Try to recover from a timed out seek
          try {
            // If playing was paused, try to resume anyway
            if (wasPlaying && currentSongState?.sound) {
              await currentSongState.sound.playAsync();
              await currentSongState.sound.setVolumeAsync(1.0);
            }
          } catch (recoveryError) {
            console.error('Error recovering from seek timeout:', recoveryError);
          }
          
          // Update state even if the seek failed
          setCurrentSongState(prev => {
            if (!prev) return null;
            return {
              ...prev,
              progress: position
            };
          });
          
          return;
        }
        
        // If it's another error, re-throw to be caught by outer try/catch
        throw seekError;
      }
      
      // If it was playing and got paused, resume playback
      if (wasPlaying) {
        setTimeout(async () => {
          // May need to play again if seeking paused it
          if (!currentSongState?.sound) return;
          
          const currentStatus = await currentSongState.sound.getStatusAsync();
          if (currentStatus.isLoaded && !currentStatus.isPlaying && wasPlaying) {
            await currentSongState.sound.playAsync();
          }
          
          // Restore full volume with a smooth ramp
          currentSongState.sound.setVolumeAsync(0.5);
          setTimeout(() => {
            if (currentSongState?.sound) {
              currentSongState.sound.setVolumeAsync(1.0);
            }
          }, 50);
        }, 50);
      }
      
      // Update the song state with the new position
      setCurrentSongState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          progress: position
        };
      });
    } catch (error) {
      console.error('Error seeking:', error);
      // Try to recover from general seek errors
      if (currentSongState?.sound) {
        try {
          // Restore playback state
          if (currentSongState.isPlaying) {
            await currentSongState.sound.playAsync();
            await currentSongState.sound.setVolumeAsync(1.0);
          }
        } catch (recoveryError) {
          console.error('Error recovering from seek error:', recoveryError);
        }
      }
    }
  };

  return (
    <MusicContext.Provider
      value={{
        likedSongs,
        playlists,
        queue,
        currentSong: currentSongState?.song || null,
        isPlaying: currentSongState?.isPlaying || false,
        progress: currentSongState?.progress || 0,
        duration: currentSongState?.duration || 0,
        toggleLike,
        addToPlaylist,
        createPlaylist,
        removeFromPlaylist,
        addToQueue,
        removeFromQueue,
        deletePlaylist,
        updatePlaylistName,
        playPlaylist,
        reorderPlaylist,
        currentPlaylistId,
        playlistOrder,
        getSongWithState,
        togglePlayPause,
        playSong,
        getSavedProgress,
        saveSongProgress,
        seekTo,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
} 