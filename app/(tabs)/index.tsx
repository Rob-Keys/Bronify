import { StyleSheet, ScrollView, View, Text, Image, TouchableOpacity, Pressable, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { getLebronLastGame, getLebronSeasonStats } from '../services/nbaStats';
import { getLebronNews, NewsItem } from '../services/newsService';
import { useTheme } from '../context/ThemeContext';

interface Song {
  id: number;
  title: string;
  artist: string;
  image: any;
  audio: any;
}

interface GameStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  opponent: string;
  date: string;
}

interface SeasonStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
}

const createSong = (id: number, title: string, artist: string, image: any, audio: any): Song => ({
  id,
  title,
  artist,
  image,
  audio,
});

const topSongs: Song[] = [
  createSong(1, 'Evil Bron', 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/EvilBron.mp3')),
  createSong(2, 'Dear Lebron', 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/DearLebron.mp3')),
  createSong(3, 'Man On The Lakers', 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/ManOnTheLakers.mp3')),
  createSong(4, 'Thinking Bout Lebron', 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/ThinkingBoutLebron.mp3')),
];

const topArtists = [
  { id: 1, name: 'Bronify', image: require('@/assets/images/default_pfp.jpg') },
  { id: 2, name: 'Bronify', image: require('@/assets/images/default_pfp.jpg') },
  { id: 3, name: 'Bronify', image: require('@/assets/images/default_pfp.jpg') },
  { id: 4, name: 'Bronify', image: require('@/assets/images/default_pfp.jpg') },
];

const songs: Song[] = [
  createSong(1, 'Evil Bron', 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/EvilBron.mp3')),
  createSong(2, 'Dear Lebron', 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/DearLebron.mp3')),
  createSong(3, 'Man On The Lakers', 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/ManOnTheLakers.mp3')),
  createSong(4, 'Thinking Bout Lebron', 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/ThinkingBoutLebron.mp3')),
  createSong(5, "That's Bron", 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/ThatsBron.mp3')),
  createSong(6, 'I Kissed Lebron', 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/IKissedLebron.mp3')),
  createSong(7, 'Not Throwing Away His Shot', 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/NotThrowingAwayHisShot.mp3')),
  createSong(8, 'They Got Luka Don', 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/TheyGotLukaDon.mp3')),
  createSong(9, 'Panic At Le Disco', 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/PanicAtLeDisco.mp3')),
  createSong(10, 'Lebron Lebron Lebron', 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/LebronLebronLebron.mp3')),
  createSong(11, 'Bron Mix', 'Bronify', require('@/assets/images/default_song.jpg'), require('@/assets/songs/BronMix.mp3')),
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { colors } = useTheme();
  const { currentSong, isPlaying, playSong, togglePlayPause } = useMusic();
  const [displayedSongs, setDisplayedSongs] = useState<Song[]>(topSongs); // Songs to display
  const [lastGameStats, setLastGameStats] = useState<GameStats | null>(null);
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        setError(null);
        const [lastGame, season] = await Promise.all([
          getLebronLastGame(),
          getLebronSeasonStats()
        ]);
        setLastGameStats(lastGame);
        setSeasonStats(season);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    }
    
    async function fetchNews() {
      try {
        setIsLoadingNews(true);
        setNewsError(null);
        const newsData = await getLebronNews();
        setNews(newsData);
      } catch (err) {
        console.error('Error fetching news:', err);
        setNewsError('Failed to load news');
      } finally {
        setIsLoadingNews(false);
      }
    }

    fetchStats();
    fetchNews();
  }, []);

  const handleSongPress = (song: Song) => {
    playSong(song);
  };

  const handleSongCardPress = (song: Song) => {
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

  const handleNewsPress = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => 
        console.error('Error opening URL:', err)
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>Hey, LeBron Fan!</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Songs</Text>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Text style={[styles.viewAllButton, { color: colors.button }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {topSongs.map((song) => (
              <TouchableOpacity
                key={song.id}
                style={[styles.songCard, { backgroundColor: colors.card }]}
                onPress={() => handleSongCardPress(song)}
              >
                <Image source={song.image} style={styles.songImage} />
                <Text style={[styles.songTitle, { color: colors.text }]} numberOfLines={1}>{song.title}</Text>
                <Text style={[styles.songArtist, { color: colors.neutral }]} numberOfLines={1}>{song.artist}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Artists</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {topArtists.map((artist) => (
              <View key={artist.id} style={[styles.artistItem, { backgroundColor: colors.card }]}>
                <Image source={artist.image} style={styles.artistImage} />
                <Text style={[styles.artistName, { color: colors.text }]}>{artist.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>LeBron Stats</Text>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.neutral }]}>Loading stats...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.negative }]}>{error}</Text>
            </View>
          ) : (
            <View style={styles.statsContainer}>
              {lastGameStats && (
                <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statsTitle, { color: colors.text }]}>Last Game</Text>
                  <Text style={[styles.statsSubtitle, { color: colors.neutral }]}>
                    vs {lastGameStats.opponent} • {lastGameStats.date}
                  </Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>{lastGameStats.points}</Text>
                      <Text style={[styles.statLabel, { color: colors.neutral }]}>PTS</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>{lastGameStats.rebounds}</Text>
                      <Text style={[styles.statLabel, { color: colors.neutral }]}>REB</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>{lastGameStats.assists}</Text>
                      <Text style={[styles.statLabel, { color: colors.neutral }]}>AST</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>{lastGameStats.steals}</Text>
                      <Text style={[styles.statLabel, { color: colors.neutral }]}>STL</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>{lastGameStats.blocks}</Text>
                      <Text style={[styles.statLabel, { color: colors.neutral }]}>BLK</Text>
                    </View>
                  </View>
                </View>
              )}

              {seasonStats && (
                <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statsTitle, { color: colors.text }]}>Season Average</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>{seasonStats.points}</Text>
                      <Text style={[styles.statLabel, { color: colors.neutral }]}>PTS</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>{seasonStats.rebounds}</Text>
                      <Text style={[styles.statLabel, { color: colors.neutral }]}>REB</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>{seasonStats.assists}</Text>
                      <Text style={[styles.statLabel, { color: colors.neutral }]}>AST</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>{seasonStats.steals}</Text>
                      <Text style={[styles.statLabel, { color: colors.neutral }]}>STL</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>{seasonStats.blocks}</Text>
                      <Text style={[styles.statLabel, { color: colors.neutral }]}>BLK</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>LeBron News</Text>
          </View>
          {isLoadingNews ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.neutral }]}>Loading news...</Text>
            </View>
          ) : newsError ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.negative }]}>{newsError}</Text>
            </View>
          ) : news.length === 0 ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.loadingText, { color: colors.neutral }]}>No news available</Text>
            </View>
          ) : (
            news.map((newsItem) => (
              <TouchableOpacity 
                key={newsItem.id} 
                style={[styles.newsItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleNewsPress(newsItem.url)}
              >
                <View style={styles.newsContent}>
                  <Text style={[styles.newsTitle, { color: colors.text }]} numberOfLines={2}>{newsItem.title}</Text>
                  <View style={styles.newsFooter}>
                    <Text style={[styles.newsSource, { color: colors.button }]}>{newsItem.source}</Text>
                    <Text style={[styles.newsTimestamp, { color: colors.neutral }]}>{newsItem.timestamp}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.neutral} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 0,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  viewAllButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  songCard: {
    marginRight: 16,
    width: 160,
    borderRadius: 8,
    padding: 8,
  },
  songImage: {
    width: 144,
    height: 144,
    borderRadius: 8,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 6,
  },
  songArtist: {
    fontSize: 14,
  },
  artistItem: {
    marginRight: 16,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  artistName: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsContainer: {
    gap: 16,
  },
  statsCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  statsSubtitle: {
    fontSize: 14,
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newsSource: {
    fontSize: 14,
  },
  newsTimestamp: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
});
