import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { useMusic } from './context/MusicContext';
import { getSongById } from '@/app/services/databaseService';
import Slider from '@react-native-community/slider';

interface Song {
  id: number;
  title: string;
  artist: string;
  image: any;
  audio: any;
  isLiked?: boolean;
  plays?: number;
  song_url?: string;
  art_url?: string;
  artist_socials?: any;
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
    seekTo,
    skipToNext,
    skipToPrevious,
    topArtists
  } = useMusic();
  
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);

  useEffect(() => {
    if (songParam) {
      try {
        const parsedSong = JSON.parse(songParam as string);
        // Fetch full song details from database
        loadSongDetails(parsedSong.id);
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

  const loadSongDetails = async (songId: number) => {
    try {
      setIsLoading(true);
      const songDetails = await getSongById(songId);
      if (songDetails) {
        setSong(songDetails);
      } else {
        Alert.alert('Error', 'Song not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading song details:', error);
      Alert.alert('Error', 'Failed to load song details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentSong = currentSong?.id === song?.id;
  const isLiked = song ? likedSongs.some(likedSong => likedSong.id === song.id) : false;

  // Initialize slider with progress when component mounts or song changes
  useEffect(() => {
    if (isCurrentSong) {
      setSliderPosition(progress);
    }
  }, [isCurrentSong, progress]);

  const handlePlayPause = () => {
    if (isCurrentSong) {
      togglePlayPause();
    } else if (song) {
      playSong(song);
    }
  };

  const handleSeekStart = () => {
    setIsDragging(true);
    setSliderPosition(progress);
  };

  const handleSeekEnd = async () => {
    setIsDragging(false);
    await seekTo(sliderPosition);
  };

  const handleSeekChange = (value: number) => {
    setSliderPosition(value);
  };

  const handleAddToPlaylist = (playlistId: number) => {
    if (song) {
      addToPlaylist(song, playlistId);
      setShowPlaylistModal(false);
    }
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName);
      setNewPlaylistName('');
      setShowCreatePlaylistModal(false);
    }
  };

  const handleAddToQueue = () => {
    if (song) {
      addToQueue(song);
      setShowOptionsModal(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading || !song) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading song...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Now Playing</Text>
        <TouchableOpacity
          style={styles.optionsButton}
          onPress={() => setShowOptionsModal(true)}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Image source={song.image} style={styles.albumArt} />
        <Text style={[styles.songTitle, { color: colors.text }]}>{song.title}</Text>
        <TouchableOpacity onPress={() => router.push({
          pathname: '/artist',
          params: { artist: JSON.stringify({ name: song.artist }) }
        })}>
          <Text style={[styles.artistName, { color: colors.primary }]}>{song.artist}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={isDragging ? sliderPosition : progress}
          onSlidingStart={handleSeekStart}
          onSlidingComplete={handleSeekEnd}
          onValueChange={handleSeekChange}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
        <View style={styles.timeContainer}>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {formatTime(isDragging ? sliderPosition : progress)}
          </Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => skipToPrevious()}
        >
          <Ionicons name="play-skip-back" size={32} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlayPause}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={48}
            color={colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => skipToNext()}
        >
          <Ionicons name="play-skip-forward" size={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleLike(song)}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? colors.primary : colors.text}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowPlaylistModal(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Playlist Modal */}
      <Modal
        visible={showPlaylistModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlaylistModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add to Playlist</Text>
            <TouchableOpacity
              onPress={() => setShowPlaylistModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {playlists.map(playlist => (
              <TouchableOpacity
                key={playlist.id}
                style={[styles.playlistItem, { backgroundColor: colors.card }]}
                onPress={() => handleAddToPlaylist(playlist.id)}
              >
                <Text style={[styles.playlistName, { color: colors.text }]}>{playlist.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.createPlaylistButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowPlaylistModal(false);
                setShowCreatePlaylistModal(true);
              }}
            >
              <Text style={styles.createPlaylistText}>Create New Playlist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Playlist Modal */}
      <Modal
        visible={showCreatePlaylistModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreatePlaylistModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Playlist</Text>
            <TouchableOpacity
              onPress={() => setShowCreatePlaylistModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Playlist Name"
              placeholderTextColor={colors.textSecondary}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={handleCreatePlaylist}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Options</Text>
            <TouchableOpacity
              onPress={() => setShowOptionsModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={[styles.optionItem, { backgroundColor: colors.card }]}
              onPress={handleAddToQueue}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>Add to Queue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionsButton: {
    padding: 8,
  },
  content: {
    alignItems: 'center',
    padding: 16,
  },
  albumArt: {
    width: 300,
    height: 300,
    borderRadius: 8,
    marginBottom: 24,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  artistName: {
    fontSize: 18,
  },
  controls: {
    padding: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  time: {
    fontSize: 14,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  iconButton: {
    padding: 16,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  actionButton: {
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    marginTop: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 16,
  },
  playlistItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  playlistName: {
    fontSize: 16,
  },
  createPlaylistButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  createPlaylistText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  createButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
  },
}); 