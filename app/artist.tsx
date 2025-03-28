import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useMusic } from '@/app/context/MusicContext';
import { fetchSongsByArtist } from '@/app/services/databaseService';

interface Artist {
  id: number;
  name: string;
  image: any;
  bio?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    website?: string;
  };
}

interface Song {
  id: number;
  title: string;
  artist: string;
  image: any;
  audio: any;
  isLiked?: boolean;
  plays?: number;
}

export default function ArtistScreen() {
  const { artist: artistParam } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const { playSong, currentSong, isPlaying, togglePlayPause } = useMusic();
  
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artistSongs, setArtistSongs] = useState<Song[]>([]);
  const [totalPlays, setTotalPlays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [songPlayCounts, setSongPlayCounts] = useState<{[key: number]: number}>({});

  useEffect(() => {
    if (artistParam) {
      try {
        const parsedArtist = JSON.parse(artistParam as string);
        setArtist(parsedArtist);
        
        // Fetch the artist's songs from database
        fetchArtistSongs(parsedArtist.name);
      } catch (error) {
        console.error('Error parsing artist data:', error);
        router.back();
      }
    } else {
      router.back();
    }
    setIsLoading(false);
  }, [artistParam]);

  // Add a useEffect to load play counts after artist songs are loaded
  useEffect(() => {
    if (artistSongs.length > 0) {
      loadPlayCounts();
    }
  }, [artistSongs]);

  const loadPlayCounts = async () => {
    const counts: {[key: number]: number} = {};
    let totalCount = 0;
    
    // Load play counts for all artist songs
    for (const song of artistSongs) {
      const playCount = await getPlayCount(song.id);
      counts[song.id] = playCount;
      
      // Add to total plays (base count + stored count)
      totalCount += (song.plays || 0) + playCount;
    }
    
    setSongPlayCounts(counts);
    setTotalPlays(totalCount);
  };
  
  // Function to get the total play count (initial + stored)
  const getTotalPlayCount = (songId: number, initialCount: number = 0): number => {
    const storedCount = songPlayCounts[songId] || 0;
    return initialCount + storedCount;
  };

  const fetchArtistSongs = async (artistName: string) => {
    try {
      setIsLoading(true);
      const songs = await fetchSongsByArtist(artistName);
      setArtistSongs(songs);
      
      // Calculate total plays
      const total = songs.reduce((sum, song) => sum + (song.plays || 0), 0);
      setTotalPlays(total);
    } catch (error) {
      console.error('Error fetching artist songs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaySong = (song: Song) => {
    playSong(song);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleSocialLink = (platform: string) => {
    if (!artist?.socialLinks) return;
    
    let url;
    switch (platform) {
      case 'instagram':
        url = artist.socialLinks.instagram;
        break;
      case 'twitter':
        url = artist.socialLinks.twitter;
        break;
      case 'tiktok':
        url = artist.socialLinks.tiktok;
        break;
      case 'website':
        url = artist.socialLinks.website;
        break;
      default:
        return;
    }
    
    if (url) {
      Linking.openURL(url).catch(err => {
        console.error('Error opening social link:', err);
      });
    }
  };

  const handleSongPress = (song: Song) => {
    router.push({
      pathname: '/song',
      params: { song: JSON.stringify(song) }
    });
  };

  if (isLoading || !artist) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading artist...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.artistHeader}>
          <Image source={artist.image} style={styles.artistImage} />
          <Text style={[styles.artistName, { color: colors.text }]}>{artist.name}</Text>
          <Text style={[styles.artistStats, { color: colors.neutral }]}>
            {formatNumber(totalPlays)} total plays • {artistSongs.length} songs
          </Text>
          
          <View style={styles.socialLinks}>
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: colors.card }]} 
              onPress={() => handleSocialLink('instagram')}
            >
              <Ionicons name="logo-instagram" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: colors.card }]} 
              onPress={() => handleSocialLink('twitter')}
            >
              <Ionicons name="logo-twitter" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: colors.card }]} 
              onPress={() => handleSocialLink('tiktok')}
            >
              <Ionicons name="logo-tiktok" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: colors.card }]} 
              onPress={() => handleSocialLink('website')}
            >
              <Ionicons name="globe-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {artist.bio && (
            <Text style={[styles.artistBio, { color: colors.text }]}>{artist.bio}</Text>
          )}
        </View>
        
        <View style={styles.songsList}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Songs</Text>
          
          {artistSongs.map((song) => (
            <TouchableOpacity 
              key={song.id} 
              style={[styles.songItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSongPress(song)}
            >
              <Image source={song.image} style={styles.songImage} />
              <View style={styles.songInfo}>
                <Text style={[styles.songTitle, { color: colors.text }]}>{song.title}</Text>
                <Text style={[styles.songPlays, { color: colors.neutral }]}>
                  {formatNumber(getTotalPlayCount(song.id, song.plays))} plays
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.playButton} 
                onPress={() => handlePlaySong(song)}
              >
                <Ionicons 
                  name={currentSong?.id === song.id && isPlaying ? "pause-circle" : "play-circle"} 
                  size={36} 
                  color={colors.button} 
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingBottom: 80,
  },
  artistHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  artistImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 16,
  },
  artistName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  artistStats: {
    fontSize: 16,
    marginBottom: 16,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistBio: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  songsList: {
    paddingTop: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  songImage: {
    width: 56,
    height: 56,
    borderRadius: 4,
  },
  songInfo: {
    flex: 1,
    marginLeft: 16,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  songPlays: {
    fontSize: 14,
  },
  playButton: {
    padding: 8,
  },
}); 