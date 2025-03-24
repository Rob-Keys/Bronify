import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { useMusic } from './context/MusicContext';
import Slider from '@react-native-community/slider';

interface Song {
  id: number;
  title: string;
  artist: string;
  image: any;
  audio: any;
  isLiked?: boolean;
}

export default function SongScreen() {
  const { song: songParam } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const { 
    likedSongs, 
    playlists, 
    toggleLike, 
    addToPlaylist, 
    createPlaylist,
    addToQueue,
    playSong,
    togglePlayPause,
    currentSong,
    isPlaying,
    progress,
    duration,
    seekTo
  } = useMusic();
  
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0); // To prevent too frequent updates
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstSongPlayed = useRef<boolean>(true);

  useEffect(() => {
    if (songParam) {
      try {
        const parsedSong = JSON.parse(songParam as string);
        setSong(parsedSong);
      } catch (error) {
        console.error('Error parsing song data:', error);
        Alert.alert('Error', 'Failed to load song data');
        router.back();
      }
    } else {
      Alert.alert('Error', 'No song data provided');
      router.back();
    }
    setIsLoading(false);
  }, [songParam]);

  const isCurrentSong = currentSong?.id === song?.id;

  // Update slider value when progress changes and not dragging
  useEffect(() => {
    if (!isDragging && isCurrentSong) {
      // For the first song, track progress more aggressively to ensure UI updates
      if (isFirstSongPlayed.current && isPlaying) {
        // Always update immediately for the first song
        setSliderValue(progress);
        
        // Set up a timer that increments progress slightly every 100ms for smoother UI
        if (!progressTimerRef.current && duration > 0) {
          console.log('Setting up supplemental progress timer for first song');
          progressTimerRef.current = setInterval(() => {
            // Only increment if actual progress is ahead of our display value
            // This avoids getting ahead of the actual playback
            setSliderValue(prev => {
              const incrementedValue = prev + 0.05;
              return Math.min(incrementedValue, progress);
            });
          }, 100);
          
          // Set a timeout to disable the aggressive tracking after 10 seconds
          setTimeout(() => {
            if (progressTimerRef.current) {
              console.log('Disabling supplemental progress timer');
              clearInterval(progressTimerRef.current);
              progressTimerRef.current = null;
              isFirstSongPlayed.current = false;
            }
          }, 10000);
        }
      } else {
        // Limit updates to reduce re-renders (every ~100ms is sufficient for a smooth UI)
        const now = Date.now();
        if (now - lastUpdateTime > 100) {
          setSliderValue(progress);
          setLastUpdateTime(now);
        }
      }
    }
  }, [progress, isCurrentSong, isDragging, lastUpdateTime, isPlaying, duration]);

  // Reset slider when a new song starts and clean up timers
  useEffect(() => {
    if (isCurrentSong && song) {
      console.log(`Current song is now: ${song.title}, resetting slider`);
      setSliderValue(0);
      isFirstSongPlayed.current = true;
    }
    
    // Cleanup timer on unmount or song change
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [isCurrentSong, song]);

  // When duration changes, make sure we update any UI that depends on it
  useEffect(() => {
    if (isCurrentSong && duration > 0) {
      console.log(`Duration updated in song.tsx: ${duration.toFixed(2)}s`);
    }
  }, [duration, isCurrentSong]);

  // Add detailed logging to track progress updates
  useEffect(() => {
    if (isCurrentSong && isPlaying && Math.floor(sliderValue) % 2 === 0 && sliderValue > 0) {
      console.log(`Progress in song.tsx: ${sliderValue.toFixed(2)}s / ${duration.toFixed(2)}s (${((sliderValue/duration)*100).toFixed(1)}%)`);
    }
  }, [sliderValue, isCurrentSong, isPlaying, duration]);

  const handlePlayPause = () => {
    if (isCurrentSong) {
      togglePlayPause();
    } else if (song) {
      playSong(song);
    }
  };

  const handleSeekStart = () => {
    setIsDragging(true);
  };

  const handleSeekChange = (value: number) => {
    setSliderValue(value);
  };

  const handleSeekComplete = async (value: number) => {
    if (isCurrentSong) {
      await seekTo(value);
    } else if (song) {
      await playSong(song);
      setTimeout(() => {
        seekTo(value).catch(e => console.error('Error seeking after play:', e));
      }, 200);
    }
    setIsDragging(false);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === null || seconds === undefined || seconds < 0) {
      return '0:00';
    }
    
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleToggleLike = () => {
    if (song) {
      toggleLike(song);
      setSong(prev => prev ? {
        ...prev,
        isLiked: !prev.isLiked
      } : null);
    }
  };

  const handleAddToPlaylist = (playlistId: number) => {
    if (song) {
      addToPlaylist(song, playlistId);
      setShowPlaylistModal(false);
      Alert.alert('Success', 'Song added to playlist');
    }
  };

  const handleAddToQueue = () => {
    if (song) {
      addToQueue(song);
      Alert.alert('Success', 'Song added to queue');
    }
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreatePlaylistModal(false);
      Alert.alert('Success', 'Playlist created');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  if (!song) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Song not found</Text>
      </View>
    );
  }

  const songIsPlaying = isCurrentSong && isPlaying;
  const currentProgress = isDragging ? sliderValue : (isCurrentSong ? progress : 0);
  const currentDuration = isCurrentSong ? duration : 100;
  const isDurationAvailable = isCurrentSong && currentDuration > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleAddToQueue}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowPlaylistModal(true)}
          >
            <Ionicons name="list-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleToggleLike}
          >
            <Ionicons 
              name={song.isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={song.isLiked ? '#FF4B4B' : colors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <Image source={song.image} style={styles.albumArt} />
      
      <View style={styles.songInfo}>
        <Text style={[styles.title, { color: colors.text }]}>{song.title}</Text>
        <Text style={[styles.artist, { color: colors.neutral }]}>{song.artist}</Text>
      </View>

      <View style={styles.controls}>
        <Slider
          style={styles.progressBar}
          minimumValue={0}
          maximumValue={currentDuration > 0 ? currentDuration : 100}
          value={currentProgress}
          onSlidingStart={handleSeekStart}
          onValueChange={handleSeekChange}
          onSlidingComplete={handleSeekComplete}
          minimumTrackTintColor={colors.button}
          maximumTrackTintColor={colors.neutral}
          thumbTintColor={colors.button}
          disabled={!isDurationAvailable}
        />
        
        <View style={styles.timeContainer}>
          <Text style={[styles.time, { color: colors.neutral }]}>{formatTime(currentProgress)}</Text>
          <Text style={[styles.time, { color: colors.neutral }]}>{formatTime(currentDuration)}</Text>
        </View>

        <View style={styles.playbackControls}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={32} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playButton}
            onPress={handlePlayPause}
          >
            <Ionicons 
              name={songIsPlaying ? "pause" : "play"} 
              size={48} 
              color={colors.text} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="play-skip-forward" size={32} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showPlaylistModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlaylistModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add to Playlist</Text>
              <TouchableOpacity onPress={() => setShowPlaylistModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.createPlaylistButton}
              onPress={() => {
                setShowPlaylistModal(false);
                setShowCreatePlaylistModal(true);
              }}
            >
              <Ionicons name="add-circle" size={24} color={colors.text} />
              <Text style={[styles.createPlaylistText, { color: colors.text }]}>Create New Playlist</Text>
            </TouchableOpacity>

            {playlists.map(playlist => (
              <TouchableOpacity
                key={playlist.id}
                style={styles.playlistItem}
                onPress={() => handleAddToPlaylist(playlist.id)}
              >
                <Ionicons name="list" size={24} color={colors.text} />
                <Text style={[styles.playlistName, { color: colors.text }]}>{playlist.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCreatePlaylistModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreatePlaylistModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Playlist</Text>
                <TouchableOpacity onPress={() => setShowCreatePlaylistModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.playlistInput, { 
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card
                }]}
                placeholder="Playlist Name"
                placeholderTextColor={colors.neutral}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus={true}
              />

              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.button }]}
                onPress={handleCreatePlaylist}
              >
                <Text style={styles.createButtonText}>Create Playlist</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    padding: 8,
  },
  backButton: {
    padding: 8,
  },
  albumArt: {
    width: 300,
    height: 300,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 80,
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  artist: {
    fontSize: 18,
  },
  controls: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  progressBar: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  time: {
    fontSize: 14,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  playlistName: {
    fontSize: 16,
    marginLeft: 15,
  },
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  createPlaylistText: {
    fontSize: 16,
    marginLeft: 15,
  },
  playlistInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  createButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 