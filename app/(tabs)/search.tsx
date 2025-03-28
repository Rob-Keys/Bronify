import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Image, Platform, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useMusic } from '@/app/context/MusicContext';
import { useState, useEffect } from 'react';
import { getPlayCount } from '@/app/services/playCountService';
import { fetchSongs } from '@/app/services/databaseService';

interface Song {
  id: number;
  title: string;
  artist: string;
  image: any;
  audio: any;
  plays?: number;
}

// Sort types
type SortType = 'none' | 'plays' | 'title' | 'artist';

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { playSong, togglePlayPause, currentSong, isPlaying } = useMusic();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [songPlayCounts, setSongPlayCounts] = useState<{[key: number]: number}>({});
  
  // Load songs from database on mount
  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setIsLoading(true);
      const fetchedSongs = await fetchSongs();
      setSongs(fetchedSongs);
    } catch (error) {
      console.error('Error loading songs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load play counts when the component mounts
  useEffect(() => {
    const loadPlayCounts = async () => {
      const counts: {[key: number]: number} = {};
      
      // Load play counts for all songs
      for (const song of songs) {
        const playCount = await getPlayCount(song.id);
        counts[song.id] = playCount;
      }
      
      setSongPlayCounts(counts);
    };
    
    loadPlayCounts();
  }, [songs]);
  
  // Function to get the total play count (initial + stored)
  const getTotalPlayCount = (songId: number, initialCount: number = 0): number => {
    const storedCount = songPlayCounts[songId] || 0;
    return initialCount + storedCount;
  };
  
  // Filter songs based on search query
  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort songs based on selected sort type
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    switch (sortType) {
      case 'plays':
        // Use the combined play counts for sorting
        return getTotalPlayCount(b.id, b.plays || 0) - getTotalPlayCount(a.id, a.plays || 0);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'artist':
        return a.artist.localeCompare(b.artist);
      default:
        return 0; // No sorting
    }
  });
  
  const handleSongPress = (song: Song) => {
    router.push({
      pathname: '/song',
      params: { song: JSON.stringify(song) }
    });
  };
  
  const handlePlayPause = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlayPause();
    } else {
      playSong(song);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const toggleSortModal = () => {
    setShowSortModal(!showSortModal);
  };

  const getSortTitle = (): string => {
    switch (sortType) {
      case 'plays':
        return 'Most Plays';
      case 'title':
        return 'Title A-Z';
      case 'artist':
        return 'Artist A-Z';
      default:
        return 'Sort By';
    }
  };

  const getSortIcon = (): string => {
    switch (sortType) {
      case 'plays':
        return 'flame';
      case 'title':
        return 'text';
      case 'artist':
        return 'person';
      default:
        return 'filter';
    }
  };
  
  const renderSongItem = ({ item: song }: { item: Song }) => {
    const isCurrentSong = currentSong?.id === song.id;
    const isPlayingThisSong = isCurrentSong && isPlaying;
    const totalPlayCount = getTotalPlayCount(song.id, song.plays);
    
    return (
      <TouchableOpacity 
        style={[styles.songItem, { borderBottomColor: colors.border }]} 
        onPress={() => handleSongPress(song)}
      >
        <Image source={song.image} style={styles.songImage} />
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, { color: colors.text }]} numberOfLines={1}>{song.title}</Text>
          <View style={styles.songDetails}>
            <Text style={[styles.songArtist, { color: colors.neutral }]} numberOfLines={1}>{song.artist}</Text>
            <Text style={[styles.songPlays, { color: colors.neutral }]}>
              {formatNumber(totalPlayCount)} plays
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={() => handlePlayPause(song)}
        >
          <Ionicons 
            name={isPlayingThisSong ? "pause-circle" : "play-circle"} 
            size={36} 
            color={colors.button} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading songs...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={24} color={colors.neutral} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search songs or artists"
          placeholderTextColor={colors.neutral}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.neutral} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.headerContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>All Songs</Text>
        <TouchableOpacity 
          style={[styles.sortButton, sortType !== 'none' && { backgroundColor: colors.button }]} 
          onPress={toggleSortModal}
        >
          <Text style={[styles.sortButtonText, sortType !== 'none' && { color: colors.background }]}>
            {getSortTitle()}
          </Text>
          <Ionicons 
            name={getSortIcon()} 
            size={18} 
            color={sortType !== 'none' ? colors.background : colors.text} 
          />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={sortedSongs}
        renderItem={renderSongItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.songsList}
        showsVerticalScrollIndicator={false}
      />

      {/* Sort Options Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleSortModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={toggleSortModal}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sort Songs By</Text>
            
            <TouchableOpacity 
              style={[
                styles.sortOption, 
                sortType === 'none' && { backgroundColor: colors.background }
              ]} 
              onPress={() => {
                setSortType('none');
                toggleSortModal();
              }}
            >
              <Ionicons name="filter-outline" size={20} color={colors.text} />
              <Text style={[styles.sortOptionText, { color: colors.text }]}>Default</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.sortOption, 
                sortType === 'plays' && { backgroundColor: colors.background }
              ]} 
              onPress={() => {
                setSortType('plays');
                toggleSortModal();
              }}
            >
              <Ionicons name="flame" size={20} color={colors.text} />
              <Text style={[styles.sortOptionText, { color: colors.text }]}>Most Plays</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.sortOption, 
                sortType === 'title' && { backgroundColor: colors.background }
              ]} 
              onPress={() => {
                setSortType('title');
                toggleSortModal();
              }}
            >
              <Ionicons name="text" size={20} color={colors.text} />
              <Text style={[styles.sortOptionText, { color: colors.text }]}>Title (A-Z)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.sortOption, 
                sortType === 'artist' && { backgroundColor: colors.background }
              ]} 
              onPress={() => {
                setSortType('artist');
                toggleSortModal();
              }}
            >
              <Ionicons name="person" size={20} color={colors.text} />
              <Text style={[styles.sortOptionText, { color: colors.text }]}>Artist (A-Z)</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    height: 48,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  sortButtonText: {
    marginRight: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  songsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  songImage: {
    width: 56,
    height: 56,
    borderRadius: 4,
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
  },
  songDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
  },
  songPlays: {
    fontSize: 14,
    fontWeight: '500',
  },
  playButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    width: '100%',
  },
  sortOptionText: {
    fontSize: 16,
    marginLeft: 12,
  },
}); 