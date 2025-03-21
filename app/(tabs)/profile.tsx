import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

interface Song {
  id: string;
  title: string;
  artist: string;
  duration?: string;
}

const playlists = [
  { id: 1, name: 'Playlist 1', image: require('@/assets/images/default_playlist.png') },
  { id: 2, name: 'Playlist 2', image: require('@/assets/images/default_playlist.png') },
  { id: 3, name: 'Playlist 3', image: require('@/assets/images/default_playlist.png') },
  { id: 4, name: 'Playlist 4', image: require('@/assets/images/default_playlist.png') },
];

const songs = [
  { id: 1, title: 'Song 1', artist: 'Artist 1', image: require('@/assets/images/default_song.jpg') },
  { id: 2, title: 'Song 2', artist: 'Artist 2', image: require('@/assets/images/default_song.jpg') },
  { id: 3, title: 'Song 3', artist: 'Artist 3', image: require('@/assets/images/default_song.jpg') },
  { id: 4, title: 'Song 4', artist: 'Artist 4', image: require('@/assets/images/default_song.jpg') },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const handleSongPress = (song: Song) => {
    router.push({
      pathname: '/song',
      params: { song: JSON.stringify(song) }
    });
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Image
            source={require('@/assets/images/default_pfp.jpg')}
            style={styles.profileImage}
          />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>User Name</Text>
            <Text style={styles.profileEmail}>user@example.com</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={handleSettingsPress}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Library</Text>
          <View style={styles.librarySection}>
            <Text style={styles.subsectionTitle}>Playlists</Text>
            {playlists.map((playlist) => (
              <TouchableOpacity key={playlist.id} style={styles.playlistItem}>
                <Image source={playlist.image} style={styles.playlistImage} />
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistName}>{playlist.name}</Text>
                  <Text style={styles.playlistSongs}>{playlist.songs} songs</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#B3B3B3" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.librarySection}>
            <Text style={styles.subsectionTitle}>Saved Songs</Text>
            {songs.map((song) => (
              <Pressable
                key={song.id}
                style={styles.songItem}
                onPress={() => handleSongPress(song)}
              >
                <Image source={song.image} style={styles.songImage} />
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                </View>
                <Ionicons name="play-circle" size={24} color="#1DB954" />
              </Pressable>
            ))}
          </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileText: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#B3B3B3',
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  librarySection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#282828',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  playlistImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playlistName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  playlistSongs: {
    color: '#B3B3B3',
    fontSize: 14,
    marginTop: 4,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#282828',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  songImage: {
    width: 56,
    height: 56,
    backgroundColor: '#282828',
    borderRadius: 4,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  songArtist: {
    color: '#B3B3B3',
    fontSize: 14,
    marginTop: 4,
  },
}); 