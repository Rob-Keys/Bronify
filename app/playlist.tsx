import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { useMusic } from './context/MusicContext';
import DraggableFlatList, { 
  RenderItemParams,
  ScaleDecorator 
} from 'react-native-draggable-flatlist';

export default function PlaylistScreen() {
  const { playlistId } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const { 
    playlists, 
    removeFromPlaylist, 
    playPlaylist,
    reorderPlaylist,
    currentPlaylistId,
    playlistOrder,
    currentSong,
    togglePlayPause,
    getSongWithState
  } = useMusic();

  const playlist = playlists.find(p => p.id === Number(playlistId));
  const isCurrentPlaylist = currentPlaylistId === Number(playlistId);

  if (!playlist) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Playlist not found</Text>
      </View>
    );
  }

  const handleSongPress = (song: any, index: number) => {
    if (isCurrentPlaylist) {
      // If this is the current playlist, play from the current index
      playPlaylist(playlist.id, index, false);
    } else {
      // Otherwise, navigate to the song screen
      router.push({
        pathname: '/song',
        params: { song: JSON.stringify(song) }
      });
    }
  };

  const handleRemoveSong = (songId: number) => {
    Alert.alert(
      'Remove Song',
      'Are you sure you want to remove this song from the playlist?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFromPlaylist(songId, playlist.id);
            Alert.alert('Success', 'Song removed from playlist');
          }
        }
      ]
    );
  };

  const handlePlayAll = () => {
    playPlaylist(playlist.id, 0, false);
  };

  const handleShufflePlay = () => {
    playPlaylist(playlist.id, 0, true);
  };

  const renderSongItem = ({ item, drag, isActive }: RenderItemParams<any>) => {
    const song = item;
    const songWithState = getSongWithState(song);
    const index = playlist.songs.indexOf(song);
    const isCurrentSong = currentSong?.id === song.id;

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.songItem,
            { borderBottomColor: colors.border },
            isCurrentSong && { backgroundColor: colors.button + '20' }
          ]}
          onPress={() => handleSongPress(song, index)}
        >
          <View style={styles.songItemContent}>
            <Image
              source={song.image}
              style={styles.songImage}
            />
            <View style={styles.songInfo}>
              <Text style={[styles.songTitle, { color: colors.text }]}>{song.title}</Text>
              <Text style={[styles.songArtist, { color: colors.neutral }]}>{song.artist}</Text>
              {isCurrentSong && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          backgroundColor: colors.button,
                          width: `${((songWithState.progress || 0) / (songWithState.duration || 1)) * 100}%`
                        }
                      ]} 
                    />
                  </View>
                </View>
              )}
            </View>
            <View style={styles.songActions}>
              {isCurrentSong && (
                <TouchableOpacity onPress={togglePlayPause}>
                  <Ionicons 
                    name={songWithState.isPlaying ? "pause-circle" : "play-circle"} 
                    size={24} 
                    color={colors.button} 
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveSong(song.id)}
              >
                <Ionicons name="remove-circle-outline" size={24} color={colors.negative} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.playlistName, { color: colors.text }]}>{playlist.name}</Text>
          <Text style={[styles.songCount, { color: colors.neutral }]}>
            {playlist.songs.length} songs
          </Text>
        </View>
      </View>

      <View style={styles.playbackControls}>
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: colors.button }]}
          onPress={handlePlayAll}
        >
          <Ionicons name="play" size={20} color="white" />
          <Text style={styles.playButtonText}>Play All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shuffleButton, { backgroundColor: colors.background }]}
          onPress={handleShufflePlay}
        >
          <Ionicons name="shuffle" size={20} color={colors.text} />
          <Text style={[styles.shuffleButtonText, { color: colors.text }]}>Shuffle</Text>
        </TouchableOpacity>
      </View>

      <DraggableFlatList
        data={playlist.songs}
        onDragEnd={({ data }) => {
          const newOrder = data.map(song => playlist.songs.indexOf(song));
          reorderPlaylist(playlist.id, 0, 0); // This will be updated with the actual reordering logic
        }}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSongItem}
        contentContainerStyle={styles.songList}
      />
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
    paddingTop: Platform.OS === 'ios' ? 60 : 0,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  songCount: {
    fontSize: 14,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    gap: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 100,
    justifyContent: 'center',
    gap: 6,
  },
  playButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 100,
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#666',
  },
  shuffleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  songList: {
    flexGrow: 1,
  },
  songItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  songItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  songImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
  },
  songActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  progressContainer: {
    marginTop: 4,
    width: 100,
  },
  progressBar: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
}); 