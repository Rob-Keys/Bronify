import { StyleSheet, ScrollView, View, Text, Image, TouchableOpacity, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { useState, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';

interface Song {
  id: number;
  title: string;
  artist: string;
  image: any;
  audio: any;
  sound?: Audio.Sound;
}

interface NewsItem {
  id: number;
  title: string;
  source: string;
  timestamp: string;
}

const topSongs: Song[] = [
  { 
    id: 1, 
    title: 'Song 1', 
    artist: 'Artist 1', 
    image: require('@/assets/images/default_song.jpg'),
    audio: require('@/assets/songs/first_song.mp3')
  },
  { 
    id: 2, 
    title: 'Song 2', 
    artist: 'Artist 2', 
    image: require('@/assets/images/default_song.jpg'),
    audio: require('@/assets/songs/first_song.mp3')
  },
  { 
    id: 3, 
    title: 'Song 3', 
    artist: 'Artist 3', 
    image: require('@/assets/images/default_song.jpg'),
    audio: require('@/assets/songs/first_song.mp3')
  },
  { 
    id: 4, 
    title: 'Song 4', 
    artist: 'Artist 4', 
    image: require('@/assets/images/default_song.jpg'),
    audio: require('@/assets/songs/first_song.mp3')
  },
];

const topArtists = [
  { id: 1, name: 'Artist 1', image: require('@/assets/images/default_pfp.jpg') },
  { id: 2, name: 'Artist 2', image: require('@/assets/images/default_pfp.jpg') },
  { id: 3, name: 'Artist 3', image: require('@/assets/images/default_pfp.jpg') },
  { id: 4, name: 'Artist 4', image: require('@/assets/images/default_pfp.jpg') },
];

const lebronStats = {
  lastGame: {
    points: 28,
    rebounds: 12,
    assists: 8,
    steals: 2,
    blocks: 1,
    opponent: 'Warriors',
    date: 'Mar 15, 2024',
  },
  season: {
    points: 25.3,
    rebounds: 7.2,
    assists: 8.1,
    steals: 1.2,
    blocks: 0.6,
  },
};

const lebronNews: NewsItem[] = [
  {
    id: 1,
    title: 'LeBron James reaches 40,000 career points milestone',
    source: 'ESPN',
    timestamp: '2h ago',
  },
  {
    id: 2,
    title: 'Lakers star LeBron James named Western Conference Player of the Week',
    source: 'NBA.com',
    timestamp: '1d ago',
  },
  {
    id: 3,
    title: 'LeBron James discusses his future with the Lakers',
    source: 'The Athletic',
    timestamp: '2d ago',
  },
];

const songs: Song[] = [
  {
    id: 1,
    title: "First Song",
    artist: "Artist 1",
    image: require('@/assets/images/default_song.jpg'),
    audio: require('@/assets/songs/first_song.mp3'),
  },
  {
    id: 2,
    title: "Second Song",
    artist: "Artist 2",
    image: require('@/assets/images/default_song.jpg'),
    audio: require('@/assets/songs/first_song.mp3'),
  },
  {
    id: 3,
    title: "Third Song",
    artist: "Artist 3",
    image: require('@/assets/images/default_song.jpg'),
    audio: require('@/assets/songs/first_song.mp3'),
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [songs, setSongs] = useState<Song[]>(topSongs);

  useEffect(() => {
    setupAudio();
    return () => {
      cleanupAudio();
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
      Alert.alert('Error', 'Failed to set up audio playback');
    }
  };

  const cleanupAudio = async () => {
    try {
      for (const song of songs) {
        if (song.sound) {
          await song.sound.unloadAsync();
        }
      }
    } catch (error) {
      console.error('Error cleaning up audio:', error);
    }
  };

  const handleSongPress = async (song: Song) => {
    try {
      // If a song is currently playing, stop it
      if (currentlyPlaying !== null && currentlyPlaying !== song.id) {
        const currentSong = songs.find(s => s.id === currentlyPlaying);
        if (currentSong?.sound) {
          await currentSong.sound.stopAsync();
        }
      }

      // If the song is already loaded, just play it
      if (song.sound) {
        const status = await song.sound.getStatusAsync();
        if (status.isLoaded) {
          await song.sound.playAsync();
          setCurrentlyPlaying(song.id);
          return;
        }
      }

      // Load the new song without auto-playing
      const { sound } = await Audio.Sound.createAsync(
        song.audio,
        { shouldPlay: false }
      );

      // Update the song in the state with the loaded sound
      setSongs(prevSongs => 
        prevSongs.map(s => 
          s.id === song.id ? { ...s, sound } : s
        )
      );

      // Now play the sound
      await sound.playAsync();
      setCurrentlyPlaying(song.id);
    } catch (error) {
      console.error('Error playing song:', error);
      Alert.alert('Error', 'Failed to play the song. Please try again.');
    }
  };

  const handleSongCardPress = (song: Song) => {
    router.push({
      pathname: '/song',
      params: { song: JSON.stringify(song) }
    });
  };

  const handlePlayPause = async (song: Song) => {
    try {
      if (!song.sound) {
        await handleSongPress(song);
        return;
      }

      const status = await song.sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await song.sound.pauseAsync();
          setCurrentlyPlaying(null);
        } else {
          await song.sound.playAsync();
          setCurrentlyPlaying(song.id);
        }
      } else {
        // If the sound is not loaded, try to load and play it
        await handleSongPress(song);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      Alert.alert('Error', 'Failed to control playback. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good evening</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="time-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="settings-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Songs</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {songs.map((song) => (
              <Pressable
                key={song.id}
                style={styles.songCard}
                onPress={() => handleSongCardPress(song)}
              >
                <View style={styles.songImageContainer}>
                  <Image source={song.image} style={styles.songImage} />
                </View>
                <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Artists</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {topArtists.map((artist) => (
              <TouchableOpacity key={artist.id} style={styles.artistItem}>
                <Image source={artist.image} style={styles.artistImage} />
                <Text style={styles.artistName}>{artist.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LeBron James Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Last Game</Text>
              <Text style={styles.statsSubtitle}>{lebronStats.lastGame.opponent}</Text>
              <Text style={styles.statsSubtitle}>{lebronStats.lastGame.date}</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lebronStats.lastGame.points}</Text>
                  <Text style={styles.statLabel}>PTS</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lebronStats.lastGame.rebounds}</Text>
                  <Text style={styles.statLabel}>REB</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lebronStats.lastGame.assists}</Text>
                  <Text style={styles.statLabel}>AST</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lebronStats.lastGame.steals}</Text>
                  <Text style={styles.statLabel}>STL</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lebronStats.lastGame.blocks}</Text>
                  <Text style={styles.statLabel}>BLK</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Season Average</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lebronStats.season.points}</Text>
                  <Text style={styles.statLabel}>PTS</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lebronStats.season.rebounds}</Text>
                  <Text style={styles.statLabel}>REB</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lebronStats.season.assists}</Text>
                  <Text style={styles.statLabel}>AST</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lebronStats.season.steals}</Text>
                  <Text style={styles.statLabel}>STL</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lebronStats.season.blocks}</Text>
                  <Text style={styles.statLabel}>BLK</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LeBron News</Text>
          {lebronNews.map((news) => (
            <TouchableOpacity key={news.id} style={styles.newsItem}>
              <View style={styles.newsContent}>
                <Text style={styles.newsTitle}>{news.title}</Text>
                <View style={styles.newsFooter}>
                  <Text style={styles.newsSource}>{news.source}</Text>
                  <Text style={styles.newsTimestamp}>{news.timestamp}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#B3B3B3" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  songCard: {
    marginRight: 16,
    width: 160,
  },
  songImageContainer: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  songImage: {
    width: 160,
    height: 160,
    borderRadius: 8,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: '#B3B3B3',
  },
  artistItem: {
    marginRight: 16,
    alignItems: 'center',
  },
  artistImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  artistName: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  statsContainer: {
    gap: 16,
  },
  statsCard: {
    backgroundColor: '#282828',
    borderRadius: 12,
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#B3B3B3',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: '18%',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#B3B3B3',
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 8,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newsSource: {
    fontSize: 14,
    color: '#1DB954',
  },
  newsTimestamp: {
    fontSize: 14,
    color: '#B3B3B3',
  },
});
