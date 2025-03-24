import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Alert, AppState, AppStateStatus, Platform, NativeModules } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { AVPlaybackStatus } from 'expo-av/build/AV';
import NetInfo from '@react-native-community/netinfo';

// Define interruption mode constants that are missing in this version of expo-av
// iOS interruption modes determine how playback behaves when app is backgrounded
const INTERRUPTION_MODE_IOS_DO_NOT_MIX = 1;
const INTERRUPTION_MODE_ANDROID_DO_NOT_MIX = 1;
// Add iOS-specific constants for audio session categories
const AVAudioSessionCategoryPlayback = 'playback'; // Most important for background audio

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

// Define a background task name for audio playback
const BACKGROUND_AUDIO_TASK = 'BACKGROUND_AUDIO_TASK';

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
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  
  // We'll keep track of the last playback state to avoid unnecessary updates in iOS background
  const lastPlaybackStateRef = React.useRef<boolean | null>(null);
  
  // Background watchdog timer to keep iOS audio alive
  const backgroundWatchdogRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Track network connectivity status
  const [isConnected, setIsConnected] = useState(true);
  
  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
      
      // If connectivity changes during playback, take action
      if (sound && isPlaying && currentSong) {
        if (state.isConnected) {
          sound.getStatusAsync().then(status => {
            if (status.isLoaded && !status.isPlaying) {
              sound.playAsync().catch(err => 
                console.error('Error resuming after network reconnection:', err)
              );
            }
          }).catch(err => console.error('Error checking status after reconnection:', err));
        } else {
          console.log('Network connection lost, audio may be affected');
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [sound, isPlaying, currentSong]);
  
  // Audio interruption monitoring
  useEffect(() => {
    // The Audio.setOnAudioInterruptionListener is not available in this version of expo-av
    // We'll handle audio interruptions through AppState changes instead
    
    return () => {
      // Clean up would go here if needed
    };
  }, [sound]);
  
  // Function to ping the audio session when in background (iOS workaround)
  const startBackgroundWatchdog = () => {
    if (Platform.OS === 'ios') {
      // Clear any existing timer
      if (backgroundWatchdogRef.current) {
        clearInterval(backgroundWatchdogRef.current);
      }
      
      // Start a new timer that runs every 1 second (much more frequent)
      backgroundWatchdogRef.current = setInterval(() => {
        if (sound && isPlaying) {
          
          // Re-apply audio mode and ensure playback continues
          Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
            allowsRecordingIOS: false,
            interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
            interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          }).catch(err => console.error('Error in background watchdog:', err));
          
          // Check if sound is still playing
          sound.getStatusAsync().then(status => {
            if (status.isLoaded) {
              if (!status.isPlaying && isPlaying) {
                sound.playAsync().catch(err => 
                  console.error('Error restarting playback in watchdog:', err)
                );
              } else if (status.isPlaying) {
                // Critical for iOS: Always call playAsync again even if already playing
                // This keeps the audio session active in background
                sound.playAsync().catch(err => 
                  console.error('Error refreshing playback in watchdog:', err)
                );
              }
            }
          }).catch(err => console.error('Error checking status in watchdog:', err));
          
          // For iOS, ensure the audio session remains active
          try {
            const { ExpoAV } = NativeModules;
            if (ExpoAV && ExpoAV.setAudioMode) {
              ExpoAV.setAudioMode({
                playsInSilentModeIOS: true,
                allowsRecordingIOS: false,
                interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
                shouldDuckAndroid: true,
                interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
                playThroughEarpieceAndroid: false,
                staysActiveInBackground: true,
                // Critical iOS settings
                iosAudioCategory: AVAudioSessionCategoryPlayback,
                iosAudioCategoryOptions: ['mixWithOthers', 'duckOthers']
              });
            }
          } catch (nativeErr) {
            console.warn('Native audio session watchdog error:', nativeErr);
          }
        }
      }, 500); // Even more frequent pings (every 500ms)
      
      // Also set up a one-time immediate ping
      setTimeout(() => {
        if (sound && isPlaying) {
          sound.getStatusAsync().then(status => {
            if (status.isLoaded) {
              sound.playAsync().catch(err => 
                console.error('Error in immediate background ping:', err)
              );
            }
          }).catch(err => console.error('Error checking status in immediate ping:', err));
        }
      }, 100);
    }
  };
  
  // Function to stop the background watchdog
  const stopBackgroundWatchdog = () => {
    if (backgroundWatchdogRef.current) {
      clearInterval(backgroundWatchdogRef.current);
      backgroundWatchdogRef.current = null;
    }
  };
  
  useEffect(() => {
    setupAudio();
    
    // Register background task for iOS audio playback
    registerBackgroundAudioTask();
    
    // Add AppState change listener to handle app background/foreground transitions
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Initial setup to ensure audio background mode is enabled
    if (Platform.OS === 'ios') {
      // Set up audio session with direct native module access for more reliable results
      try {
        const { ExpoAV } = NativeModules;
        if (ExpoAV && ExpoAV.setAudioMode) {
          ExpoAV.setAudioMode({
            playsInSilentModeIOS: true,
            allowsRecordingIOS: false,
            interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
            shouldDuckAndroid: true,
            interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: true,
          });
        }
      } catch (err) {
        console.warn('Error setting up initial native audio mode:', err);
      }
    }
    
    return () => {
      cleanupAudio();
      appStateSubscription.remove();
      stopBackgroundWatchdog();
      // Unregister background task
      if (Platform.OS === 'ios') {
        TaskManager.unregisterTaskAsync(BACKGROUND_AUDIO_TASK).catch((err: Error) => 
          console.error('Error unregistering background task:', err)
        );
      }
    };
  }, []);
  
  // Monitor isPlaying state and manage watchdog accordingly
  useEffect(() => {
    if (isPlaying && appState !== 'active') {
      // Start the watchdog when playing in background
      startBackgroundWatchdog();
    } else if (!isPlaying) {
      // Stop the watchdog when not playing
      stopBackgroundWatchdog();
    }
  }, [isPlaying, appState]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    
    if (appState.match(/active/) && nextAppState.match(/inactive|background/)) {

      // Store the current playback state to avoid unnecessary state changes
      lastPlaybackStateRef.current = isPlaying;

      // Critical: immediately apply the audio mode before the app fully backgrounds
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: false,
        interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      }).catch(err => console.error('Error setting audio mode before background:', err));

      // Start background watchdog immediately if we're playing
      if (isPlaying) {
        startBackgroundWatchdog();
        if (currentSong) {
          showPlaybackNotification(currentSong).catch(err => 
            console.error('Error showing notification:', err)
          );
        }
        
        // On iOS, we need a more aggressive approach
        if (Platform.OS === 'ios' && sound) {
          // Attempt to ping the audio session right before going to background
          try {
            const { ExpoAV } = NativeModules;
            if (ExpoAV && ExpoAV.setAudioMode) {
              ExpoAV.setAudioMode({
                playsInSilentModeIOS: true,
                allowsRecordingIOS: false,
                interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
                shouldDuckAndroid: true,
                interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
                playThroughEarpieceAndroid: false,
                staysActiveInBackground: true,
                // Critical for iOS background audio:
                iosAudioCategory: AVAudioSessionCategoryPlayback,
                iosAudioCategoryOptions: ['mixWithOthers', 'duckOthers']
              });
            }
          } catch (nativeErr) {
            console.warn('Native audio mode error before background:', nativeErr);
          }
          
          // Force a play call right before going to background
          // This is CRITICAL for iOS - must call playAsync before backgrounding
          sound.getStatusAsync().then(status => {
            if (status.isLoaded && isPlaying) {
              // Even if it's already playing, call playAsync again to ensure iOS keeps it active
              sound.playAsync().catch(err => 
                console.error('Error forcing play before background:', err)
              );
            }
          }).catch(err => console.error('Error getting status before background:', err));
        }
      }

      // Direct check of sound object's playback status - most reliable way
      if (sound) {
        sound.getStatusAsync().then(status => {
          
          if (status.isLoaded) {
            // Ensure audio is properly configured for background
            Audio.setAudioModeAsync({
              playsInSilentModeIOS: true,
              staysActiveInBackground: true,
              shouldDuckAndroid: true,
              playThroughEarpieceAndroid: false,
              allowsRecordingIOS: false,
              interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
              interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
            }).then(() => {
              // If sound exists and is loaded but not playing, and should be playing,
              // then explicitly start playback
              if (isPlaying && !status.isPlaying) {
                sound.playAsync().catch(err => 
                  console.error('Error ensuring playback in background:', err)
                );
              } else if (isPlaying && status.isPlaying) {
                // On iOS, we still need to make a playAsync call to ensure it continues
                // This is a workaround for iOS background audio issues
                if (Platform.OS === 'ios') {
                  sound.playAsync().catch(err => 
                    console.error('Error ensuring continued playback in background:', err)
                  );
                }
              }
              
              // For iOS, directly access the native module to ensure audio continues
              if (Platform.OS === 'ios') {
                try {
                  const { ExpoAV } = NativeModules;
                  if (ExpoAV && ExpoAV.setAudioMode) {
                    ExpoAV.setAudioMode({
                      playsInSilentModeIOS: true,
                      allowsRecordingIOS: false,
                      interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
                      shouldDuckAndroid: true,
                      interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
                      playThroughEarpieceAndroid: false,
                      staysActiveInBackground: true,
                    });
                  }
                } catch (nativeErr) {
                  console.warn('Native audio mode error in background:', nativeErr);
                }
              }
            }).catch(err => console.error('Error setting background audio mode:', err));
          } else if (currentSong && isPlaying) {
            // If we have a song that should be playing but sound isn't loaded,
            // try to reload and play it
            loadSoundForCurrentSong().catch(err => 
              console.error('Error reloading song for background:', err)
            );
          }
        }).catch(err => console.error('Error checking sound status for background:', err));
      } else if (currentSong && isPlaying) {
        // If there's no sound object but we have a song and it should be playing,
        // try to reload and play it
        loadSoundForCurrentSong().catch(err => 
          console.error('Error loading song for background without sound:', err)
        );
      }
      
      // Ensure battery optimization doesn't affect our app
      if (Platform.OS === 'android') {
        try {
          // Request to ignore battery optimization (this is just a hint to the system)
          // Real solution requires directing users to system settings
        } catch (err) {
          console.warn('Error requesting battery optimization exception:', err);
        }
      }
    } else if (nextAppState === 'active' && appState.match(/inactive|background/)) {
      // App is coming to foreground
      
      // Stop background watchdog as we're now in foreground
      stopBackgroundWatchdog();
      
      // Hide notification when app is in foreground
      hidePlaybackNotification();
      
      // Check if audio is still playing or needs to be restored
      if (sound) {
        sound.getStatusAsync().then(status => {
          // Only take action if the playback state changed unexpectedly
          if (!status.isLoaded) {
            if (currentSong && lastPlaybackStateRef.current) {
              console.log('Reloading unloaded sound after foreground return');
              loadSoundForCurrentSong().catch(err => 
                console.error('Error reloading song after foreground:', err)
              );
            }
          } else if (lastPlaybackStateRef.current && !status.isPlaying) {
            // Resume playback if it was playing before but stopped
            console.log('Resuming interrupted playback after foreground return');
            sound.playAsync().catch(err => 
              console.error('Error resuming playback after foreground:', err)
            );
          } else {
            console.log('Sound status ok after foreground return, isPlaying:', status.isPlaying);
            // Update our UI state to match actual playback state
            if (status.isPlaying !== isPlaying) {
              setIsPlaying(status.isPlaying);
            }
          }
        }).catch((error: unknown) => {
          console.error('Error checking sound status after app resume:', error);
        });
      } else if (currentSong && lastPlaybackStateRef.current) {
        // If there's no sound object but we should be playing, reload the song
        console.log('No sound after foreground return, recreating');
        loadSoundForCurrentSong().catch(err => 
          console.error('Error reloading after foreground with no sound:', err)
        );
      }
      
      // Reset the playback state ref
      lastPlaybackStateRef.current = null;
    }
    
    setAppState(nextAppState);
  };

  const setupAudio = async () => {
    try {
      // Configure audio to play in background and handle interruptions properly
      // This is the critical configuration for iOS background audio
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: false,
        interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });
      
      if (Platform.OS === 'ios') {
        // For iOS, we need additional configuration through native module
        try {
          // This is a workaround to set proper audio session category on iOS
          // Setting AVAudioSessionCategoryPlayback is CRITICAL for background audio
          const { ExpoAV } = NativeModules;
          if (ExpoAV && ExpoAV.setAudioMode) {
            await ExpoAV.setAudioMode({
              playsInSilentModeIOS: true,
              allowsRecordingIOS: false,
              interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
              shouldDuckAndroid: true,
              interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
              playThroughEarpieceAndroid: false,
              staysActiveInBackground: true,
              // Explicitly set iOS category to playback for background audio
              iosAudioCategory: AVAudioSessionCategoryPlayback,
              // Add options to mix with others but duck other audio
              iosAudioCategoryOptions: ['mixWithOthers', 'duckOthers']
            });
          }
        } catch (nativeErr) {
          console.warn('Native audio session config error:', nativeErr);
          // Continue anyway, the standard config might be sufficient
        }
      }
      
      // Setup notification channels for background playback
      setupNotificationChannel();
      
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };
  
  // Set up notification channel for background playback
  const setupNotificationChannel = async () => {
    // Configure notifications for iOS and Android
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    
    if (Platform.OS === 'android') {
      // Create a channel for Android
      await Notifications.setNotificationChannelAsync('audio-playback', {
        name: 'Audio Playback',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0, 0, 0, 0],
        lightColor: '#FF231F7C',
      });
    }
  };

  const cleanupAudio = async () => {
    stopBackgroundWatchdog();
    hidePlaybackNotification();
    
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (err) {
        console.error('Error cleaning up audio:', err);
      }
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    // Only process if the sound is loaded, otherwise ignore
    if (!status.isLoaded) return;

    // Only handle specific events, not continuous updates:
    // 1. When a song finishes
    // 2. When play/pause state changes
    // 3. Position updates during early playback or significant position changes

    // Handle playback state changes (play/pause)
    if (status.isPlaying !== isPlaying) {
      setIsPlaying(status.isPlaying);
      
      // When a song starts or stops playing, update the song status in our map
      if (currentSong) {
        setLoadedSongs(prev => {
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
    
    // Handle song completion
    if (status.didJustFinish) {
      setIsPlaying(false);
    }
    
    // Update position more frequently during the first 5 seconds of playback
    // then less frequently after that
    const isStartOfPlayback = status.positionMillis < 5000;
    const positionThreshold = isStartOfPlayback ? 0.1 : 1; // Lower threshold at start
    
    if (isStartOfPlayback || Math.abs(status.positionMillis / 1000 - position) > positionThreshold) {
      setPosition(status.positionMillis / 1000);
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

      // If the same song is already selected, toggle play/pause
      if (currentlyPlaying === song.id) {
        if (isPlaying) {
          await pauseSong();
        } else {
          await resumeSong();
        }
        return;
      }

      // If different song is already playing, keep it playing until we manually press play
      if (currentlyPlaying !== null && currentlyPlaying !== song.id) {
        // Just select the song without playing it
        setCurrentSong(song);
        setCurrentlyPlaying(song.id);
        
        // Update the loadedSongs map without affecting currently playing song
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
        
        // Don't start loading the new song yet - we'll do that when play is pressed
        return;
      }

      // If loading, don't start another load
      if (isLoading) {
        return;
      }

      setIsLoading(true);
      console.log('Loading song:', song.title);

      if (!song.audio) {
        throw new Error('Audio source is null or undefined');
      }

      // First check if we need to unload existing sound
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (err) {
          console.error('Error unloading previous sound:', err);
          // Continue anyway - we'll create a new sound object
        }
      }

      // Ensure proper notifications are shown for background playback
      if (appState !== 'active') {
        await showPlaybackNotification(song);
      }
      
      // Configure audio session once before creating sound - critical for iOS background audio
      try {
        // For iOS, we need to configure the audio session properly before loading
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          allowsRecordingIOS: false,
          interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        });
        
        // For iOS, set the audio category directly if possible
        if (Platform.OS === 'ios') {
          try {
            const { ExpoAV } = NativeModules;
            if (ExpoAV && ExpoAV.setAudioMode) {
              await ExpoAV.setAudioMode({
                playsInSilentModeIOS: true,
                allowsRecordingIOS: false, 
                interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
                shouldDuckAndroid: true,
                interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
                playThroughEarpieceAndroid: false,
                staysActiveInBackground: true,
                iosAudioCategory: AVAudioSessionCategoryPlayback,
                iosAudioCategoryOptions: ['mixWithOthers', 'duckOthers']
              });
            }
          } catch (nativeErr) {
            console.warn('Error setting iOS audio category:', nativeErr);
          }
        }
      } catch (err) {
        console.error('Error setting audio mode:', err);
        // Continue anyway - we'll still try to create the sound
      }

      // On iOS, we want to fully preload the audio to ensure better background playback
      if (Platform.OS === 'ios') {
        try {
          // Preloading not available in this version of expo-av
          console.log('Note: Audio preloading not available in this version of expo-av');
          // Instead, we'll try to ensure the audio loads completely before playing
          
          // For iOS, we'll tell the system we're playing audio 
          // even before we finish loading the sound
          await showPlaybackNotification(song);
        } catch (preloadErr) {
          console.warn('Error with audio setup:', preloadErr);
        }
      }

      // Create the sound object with minimal status updates to reduce state changes
      const initialStatus = {
        shouldPlay: false, // Don't auto-play initially
        progressUpdateIntervalMillis: Platform.OS === 'ios' ? 100 : 250, // More frequent updates on iOS
        positionMillis: 0,
        volume: 1.0,
        rate: 1.0,
        isLooping: false,
      };
      
      console.log('Creating sound object with optimized iOS settings');
      
      // Create the sound object with more reliable iOS-specific handling
      const { sound: newSound } = await Audio.Sound.createAsync(
        song.audio,
        initialStatus,
        // Status update handler
        (status) => {
          if (!status.isLoaded) return;
          
          // Cast to the correct type to help TypeScript
          const audioStatus = status as {
            isLoaded: true;
            positionMillis: number;
            durationMillis?: number;
            isPlaying: boolean;
            didJustFinish?: boolean;
          };
          
          // Only update state when these specific things change
          const playStateChanged = audioStatus.isPlaying !== isPlaying;
          const songFinished = audioStatus.didJustFinish === true;
          
          // Update position more frequently during the first 5 seconds of playback
          // then less frequently after that
          const isStartOfPlayback = audioStatus.positionMillis < 5000;
          const positionThreshold = isStartOfPlayback ? 0.1 : 1; // Smaller threshold at start
          const bigPositionChange = Math.abs(audioStatus.positionMillis / 1000 - position) > positionThreshold;
          
          if (playStateChanged) {
            setIsPlaying(audioStatus.isPlaying);
            
            // If the playback state changes, update the notification
            if (audioStatus.isPlaying && appState !== 'active' && currentSong) {
              showPlaybackNotification(currentSong);
            } else if (!audioStatus.isPlaying && appState !== 'active') {
              hidePlaybackNotification();
            }
          }
          
          if (songFinished) {
            setIsPlaying(false);
            hidePlaybackNotification();
          }
          
          if (bigPositionChange || isStartOfPlayback) {
            setPosition(audioStatus.positionMillis / 1000);
          }
          
          // Only update duration once when it first becomes available
          if (audioStatus.durationMillis && duration === 0) {
            setDuration(audioStatus.durationMillis / 1000);
          }
          
          // Update song metadata in our map only when playback state changes
          if ((playStateChanged || bigPositionChange) && currentSong) {
            setLoadedSongs(prev => {
              const newMap = new Map(prev);
              newMap.set(currentSong.id, {
                ...currentSong,
                isPlaying: audioStatus.isPlaying,
                position: audioStatus.positionMillis / 1000,
                duration: audioStatus.durationMillis ? audioStatus.durationMillis / 1000 : 0,
              });
              return newMap;
            });
          }
        }
      );

      // For iOS, specifically configure the sound object for background playback
      if (Platform.OS === 'ios') {
        // iOS-specific sound configuration if available
        try {
          console.log('Applying iOS-specific sound configuration');
          
          // These direct properties may not be available in this version
          // of expo-av, but attempting to set them if possible
          (newSound as any)._preferredAudioSessionIOS = AVAudioSessionCategoryPlayback;
          (newSound as any)._preferredAudioCategoryOptionIOS = ['mixWithOthers', 'duckOthers'];
        } catch (iosErr) {
          console.warn('Could not apply iOS-specific sound config:', iosErr);
        }
      }

      // Batch our state updates to minimize re-renders
      setSound(newSound);
      setCurrentSong(song);
      setCurrentlyPlaying(song.id);
      setIsPlaying(false); // Initially set to false - no auto-play
      setPosition(0);
      setDuration(0);

      // Update the song's status all at once
      setLoadedSongs(prev => {
        const newMap = new Map(prev);
        newMap.set(song.id, {
          ...song,
          isPlaying: false, // Initially set to false
          position: 0,
          duration: 0,
        });
        return newMap;
      });

      // Get initial duration if available
      newSound.getStatusAsync().then(status => {
        if (status.isLoaded && status.durationMillis) {
          setDuration(status.durationMillis / 1000);
          
          // Update duration in loadedSongs
          if (currentSong) {
            setLoadedSongs(prev => {
              const newMap = new Map(prev);
              const existingSong = newMap.get(currentSong.id);
              if (existingSong) {
                newMap.set(currentSong.id, {
                  ...existingSong,
                  duration: status.durationMillis ? status.durationMillis / 1000 : 0,
                });
              }
              return newMap;
            });
          }
        }
      }).catch(err => console.error('Error getting initial status:', err));

    } catch (error) {
      console.error('Error loading song:', error);
      // Reset state on error
      setSound(null);
      setCurrentSong(null);
      setCurrentlyPlaying(null);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      hidePlaybackNotification();
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
          
          // Hide notification when paused
          hidePlaybackNotification();
          
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
        hidePlaybackNotification();
      }
    }
  };

  const resumeSong = async () => {
    if (!currentSong) {
      return;
    }
    
    try {
      // First ensure audio session is properly configured - critical for iOS background playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: false,
        interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });
      
      // For iOS, directly set the audio category
      if (Platform.OS === 'ios') {
        try {
          const { ExpoAV } = NativeModules;
          if (ExpoAV && ExpoAV.setAudioMode) {
            await ExpoAV.setAudioMode({
              playsInSilentModeIOS: true,
              allowsRecordingIOS: false,
              interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
              shouldDuckAndroid: true,
              interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
              playThroughEarpieceAndroid: false,
              staysActiveInBackground: true,
              iosAudioCategory: AVAudioSessionCategoryPlayback,
              iosAudioCategoryOptions: ['mixWithOthers', 'duckOthers']
            });
          }
        } catch (err) {
          console.warn('Error setting iOS audio category in resumeSong:', err);
        }
        
        // Ensure notification is shown for background playback
        if (appState !== 'active' && currentSong) {
          await showPlaybackNotification(currentSong);
        }
        
        // Start background watchdog if in background state
        if (appState !== 'active') {
          startBackgroundWatchdog();
        }
      }

      // If we have a sound object, check if it's loaded
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          console.log('Resuming loaded sound');
          
          // For iOS, we might need to reconfigure the sound object before playing
          if (Platform.OS === 'ios') {
            try {
              // These direct properties may not be available in this version
              // of expo-av, but attempting to set them if possible
              (sound as any)._preferredAudioSessionIOS = AVAudioSessionCategoryPlayback;
            } catch (iosErr) {
              // Ignore errors - this is just a best-effort attempt
            }
          }
          
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
          console.warn('Sound is not loaded, loading now...');
          // We need to load the sound first
          await loadSoundForCurrentSong();
        }
      } else {
        console.warn('No sound object, loading now...');
        // We need to create a sound object
        await loadSoundForCurrentSong();
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
  };

  // Helper function to load sound for current song and start playing
  const loadSoundForCurrentSong = async () => {
    if (!currentSong || !currentSong.audio) {
      console.error('No current song or audio source');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Configure audio session with iOS-specific settings
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: false,
        interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });
      
      // For iOS, directly set the audio category (critical for background playback)
      if (Platform.OS === 'ios') {
        try {
          const { ExpoAV } = NativeModules;
          if (ExpoAV && ExpoAV.setAudioMode) {
            await ExpoAV.setAudioMode({
              playsInSilentModeIOS: true,
              allowsRecordingIOS: false,
              interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
              shouldDuckAndroid: true,
              interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
              playThroughEarpieceAndroid: false,
              staysActiveInBackground: true,
              iosAudioCategory: AVAudioSessionCategoryPlayback,
              iosAudioCategoryOptions: ['mixWithOthers', 'duckOthers']
            });
          }
        } catch (err) {
          console.warn('Error setting iOS audio category in loadSoundForCurrentSong:', err);
        }
      }
      
      // Ensure proper notifications are shown for background playback
      if (appState !== 'active') {
        await showPlaybackNotification(currentSong);
      }
      
      // On iOS, start background watchdog immediately if in background
      if (Platform.OS === 'ios' && appState !== 'active') {
        startBackgroundWatchdog();
      }
      
      // On iOS, we want to fully preload the audio to ensure better background playback
      if (Platform.OS === 'ios') {
        try {
          // Preloading not available in this version of expo-av
          console.log('Note: Audio preloading not available in this version of expo-av');
          // Direct loading will be used instead, ensure iOS knows we're playing audio
          await showPlaybackNotification(currentSong);
        } catch (preloadErr) {
          console.warn('Error with audio setup:', preloadErr);
        }
      }
      
      // Create sound initial status with iOS optimizations
      const initialStatus = {
        shouldPlay: false,
        progressUpdateIntervalMillis: Platform.OS === 'ios' ? 100 : 250, // More frequent on iOS
        positionMillis: 0,
        volume: 1.0,
      };
      
      // Create new sound object with iOS optimizations
      const { sound: newSound } = await Audio.Sound.createAsync(
        currentSong.audio,
        initialStatus,
        (status) => {
          if (!status.isLoaded) return;
          
          // Cast to the correct type to help TypeScript
          const audioStatus = status as {
            isLoaded: true;
            positionMillis: number;
            durationMillis?: number;
            isPlaying: boolean;
            didJustFinish?: boolean;
          };
          
          // Only update state when these specific things change
          const playStateChanged = audioStatus.isPlaying !== isPlaying;
          const songFinished = audioStatus.didJustFinish === true;
          
          // Update position more frequently during the first 5 seconds of playback
          // then less frequently after that
          const isStartOfPlayback = audioStatus.positionMillis < 5000;
          const positionThreshold = isStartOfPlayback ? 0.1 : 1; // Smaller threshold at start
          const bigPositionChange = Math.abs(audioStatus.positionMillis / 1000 - position) > positionThreshold;
          
          if (playStateChanged) {
            setIsPlaying(audioStatus.isPlaying);
            
            // If the playback state changes, update the notification
            if (audioStatus.isPlaying && appState !== 'active' && currentSong) {
              showPlaybackNotification(currentSong);
            } else if (!audioStatus.isPlaying && appState !== 'active') {
              hidePlaybackNotification();
            }
          }
          
          if (songFinished) {
            setIsPlaying(false);
            hidePlaybackNotification();
          }
          
          if (bigPositionChange || isStartOfPlayback) {
            setPosition(audioStatus.positionMillis / 1000);
          }
          
          // Only update duration once when it first becomes available
          if (audioStatus.durationMillis && duration === 0) {
            setDuration(audioStatus.durationMillis / 1000);
          }
        }
      );
      
      // For iOS, specifically configure the sound object for background playback
      if (Platform.OS === 'ios') {
        try {
          // These direct properties may not be available in this version
          // of expo-av, but attempting to set them if possible
          (newSound as any)._preferredAudioSessionIOS = AVAudioSessionCategoryPlayback;
          (newSound as any)._preferredAudioCategoryOptionIOS = ['mixWithOthers', 'duckOthers'];
        } catch (iosErr) {
          // Ignore errors - this is just a best-effort attempt
        }
      }
      
      // Update state
      setSound(newSound);
      
      // Start playing
      await newSound.playAsync();
      setIsPlaying(true);
      
      // Set up an initial position update immediately after playback starts
      setTimeout(() => {
        if (newSound) {
          newSound.getStatusAsync().then(status => {
            if (status.isLoaded) {
              setPosition(status.positionMillis / 1000);
            }
          }).catch(err => console.error('Error getting initial position:', err));
        }
      }, 100);
      
      // Update song status
      setLoadedSongs(prev => {
        const newMap = new Map(prev);
        newMap.set(currentSong.id, {
          ...currentSong,
          isPlaying: true,
        });
        return newMap;
      });
      
    } catch (error) {
      console.error('Error loading sound in resumeSong:', error);
      // Reset on error
      setIsPlaying(false);
      hidePlaybackNotification();
    } finally {
      setIsLoading(false);
    }
  };

  const seekTo = async (position: number) => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.setPositionAsync(position * 1000); // Convert to milliseconds
          setPosition(position);
          
          // Update the current song's position in our map
          if (currentSong) {
            setLoadedSongs(prev => {
              const newMap = new Map(prev);
              const existingSong = newMap.get(currentSong.id);
              if (existingSong) {
                newMap.set(currentSong.id, {
                  ...existingSong,
                  position: position,
                });
              }
              return newMap;
            });
          }
        }
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };

  // Register a background task for iOS audio
  const registerBackgroundAudioTask = async () => {
    if (Platform.OS === 'ios') {
      // Make sure any previous task is unregistered
      try {
        await TaskManager.unregisterTaskAsync(BACKGROUND_AUDIO_TASK)
          .catch(err => console.log('No existing task to unregister:', err));
      } catch (err) {
        // Ignore errors here - task might not exist yet
      }
      
      // Define the task handler
      TaskManager.defineTask(BACKGROUND_AUDIO_TASK, async () => {
        console.log('Background audio task executed');
        
        // If we have a sound and it should be playing, ensure it's playing
        if (sound && isPlaying && currentSong) {
          try {
            // Re-apply audio mode settings with correct iOS category
            await Audio.setAudioModeAsync({
              playsInSilentModeIOS: true,
              staysActiveInBackground: true,
              shouldDuckAndroid: true,
              playThroughEarpieceAndroid: false,
              allowsRecordingIOS: false,
              interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
              interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
            });
            
            // For iOS, directly access the native module
            try {
              const { ExpoAV } = NativeModules;
              if (ExpoAV && ExpoAV.setAudioMode) {
                ExpoAV.setAudioMode({
                  playsInSilentModeIOS: true,
                  allowsRecordingIOS: false,
                  interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
                  shouldDuckAndroid: true,
                  interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
                  playThroughEarpieceAndroid: false,
                  staysActiveInBackground: true,
                  // Critical iOS settings
                  iosAudioCategory: AVAudioSessionCategoryPlayback,
                  iosAudioCategoryOptions: ['mixWithOthers', 'duckOthers']
                });
              }
            } catch (nativeErr) {
              console.warn('Native audio mode error in background task:', nativeErr);
            }
            
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              // Always call playAsync to refresh the audio session, regardless of playing state
              console.log('Background task: refreshing audio session');
              await sound.playAsync();
              
              // Ensure notification is displayed
              await showPlaybackNotification(currentSong);
            } else {
              // If sound is not loaded, try to reload it
              console.log('Background task: sound not loaded, attempting to reload');
              await loadSoundForCurrentSong();
            }
            return BackgroundFetch.BackgroundFetchResult.NewData;
          } catch (error) {
            console.error('Error in background audio task:', error);
            return BackgroundFetch.BackgroundFetchResult.Failed;
          }
        }
        
        return BackgroundFetch.BackgroundFetchResult.NoData;
      });
      
      // Register the task with more frequent execution and higher priority
      try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_AUDIO_TASK, {
          minimumInterval: 1, // Minimum 1 second between task executions
          stopOnTerminate: false, // Keep running after app is terminated
          startOnBoot: true, // Start the task after device reboot
        });
      } catch (err: unknown) {
        console.error('Background task registration failed:', err);
      }
    }
  };

  // Show a persistent notification when playing audio in background
  const showPlaybackNotification = async (song: Song) => {
    try {
      // Cancel any existing notifications
      await Notifications.dismissAllNotificationsAsync();
      
      // Create a notification for the current song with iOS-specific options
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Now Playing',
          body: `${song.title} - ${song.artist}`,
          data: { songId: song.id },
          sticky: true,
          autoDismiss: false,
          // iOS options need to have correct types
        },
        trigger: null, // Show immediately
      });
      
      
      // For iOS, we need additional configuration to optimize notifications
      if (Platform.OS === 'ios') {
        try {
          // Configure iOS notification interaction categories
          await Notifications.setNotificationCategoryAsync('playback', [
            {
              identifier: 'pause',
              buttonTitle: 'Pause',
              options: {
                isDestructive: false,
                isAuthenticationRequired: false,
              }
            },
            {
              identifier: 'play',
              buttonTitle: 'Play',
              options: {
                isDestructive: false,
                isAuthenticationRequired: false,
              }
            }
          ]);
        } catch (err) {
          console.error('Error configuring iOS notification categories:', err);
        }
      }
    } catch (err) {
      console.error('Error showing playback notification:', err);
    }
  };
  
  // Hide the playback notification when stopped
  const hidePlaybackNotification = async () => {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (err) {
      console.error('Error hiding playback notification:', err);
    }
  };
  
  // Register background notification handler
  useEffect(() => {
    // Set up notification listener
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const songId = response.notification.request.content.data?.songId;
      if (songId) {
        // Handle notification interaction, e.g., navigate to now playing screen
        console.log('Notification interaction with songId:', songId);
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, []);

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