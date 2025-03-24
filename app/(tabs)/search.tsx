import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Image, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useMusic } from '@/app/context/MusicContext';
import { useState } from 'react';

interface Song {
  id: number;
  title: string;
  artist: string;
  image: any;
  audio: any;
}

// Import the full song list
const songs: Song[] = [
  { id: 1, title: 'Evil Bron', artist: 'Bronify', image: require('@/assets/images/default_song.jpg'), audio: require('@/assets/songs/EvilBron.mp3') },
  { id: 2, title: 'Dear Lebron', artist: 'Bronify', image: require('@/assets/images/default_song.jpg'), audio: require('@/assets/songs/DearLebron.mp3') },
  { id: 3, title: 'Man On The Lakers', artist: 'Bronify', image: require('@/assets/images/default_song.jpg'), audio: require('@/assets/songs/ManOnTheLakers.mp3') },
  { id: 4, title: 'Thinking Bout Lebron', artist: 'Bronify', image: require('@/assets/images/default_song.jpg'), audio: require('@/assets/songs/ThinkingBoutLebron.mp3') },
  { id: 5, title: "That's Bron", artist: 'Bronify', image: require('@/assets/images/default_song.jpg'), audio: require('@/assets/songs/ThatsBron.mp3') },
  { id: 6, title: 'I Kissed Lebron', artist: 'Bronify', image: require('@/assets/images/default_song.jpg'), audio: require('@/assets/songs/IKissedLebron.mp3') },
  { id: 7, title: 'Not Throwing Away His Shot', artist: 'Bronify', image: require('@/assets/images/default_song.jpg'), audio: require('@/assets/songs/NotThrowingAwayHisShot.mp3') },
  { id: 8, title: 'They Got Luka Don', artist: 'Bronify', image: require('@/assets/images/default_song.jpg'), audio: require('@/assets/songs/TheyGotLukaDon.mp3') },
  { id: 9, title: 'Panic At Le Disco', artist: 'Bronify', image: require('@/assets/images/default_song.jpg'), audio: require('@/assets/songs/PanicAtLeDisco.mp3') },
  { id: 10, title: 'Lebron Lebron Lebron', artist: 'Bronify', image: require('@/assets/images/default_song.jpg'), audio: require('@/assets/songs/LebronLebronLebron.mp3') },
  { id: 11, title: 'Bron Mix', artist: 'Bronify', image: require('@/assets/images/default_song.jpg'), audio: require('@/assets/songs/BronMix.mp3') },
];

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { playSong, togglePlayPause, currentSong, isPlaying } = useMusic();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter songs based on search query
  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
  
  const renderSongItem = ({ item }: { item: Song }) => {
    const isCurrentSong = currentSong?.id === item.id;
    const songIsPlaying = isCurrentSong && isPlaying;
    
    return (
      <TouchableOpacity 
        style={[styles.songItem, { borderBottomColor: colors.border }]} 
        onPress={() => handleSongPress(item)}
      >
        <Image source={item.image} style={styles.songImage} />
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.songArtist, { color: colors.neutral }]} numberOfLines={1}>{item.artist}</Text>
        </View>
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={() => handlePlayPause(item)}
        >
          <Ionicons 
            name={songIsPlaying ? "pause-circle" : "play-circle"} 
            size={36} 
            color={colors.button} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  
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

      <Text style={[styles.sectionTitle, { color: colors.text }]}>All Songs</Text>
      
      <FlatList
        data={filteredSongs}
        renderItem={renderSongItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.songsList}
        showsVerticalScrollIndicator={false}
      />
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 16,
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
  songTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
  },
  playButton: {
    padding: 8,
  },
}); 