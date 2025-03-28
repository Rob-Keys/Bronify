import { StyleSheet, ScrollView, View, Text, Image, TouchableOpacity, Pressable, Alert, Linking, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { useState, useEffect } from 'react';
import { useMusic } from '@/app/context/MusicContext';
import { getLebronLastGame, getLebronSeasonStats } from '@/app/services/nbaStats';
import { getLebronNews, NewsItem } from '@/app/services/newsService';
import { useTheme } from '@/app/context/ThemeContext';
import { getPlayCount } from '@/app/services/playCountService';
import { fetchSongs } from '@/app/services/databaseService';

interface Artist {
  id: number;
  name: string;
  image: any;
  bio: string;
  socialLinks: {
    instagram: string;
    twitter: string;
    tiktok: string;
    website: string;
  };
}

interface Song {
  id: number;
  title: string;
  artist: string;
  plays: number;
  song_url: string;
  art_url: string;
  artist_socials: Record<string, string>;
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

const createSong = (id: number, title: string, artist: string, song_url: string, art_url: string, plays: number = 0): Song => ({
  id,
  title,
  artist,
  song_url,
  art_url,
  plays,
  artist_socials: {}
});

const topSongs: Song[] = [
  createSong(1, 'Evil Bron', 'Bron Jamz', 'EvilBron.mp3', 'default_song.jpg', 3),
  createSong(2, 'Dear Lebron', 'King James Band', 'DearLebron.mp3', 'default_song.jpg', 5),
  createSong(3, 'Man On The Lakers', 'LA Brontourage', 'ManOnTheLakers.mp3', 'default_song.jpg', 2),
  createSong(4, 'Thinking Bout Lebron', 'Bronify', 'ThinkingBoutLebron.mp3', 'default_song.jpg', 7),
];

const topArtists = [
  { 
    id: 1, 
    name: 'Bron Jamz', 
    image: require('@/assets/images/default_pfp.jpg'),
    bio: 'Creating LeBron-inspired jams since 2019. The original LeBron tribute artist.',
    socialLinks: {
      instagram: 'https://www.instagram.com',
      twitter: 'https://www.twitter.com',
      tiktok: 'https://www.tiktok.com',
      website: 'https://www.bronjamz.com'
    }
  },
  { 
    id: 2, 
    name: 'King James Band', 
    image: require('@/assets/images/default_pfp.jpg'),
    bio: 'A collective of musicians dedicated to celebrating LeBron through music.',
    socialLinks: {
      instagram: 'https://www.instagram.com',
      twitter: 'https://www.twitter.com',
      tiktok: 'https://www.tiktok.com',
      website: 'https://www.kingjamesband.com'
    }
  },
  { 
    id: 3, 
    name: 'LA Brontourage', 
    image: require('@/assets/images/default_pfp.jpg'),
    bio: 'West coast beats celebrating the King\'s LA era. Lakers-inspired melodies.',
    socialLinks: {
      instagram: 'https://www.instagram.com',
      twitter: 'https://www.twitter.com',
      tiktok: 'https://www.tiktok.com',
      website: 'https://www.labrontourage.com'
    }
  },
  { 
    id: 4, 
    name: 'Bronify', 
    image: require('@/assets/images/default_pfp.jpg'),
    bio: 'The #1 LeBron James tribute artist. Creating songs about the King since 2021.',
    socialLinks: {
      instagram: 'https://www.instagram.com',
      twitter: 'https://www.twitter.com',
      tiktok: 'https://www.tiktok.com',
      website: 'https://www.bronify.com'
    }
  },
];

const songs: Song[] = [
  createSong(1, 'Evil Bron', 'Bron Jamz', 'EvilBron.mp3', 'default_song.jpg', 3),
  createSong(2, 'Dear Lebron', 'King James Band', 'DearLebron.mp3', 'default_song.jpg', 5),
  createSong(3, 'Man On The Lakers', 'LA Brontourage', 'ManOnTheLakers.mp3', 'default_song.jpg', 2),
  createSong(4, 'Thinking Bout Lebron', 'Bronify', 'ThinkingBoutLebron.mp3', 'default_song.jpg', 7),
  createSong(5, "That's Bron", 'Bron Jamz', 'ThatsBron.mp3', 'default_song.jpg', 4),
  createSong(6, 'I Kissed Lebron', 'King James Band', 'IKissedLebron.mp3', 'default_song.jpg', 6),
  createSong(7, 'Not Throwing Away His Shot', 'LA Brontourage', 'NotThrowingAwayHisShot.mp3', 'default_song.jpg', 1),
  createSong(8, 'They Got Luka Don', 'Bronify', 'TheyGotLukaDon.mp3', 'default_song.jpg', 2),
  createSong(9, 'Panic At Le Disco', 'Bron Jamz', 'PanicAtLeDisco.mp3', 'default_song.jpg', 3),
  createSong(10, 'Lebron Lebron Lebron', 'King James Band', 'LebronLebronLebron.mp3', 'default_song.jpg', 4),
  createSong(11, 'Bron Mix', 'LA Brontourage', 'BronMix.mp3', 'default_song.jpg', 1),
];

type Section = {
  type: 'header' | 'topSongs' | 'topArtists' | 'stats' | 'news';
  data: Song[] | Artist[] | NewsItem[] | null;
};

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
  const [songPlayCounts, setSongPlayCounts] = useState<{[key: number]: number}>({});
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    async function fetchStats() {
      try {
        setIsLoading(true);
        setError(null);
        const [lastGame, season] = await Promise.all([
          getLebronLastGame(),
          getLebronSeasonStats()
        ]);
        if (isMounted) {
          setLastGameStats(lastGame);
          setSeasonStats(season);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        if (isMounted) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying stats fetch (attempt ${retryCount}/${maxRetries})...`);
            setTimeout(fetchStats, 2000 * retryCount); // Exponential backoff
          } else {
            setError('Failed to load stats after multiple attempts');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    async function fetchNews() {
      try {
        setIsLoadingNews(true);
        setNewsError(null);
        const newsData = await getLebronNews();
        if (isMounted) {
          setNews(newsData);
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        if (isMounted) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying news fetch (attempt ${retryCount}/${maxRetries})...`);
            setTimeout(fetchNews, 2000 * retryCount); // Exponential backoff
          } else {
            setNewsError('Failed to load news after multiple attempts');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingNews(false);
        }
      }
    }

    fetchStats();
    fetchNews();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const loadPlayCounts = async () => {
      const counts: {[key: number]: number} = {};
      
      // Load play counts for top songs
      for (const song of topSongs) {
        const playCount = await getPlayCount(song.id);
        counts[song.id] = playCount;
      }
      
      setSongPlayCounts(counts);
    };
    
    loadPlayCounts();
  }, []);

  const getTotalPlayCount = (songId: number, initialCount: number = 0): number => {
    const storedCount = songPlayCounts[songId] || 0;
    return initialCount + storedCount;
  };

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

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

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

  const renderSongItem = ({ item: song }: { item: Song }) => {
    const isCurrentSong = currentSong?.id === song.id;
    const isPlayingThisSong = isCurrentSong && isPlaying;

    return (
      <TouchableOpacity
        style={[styles.songItem, { backgroundColor: colors.card }]}
        onPress={() => handleSongPress(song)}
      >
        <Image source={{ uri: song.art_url }} style={styles.songImage} />
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, { color: colors.text }]}>{song.title}</Text>
          <Text style={[styles.songArtist, { color: colors.textSecondary }]}>{song.artist}</Text>
        </View>
        <View style={styles.songStats}>
          <Text style={[styles.playCount, { color: colors.textSecondary }]}>
            {song.plays || 0} plays
          </Text>
          {isCurrentSong && (
            <Text style={[styles.playingIndicator, { color: colors.primary }]}>
              {isPlayingThisSong ? 'Playing' : 'Paused'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderArtistItem = ({ item: artist }: { item: Artist }) => (
    <TouchableOpacity
      style={[styles.artistItem, { backgroundColor: colors.card }]}
      onPress={() => handleArtistPress(artist.name)}
    >
      <Image source={artist.image} style={styles.artistImage} />
      <Text style={[styles.artistName, { color: colors.text }]}>{artist.name}</Text>
    </TouchableOpacity>
  );

  const renderSection = ({ item }: { item: Section }) => {
    switch (item.type) {
      case 'header':
        return (
          <View style={styles.header}>
            <Text style={[styles.greeting, { color: colors.text }]}>Hey, LeBron Fan!</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings')}>
                <Ionicons name="settings-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'topSongs':
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Songs</Text>
              <TouchableOpacity onPress={() => router.push('/search')}>
                <Text style={[styles.viewAllButton, { color: colors.button }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={songs}
              renderItem={renderSongItem}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.songsList}
              scrollEnabled={false}
            />
          </View>
        );

      case 'topArtists':
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Artists</Text>
            </View>
            <FlatList
              data={topArtists}
              renderItem={renderArtistItem}
              keyExtractor={item => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.artistsList}
              scrollEnabled={false}
            />
          </View>
        );

      case 'stats':
        return (
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
        );

      case 'news':
        return (
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
        );

      default:
        return null;
    }
  };

  const sections: Section[] = [
    { type: 'header', data: null },
    { type: 'topSongs', data: songs },
    { type: 'topArtists', data: topArtists },
    { type: 'stats', data: null },
    { type: 'news', data: news }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      />
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
    height: 220,
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
  songMetadata: {
    flexDirection: 'column',
    width: '100%',
  },
  songDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  songArtist: {
    fontSize: 14,
    marginBottom: 2,
  },
  songPlays: {
    fontSize: 12,
    fontWeight: '500',
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
  songsList: {
    paddingBottom: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
  },
  songStats: {
    alignItems: 'flex-end',
  },
  playCount: {
    fontSize: 12,
  },
  playingIndicator: {
    fontSize: 12,
    marginTop: 4,
  },
  artistsList: {
    paddingRight: 16,
  },
  contentContainer: {
    paddingBottom: 16,
  },
});
