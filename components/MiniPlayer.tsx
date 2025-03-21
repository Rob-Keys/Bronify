import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Song {
  id: string;
  title: string;
  artist: string;
}

interface MiniPlayerProps {
  onPress: () => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  song: Song;
}

export default function MiniPlayer({ onPress, isPlaying, onPlayPause, song }: MiniPlayerProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.songInfo}>
          <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
        </View>
        <View style={styles.controls}>
          <Pressable onPress={onPlayPause}>
            <Ionicons 
              name={isPlaying ? "pause-circle" : "play-circle"} 
              size={32} 
              color="#1DB954" 
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#282828',
    borderTopWidth: 1,
    borderTopColor: '#404040',
    padding: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  songInfo: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    color: '#B3B3B3',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 