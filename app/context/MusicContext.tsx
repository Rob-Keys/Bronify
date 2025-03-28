import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { AVPlaybackStatus } from 'expo-av/build/AV';
import { AppState, AppStateStatus } from 'react-native';
import { Alert } from 'react-native';
import { fetchSongs, updateSongPlayCount, getSongById } from '../services/databaseService';

// Define constants for the Audio module that might not be available in this version
const INTERRUPTION_MODE_IOS_DO_NOT_MIX = 1;
const INTERRUPTION_MODE_ANDROID_DO_NOT_MIX = 1;

// Audio quality constants
const AUDIO_QUALITY_HIGH = 16000 * 48; // High quality bitrate

// Threshold in seconds for counting a song play
const PLAY_COUNT_THRESHOLD = 30;

interface Song {
  id: number;
  title: string;
  artist: string;
  plays: number;
  song_url: string;
  art_url: string;
  artist_socials: Record<string, string>;
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
  lastUpdateTime: number;
  isSeeking: boolean;
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
  seekTo: (position: number) => Promise<boolean>;
  skipToNext: () => Promise<boolean>;
  skipToPrevious: () => Promise<boolean>;
  addMultipleToQueue: (songs: Song[]) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  isAutoPlayEnabled: boolean;
  toggleAutoPlay: () => void;
  getNextQueueSong: () => Song | null;
  lastKnownProgress: number;
  topArtists: Array<{
    id: number;
    name: string;
    image: any;
    bio?: string;
    socialLinks?: {
      instagram?: string;
      twitter?: string;
      tiktok?: string;
      website?: string;
    };
  }>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

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

export const MusicProvider = ({ children }: { children: React.ReactNode }) => {
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: 1, name: 'Favorites', songs: [] },
    { id: 2, name: 'Workout Mix', songs: [] },
    { id: 3, name: 'Chill Vibes', songs: [] },
  ]);
  const [queue, setQueue] = useState<Song[]>([]);
  const [previousSongs, setPreviousSongs] = useState<Song[]>([]);
  const [currentSongState, setCurrentSongState] = useState<SongState | null>(null);
  const [soundObjects, setSoundObjects] = useState<{ [key: number]: Audio.Sound }>({});
  const [currentPlaylistId, setCurrentPlaylistId] = useState<number | null>(null);
  const [playlistOrder, setPlaylistOrder] = useState<number[]>([]);
  const songManager = SongManager.getInstance();
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState<boolean>(true);
  const [preloadedSongs, setPreloadedSongs] = useState<{ [key: number]: Audio.Sound }>({});
  const [lastKnownProgress, setLastKnownProgress] = useState<number>(0);
  const progressUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const lastProgressUpdate = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const progressUpdateRate = 250; // Update every 250ms for smooth UI
  const [allSongs, setAllSongs] = useState<Song[]>([]);

  // Add topArtists state
  const [topArtists] = useState([
    { 
      id: 1, 
      name: 'Bron Jamz', 
      image: require('@/assets/images/default_pfp.jpg'),
      bio: 'Creating LeBron-inspired jams since 2019. The original LeBron tribute artist.',
      socialLinks: {
        instagram: 'https://www.instagram.com',
        twitter: 'https://www.twitter.com',
        tiktok: 'https://www.tiktok.com',
        website: 'https://www.bronjamz.com'
      }
    },
    { 
      id: 2, 
      name: 'King James Band', 
      image: require('@/assets/images/default_pfp.jpg'),
      bio: 'A collective of musicians dedicated to celebrating LeBron through music.',
      socialLinks: {
        instagram: 'https://www.instagram.com',
        twitter: 'https://www.twitter.com',
        tiktok: 'https://www.tiktok.com',
        website: 'https://www.kingjamesband.com'
      }
    },
    { 
      id: 3, 
      name: 'LA Brontourage', 
      image: require('@/assets/images/default_pfp.jpg'),
      bio: 'West coast beats celebrating the King\'s LA era. Lakers-inspired melodies.',
      socialLinks: {
        instagram: 'https://www.instagram.com',
        twitter: 'https://www.twitter.com',
        tiktok: 'https://www.tiktok.com',
        website: 'https://www.labrontourage.com'
      }
    },
    { 
      id: 4, 
      name: 'Bronify', 
      image: require('@/assets/images/default_pfp.jpg'),
      bio: 'The #1 LeBron James tribute artist. Creating songs about the King since 2021.',
      socialLinks: {
        instagram: 'https://www.instagram.com',
        twitter: 'https://www.twitter.com',
        tiktok: 'https://www.tiktok.com',
        website: 'https://www.bronify.com'
      }
    },
  ]);

  // Add reference to track app state changes
  const appState = useRef(AppState.currentState);

  // Add a loading state to prevent multiple playback attempts
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  // Add a buffer state to track when audio is buffering
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  // Add a ref to track initialization
  const isAudioInitialized = useRef<boolean>(false);

  // Add a ref to track if this is the very first song played
  const isFirstSongAfterReload = useRef<boolean>(true);
  const progressUpdateTimer = useRef<NodeJS.Timeout | null>(null);

  // Add ref to track if the current song's play count has been incremented
  const playCountIncremented = useRef<boolean>(false);
  // Track when playback started to determine if the 30 second threshold is met
  const playbackStartTime = useRef<number>(0);

  // Progress tracking interval
  const [globalInterval, setGlobalInterval] = useState<NodeJS.Timeout | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  // Main function to update progress - called by interval
  const updateGlobalProgress = useCallback(() => {
    if (currentSongState && currentSongState.isPlaying && !currentSongState.isSeeking) {
      const now = Date.now();
      lastTimeRef.current = now;
      
      // Update the progress immediately with simple increment
      setCurrentSongState(prev => {
        if (!prev) return prev;
        
        // Add exactly 100ms of progress (our interval time)
        const newProgress = Math.min(prev.progress + 0.1, prev.duration); 
        
        return {
          ...prev, // Keep all existing properties
          progress: newProgress,
          lastUpdateTime: now
        };
      });
    }
  }, [currentSongState]);

  // Setup and teardown for global progress tracking
  useEffect(() => {
    // Start tracking progress when a song is playing
    if (currentSongState && currentSongState.isPlaying && !globalInterval) {
      console.log('Starting global progress tracking');
      lastTimeRef.current = Date.now();
      
      const interval = setInterval(() => {
        updateGlobalProgress();
      }, 100); // Update every 100ms for smooth motion
      
      setGlobalInterval(interval);
    } 
    // Stop tracking when no song is playing
    else if ((!currentSongState || !currentSongState.isPlaying) && globalInterval) {
      console.log('Stopping global progress tracking');
      clearInterval(globalInterval);
      setGlobalInterval(null);
    }

    return () => {
      if (globalInterval) {
        clearInterval(globalInterval);
      }
    };
  }, [currentSongState?.isPlaying, globalInterval, updateGlobalProgress]);

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
    if (!song || !song.song_url) {
      console.log('Cannot preload song with missing song_url');
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
            { uri: song.song_url },
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
    if (progressUpdateInterval.current) {
      clearInterval(progressUpdateInterval.current);
      progressUpdateInterval.current = null;
    }
    
    // Only set up interval if there's a song playing
    if (currentSongState?.isPlaying) {
      progressUpdateInterval.current = setInterval(() => {
        saveSongProgress(
          currentSongState.song.id,
          currentSongState.progress
        );
      }, 5000); // Save every 5 seconds
    }
    
    return () => {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current);
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
      // Don't add if already in queue
      if (prev.some(s => s.id === song.id)) {
        return prev;
      }
      
      // If queue was empty and a song is currently playing, 
      // start playing from queue when current song finishes
      return [...prev, song];
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

  // Centralized progress update function
  const updateProgress = useCallback((newProgress: number, newDuration?: number) => {
    if (!currentSongState) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastProgressUpdate.current;
    
    // Only update if enough time has passed or if duration changed
    if (timeSinceLastUpdate >= progressUpdateRate || newDuration !== undefined) {
      setCurrentSongState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          progress: newProgress,
          duration: newDuration !== undefined ? newDuration : prev.duration,
          lastUpdateTime: now
        };
      });
      lastProgressUpdate.current = now;
    }
  }, [currentSongState]);

  // Handle playback status updates
  const onPlaybackStatusUpdate = async (status: any) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error(`Encountered a playback error: ${status.error}`);
      }
      return;
    }

    // Only handle significant events
    if (status.didJustFinish) {
      // Handle song completion
      console.log('Song finished playing');
      await saveSongProgress(currentSongState!.song.id, 0);
      await playNextSong();
      return;
    }
      
    // Handle play state changes
    if (status.isPlaying !== currentSongState?.isPlaying) {
      setCurrentSongState(prevState => {
        if (!prevState) return prevState;
        return {
          ...prevState,
          isPlaying: status.isPlaying,
        };
      });
    }
  };

  const stopAllSounds = async () => {
    console.log('Stopping all sounds');
    
    try {
      // Set loading state to prevent new plays during cleanup
      setIsLoadingAudio(true);
      
      // Create an array to hold all the promises
      const stopPromises: Promise<any>[] = [];
      
      // Stop and unload current song first if it exists
      if (currentSongState?.sound) {
        try {
          console.log('Stopping current song:', currentSongState.song.title);
          stopPromises.push(
            currentSongState.sound.stopAsync()
              .then(() => currentSongState.sound.unloadAsync())
              .catch(err => {
                console.log('Non-critical error stopping current song:', err);
                // Proceed without throwing - we don't want to break the cleanup process
                return Promise.resolve();
              })
          );
        } catch (error) {
          console.log('Non-critical error accessing current song:', error);
          // Just log and continue, don't let this stop the cleanup process
        }
      }
      
      // Stop and unload all other sound objects
      for (const id in soundObjects) {
        if (!soundObjects[id]) {
          console.log(`Sound object ${id} is null, skipping cleanup`);
          continue;
        }
        
        if (currentSongState?.song.id !== Number(id)) {
          try {
            console.log(`Stopping sound object ${id}`);
            stopPromises.push(
              soundObjects[id].stopAsync()
                .then(() => soundObjects[id].unloadAsync())
                .catch(err => {
                  console.log(`Non-critical error stopping sound ${id}:`, err);
                  // Proceed without throwing - we don't want to break the cleanup process
                  return Promise.resolve();
                })
            );
          } catch (error) {
            console.log(`Non-critical error accessing sound ${id}:`, error);
            // Just log and continue, don't let this stop the cleanup process
          }
        }
      }
      
      // Also clean up any preloaded sounds
      Object.entries(preloadedSongs).forEach(([id, sound]) => {
        try {
          console.log(`Stopping preloaded sound ${id}`);
          stopPromises.push(
            sound.unloadAsync()
              .catch(err => {
                console.log(`Non-critical error unloading preloaded sound ${id}:`, err);
                return Promise.resolve();
              })
          );
        } catch (error) {
          console.log(`Non-critical error accessing preloaded sound ${id}:`, error);
        }
      });
      
      // Wait for all stop/unload operations to complete
      await Promise.all(stopPromises);
      
      console.log('All sounds stopped and unloaded');
      
      // Clear sound objects and current song
      setCurrentSongState(null);
      setSoundObjects({});
      setPreloadedSongs({});
      
      // Final cleanup: ensure the Audio module is reset
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: true,
      }).catch(err => {
        console.log('Non-critical error resetting audio mode:', err);
      });
    } catch (error) {
      console.error('Error stopping sounds:', error);
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

  // Function to preload the next song in queue
  const preloadNextSong = async () => {
    try {
      // Only preload if we have songs in the queue
      if (queue.length === 0) {
        return;
      }

      const nextSong = queue[0];
      
      // Skip if we've already preloaded this song or if it's already loaded as the current song
      if (preloadedSongs[nextSong.id] || (currentSongState?.song.id === nextSong.id)) {
        return;
      }
      
      console.log(`Preloading next song: ${nextSong.title}`);
      
      // Create a new sound object with minimal settings for preloading
      const { sound } = await Audio.Sound.createAsync(
        { uri: nextSong.song_url },
        { shouldPlay: false, volume: 0 },
        null // No need for status updates on preloaded song
      );
      
      // Store the preloaded sound
      setPreloadedSongs(prev => ({
        ...prev,
        [nextSong.id]: sound
      }));
      
      console.log(`Successfully preloaded: ${nextSong.title}`);
    } catch (error) {
      console.log('Non-critical error preloading next song:', error);
      // Don't throw - preloading failure shouldn't interrupt playback
    }
  };

  // Trigger preload whenever the queue changes or a new song starts playing
  useEffect(() => {
    preloadNextSong();
  }, [queue, currentSongState?.song?.id]);

  // Add additional attempts to get the duration after playback starts
  useEffect(() => {
    // Only run this effect when a song is playing and has no duration
    if (currentSongState?.sound && currentSongState.isPlaying && currentSongState.duration < 1) {
      console.log('🔄 Setting up duration detection retries for song with missing duration');
      
      // Try multiple times to get the duration with increasing delays
      const retryTimes = [500, 1000, 2000, 5000]; // Milliseconds
      
      retryTimes.forEach(delay => {
        setTimeout(() => {
          if (currentSongState?.sound && currentSongState.duration < 1) {
            console.log(`Retry duration detection after ${delay}ms`);
            updateSongDuration(currentSongState.sound)
              .catch(err => console.log('Non-critical error in duration retry:', err));
          }
        }, delay);
      });
    }
  }, [currentSongState?.isPlaying, currentSongState?.sound, currentSongState?.duration]);

  // Cleanup preloaded songs when unmounting
  useEffect(() => {
    return () => {
      // Clean up any preloaded songs
      Object.values(preloadedSongs).forEach(sound => {
        try {
          sound.unloadAsync().catch(err => {
            console.log('Non-critical error unloading preloaded sound:', err);
          });
        } catch (error) {
          console.log('Non-critical error during preload cleanup:', error);
        }
      });
    };
  }, []);

  // Modify the existing updateProgress function or add a new function to track play counts
  const checkAndUpdatePlayCount = async (currentProgress: number, songId: number) => {
    // If play count already incremented for this song playback session, do nothing
    if (playCountIncremented.current) return;
    
    // Check if the song has been playing for at least PLAY_COUNT_THRESHOLD seconds
    if (currentProgress >= PLAY_COUNT_THRESHOLD) {
      // Increment play count
      await updateSongPlayCount(songId, (currentSongState?.song.plays || 0) + 1);
      
      // Mark this song's play count as incremented for this session
      playCountIncremented.current = true;
      
      console.log(`Play count incremented for song ${songId} after ${PLAY_COUNT_THRESHOLD} seconds of playback`);
    }
  };

  // Find the function that updates progress during playback and add play count tracking
  // This is typically in an interval or onPlaybackStatusUpdate callback
  
  // Add this near where the playback status is updated
  useEffect(() => {
    if (currentSongState && currentSongState.isPlaying) {
      const onPlaybackProgressUpdate = async (status: AVPlaybackStatus) => {
        if (status.isLoaded && !status.isBuffering) {
          const currentPosition = status.positionMillis / 1000; // Convert to seconds
          
          // Check if play count should be incremented
          if (currentSongState.song.id) {
            await checkAndUpdatePlayCount(currentPosition, currentSongState.song.id);
          }
        }
      };
      
      // Set up the progress update event if it doesn't exist yet
      if (currentSongState.sound) {
        currentSongState.sound.setOnPlaybackStatusUpdate(onPlaybackProgressUpdate);
      }
    }
    
    return () => {
      // Clean up if needed
      if (currentSongState && currentSongState.sound) {
        currentSongState.sound.setOnPlaybackStatusUpdate(null);
      }
    };
  }, [currentSongState]);

  // Modify playSong to track previously played songs
  const playSong = async (song: Song) => {
    try {
      setIsLoadingAudio(true);
      console.log(`Attempting to play song: ${song.title}`);
      
      // Track the current song in previousSongs when changing songs
      if (currentSongState?.song && currentSongState.song.id !== song.id) {
        console.log(`Adding song to history: ${currentSongState.song.title}`);
        setPreviousSongs(prev => {
          // Only keep last 20 songs to avoid memory issues
          const newHistory = [currentSongState.song, ...prev.slice(0, 19)];
          return newHistory;
        });
      }
      
      // If we're playing the same song again, handle specially
      const hasPreloadedSound = preloadedSongs[song.id] !== undefined;
      
      // Declare these variables properly
      let startPosition = 0;
      let startPositionMillis = 0;
      
      // If this is the same song that's already playing, just toggle play/pause
      if (currentSongState?.song.id === song.id) {
        console.log('Toggling play/pause on current song');
        
        // Null check for sound
        if (!currentSongState.sound) {
          console.log('Sound object is null, recreating...');
          // Fall through to recreate the sound
        } else {
          try {
            // Check if sound is still valid
            const status = await currentSongState.sound.getStatusAsync();
            
            if (status.isLoaded) {
              if (currentSongState.isPlaying) {
                await currentSongState.sound.pauseAsync();
                setCurrentSongState(prev => prev ? { ...prev, isPlaying: false } : null);
                
                // Save progress when pausing
                saveSongProgress(song.id, currentSongState.progress);
              } else {
                // When resuming the same song, use lastKnownProgress
                if (lastKnownProgress > 0) {
                  startPosition = lastKnownProgress;
                  startPositionMillis = Math.floor(lastKnownProgress * 1000);
                  console.log(`Resuming from saved position: ${startPosition.toFixed(2)}s`);
                  
                  // Seek to the saved position
                  await currentSongState.sound.setPositionAsync(startPositionMillis);
                }
                
                // Resume with improved fade-in
                await currentSongState.sound.setVolumeAsync(0.6);
                await currentSongState.sound.playAsync();
                
                // Gradually increase volume to full
                setTimeout(() => {
                  if (currentSongState.sound) {
                    currentSongState.sound.setVolumeAsync(1.0)
                      .catch(e => console.log('Non-critical error setting volume on resume:', e));
                  }
                }, 50);
                
                setCurrentSongState(prev => prev ? { ...prev, isPlaying: true } : null);
              }
              setIsLoadingAudio(false);
              
              // Preload the next song after toggling
              preloadNextSong();
              
              // Update play count in database
              if (song.plays !== undefined) {
                await updateSongPlayCount(song.id, (song.plays || 0) + 1);
                // Update local state
                setAllSongs(prev => prev.map(s => 
                  s.id === song.id ? { ...s, plays: (s.plays || 0) + 1 } : s
                ));
              }
              
              return;
            } else {
              console.log('Sound is no longer loaded, recreating...');
              // Fall through to recreate the sound
            }
          } catch (error) {
            console.log('Non-critical error checking current sound:', error);
            // Fall through to recreate the sound
          }
        }
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
      
      // Stop all sounds first
      await stopAllSounds();
      
      // Always reset saved progress for any new song to ensure consistent behavior
      await resetSavedProgress(song.id);
      
      // When playing a completely new song, reset progress
      startPosition = 0;
      startPositionMillis = 0;
      
      console.log(`Starting song from position: ${startPosition.toFixed(2)}s`);
      
      let sound: Audio.Sound;
      
      // Use preloaded sound if available
      if (hasPreloadedSound) {
        console.log('Using preloaded sound for faster startup');
        sound = preloadedSongs[song.id];
        
        // Remove from preloaded cache since we're using it now
        const newPreloaded = { ...preloadedSongs };
        delete newPreloaded[song.id];
        setPreloadedSongs(newPreloaded);
      } else {
        // Create a new sound if not preloaded
        console.log('Creating new sound (not preloaded)');
        sound = new Audio.Sound();
        
        // Load the audio file
        try {
          await sound.loadAsync(
            { uri: song.song_url },
            { positionMillis: startPositionMillis, shouldPlay: false }
          );
        } catch (error) {
          console.error(`Error loading audio: ${error}`);
          setIsLoadingAudio(false);
          Alert.alert('Error', 'Failed to load audio file');
          return;
        }
      }
      
      // Set audio mode to ensure playback continues even with screen locked
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      
      // Start playback with gentle fade-in
      try {
        // Begin with reduced volume for fade-in
        await sound.setVolumeAsync(0.6);
        
        // Setup listener for playback status updates
        sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        
        // Start playback
        console.log('Starting sound playback');
        await sound.playAsync();
        
        // Fade in volume after a short delay
        setTimeout(() => {
          sound.setVolumeAsync(1.0)
            .catch(e => console.log('Non-critical error setting volume after play:', e));
        }, 50);
      } catch (playError) {
        console.error(`Error playing audio: ${playError}`);
        setIsLoadingAudio(false);
        Alert.alert('Error', 'Failed to play audio file');
        return;
      }
      
      // Update current song state
      setCurrentSongState({
        song: {
          ...song,
          isLiked: likedSongs.some(s => s.id === song.id)
        },
        sound,
        isPlaying: true,
        progress: startPosition,
        duration: song.duration || 0
      });
      
      // Set lastKnownProgress to the start position
      setLastKnownProgress(startPosition);
      
      setIsLoadingAudio(false);
      
      // Preload the next song after this one starts
      preloadNextSong();

      // Reset the play count increment flag when a new song is played
      playCountIncremented.current = false;
      playbackStartTime.current = Date.now();
    } catch (error) {
      console.error(`Error in playSong: ${error}`);
      setIsLoadingAudio(false);
      Alert.alert('Error', 'Something went wrong playing the song');
    }
  };

  const togglePlayPause = async () => {
    try {
      if (!currentSongState || !currentSongState.sound) {
        console.log('No song currently loaded to toggle play/pause');
        return;
      }
      
      // Check if sound is still valid before trying to use it
      try {
        const status = await currentSongState.sound.getStatusAsync();
        if (!status.isLoaded) {
          console.log('Current sound is no longer loaded, cannot toggle');
          // If we have song info, try to reload it
          if (currentSongState.song) {
            console.log('Attempting to reload song');
            playSong(currentSongState.song);
          }
          return;
        }
      } catch (statusError) {
        console.log('Non-critical error checking sound status:', statusError);
        // If we have song info, try to reload it
        if (currentSongState.song) {
          console.log('Error with sound, attempting to reload song');
          playSong(currentSongState.song);
        }
        return;
      }
      
      if (currentSongState.isPlaying) {
        console.log('Pausing current song');
        
        try {
          // Fade out before pausing for smoother transition
          await currentSongState.sound.setVolumeAsync(0.5);
          setTimeout(async () => {
            try {
              // Further reduce volume to near-zero before full pause
              if (currentSongState?.sound) {
                await currentSongState.sound.setVolumeAsync(0.2);
                await currentSongState.sound.pauseAsync();
              }
            } catch (pauseError) {
              console.log('Non-critical error during fade-out pause:', pauseError);
            }
          }, 30);
        } catch (fadeError) {
          console.log('Non-critical error during volume fade:', fadeError);
          // Still try to pause even if the fade fails
          try {
            await currentSongState.sound.pauseAsync();
          } catch (directPauseError) {
            console.log('Could not pause sound:', directPauseError);
          }
        }
        
        setCurrentSongState(prev => prev ? { ...prev, isPlaying: false } : null);
        
        // Save progress when pausing
        if (currentSongState.song) {
          saveSongProgress(currentSongState.song.id, currentSongState.progress);
        }
      } else {
        console.log('Resuming current song');
        
        try {
          // Start at a lower volume and ramp up for smoother resume
          await currentSongState.sound.setVolumeAsync(0.2);
          
          // Resume playback
          await currentSongState.sound.playAsync();
          
          // Sequential volume increase for smoother transition
          setTimeout(() => {
            if (currentSongState?.sound) {
              currentSongState.sound.setVolumeAsync(0.5)
                .catch(e => console.log('Non-critical error in volume ramp step 1:', e));
              
              setTimeout(() => {
                if (currentSongState?.sound) {
                  currentSongState.sound.setVolumeAsync(0.8)
                    .catch(e => console.log('Non-critical error in volume ramp step 2:', e));
                  
                  setTimeout(() => {
                    if (currentSongState?.sound) {
                      currentSongState.sound.setVolumeAsync(1.0)
                        .catch(e => console.log('Non-critical error in final volume ramp:', e));
                    }
                  }, 30);
                }
              }, 30);
            }
          }, 30);
        } catch (resumeError) {
          console.log('Non-critical error during resume:', resumeError);
          // Try direct play without volume changes if the smooth approach fails
          try {
            await currentSongState.sound.playAsync();
          } catch (directPlayError) {
            console.log('Could not resume sound:', directPlayError);
            // If we can't resume, try reloading the song
            if (currentSongState.song) {
              console.log('Error with sound resume, attempting to reload');
              playSong(currentSongState.song);
              return;
            }
          }
        }
        
        setCurrentSongState(prev => prev ? { ...prev, isPlaying: true } : null);
      }
    } catch (error) {
      console.log('Non-critical error toggling play/pause:', error);
      
      // On error, try to reload the song
      if (currentSongState?.song) {
        console.log('Error with sound, attempting to reload');
        playSong(currentSongState.song);
      }
    }
  };

  // Enhanced seek function
  const seekTo = async (position: number) => {
    console.log(`Seeking to position ${position}`);
    
    if (!currentSongState) {
      console.log('No song is playing, cannot seek');
      return;
    }
    
    try {
      // Set seeking flag
      setCurrentSongState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          isSeeking: true
        };
      });
      
      // Pause playback temporarily to ensure accurate seeking
      const wasPlaying = currentSongState.isPlaying;
      if (wasPlaying) {
        await currentSongState.sound.pauseAsync().catch(e => console.log('Non-critical pause error during seek:', e));
      }
      
      // Perform the seek operation
      await currentSongState.sound.setPositionAsync(position * 1000);
      
      // Update state with the new position
      setCurrentSongState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          progress: position,
          isSeeking: false,
          isPlaying: wasPlaying
        };
      });
      
      // Reset our time tracking reference
      lastTimeRef.current = Date.now();
      
      // Resume playback if it was playing before
      if (wasPlaying) {
        await currentSongState.sound.playAsync().catch(e => console.log('Non-critical play error after seek:', e));
      }
      
      // Save progress for app resume/restart
      await saveSongProgress(currentSongState.song.id, position);
      
      console.log(`Successfully seeked to ${position}s`);
      return true;
    } catch (error) {
      console.error('Error seeking to position:', error);
      
      // Clear seeking flag on error
      setCurrentSongState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          isSeeking: false
        };
      });
      
      return false;
    }
  };

  // Clean up progress update interval
  useEffect(() => {
    return () => {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current);
      }
    };
  }, []);

  // Function to get all available songs from all playlists
  const getAllSongs = (): Song[] => {
    const allSongsList: Song[] = [...allSongs];
    
    // Add songs from playlists
    playlists.forEach(playlist => {
      playlist.songs.forEach(song => {
        if (!allSongsList.some(s => s.id === song.id)) {
          allSongsList.push(song);
        }
      });
    });
    
    // Add liked songs
    likedSongs.forEach(song => {
      if (!allSongsList.some(s => s.id === song.id)) {
        allSongsList.push(song);
      }
    });
    
    console.log(`Total songs available for random play: ${allSongsList.length}`);
    return allSongsList;
  };
  
  // Function to get the next song from queue or random selection
  const getNextSong = (): Song | null => {
    console.log('Getting next song...');
    
    // Check if there are songs in the queue
    if (queue.length > 0) {
      console.log('Next song from queue:', queue[0].title);
      // Return first song in queue
      return queue[0];
    }
    
    // If auto-play is enabled, select a random song
    if (isAutoPlayEnabled) {
      console.log('Autoplay is enabled, selecting random song');
      const allSongs = getAllSongs();
      
      // Store the current song and previous songs to avoid playing them again
      const recentlyPlayedIds = [
        ...(currentSongState?.song ? [currentSongState.song.id] : []),
        ...previousSongs.slice(0, 3).map(song => song.id) // Avoid the last 3 played songs
      ];
      
      console.log(`Excluding ${recentlyPlayedIds.length} recently played songs from random selection`);
      
      // Filter out recently played songs
      const availableSongs = allSongs.filter(song => !recentlyPlayedIds.includes(song.id));
      
      if (availableSongs.length > 0) {
        // Improved random selection - use crypto for better randomness if available
        let randomIndex: number;
        
        try {
          // Use more secure random number generation if available
          if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            const randomArray = new Uint32Array(1);
            window.crypto.getRandomValues(randomArray);
            randomIndex = randomArray[0] % availableSongs.length;
          } else {
            // Fallback to Math.random with timestamp seed for better distribution
            let seed = Date.now();
            const rng = () => {
              const x = Math.sin(seed++) * 10000;
              return x - Math.floor(x);
            };
            randomIndex = Math.floor(rng() * availableSongs.length);
          }
        } catch (error) {
          // Ultimate fallback to simple Math.random
          randomIndex = Math.floor(Math.random() * availableSongs.length);
        }
        
        const randomSong = availableSongs[randomIndex];
        console.log(`Selected random song: ${randomSong.title} (ID: ${randomSong.id})`);
        return randomSong;
      } else if (allSongs.length > 0) {
        // If all songs were recently played, just pick truly random from all songs
        // except the currently playing one
        const trulyAvailableSongs = currentSongState?.song 
          ? allSongs.filter(song => song.id !== currentSongState.song.id)
          : allSongs;
          
        if (trulyAvailableSongs.length > 0) {
          const randomIndex = Math.floor(Math.random() * trulyAvailableSongs.length);
          const randomSong = trulyAvailableSongs[randomIndex];
          console.log(`All songs were recently played. Selected random song anyway: ${randomSong.title}`);
          return randomSong;
        }
      }
      
      console.log('No available songs for autoplay');
    } else {
      console.log('Autoplay is disabled, not selecting a random song');
    }
    
    return null;
  };
  
  // Function to play the next song from queue
  const playNextSong = async () => {
    try {
      console.log('Playing next song...');
      
      // Get the next song (from queue or random if autoplay enabled)
      const nextSong = getNextSong();
      
      // If queue had a song, remove it from queue
      if (queue.length > 0) {
        console.log('Removing song from queue');
        setQueue(prev => prev.slice(1));
      }
      
      // If we have a song to play, play it
      if (nextSong) {
        console.log('Playing next song:', nextSong.title);
        await playSong(nextSong);
        return true;
      } else {
        console.log('No next song available');
      }
      
      return false;
    } catch (error) {
      console.log('Error playing next song:', error);
      return false;
    }
  };

  // Toggle auto-play feature
  const toggleAutoPlay = () => {
    setIsAutoPlayEnabled(prev => !prev);
  };

  // Add multiple songs to queue
  const addMultipleToQueue = (songs: Song[]) => {
    setQueue(prev => {
      // Filter out songs that are already in the queue
      const newSongs = songs.filter(song => !prev.some(s => s.id === song.id));
      return [...prev, ...newSongs];
    });
  };

  // Clear the entire queue
  const clearQueue = () => {
    setQueue([]);
  };

  // Reorder songs in the queue
  const reorderQueue = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= queue.length || toIndex >= queue.length) {
      return;
    }
    
    setQueue(prev => {
      const newQueue = [...prev];
      const [movedSong] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedSong);
      return newQueue;
    });
  };

  // Skip to next song
  const skipToNext = async () => {
    // Ensure we save progress of current song
    if (currentSongState?.song) {
      saveSongProgress(currentSongState.song.id, currentSongState.progress);
    }
    
    // Play next song from queue or random
    return playNextSong();
  };

  // Add getNextQueueSong function to access in the context
  const getNextQueueSong = (): Song | null => {
    if (queue.length > 0) {
      return queue[0];
    }
    return null;
  };

  // Skip to previous song or restart current song
  const skipToPrevious = async (): Promise<boolean> => {
    try {
      console.log('skipToPrevious called');
      
      // If we have a current song
      if (currentSongState) {
        // If progress is less than 5 seconds, go to previous song
        if (currentSongState.progress < 5) {
          console.log('Progress < 5 seconds, trying to play previous song');
          
          // Check if we have a previous song in history
          if (previousSongs.length > 0) {
            // Get the previous song from history
            const prevSong = previousSongs[0];
            console.log(`Playing previous song: ${prevSong.title}`);
            
            // Remove the song from history
            setPreviousSongs(prev => prev.slice(1));
            
            // Play the previous song
            await playSong(prevSong);
            return true;
          } else {
            console.log('No previous songs in history, restarting current song');
            // If no previous song, just restart the current one
            await seekTo(0);
            return true;
          }
        } else {
          console.log(`Progress > 5 seconds (${currentSongState.progress.toFixed(2)}s), restarting current song`);
          // If progress is more than 5 seconds, restart the current song
          await seekTo(0);
          return true;
        }
      }
      
      // If no current song but we have a previous song
      if (previousSongs.length > 0) {
        const prevSong = previousSongs[0];
        console.log(`No current song, playing from history: ${prevSong.title}`);
        setPreviousSongs(prev => prev.slice(1));
        await playSong(prevSong);
        return true;
      }
      
      console.log('No current song and no history, cannot go to previous');
      return false;
    } catch (error) {
      console.log('Error in skipToPrevious:', error);
      return false;
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
        skipToNext,
        skipToPrevious,
        addMultipleToQueue,
        clearQueue,
        reorderQueue,
        isAutoPlayEnabled,
        toggleAutoPlay,
        getNextQueueSong,
        lastKnownProgress,
        topArtists,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};