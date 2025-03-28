import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, FlatList, Dimensions, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMusic } from './context/MusicContext';
import { useTheme } from './context/ThemeContext';
import Slider from '@react-native-community/slider';

export default function PlayerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { 
    currentSong, 
    isPlaying, 
    progress, 
    duration, 
    togglePlayPause, 
    queue,
    skipToNext,
    skipToPrevious,
    clearQueue,
    removeFromQueue,
    toggleLike,
    isAutoPlayEnabled,
    toggleAutoPlay,
    seekTo,
    addToQueue,
    playlists,
    addToPlaylist,
    topArtists
  } = useMusic();
  
  // Only track local slider state when dragging
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  // Initialize slider with progress when component mounts or song changes
  useEffect(() => {
    if (currentSong) {
      setSliderPosition(progress);
    }
  }, [currentSong?.id, progress]);

  const handleBackPress = () => {
    router.back();
  };

  const handlePlayPause = () => {
    togglePlayPause();
  };

  const handleSkipNext = () => {
    skipToNext();
  };

  const handleSkipPrevious = () => {
    skipToPrevious();
  };

  const handleSeekStart = () => {
    setIsDragging(true);
    setSliderPosition(progress);
  };

  const handleSeekChange = (value: number) => {
    setSliderPosition(value);
  };

  const handleSeekComplete = async (value: number) => {
    if (currentSong) {
      try {
        await seekTo(value);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
    setIsDragging(false);
  };

  const handleClearQueue = () => {
    Alert.alert(
      'Clear Queue',
      'Are you sure you want to clear your entire queue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => clearQueue()
        }
      ]
    );
  };

  const handleToggleLike = () => {
    if (currentSong) {
      toggleLike(currentSong);
    }
  };

  const handleAddToQueue = () => {
    if (currentSong) {
      addToQueue(currentSong);
      setShowOptionsModal(false);
      Alert.alert('Success', 'Song added to queue');
    }
  };

  const handleAddToPlaylist = (playlistId: number) => {
    if (currentSong) {
      addToPlaylist(currentSong, playlistId);
      setShowPlaylistModal(false);
      Alert.alert('Success', 'Song added to playlist');
    }
  };

  const handleArtistPress = (artistName: string) => {
    // Find the artist in topArtists array
    const artist = topArtists.find(a => a.name === artistName);
    if (artist) {
      router.push({
        pathname: '/artist',
        params: { artist: JSON.stringify(artist) }
      });
    }
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

  // Display value - use slider position when dragging, otherwise use global progress
  const displayValue = isDragging ? sliderPosition : progress;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
        >
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Now Playing</Text>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowOptionsModal(true)}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.neutral} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={true}
      >
        {currentSong ? (
          <View style={styles.nowPlayingContainer}>
            <Image source={currentSong.image} style={styles.albumArt} />
            
            <View style={styles.songInfo}>
              <Text style={[styles.songTitle, { color: colors.text }]}>{currentSong.title}</Text>
              <TouchableOpacity onPress={() => handleArtistPress(currentSong.artist)}>
                <Text style={[styles.artistName, { color: colors.button }]}>{currentSong.artist}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.progressContainer}>
              <Slider
                style={styles.progressBar}
                minimumValue={0}
                maximumValue={Math.max(duration, 1)}
                value={displayValue}
                minimumTrackTintColor={colors.button}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.button}
                onSlidingStart={handleSeekStart}
                onValueChange={handleSeekChange}
                onSlidingComplete={handleSeekComplete}
              />
              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: colors.neutral }]}>
                  {formatTime(displayValue)}
                </Text>
                <Text style={[styles.timeText, { color: colors.neutral }]}>
                  {formatTime(duration)}
                </Text>
              </View>
            </View>
            
            <View style={styles.controls}>
              <TouchableOpacity style={styles.controlButton} onPress={handleToggleLike}>
                <Ionicons 
                  name={currentSong.isLiked ? "heart" : "heart-outline"} 
                  size={26} 
                  color={currentSong.isLiked ? colors.button : colors.text} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={handleSkipPrevious}
              >
                <Ionicons name="play-skip-back" size={28} color={colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.playButton, { backgroundColor: colors.button }]} 
                onPress={handlePlayPause}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={32} 
                  color={colors.background} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={handleSkipNext}
              >
                <Ionicons name="play-skip-forward" size={28} color={colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={toggleAutoPlay}
              >
                <Ionicons 
                  name={isAutoPlayEnabled ? "repeat" : "repeat-outline"} 
                  size={26} 
                  color={isAutoPlayEnabled ? colors.button : colors.text} 
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyPlayerContainer}>
            <Ionicons name="musical-notes" size={64} color={colors.neutral} />
            <Text style={[styles.emptyPlayerText, { color: colors.text }]}>No song playing</Text>
          </View>
        )}
        
        <View style={[styles.queueSection, { borderTopColor: colors.border }]}>
          <View style={styles.queueHeader}>
            <Text style={[styles.queueTitle, { color: colors.text }]}>Next in Queue</Text>
            {queue.length > 0 && (
              <TouchableOpacity 
                style={styles.clearQueueButton}
                onPress={handleClearQueue}
              >
                <Text style={[styles.clearQueueText, { color: colors.button }]}>
                  Clear Queue
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {queue.length === 0 ? (
            <View style={styles.emptyQueueContainer}>
              <Text style={[styles.emptyQueueText, { color: colors.neutral }]}>
                Your queue is empty
              </Text>
              <Text style={[styles.autoplayText, { color: colors.neutral }]}>
                {isAutoPlayEnabled ? 
                  "Autoplay is on. Similar songs will play after the current one ends." : 
                  "Autoplay is off. Add songs to your queue to keep the music going."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={queue}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }) => (
                <View style={[styles.queueItem, { borderBottomColor: colors.border }]}>
                  <Image source={item.image} style={styles.queueItemImage} />
                  <View style={styles.queueItemInfo}>
                    <Text style={[styles.queueItemTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.queueItemArtist, { color: colors.neutral }]}>
                      {item.artist}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromQueue(item.id)}
                  >
                    <Ionicons name="close" size={20} color={colors.neutral} />
                  </TouchableOpacity>
                </View>
              )}
              style={styles.queueList}
              contentContainerStyle={{ paddingBottom: 200 }}
              scrollEnabled={false}
              ListFooterComponent={<View style={{ height: 200 }} />}
            />
          )}
        </View>
        <View style={{ height: 300 }} />
      </ScrollView>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity 
          style={[styles.optionsModalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          activeOpacity={1} 
          onPress={() => setShowOptionsModal(false)}
        >
          <TouchableOpacity 
            style={[styles.optionsModalContent, { backgroundColor: colors.background }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Options</Text>
              <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleAddToQueue}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Add to Queue</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsModal(false);
                setShowPlaylistModal(true);
              }}
            >
              <Ionicons name="list-outline" size={24} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Add to Playlist</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Playlists Modal */}
      <Modal
        visible={showPlaylistModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlaylistModal(false)}
      >
        <TouchableOpacity 
          style={[styles.playlistModalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          activeOpacity={1}
          onPress={() => setShowPlaylistModal(false)}
        >
          <TouchableOpacity 
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add to Playlist</Text>
              <TouchableOpacity onPress={() => setShowPlaylistModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  contentContainer: {
    flex: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  menuButton: {
    padding: 8,
  },
  nowPlayingContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  albumArt: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 12,
    marginBottom: 24,
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  songTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  artistName: {
    fontSize: 16,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  timeText: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  queueTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearQueueButton: {
    padding: 8,
  },
  clearQueueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  queueList: {
    flex: 1,
    paddingBottom: 200,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  queueItemImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  queueItemInfo: {
    flex: 1,
  },
  queueItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  queueItemArtist: {
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
  },
  emptyQueueContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyQueueText: {
    fontSize: 16,
    marginBottom: 8,
  },
  autoplayText: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: '80%',
  },
  emptyPlayerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyPlayerText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
  },
  // Modal Styles
  optionsModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  optionsModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
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
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 15,
  },
  playlistModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  playlistName: {
    fontSize: 16,
    marginLeft: 15,
  },
}); 