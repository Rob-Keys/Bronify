import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Song {
  id: string;
  title: string;
  artist: string;
  image: any;
}

interface SongPlayerProps {
  onClose: () => void;
  song: Song;
}

export default function SongPlayer({ onClose, song }: SongPlayerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose}>
          <Ionicons name="chevron-down" size={24} color="#fff" />
        </Pressable>
      </View>
      
      <View style={styles.content}>
        <Image source={require('@/assets/images/default_song.jpg')} style={styles.albumArt} />
        <Text style={styles.title}>{song.title}</Text>
        <Text style={styles.artist}>{song.artist}</Text>
      </View>

      <View style={styles.controls}>
        <Pressable>
          <Ionicons name="shuffle" size={24} color="#B3B3B3" />
        </Pressable>
        <Pressable>
          <Ionicons name="play-skip-back" size={32} color="#fff" />
        </Pressable>
        <Pressable style={styles.playButton}>
          <Ionicons name="pause-circle" size={64} color="#1DB954" />
        </Pressable>
        <Pressable>
          <Ionicons name="play-skip-forward" size={32} color="#fff" />
        </Pressable>
        <Pressable>
          <Ionicons name="repeat" size={24} color="#B3B3B3" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  albumArt: {
    width: 300,
    height: 300,
    borderRadius: 8,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  artist: {
    fontSize: 18,
    color: '#B3B3B3',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  playButton: {
    marginHorizontal: 16,
  },
}); 