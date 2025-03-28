import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMusic } from '@/app/context/MusicContext';
import { useTheme } from '@/app/context/ThemeContext';

export default function NowPlaying() {
  const router = useRouter();
  const { colors } = useTheme();
  const { 
    currentSong, 
    isPlaying, 
    progress, 
    duration, 
    togglePlayPause,
    skipToNext,
    queue,
    addToQueue,
    playlists,
    addToPlaylist,
    topArtists
  } = useMusic();

  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  // Show either if song is playing or there are songs in queue
  const shouldShow = currentSong || queue.length > 0;
  
  if (!shouldShow) {
    return null;
  }

  // Determine what to display
  const displaySong = currentSong || (queue.length > 0 ? queue[0] : null);
  
  if (!displaySong) {
    return null;
  }

  // Calculate progress percentage for the progress bar
  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  const handlePlayerPress = () => {
    if (currentSong) {
      router.push('/player');
    } else if (queue.length > 0) {
      router.push('/player');
    }
  };

  const handlePlayAction = () => {
    if (currentSong) {
      togglePlayPause();
    } else if (queue.length > 0) {
      // Play the first song in queue
      skipToNext();
    }
  };

  const handleSkipNext = () => {
    skipToNext();
  };

  const handleAddToQueue = () => {
    if (displaySong) {
      addToQueue(displaySong);
      setShowOptionsModal(false);
      Alert.alert('Success', 'Song added to queue');
    }
  };

  const handleAddToPlaylist = (playlistId: number) => {
    if (displaySong) {
      addToPlaylist(displaySong, playlistId);
      setShowPlaylistModal(false);
      Alert.alert('Success', 'Song added to playlist');
    }
  };

  const handleArtistPress = (artistName: string) => {
    // Close any open modals first
    setShowOptionsModal(false);
    setShowPlaylistModal(false);

    console.log('Attempting to navigate to artist:', artistName);
    console.log('Available artists:', topArtists.map(a => a.name));
    
    if (!artistName) {
      console.log('No artist name provided');
      return;
    }
    
    // Find the artist in topArtists array
    const artist = topArtists.find(a => a.name.toLowerCase() === artistName.toLowerCase());
    
    if (artist) {
      console.log('Found artist:', artist.name);
      try {
        // Navigate directly to the artist profile
        router.push({
          pathname: '/artist',
          params: { artist: JSON.stringify(artist) }
        });
      } catch (error) {
        console.error('Error navigating to artist:', error);
        Alert.alert(
          'Navigation Error',
          'Sorry, there was an error navigating to the artist profile.',
          [{ text: 'OK' }]
        );
      }
    } else {
      console.log('Artist not found:', artistName);
      Alert.alert(
        'Artist Not Found',
        'Sorry, we couldn\'t find this artist\'s profile.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={[
          styles.container, 
          { 
            backgroundColor: colors.card,
            borderColor: colors.border
          }
        ]} 
        onPress={handlePlayerPress}
        activeOpacity={0.8}
      >
        <Image source={displaySong.image} style={styles.albumArt} />
        
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, { color: colors.text }]} numberOfLines={1}>
            {displaySong.title}
          </Text>
          <View style={styles.subtitleContainer}>
            <TouchableOpacity onPress={() => {
              console.log('Artist name clicked:', displaySong.artist);
              handleArtistPress(displaySong.artist);
            }}>
              <Text style={[styles.artistName, { color: colors.button }]} numberOfLines={1}>
                {displaySong.artist}
              </Text>
            </TouchableOpacity>
            {queue.length > 0 && !currentSong && (
              <Text style={[styles.queueLabel, { color: colors.button }]}>
                • Next in Queue
              </Text>
            )}
            {queue.length > 0 && currentSong && (
              <Text style={[styles.queueLabel, { color: colors.button }]}>
                • {queue.length} in Queue
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={handlePlayAction}
          >
            <Ionicons 
              name={currentSong && isPlaying ? 'pause' : 'play'} 
              size={28} 
              color={colors.text} 
            />
          </TouchableOpacity>

          {(currentSong || queue.length > 1) && (
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={handleSkipNext}
            >
              <Ionicons 
                name="play-skip-forward" 
                size={28} 
                color={colors.text} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        {currentSong && (
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: colors.button
                }
              ]} 
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={[styles.optionsModalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.optionsModalContent, { backgroundColor: colors.background }]}>
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
          </View>
        </View>
      </Modal>

      {/* Playlists Modal */}
      <Modal
        visible={showPlaylistModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlaylistModal(false)}
      >
        <View style={[styles.playlistModalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
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
          </View>
        </View>
      </Modal>
    </>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: width,
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
    marginRight: 8,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  artistName: {
    fontSize: 12,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueLabel: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 4,
    marginRight: 8,
  },
  playButton: {
    padding: 4,
    marginRight: 4,
  },
  skipButton: {
    padding: 4,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1DB954',
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